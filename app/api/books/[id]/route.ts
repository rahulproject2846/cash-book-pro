import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// PUT: লেজারের নাম, বিবরণ, টাইপ, ফোন বা ইমেজ আপডেট করা
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    // ১. ভ্যালিডেশন
    if (!id) {
        return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });
    }

    await connectDB();
    
    // ২. আপডেটেড পেলোড তৈরি (নতুন ফিল্ড সহ)
    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name.trim();
    if (data.description !== undefined) updatePayload.description = data.description.trim();
    
    // 🔥 নতুন ডাটা সিঙ্ক লজিক
    if (data.type) updatePayload.type = data.type.toLowerCase();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.image !== undefined) updatePayload.image = data.image;

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

// DELETE: লেজার ডিলিট করা (Unchanged logic)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      if (!id) return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });

      await connectDB();
      const bookExists = await Book.findById(id);
      if (!bookExists) return NextResponse.json({ message: "Ledger not found" }, { status: 404 });
      
      await Entry.deleteMany({ bookId: id });
      await Book.findByIdAndDelete(id);

      return NextResponse.json({ 
        success: true,
        message: "Vault cleared successfully" 
      }, { status: 200 });

    } catch (error: any) {
      console.error("BOOK_DELETE_ERROR:", error.message);
      return NextResponse.json({ message: "Termination failed" }, { status: 500 });
    }
}