import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

/**
 * GET: Background Integrity Check - The Final Gatekeeper
 * Returns count and hash for books and entries to detect data inconsistencies
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 });
    }

    await connectDB();

    // 🔍 READ-ONLY ORPHANED DETECTION: Count but NEVER delete
    try {
      const orphanedCount = await Entry.countDocuments({
        userId: userId,
        $or: [
          { bookId: { $exists: false } },
          { bookId: { $type: null } },
          { bookId: "" },
          { bookId: null },
          { bookId: "undefined" },
          { bookId: "null" }
        ]
      });
      
      if (orphanedCount > 0) {
        console.warn(`⚠️ [ORPHANED DETECTION] Found ${orphanedCount} orphaned entries for user ${userId} - NOT DELETED (Read-only mode)`);
      }
    } catch (err) {
      console.error("Orphaned Detection Error:", err);
    }

    // � GATEKEEPER: Get server-side data counts and hashes
    const serverBooks = await Book.find({ 
      userId: userId, 
      isDeleted: { $ne: 1 } 
    }).select('vKey cid _id').lean();

    const serverEntries = await Entry.find({ 
      userId: userId, 
      isDeleted: { $ne: 1 } 
    }).select('vKey cid _id').lean();

    // 🔥 HASH CALCULATION: Match client logic exactly
    const calculateHash = (items: any[]) => {
      const vKeySum = items.reduce((sum, item) => sum + (item.vKey || 0), 0);
      const cidHash = items.reduce((hash, item) => {
        // Match client: cid || localId || 'unknown'
        const cid = item.cid || item._id?.toString() || 'unknown';
        return hash + cid.split('').reduce((charSum: number, char: string) => charSum + char.charCodeAt(0), 0);
      }, 0);
      return `${items.length}-${vKeySum}-${cidHash}`;
    };

    const booksHash = calculateHash(serverBooks);
    const entriesHash = calculateHash(serverEntries);

    console.log(`🔍 [INTEGRITY] Server check for user ${userId}:`, {
      books: { count: serverBooks.length, hash: booksHash },
      entries: { count: serverEntries.length, hash: entriesHash }
    });

    return NextResponse.json({
      success: true,
      userId,
      timestamp: Date.now(),
      books: {
        totalCount: serverBooks.length,
        hash: booksHash,
        sampleIds: serverBooks.slice(0, 3).map(b => ({ _id: b._id, cid: b.cid, vKey: b.vKey }))
      },
      entries: {
        totalCount: serverEntries.length,
        hash: entriesHash,
        sampleIds: serverEntries.slice(0, 3).map(e => ({ _id: e._id, cid: e.cid, vKey: e.vKey }))
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("🚨 [INTEGRITY] Check failed:", error.message);
    return NextResponse.json({ 
      message: "Integrity check failed",
      error: error.message 
    }, { status: 500 });
  }
}
