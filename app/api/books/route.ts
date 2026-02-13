// src/app/api/books/route.ts
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Book from "@/models/Book";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট
import { NextResponse } from "next/server";

/**
 * GET: ইউজারের সকল বই (Vaults) সিংক্রোনাইজ করা
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');

    // 🔍 X-RAY LOGGING: Server-side visibility
    console.log(`🔍 [API-BOOKS] Received Request for UID: ${userId}`);
    console.log(`🔍 [API-BOOKS] Since parameter: ${since}`);

    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    await connectDB();

    // 🔥 BACKWARD COMPATIBILITY: Query both ObjectId and String formats
    let user;
    try {
      user = await User.findById(userId).select('isActive');
    } catch (error) {
      console.error('User lookup error:', error);
      return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }
    
    if (!user) return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // 🔥 ROBUST FORMAT-AGNOSTIC QUERY: Handle userId formats correctly
    const queryConditions: any[] = [{ userId: userId }]; // Always check string format
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ userId: new mongoose.Types.ObjectId(userId) }); // Check ObjectId format
    }

    // Use a simpler approach for query construction
    let query: any = { $or: queryConditions };
    
    if (since && since !== '0') {
      const sinceDate = new Date(Number(since));
      query.$or = queryConditions.map(condition => ({
        ...condition,
        updatedAt: { $gt: sinceDate }
      }));
    }

    // 🔍 X-RAY LOGGING: Robust query construction
    console.log('🔍 [API-BOOKS] Robust Format-Agnostic query:', JSON.stringify(query, null, 2));
    console.log('🔍 [API-BOOKS] Query conditions built:', {
      userId,
      isValidObjectId: mongoose.Types.ObjectId.isValid(userId),
      conditionsCount: queryConditions.length,
      conditions: queryConditions.map(c => ({ userId: c.userId, userIdType: typeof c.userId }))
    });

    const books = await Book.find(query).lean().sort({ updatedAt: -1 });
    
    // 🔍 X-RAY LOGGING: Results visibility
    console.log(`📊 [API-BOOKS] Books found: ${books.length}`);
    if (books.length > 0) {
      console.log('💎 RAW BOOK:', JSON.stringify(books[0]));
      console.log('🔍 [API-BOOKS] Sample book IDs:', books.slice(0, 3).map(b => ({ _id: b._id, userId: b.userId, userIdType: typeof b.userId })));
    } else {
      // 🔥 FALLBACK: Try explicit ObjectId and string searches
      console.log('🔍 [API-BOOKS] No books found, trying fallback searches...');
      
      const stringBooks = await Book.find({ userId: userId }).lean().sort({ updatedAt: -1 });
      console.log(`📊 [API-BOOKS] String search found: ${stringBooks.length} books`);
      
      let objectIdBooks: any[] = [];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        objectIdBooks = await Book.find({ userId: new mongoose.Types.ObjectId(userId) }).lean().sort({ updatedAt: -1 });
        console.log(`📊 [API-BOOKS] ObjectId search found: ${objectIdBooks.length} books`);
      }
      
      const allFallbackBooks = [...stringBooks, ...objectIdBooks];
      console.log(`📊 [API-BOOKS] Total fallback books: ${allFallbackBooks.length}`);
      
      if (allFallbackBooks.length > 0) {
        console.log('💎 RAW FALLBACK BOOK:', JSON.stringify(allFallbackBooks[0]));
        return NextResponse.json({ 
          success: true, 
          data: allFallbackBooks,
          count: allFallbackBooks.length,
          isActive: true 
        }, { status: 200 });
      }
    }

    return NextResponse.json({ 
        success: true, 
        data: books,
        count: books.length,
        isActive: true 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Failed to sync" }, { status: 500 });
  }
}

/**
 * POST: নতুন বই (Vault) তৈরি করা
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, description, userId, type, phone, image, vKey, cid } = data;

    // 🔥 API LOGGING: Show received payload for debugging
    console.log('📦 [API-BOOKS] Received Payload:', JSON.stringify(data));

    if (!userId || !name) return NextResponse.json({ message: "Fields missing" }, { status: 400 });

    await connectDB();

    // --- সিকিউরিটি চেক ---
    let user;
    try {
      user = await User.findById(userId).select('isActive');
    } catch (error) {
      console.error('User lookup error:', error);
      return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }
    
    if (user && user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }
    
    // চেক: এই ইউজারের এই নামে অন্য কোনো বই আছে কি না - Use string userId
    const existingBook = await Book.findOne({ 
        userId: userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
    });

    if (existingBook) {
        // 🔥 CONFLICT RESOLUTION: Return existing book with 200 status for sync engine adoption
        return NextResponse.json({ 
            success: true, 
            book: existingBook, 
            message: "Vault adopted", 
            isActive: true 
        }, { status: 200 });
    }

    // 🔥 SERVER-SIDE DEDUPLICATION: Check for duplicate CID before creation
    if (cid) {
      const existingByCid = await Book.findOne({ cid });
      if (existingByCid) {
        return NextResponse.json({ 
            success: true, 
            book: existingByCid, 
            message: "CID match found", 
            isActive: true 
        }, { status: 200 });
      }
    }

    const newBook = await Book.create({ 
        name: name.trim(), 
        description, 
        userId, 
        type: String(type || 'general').toLowerCase(), 
        phone, 
        image,
        vKey: vKey || 1,
        cid: cid || undefined // 🔥 CRITICAL: Include cid field if provided
    });
    
    return NextResponse.json({ success: true, book: newBook, isActive: true }, { status: 201 });
  } catch (error: any) {
    console.error('❌ [API-BOOKS-POST] Error:', error.message);
    return NextResponse.json({ message: error.message || "Creation failed" }, { status: 500 });
  }
}

/**
 * PUT: বইয়ের তথ্য আপডেট করা (Logic B Conflict Resolution সহ)
 */
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { _id, name, description, userId, type, phone, image, vKey } = data;

    if (!_id || !userId) {
      return NextResponse.json({ message: "Auth/Book ID missing" }, { status: 400 });
    }

    await connectDB();

    // ১. ডাটা এবং ইউজার চেক - Use string userId
    const existingBook = await Book.findOne({ _id, userId: userId });
    if (!existingBook) return NextResponse.json({ message: "Vault not found" }, { status: 404 });

    // --- সিকিউরিটি চেক ---
    let user;
    try {
      user = await User.findById(userId).select('isActive');
    } catch (error) {
      console.error('User lookup error:', error);
      return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }
    
    if (user && user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // ২. Logic B: Conflict Resolution
    if (vKey && existingBook.vKey > vKey) {
        return NextResponse.json({ 
            message: "Version conflict: Server has newer info", 
            isActive: true,
            errorCode: "VERSION_CONFLICT" 
        }, { status: 409 });
    }

    // ৩. স্মার্ট ডুপ্লিকেট চেক (নাম পরিবর্তন করলে অন্য কোনো বইয়ের সাথে মিলছে কি না) - Use string userId
    const duplicate = await Book.findOne({
        userId: userId,
        _id: { $ne: _id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (duplicate) {
        return NextResponse.json({ message: "Another vault has this name", isActive: true }, { status: 400 });
    }

    // ৪. আপডেট এক্সিকিউশন
    const updatedBook = await Book.findOneAndUpdate(
      { _id, userId: userId },
      { 
        $set: { 
            name: name.trim(), 
            description, 
            type: String(type).toLowerCase(), 
            phone, 
            image, 
            vKey: vKey, // লেটেস্ট ভার্সন কি আপডেট করা
            updatedAt: Date.now() 
        } 
      },
      { new: true }
    );

    return NextResponse.json({ success: true, book: updatedBook, isActive: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}