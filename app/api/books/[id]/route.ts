import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";
import Pusher from 'pusher';
import mongoose from "mongoose";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

/**
 * GET: Fetch single book with all fields (including images)
 * Returns complete book object for focused hydration
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ message: "Book ID is required" }, { status: 400 });
    }

    await connectDB();

    // 🔥 FOCUSED HYDRATION: Support both MongoDB _id and cid
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { cid: id };
    const book = await Book.findOne(query).lean();

    if (!book) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    console.log(`🎯 [SINGLE BOOK] Fetched book for focused hydration:`, {
      id: book._id,
      cid: book.cid,
      name: book.name,
      hasImage: !!book.image
    });

    return NextResponse.json({
      success: true,
      data: book,
      timestamp: Date.now()
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [SINGLE BOOK] Fetch failed:", error);
    return NextResponse.json({ 
      message: "Failed to fetch book",
      error: error.message 
    }, { status: 500 });
  }
}

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
    console.log('🔍 [API-BOOKS-PUT] ID Match Check - URL ID:', JSON.stringify(id), 'DB _id:', JSON.stringify(existingBook._id), 'Match:', String(id) === String(existingBook._id));
    
    // ৩. আপডেটেড পেলোড তৈরি (নতুন ফিল্ড সহ)
    const updatePayload: any = {};
    
    // 🔕 BLIND DELETE BYPASS: Skip all validations for delete operations
    if (updateData.isDeleted === 1) {
        console.log('🔕 [BLIND DELETE] Bypassing validations for delete operation');
        
        const updatedBook = await Book.findByIdAndUpdate(
            id, 
            { $set: { 
                isDeleted: 1,
                vKey: updateData.vKey || Date.now() // 🚨 CRITICAL: Update vKey for delete
            }}, 
            { new: true }
        );
        
        if (!updatedBook) {
            return NextResponse.json({ message: "Vault record not found" }, { status: 404 });
        }
        
        // 📡 BOOK_UPDATED: Trigger real-time sync for delete operation
        try {
            await pusher.trigger(`vault-channel-${String(userId)}`, 'BOOK_UPDATED', { 
                ...updatedBook.toObject(),
                userId: String(userId),
                vKey: updatedBook.vKey,
                cid: updatedBook.cid,
                _id: updatedBook._id
            });
        } catch (e) {}
        
        return NextResponse.json({
            success: true,
            message: "Ledger marked as deleted",
            book: updatedBook
        }, { status: 200 });
    }
    
    // Normal field validations for non-delete operations
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
    
    // 📡 BOOK_UPDATED: Trigger real-time sync
    try {
        await pusher.trigger(`vault-channel-${String(userId)}`, 'BOOK_UPDATED', { 
            ...updatedBook.toObject(),
            userId: String(userId),
            vKey: updatedBook.vKey,
            cid: updatedBook.cid,
            _id: updatedBook._id
        });
    } catch (e) {}
    
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
      
      // 📡 BOOK_DELETED: Trigger real-time sync before deletion
      try {
        await pusher.trigger(`vault-channel-${String(bookExists.userId)}`, 'BOOK_DELETED', { 
            ...bookExists.toObject(),
            userId: String(bookExists.userId),
            vKey: bookExists.vKey,
            cid: bookExists.cid,
            _id: bookExists._id
        });
      } catch (e) {}
      
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