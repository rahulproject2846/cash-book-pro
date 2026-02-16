import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";
import mongoose from 'mongoose'; // Import mongoose

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '100') || 100; // Default 100, configurable
    const page = parseInt(searchParams.get('page') || '0') || 0; // Default 0
    
    // 🔍 X-RAY LOGGING: Server-side visibility (SILENCED)
    // console.log(`🔍 [API-ENTRIES] Received Request for UID: ${userId}`);
    // console.log(`🔍 [API-ENTRIES] Since parameter: ${since}`);
    
    if (!userId) {
      return NextResponse.json({ message: "Security token required" }, { status: 400 });
    }

    await connectDB();
    
    // 🔥 ROBUST FORMAT-AGNOSTIC QUERY: Handle userId formats correctly for Book.find
    const queryConditions: any[] = [{ userId: userId, isDeleted: false }]; // 🚨 CRITICAL: Exclude deleted records
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ userId: new mongoose.Types.ObjectId(userId), isDeleted: false }); // Check ObjectId format
    }

    const bookQuery = { $or: queryConditions };
    
    // 🔍 X-RAY LOGGING: Robust book query construction (SILENCED)
    // console.log('🔍 [API-ENTRIES] Robust Format-Agnostic book query:', JSON.stringify(bookQuery, null, 2));
    // console.log('🔍 [API-ENTRIES] Book query conditions built:', {
    //   userId,
    //   isValidObjectId: mongoose.Types.ObjectId.isValid(userId),
    //   conditionsCount: queryConditions.length,
    //   conditions: queryConditions.map(c => ({ userId: c.userId, userIdType: typeof c.userId }))
    // });
    
    const userBooks = await Book.find(bookQuery).select('_id');
    
    // 🔍 X-RAY LOGGING: Books found visibility (SILENCED)
    // console.log(`📊 [API-ENTRIES] User books found: ${userBooks.length}`);
    // if (userBooks.length > 0) {
    //   console.log('🔍 [API-ENTRIES] Sample book IDs:', userBooks.slice(0, 3).map(b => ({ _id: b._id, userId: b.userId, userIdType: typeof b.userId })));
    // }
    
    // 🔥 STRING CONVERSION: Explicitly convert _id to strings for $in query
    const bookIds = userBooks.map(b => b._id.toString());

    // 🔥 FALLBACK: If no books found, search entries by userId directly
    let entriesQuery: any;
    if (userBooks.length === 0) {
      console.log('🔍 [API-ENTRIES] No books found, using direct userId query for entries (SILENCED)');
      entriesQuery = { $or: queryConditions, isDeleted: false }; // Same userId formats as books
    } else {
      // Standard bookId-based query
      const baseEntryConditions = [
        { bookId: { $in: bookIds }, isDeleted: false }, // New String format
        { bookId: { $in: bookIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null) }, isDeleted: false } // Legacy ObjectId format
      ].filter(q => q.bookId && q.bookId.$in && q.bookId.$in.length > 0);

      entriesQuery = { $or: baseEntryConditions };
    }
    
    // Add timestamp filter if since is provided and not '0'
    if (since && since !== '0') {
      const sinceDate = new Date(Number(since));
      if (userBooks.length === 0) {
        // Direct userId query with timestamp
        entriesQuery.$or = queryConditions.map((condition: any) => ({
          ...condition,
          updatedAt: { $gt: sinceDate }
        }));
      } else {
        // BookId-based query with timestamp
        entriesQuery.$or = entriesQuery.$or.map((condition: any) => ({
          ...condition,
          updatedAt: { $gt: sinceDate }
        }));
      }
    }

    // 🔍 X-RAY LOGGING: Final entries query construction (SILENCED)
    // console.log('🔍 [API-ENTRIES] Final entries query:', JSON.stringify(entriesQuery, null, 2));
    // console.log('🔍 [API-ENTRIES] Query strategy:', userBooks.length === 0 ? 'Direct userId' : 'BookId-based', { bookIdsCount: bookIds.length });

    // Get total count for pagination metadata
    const totalCount = await Entry.countDocuments({
      $or: queryConditions,
      isDeleted: false
    });

    const allEntries = await Entry.find(entriesQuery)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .skip(page * limit);

    // 🔥 BOOK RESCUE: Collect unique bookIds from entries and rescue their books
    let rescuedBooks: any[] = [];
    if (allEntries.length > 0) {
      const uniqueBookIds = [...new Set(allEntries.map(e => e.bookId).filter(bookId => bookId))];
      // console.log('🔍 [API-ENTRIES] Unique bookIds found in entries:', uniqueBookIds);
      
      if (uniqueBookIds.length > 0) {
        try {
          // 🔥 SAFETY: Only include valid ObjectIds to prevent 500 errors
          const validObjectIds = uniqueBookIds.filter(id => mongoose.Types.ObjectId.isValid(id));
          // console.log('🔍 [API-ENTRIES] Valid ObjectIds:', validObjectIds);
          
          if (validObjectIds.length > 0) {
            rescuedBooks = await Book.find({ _id: { $in: validObjectIds } }).lean();
            // console.log(`📊 [API-ENTRIES] Rescued ${rescuedBooks.length} books from entries`);
            // if (rescuedBooks.length > 0) {
            //   console.log('💎 RESCUED BOOK:', JSON.stringify(rescuedBooks[0]));
            // }
          } else {
            // console.log('🔍 [API-ENTRIES] No valid ObjectIds found, skipping rescue');
          }
        } catch (error) {
          console.error('🚨 [API-ENTRIES] Book rescue failed:', error);
          // Continue without rescued books - API should not fail
        }
      }
    }

    //   })));
    // }

    return NextResponse.json({
        success: true,
        data: allEntries,
        books: rescuedBooks, // 📌 Include rescued books
        count: allEntries.length,
        rescuedBooksCount: rescuedBooks.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Entries fetch error:', error);
    return NextResponse.json({ message: "Timeline synchronization failed" }, { status: 500 });
  }
}