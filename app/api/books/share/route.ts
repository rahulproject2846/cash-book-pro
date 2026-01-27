// src/app/api/books/share/route.ts

import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { bookId, enable } = await req.json();
    
    if (!bookId) {
        return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    await connectDB();

    // টোকেন জেনারেট করার সিম্পল ফাংশন
    const generateToken = () => {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    };

    let updateData: any = { isPublic: enable };

    if (enable) {
        const book = await Book.findById(bookId);
        
        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        // যদি আগে টোকেন না থাকে, তবেই নতুন বানাবো
        if (!book.shareToken) {
            updateData.shareToken = generateToken();
        }
    } else {
        updateData.isPublic = false;
    }

    // ডাটাবেস আপডেট করা
    const updatedBook = await Book.findByIdAndUpdate(
        bookId, 
        updateData, 
        { new: true }
    );
    
    return NextResponse.json({ 
        success: true, 
        isPublic: updatedBook.isPublic, 
        shareToken: updatedBook.shareToken 
    });

  } catch (error) {
    console.error("SHARE API ERROR:", error);
    return NextResponse.json({ error: "Failed to update share settings" }, { status: 500 });
  }
}