import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ message: "Security token required" }, { status: 400 });
    }

    await connectDB();
    
    // ১. ইউজারের সব বই খুঁজে বের করা
    const userBooks = await Book.find({ userId }).select('_id');
    const bookIds = userBooks.map(b => b._id);

    // ২. ওই সব বইয়ের সব ট্রানজেকশন তারিখ অনুযায়ী আনা
    const allEntries = await Entry.find({ bookId: { $in: bookIds } })
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json({
        success: true,
        count: allEntries.length,
        entries: allEntries
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Timeline synchronization failed" }, { status: 500 });
  }
}