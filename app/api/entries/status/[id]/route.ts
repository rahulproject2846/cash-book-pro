import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

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
    const validStatuses = ['Completed', 'Pending'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json(
            { message: "Invalid status protocol. Must be 'Completed' or 'Pending'" }, 
            { status: 400 }
        );
    }

    await connectDB();

    // ৩. শুধুমাত্র স্ট্যাটাস ফিল্ডটি আপডেট করা
    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      { $set: { status } }, 
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json({ message: "Record not found in vault" }, { status: 404 });
    }

    // ৪. সফল রেসপন্স
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