// src/app/api/stats/global/route.ts
import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ income: 0, expense: 0 });
    }

    await connectDB();
    
    // ১. ইউজারের সব বই খুঁজে বের করা
    const userBooks = await Book.find({ userId });
    const bookIds = userBooks.map(b => b._id);

    // ২. সেই সব বইয়ের সব এন্ট্রি এগ্রিগেট করা (শুধুমাত্র Completed গুলো)
    const stats = await Entry.aggregate([
      { $match: { bookId: { $in: bookIds }, status: 'Completed' } },
      { $group: {
          _id: "$type",
          total: { $sum: "$amount" }
      }}
    ]);

    const result = {
      income: stats.find(s => s._id === 'income')?.total || 0,
      expense: stats.find(s => s._id === 'expense')?.total || 0,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ income: 0, expense: 0 }, { status: 500 });
  }
}