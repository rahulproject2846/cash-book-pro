// src/app/api/books/route.ts
import connectDB from "@/lib/db";
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

    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    await connectDB();

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(userId).select('isActive');
    if (!user) return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    let query: any = { userId };
    if (since && since !== '0') {
        query.updatedAt = { $gt: new Date(Number(since)) };
    }

    const books = await Book.find(query).sort({ updatedAt: -1 });

    return NextResponse.json({ 
        success: true, 
        books, 
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
    const { name, description, userId, type, phone, image, vKey } = data;

    if (!userId || !name) return NextResponse.json({ message: "Fields missing" }, { status: 400 });

    await connectDB();

    // --- সিকিউরিটি চেক ---
    const user = await User.findById(userId).select('isActive');
    if (user && user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }
    
    // চেক: এই ইউজারের এই নামে অন্য কোনো বই আছে কি না
    const existingBook = await Book.findOne({ 
        userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
    });

    if (existingBook) {
        return NextResponse.json({ message: "Vault name exists", isActive: true }, { status: 400 });
    }

    const newBook = await Book.create({ 
        name: name.trim(), 
        description, 
        userId, 
        type: String(type || 'general').toLowerCase(), 
        phone, 
        image,
        vKey: vKey || 1 
    });
    
    return NextResponse.json({ success: true, book: newBook, isActive: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Creation failed" }, { status: 500 });
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

    // ১. ডাটা এবং ইউজার চেক
    const existingBook = await Book.findOne({ _id, userId });
    if (!existingBook) return NextResponse.json({ message: "Vault not found" }, { status: 404 });

    // --- সিকিউরিটি চেক ---
    const user = await User.findById(userId).select('isActive');
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

    // ৩. স্মার্ট ডুপ্লিকেট চেক (নাম পরিবর্তন করলে অন্য কোনো বইয়ের সাথে মিলছে কি না)
    const duplicate = await Book.findOne({
        userId,
        _id: { $ne: _id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (duplicate) {
        return NextResponse.json({ message: "Another vault has this name", isActive: true }, { status: 400 });
    }

    // ৪. আপডেট এক্সিকিউশন
    const updatedBook = await Book.findOneAndUpdate(
      { _id, userId },
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