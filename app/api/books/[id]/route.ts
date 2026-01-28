import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// PUT: লেজারের নাম বা বিবরণ আপডেট করা
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    // ১. ভ্যালিডেশন
    if (!id) {
        return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });
    }

    await connectDB();
    
    // ২. শুধুমাত্র নাম এবং ডেসক্রিপশন আপডেট করার অনুমতি দেওয়া (userId বা অন্য কিছু নয়)
    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name.trim();
    if (data.description !== undefined) updatePayload.description = data.description.trim();

    const updatedBook = await Book.findByIdAndUpdate(
        id, 
        { $set: updatePayload }, 
        { new: true }
    );
    
    if (!updatedBook) {
        return NextResponse.json({ message: "Vault record not found" }, { status: 404 });
    }
    
    return NextResponse.json({
        success: true,
        message: "Ledger details updated",
        book: updatedBook
    }, { status: 200 });

  } catch (error: any) {
    console.error("BOOK_UPDATE_ERROR:", error.message);
    return NextResponse.json({ message: "Update operation failed" }, { status: 500 });
  }
}

// DELETE: লেজার ডিলিট করা (ভেতরের সব এন্ট্রি সহ)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });
      }

      await connectDB();

      // ১. সিকিউরিটি চেক: বইটি আসলে আছে কি না দেখা
      const bookExists = await Book.findById(id);
      if (!bookExists) {
        return NextResponse.json({ message: "Ledger not found in the vault" }, { status: 404 });
      }
      
      // ২. ক্যাসকেড ডিলিট: প্রথমে বইয়ের ভেতরের সব ট্রানজেকশন ডিলিট করা
      await Entry.deleteMany({ bookId: id });
      
      // ৩. সবশেষে লেজার ডিলিট করা
      await Book.findByIdAndDelete(id);

      return NextResponse.json({ 
        success: true,
        message: "Vault cleared and ledger deleted successfully" 
      }, { status: 200 });

    } catch (error: any) {
      console.error("BOOK_DELETE_ERROR:", error.message);
      return NextResponse.json({ message: "Ledger termination failed" }, { status: 500 });
    }
}