import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    
    // 👇 এই লাইনটি কনসোলে প্রিন্ট হবে যদি API হিট করে
    console.log("🔥 API HIT! Token checking for:", token);

    await connectDB();

    const book = await Book.findOne({ shareToken: token, isPublic: true }).select('-userId');
    
    if (!book) {
      console.log("❌ Book not found or not public");
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }

    const entries = await Entry.find({ bookId: book._id }).sort({ date: -1 });

    return NextResponse.json({ book, entries });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}