import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

// GET: ইউজারের সব লেজার লিস্ট দেখা (Unchanged)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ message: "User ID is required" }, { status: 400 });

    await connectDB();
    const books = await Book.find({ userId }).sort({ updatedAt: -1 });
    
    return NextResponse.json({
        success: true,
        count: books.length,
        books: books
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET_BOOKS_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to sync" }, { status: 500 });
  }
}

// POST: নতুন লেজার তৈরি করা (Updated with new fields)
export async function POST(req: Request) {
  try {
    const { name, description, userId, type, phone, image } = await req.json();
    
    if (!userId || !name) {
      return NextResponse.json({ message: "Ledger name and User ID are required" }, { status: 400 });
    }

    await connectDB();
    
    // ডুপ্লিকেট চেক
    const existingBook = await Book.findOne({ 
        userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
    });

    if (existingBook) {
        return NextResponse.json({ message: "Name already exists" }, { status: 400 });
    }

    // ৩. নতুন বই তৈরি (নতুন ফিল্ড সহ)
    const newBook = await Book.create({ 
        name: name.trim(), 
        description: description?.trim() || "", 
        userId,
        // 🔥 হার্ড সিঙ্ক ডাটা
        type: type?.toLowerCase() || 'general',
        phone: phone?.trim() || "",
        image: image || "" 
    });
    
    return NextResponse.json({
        success: true,
        message: "Vault initialized",
        book: newBook
    }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_BOOK_ERROR:", error.message);
    return NextResponse.json({ message: "Creation failed" }, { status: 500 });
  }
}