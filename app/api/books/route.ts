// src/app/api/books/route.ts
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Book, { IBook } from "@/models/Book";
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
      
      let objectIdBooks: IBook[] = [];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        // Schema uses String for userId, so we query as string
        objectIdBooks = await Book.find({ userId: userId, isDeleted: { $ne: 1 } }).lean().select('-image').sort({ updatedAt: -1 });
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
 * POST: ATOMIC UPSERT - Create or update book with CID-based deduplication
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, description, userId, type, phone, image, vKey, cid, mediaCid } = data;

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

    // 🔍 [FORENSIC AUDIT] Trace bookData before save
    const bookData = {
      name: name.trim(),
      description: description || "",
      userId,
      type: String(type || 'general').toLowerCase(),
      phone: phone || "",
      image: (image && image !== "") ? image : undefined,
      mediaCid: mediaCid || undefined,
      vKey: vKey || Date.now(),
      cid: cid || undefined,
      isDeleted: 0, // Ensure active status
      // 🚨 DNA HARDENING: Force Number casting to prevent Mongoose auto-conversion
      updatedAt: Number(data.updatedAt) || Date.now(),
      isPublic: Number(data.isPublic ?? 1) // 🛡️ NULLISH COALESCING: Use ?? instead of ||
    };

    
    // 🚀 PHASE 24.2: ATOMIC UPSERT OPERATION
    // This eliminates E11000 duplicate key errors by using findOneAndUpdate with upsert
    try {
      // 🔥 ATOMIC UPSERT: Create if not exists, update if exists (by CID)
      const filter = cid ? { cid } : { userId, name: { $regex: new RegExp(`^${name.trim()}$`, "i") }, isDeleted: { $ne: 1 } };
      
      const upsertedBook = await Book.findOneAndUpdate(
        filter,
        { 
          $set: bookData,
          $setOnInsert: { 
            createdAt: Number(data.createdAt) || Date.now(),
            // ❌ REMOVED: isPublic is already in bookData via $set - no conflict
            syncAttempts: 0,
            isPinned: 0
          }
        },
        { 
          upsert: true, 
          new: true, 
          setDefaultsOnInsert: true,
          runValidators: true 
        }
      );

      // �️ DUPLICATE NAME CHECK: If no CID provided, check for name conflicts
      if (!cid) {
        const nameConflict = await Book.findOne({
          userId: userId,
          name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
          isDeleted: { $ne: 1 },
          _id: { $ne: upsertedBook._id }
        });

        if (nameConflict) {
          return NextResponse.json({ 
            success: true, 
            book: nameConflict, 
            message: "Vault adopted", 
            isActive: true 
          }, { status: 200 });
        }
      }

      // 📡 PUSH NOTIFICATION
      try {
        await pusher.trigger(`vault-channel-${userId}`, 'BOOK_CREATED', { 
          cid: upsertedBook.cid,
          _id: upsertedBook._id,
          userId: userId,
          vKey: upsertedBook.vKey
        });
      } catch (e) {}

      // 🎯 CONSISTENT RESPONSE FORMAT
      return NextResponse.json({ 
        success: true, 
        data: upsertedBook,
        isActive: true 
      }, { status: 201 });

    } catch (upsertError: any) {
      // �️ FALLBACK: Handle any remaining duplicate key errors
      if (upsertError.code === 11000) {
        console.warn('🔄 [UPSERT] Duplicate key error, fetching existing record:', upsertError.message);
        
        const existingBook = await Book.findOne({ 
          $or: [
            cid ? { cid } : {},
            { userId, name: { $regex: new RegExp(`^${name.trim()}$`, "i") }, isDeleted: { $ne: 1 } }
          ].filter(Boolean)
        });

        if (existingBook) {
          return NextResponse.json({ 
            success: true, 
            data: existingBook,
            message: "Existing record returned", 
            isActive: true 
          }, { status: 200 });
        }
      }
      
      throw upsertError; // Re-throw if not a duplicate error
    }
    
  } catch (error: any) {
    console.error('❌ [API-BOOKS-POST] Error:', error.message);
    return NextResponse.json({ message: error.message || "Operation failed" }, { status: 500 });
  }
}

/**
 * PUT: বইয়ের তথ্য আপডেট করা (Logic B Conflict Resolution সহ)
 */
export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { _id, name, description, userId, type, phone, image, vKey, mediaCid } = data;

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

    
    // 🎯 SERVER AUDIT: Log incoming vKey for debugging
    console.log('📡 [SERVER_AUDIT] Incoming vKey:', data.vKey, 'Current DB vKey:', existingBook.vKey);
    
    
    // 🎯 SMART-MERGE: Only update fields that are actually in the payload
    // This prevents overwriting existing data with undefined/null values
    const updateData: any = {};
    const allowedFields = ['name', 'description', 'type', 'phone', 'image', 'mediaCid', 'vKey', 'updatedAt', 'isPublic', 'cachedBalance'];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'name') {
          updateData.name = data.name.trim();
        } else if (field === 'updatedAt') {
          updateData.updatedAt = Number(data.updatedAt) || Date.now();
        } else if (field === 'isPublic') {
          updateData.isPublic = Number(data.isPublic);
        } else if (field === 'cachedBalance') {
          updateData.cachedBalance = Number(data.cachedBalance) || 0; // 🚨 DNA HARDENING: Force Number
        } else if (field === 'vKey') {
          updateData.vKey = Number(data.vKey); // 🎯 Force Number for vKey
        } else {
          updateData[field] = data[field];
        }
      }
    });
    
    // 🛡️ SOVEREIGN ENFORCEMENT: Force versioning data from client
    if (data.vKey !== undefined) updateData.vKey = Number(data.vKey);
    if (data.updatedAt !== undefined) updateData.updatedAt = Number(data.updatedAt);
    
    // Always update timestamp if not provided
    if (!updateData.updatedAt) {
      updateData.updatedAt = Date.now();
    }
    
    const updatedBook = await Book.findOneAndUpdate(
      { _id, userId: userId },
      { $set: updateData },
      { new: true, runValidators: true } // 🎯 Ensure new: true is present
    );

    // সিগন্যাল ট্রিগার
    try {
        if (updatedBook) {
            await pusher.trigger(`vault_channel_${updatedBook.userId}`, 'BOOK_UPDATED', { 
                cid: updatedBook.cid,
                _id: updatedBook._id,
                userId: updatedBook.userId,
                vKey: updatedBook.vKey
            });
        } else {
            return NextResponse.json({ message: "Book not found" }, { status: 404 });
        }
    } catch (e) {}

    // 🎯 ATOMIC vKey GUARD: Return client's vKey for verification
    // This ensures the client knows what vKey was used
    const clientVKey = data.vKey;
    
    return NextResponse.json({ 
      success: true, 
      book: updatedBook, 
      clientVKey: clientVKey, // 🔒 ATOMIC GUARD: Echo back client's vKey
      isActive: true 
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
