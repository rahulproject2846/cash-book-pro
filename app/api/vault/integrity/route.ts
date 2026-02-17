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
          { bookId: null },
          { bookId: "" },
          { bookId: "orphaned-data" }
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

    // 🛡️ STEP 1 - GET ACTIVE BOOKS: Only count entries from active books
    const activeBooks = await Book.find({ 
      userId: userId, 
      isDeleted: { $ne: 1 } 
    }).select('_id').lean();
    
    const activeBookIds = activeBooks.map(book => book._id?.toString()).filter(id => id);
    
    // 🛡️ STEP 2 - COUNT ENTRIES FROM ACTIVE BOOKS ONLY
    const serverEntries = await Entry.find({ 
      userId: userId, 
      isDeleted: { $ne: 1 },
      bookId: { $in: activeBookIds }  // 🚨 ALIGNMENT: Only count entries from active books
    }).select('vKey cid _id').lean();

    // 🔥 HASH CALCULATION: Match client logic exactly with sorting
    const calculateHash = (items: any[]) => {
      // 🔥 SORT BY CID: Ensure consistent order for hash calculation
      const sorted = items.sort((a, b) => (a.cid || '').localeCompare(b.cid || ''));
      
      const vKeySum = sorted.reduce((sum, item) => sum + (item.vKey || 0), 0);
      const cidHash = sorted.reduce((hash, item) => {
        // 🔥 UNIFIED HASH LOGIC: Match client exactly - use (item.cid || item._id || '').toString()
        const cid = (item.cid || item._id || '').toString();
        return hash + cid.split('').reduce((charSum: number, char: string) => charSum + char.charCodeAt(0), 0);
      }, 0);
      return `${sorted.length}-${vKeySum}-${cidHash}`;
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
