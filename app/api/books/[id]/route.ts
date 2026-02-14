import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// PUT: লেজারের নাম, বিবরণ, টাইপ, ফোন বা ইমেজ আপডেট করা
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, ...updateData } = await req.json();

    console.log('🔍 [API-BOOKS-PUT] Updating Book ID:', id, 'with data:', updateData);

    // ১. ভ্যালিডেশন
    if (!id) {
        return NextResponse.json({ message: "Ledger ID is required" }, { status: 400 });
    }

    if (!userId) {
        return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    }

    await connectDB();
    
    // ২. সিকিউরিটি চেক - Ensure book belongs to user
    const existingBook = await Book.findOne({ _id: id, userId });
    if (!existingBook) {
        console.log('❌ [API-BOOKS-PUT] Book not found or access denied. URL ID:', id, 'DB lookup failed for _id:', id, 'userId:', userId);
        return NextResponse.json({ message: "Access Denied" }, { status: 403 });
    }

    // 🔍 DEBUG: Check ID mismatch
    console.log('🔍 [API-BOOKS-PUT] ID Match Check - URL ID:', JSON.stringify(id), 'DB _id:', JSON.stringify(existingBook._id), 'Match:', id === existingBook._id);
    
    // ৩. আপডেটেড পেলোড তৈরি (নতুন ফিল্ড সহ)
    const updatePayload: any = {};
    if (updateData.name) updatePayload.name = updateData.name.trim();
    if (updateData.description !== undefined) updatePayload.description = updateData.description.trim();
    
    // 🔥 নতুন ডাটা সিঙ্ক লজিক
    if (updateData.type) updatePayload.type = updateData.type.toLowerCase();
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone.trim();
    if (updateData.image !== undefined) updatePayload.image = updateData.image;

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