import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // ১. ভ্যালিডেশন
    if (!userId) {
      return NextResponse.json({ 
        success: true, 
        data: { income: 0, expense: 0, balance: 0 } 
      });
    }

    await connectDB();
    
    // ২. ইউজারের সব বই খুঁজে বের করা
    const userBooks = await Book.find({ userId }).select('_id');
    
    if (!userBooks || userBooks.length === 0) {
        return NextResponse.json({ 
            success: true, 
            data: { income: 0, expense: 0, balance: 0 } 
        });
    }

    const bookIds = userBooks.map(b => b._id);

    // ৩. অ্যাগ্রিগেশন প্রটোকল: সব বইয়ের এন্ট্রি ক্যালকুলেট করা (শুধুমাত্র Completed গুলো)
    const stats = await Entry.aggregate([
      { 
        $match: { 
          bookId: { $in: bookIds }, 
          status: 'Completed' 
        } 
      },
      { 
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    // ৪. ডাটা ফরম্যাটিং
    const income = stats.find(s => s._id === 'income')?.total || 0;
    const expense = stats.find(s => s._id === 'expense')?.total || 0;
    const balance = income - expense;

    // ৫. স্ট্যান্ডার্ড রেসপন্স
    return NextResponse.json({
        success: true,
        message: "Global analytics synchronized",
        data: {
            income,
            expense,
            balance
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("GLOBAL_STATS_ERROR:", error.message);
    return NextResponse.json({ 
        success: false, 
        message: "System failure during analytics processing",
        data: { income: 0, expense: 0, balance: 0 } 
    }, { status: 500 });
  }
}