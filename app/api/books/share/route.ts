import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";
import crypto from 'crypto'; // নিরাপদ টোকেন তৈরির জন্য বিল্ট-ইন মডিউল

export async function POST(req: Request) {
  try {
    const { bookId, enable } = await req.json();
    
    // ১. ভ্যালিডেশন
    if (!bookId) {
        return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });
    }

    await connectDB();

    // টোকেন জেনারেট করার নিরাপদ ফাংশন
    const generateSecureToken = () => {
        return crypto.randomBytes(16).toString('hex'); // 32-character secure token
    };

    let updateData: any = { isPublic: !!enable }; // নিশ্চিতভাবে বুলিয়ান ভ্যালু করা

    if (enable) {
        const book = await Book.findById(bookId);
        
        if (!book) {
            return NextResponse.json({ message: "Ledger not found" }, { status: 404 });
        }

        // যদি আগে থেকে টোকেন না থাকে, তবেই নতুন সিকিউর টোকেন জেনারেট হবে
        if (!book.shareToken) {
            updateData.shareToken = generateSecureToken();
        }
    } else {
        // শেয়ার অফ করলে Public Access বন্ধ হয়ে যাবে এবং টোকেন null করে দিতে হবে
        updateData.isPublic = false;
        updateData.shareToken = null;
    }

    // ২. ডাটাবেসে শেয়ার সেটিংস আপডেট করা
    const updatedBook = await Book.findByIdAndUpdate(
        bookId, 
        { $set: updateData }, 
        { new: true }
    );
    
    // ৩. রেসপন্স পাঠানো
    return NextResponse.json({ 
        success: true,
        message: enable ? "Public access enabled" : "Public access disabled",
        data: {
            isPublic: updatedBook.isPublic, 
            shareToken: updatedBook.shareToken 
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("SHARE_API_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to update share protocol" }, { status: 500 });
  }
}