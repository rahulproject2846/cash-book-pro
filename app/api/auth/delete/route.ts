import connectDB from "@/lib/db";
import User from "@/models/User";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();
    await connectDB();

    // ১. প্রথমে এই ইউজারের সব বই খুঁজে বের করি
    const userBooks = await Book.find({ userId });
    const bookIds = userBooks.map(book => book._id);

    // ২. সেই বইগুলোর সব এন্ট্রি ডিলিট করি
    await Entry.deleteMany({ bookId: { $in: bookIds } });

    // ৩. ইউজারের সব বই ডিলিট করি
    await Book.deleteMany({ userId });

    // ৪. সবশেষে ইউজার ডিলিট করি
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "Account deleted successfully" });

  } catch (error) {
    return NextResponse.json({ message: "Failed to delete account" }, { status: 500 });
  }
}