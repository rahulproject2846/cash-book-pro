import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";
import mongoose from 'mongoose';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '100') || 100;
    const page = parseInt(searchParams.get('page') || '0') || 0;
    
    if (!userId) {
      return NextResponse.json({ message: "Security token required" }, { status: 400 });
    }

    await connectDB();
    
    // 🛡️ FORMAT-AGNOSTIC USER QUERY
    const queryConditions: any[] = [{ userId: userId, isDeleted: 0 }];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ userId: new mongoose.Types.ObjectId(userId), isDeleted: 0 });
    }

    // 1. Fetch User Books to establish valid context
    const userBooks = await Book.find({ $or: queryConditions }).select('_id cid isDeleted').lean();
    
    // 🚀 SIMPLIFIED QUERY STRUCTURE: Clean, flat query with correct types
    const bookIdentifiers = [
      ...userBooks.map(b => String(b._id)),
      ...userBooks.map(b => String(b.cid)).filter(Boolean)
    ];

    let entriesQuery: {
      userId: string;
      bookId: { $in: string[] };
      isDeleted: number;
      updatedAt?: { $gt: number };
    } = {
      userId: String(userId),
      bookId: { $in: bookIdentifiers.map(id => String(id)) },
      isDeleted: 0
    };

    // 🕐 DELTA SYNC ENGINE: Fixed Number-to-Number comparison
    if (since && since !== '0') {
      entriesQuery.updatedAt = { $gt: Number(since) }; // 🚨 CRITICAL: Compare Number with Number
    }
    
    // 3. Execute Optimized Fetch
    const allEntries = await Entry.find(entriesQuery)
      .sort({ updatedAt: -1 }) // Sort by update for sync consistency
      .limit(limit)
      .skip(page * limit)
      .lean();

    // 4. SERVER-SIDE DEDUPLICATION (The Final Shield)
    // If Mongo has duplicates, we only send the latest unique CID to the client
    const uniqueEntriesMap = new Map();
    allEntries.forEach(entry => {
      const key = entry.cid || entry._id.toString();
      if (!uniqueEntriesMap.has(key)) {
        uniqueEntriesMap.set(key, entry);
      }
    });
    const deduplicatedEntries = Array.from(uniqueEntriesMap.values());

    // 5. BOOK RESCUE MISSION
    let rescuedBooks: any[] = [];
    if (deduplicatedEntries.length > 0) {
      const uniqueBookIdsInEntries = [...new Set(deduplicatedEntries.map(e => e.bookId))];
      const validObjectIds = uniqueBookIdsInEntries.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validObjectIds.length > 0) {
        rescuedBooks = await Book.find({ _id: { $in: validObjectIds } }).lean();
      }
    }

    return NextResponse.json({
        success: true,
        data: deduplicatedEntries,
        books: rescuedBooks,
        count: deduplicatedEntries.length,
        totalInQuery: allEntries.length
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Timeline synchronization failed", error: error.message }, { status: 500 });
  }
}