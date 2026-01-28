import connectDB from "@/lib/db";
import User from "@/models/User";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    // ১. ভ্যালিডেশন: ইউজার আইডি না থাকলে সাথে সাথে এরর রিটার্ন
    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    // ২. চেক করা: ইউজার আসলে আছে কি না (অপ্রয়োজনীয় ডিলিট অপারেশন এড়াতে)
    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json({ message: "User account not found" }, { status: 404 });
    }

    // ৩. ক্যাসকেড ডিলিট অপারেশন (একদম নিখুঁত সিরিয়াল)
    
    // ইউজারের সব বই খুঁজে বের করা
    const userBooks = await Book.find({ userId });
    const bookIds = userBooks.map(book => book._id);

    if (bookIds.length > 0) {
      // ওই বইগুলোর সাথে যুক্ত সব ট্রানজেকশন (Entry) ডিলিট করা
      await Entry.deleteMany({ bookId: { $in: bookIds } });
      
      // ইউজারের সব বই (Book) ডিলিট করা
      await Book.deleteMany({ userId });
    }

    // ৪. সবশেষে মেইন ইউজার প্রোফাইল ডিলিট করা
    await User.findByIdAndDelete(userId);

    // ৫. সাকসেস রেসপন্স
    return NextResponse.json({ 
      message: "Vault destroyed and account deleted successfully",
      success: true 
    }, { status: 200 });

  } catch (error: any) {
    console.error("ACCOUNT_DELETE_ERROR:", error.message);
    return NextResponse.json({ 
      message: "System failure during account termination",
      error: error.message 
    }, { status: 500 });
  }
}