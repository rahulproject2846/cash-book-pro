import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// PUT: বইয়ের নাম বা বিবরণ এডিট করা
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    
    await connectDB();
    
    const updatedBook = await Book.findByIdAndUpdate(id, data, { new: true });
    
    if (!updatedBook) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedBook);
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: বই ডিলিট করা (বইয়ের ভেতরের এন্ট্রি সহ)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      await connectDB();
      
      // ১. বইয়ের সব এন্ট্রি ডিলিট
      await Entry.deleteMany({ bookId: id });
      
      // ২. বই ডিলিট
      const deletedBook = await Book.findByIdAndDelete(id);

      if (!deletedBook) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Ledger deleted successfully" });
    } catch (err) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}