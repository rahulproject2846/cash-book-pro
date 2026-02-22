import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID required" 
      }, { status: 400 });
    }

    await connectDB();
    
    // Get user's books and entries for manifest
    const userBooks = await Book.find({ userId, isDeleted: 0 }).countDocuments();
    const stats = await Entry.aggregate([
      { 
        $match: { 
          bookId: { $in: await Book.find({ userId, isDeleted: 0 }).select('_id') }, 
          status: { $in: ['completed', 'Completed'] }
        } 
      },
      { 
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const income = stats.find(s => s._id === 'income')?.total || 0;
    const expense = stats.find(s => s._id === 'expense')?.total || 0;
    const balance = income - expense;

    return NextResponse.json({
      success: true,
      message: "Manifest generated successfully",
      data: {
        totalBooks: userBooks,
        totalIncome: income,
        totalExpense: expense,
        balance
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("MANIFEST_ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to generate manifest" 
    }, { status: 500 });
  }
}
