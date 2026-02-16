import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import Book from "@/models/Book";
import { NextResponse } from "next/server";
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    // ১. ভ্যালিডেশন: আইডি এবং স্ট্যাটাস দুটাই থাকতে হবে
    if (!id || !status) {
      return NextResponse.json(
        { message: "Transaction ID and Status protocol required" }, 
        { status: 400 }
      );
    }

    // ২. এনাম ভ্যালিডেশন: ভুল কোনো স্ট্যাটাস যাতে ডাটাবেসে না যায়
    const validStatuses = ['completed', 'pending'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json(
            { message: "Invalid status protocol. Must be 'completed' or 'pending'" }, 
            { status: 400 }
        );
    }

    await connectDB();

    // ৩. FETCH EXISTING ENTRY FOR vKey INCREMENT
    const existingEntry = await Entry.findById(id);
    if (!existingEntry) {
      return NextResponse.json({ message: "Record not found in vault" }, { status: 404 });
    }

    // 🔥 vKey INCREMENT: Increment by 1 for proper versioning
    const newVKey = (existingEntry.vKey || 0) + 1;

    // ৪. UPDATE ENTRY WITH INCREMENTED vKey
    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      { 
        $set: { 
          status,
          vKey: newVKey, // 🔥 CRITICAL: Increment vKey for version control
          updatedAt: Date.now()
        } 
      }, 
      { new: true }
    );

    // ৫. UPDATE PARENT BOOK TIMESTAMP
    if (updatedEntry && updatedEntry.bookId) {
      await Book.findByIdAndUpdate(
        updatedEntry.bookId,
        { $set: { updatedAt: Date.now() } }
      );
    }

    // ৬. NON-BLOCKING PUSHER TRIGGER: Fire-and-forget for better UX
    if (updatedEntry) {
      pusher.trigger(`vault-channel-${updatedEntry.userId}`, 'ENTRY_STATUS_UPDATED', {
        cid: updatedEntry.cid,
        _id: updatedEntry._id,
        userId: updatedEntry.userId,
        bookId: updatedEntry.bookId,
        status: updatedEntry.status,
        vKey: updatedEntry.vKey
      }).catch(err => {
        console.warn('🚨 [PUSHER] Failed to trigger ENTRY_STATUS_UPDATED:', err);
      });
    }

    // ৭. সফল রেসপন্স
    return NextResponse.json({
        success: true,
        message: `Status updated to ${status}`,
        entry: updatedEntry
    }, { status: 200 });

  } catch (error: any) {
    console.error("STATUS_UPDATE_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to synchronize status" }, { status: 500 });
  }
}