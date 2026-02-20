// src/app/api/books/route.ts
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Book from "@/models/Book";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট
import { NextResponse } from "next/server";
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

/**
 * GET: ইউজারের সকল বই (Vaults) সিংক্রোনাইজ করা
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50') || 50; // Default 50, configurable
    const page = parseInt(searchParams.get('page') || '0') || 0; // Default 0

    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    await connectDB();

    let user;
    try {
      user = await User.findById(userId).select('isActive');
    } catch (error) {
      return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 });
    }
    
    if (!user) return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    const queryConditions: any[] = [{ userId: userId, isDeleted: { $ne: 1 } }]; 
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      queryConditions.push({ userId: new mongoose.Types.ObjectId(userId), isDeleted: { $ne: 1 } }); 
    }

    let query: any = { $or: queryConditions };
    
    if (since && since !== '0') {
      const sinceDate = new Date(Number(since));
      query.$or = queryConditions.map(condition => ({
        ...condition,
        updatedAt: { $gt: sinceDate }
      }));
    }

    // Get total count for pagination metadata
    const totalCount = await Book.countDocuments({ 
      $or: queryConditions,
      isDeleted: { $ne: 1 }
    });

    const books = await Book.find(query)
      .lean()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(page * limit);
    
    // --- FALLBACK LOGIC ---
    if (books.length === 0) {
      const stringBooks = await Book.find({ userId: userId, isDeleted: { $ne: 1 } }).lean().select('-image').sort({ updatedAt: -1 });
      
      let objectIdBooks: any[] = [];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        objectIdBooks = await Book.find({ userId: new mongoose.Types.ObjectId(userId), isDeleted: { $ne: 1 } }).lean().select('-image').sort({ updatedAt: -1 });
      }
      
      const allFallbackBooks = [...stringBooks, ...objectIdBooks];
      
      if (allFallbackBooks.length > 0) {
        return NextResponse.json({ 
          success: true, 
          data: allFallbackBooks,
          count: allFallbackBooks.length,
          totalCount: allFallbackBooks.length,
          isActive: true 
        }, { status: 200 });
      }
    }

    return NextResponse.json({ 
        success: true, 
        data: books,
        count: books.length,
        totalCount: totalCount,
        page: page,
        limit: limit,
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

    // 🔥 API LOGGING: Show received payload for debugging (SILENCED)
    // console.log('📦 [API-BOOKS] Received Payload:', JSON.stringify(data));

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
    // 🔒 STRICT INTEGRITY: Ignore deleted books when checking for name conflicts
    const existingBook = await Book.findOne({ 
        userId: userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        isDeleted: { $ne: 1 } // 🔥 CRITICAL: Only consider active books, ignore deleted ones
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
        image: (image && image !== "") ? image : undefined, // 🛡️ SERVER GUARD: Reject empty strings
        vKey: vKey || Date.now(), // 🔥 UNIFIED VKEY STRATEGY: Use Date.now() for absolute versioning
        cid: cid || undefined // 🔥 CRITICAL: Include cid field if provided
    });
    
    // � [STRICT INTEGRITY] Book created without automatic entry relinking
    console.log('� [STRICT INTEGRITY] Book created without automatic entry relinking');
    
    // সিগন্যাল ট্রিগার
    try {
        // Backend Name Verification: Check if name field exists
        if (!newBook.name) {
            console.warn('⚠️ BOOK_CREATED payload missing name field:', newBook);
        }
        
        await pusher.trigger(`vault-channel-${userId}`, 'BOOK_CREATED', { 
            cid: newBook.cid,
            _id: newBook._id,
            userId: userId,
            vKey: newBook.vKey
        });
    } catch (e) {}
    
    return NextResponse.json({ success: true, book: newBook, isActive: true }, { status: 201 });
  } catch (error: any) {
    // console.error('❌ [API-BOOKS-POST] Error:', error.message);
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
    const imageToSave = (image && image !== "") ? image : undefined; // SERVER GUARD: Reject empty strings
    const updatedBook = await Book.findOneAndUpdate(
      { _id, userId: userId },
      { 
        $set: { 
            name: name.trim(), 
            description, 
            type: String(type).toLowerCase(), 
            phone, 
            image: imageToSave, 
            vKey: vKey, // লেটেস্ট ভার্সন কি আপডেট করা
            updatedAt: Date.now() 
        } 
      },
      { new: true }
    );

    // সিগন্যাল ট্রিগার
    try {
        await pusher.trigger(`vault_channel_${updatedBook.userId}`, 'BOOK_UPDATED', { 
            cid: updatedBook.cid,
            _id: updatedBook._id,
            userId: updatedBook.userId,
            vKey: updatedBook.vKey
        });
    } catch (e) {}

    return NextResponse.json({ success: true, book: updatedBook, isActive: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}