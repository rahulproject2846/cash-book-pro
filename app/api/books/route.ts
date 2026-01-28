import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

// GET: ইউজারের সব লেজার (বই) লিস্ট দেখা
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // ১. ভ্যালিডেশন
    if (!userId) {
      return NextResponse.json({ message: "Security token (User ID) is required" }, { status: 400 });
    }

    await connectDB();
    
    // ২. ডেটা ফেচিং: updatedAt অনুযায়ী সর্ট (সর্বশেষ কাজ করা বই সবার উপরে)
    const books = await Book.find({ userId }).sort({ updatedAt: -1 });
    
    return NextResponse.json({
        success: true,
        count: books.length,
        books: books
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET_BOOKS_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to sync ledger list" }, { status: 500 });
  }
}

// POST: নতুন লেজার (বই) তৈরি করা
export async function POST(req: Request) {
  try {
    const { name, description, userId } = await req.json();
    
    // ১. ম্যান্ডেটরি ফিল্ড চেক
    if (!userId || !name) {
      return NextResponse.json({ message: "Ledger name and User ID are required" }, { status: 400 });
    }

    await connectDB();
    
    // ২. ডুপ্লিকেট চেক: একই নামে ইউজার যাতে একাধিক বই না খোলে
    const existingBook = await Book.findOne({ 
        userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") } // Case-insensitive check
    });

    if (existingBook) {
        return NextResponse.json({ message: "A ledger with this name already exists in your vault" }, { status: 400 });
    }

    // ৩. নতুন বই তৈরি (ডেটা ক্লিন করে)
    const newBook = await Book.create({ 
        name: name.trim(), 
        description: description?.trim() || "", 
        userId 
    });
    
    return NextResponse.json({
        success: true,
        message: "New financial vault initialized",
        book: newBook
    }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_BOOK_ERROR:", error.message);
    return NextResponse.json({ message: "Protocol failure during ledger creation" }, { status: 500 });
  }
}