import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // ১. ভ্যালিডেশন
    if (!token) {
        return NextResponse.json({ message: "Security token is missing" }, { status: 400 });
    }

    console.log("🔥 PUBLIC_ACCESS_ATTEMPT: Token:", token);

    await connectDB();

    // ২. বই খোঁজা (অবশ্যই isPublic: true হতে হবে)
    // সিকিউরিটির জন্য userId এবং টাইমস্ট্যাম্প বাদ দেওয়া হয়েছে
    const book = await Book.findOne({ shareToken: token, isPublic: 1 })
        .select('-userId -createdAt -updatedAt -__v');
    
    if (!book) {
      console.log("❌ ACCESS_DENIED: Vault not found or private");
      return NextResponse.json(
        { message: "This vault link is either invalid, expired, or set to private" }, 
        { status: 404 }
      );
    }

    // ৩. ওই বইয়ের সব এন্ট্রি বের করা
    // লেটেস্ট তারিখ অনুযায়ী সর্ট করা
    const entries = await Entry.find({ bookId: book._id })
        .sort({ date: -1, createdAt: -1 })
        .select('-bookId -createdAt -updatedAt -__v');

    console.log(`✅ ACCESS_GRANTED: Synchronized ${entries.length} records for vault: ${book.name}`);

    // ৪. স্ট্যান্ডার্ড রেসপন্স
    return NextResponse.json({
        success: true,
        message: "Public vault synchronized successfully",
        data: {
            book,
            entries
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("PUBLIC_API_ERROR:", error.message);
    return NextResponse.json(
      { message: "Protocol failure during public access" }, 
      { status: 500 }
    );
  }
}