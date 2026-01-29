import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// PUT: লেনদেন (Transaction) আপডেট করা
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!id) {
        return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
    }

    await connectDB();

    // ১. আপডেট করার জন্য প্রয়োজনীয় ফিল্ডগুলো স্যানিটাইজ করা
    const updatePayload: any = {};
    if (data.title) updatePayload.title = data.title.trim();
    if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
    if (data.type) updatePayload.type = data.type;
    if (data.category) updatePayload.category = data.category;
    if (data.paymentMethod) updatePayload.paymentMethod = data.paymentMethod;
    if (data.note !== undefined) updatePayload.note = data.note.trim();
    if (data.date) updatePayload.date = new Date(data.date);
    if (data.status) updatePayload.status = data.status;
    if (data.time !== undefined) updatePayload.time = data.time;

    // ২. ডাটাবেসে আপডেট করা
    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      { $set: updatePayload }, 
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json({ message: "Transaction record not found" }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        message: "Transaction updated in the vault",
        entry: updatedEntry
    }, { status: 200 });

  } catch (error: any) {
    console.error("ENTRY_UPDATE_ERROR:", error.message);
    return NextResponse.json({ message: "Protocol failure during entry update" }, { status: 500 });
  }
}

// DELETE: লেনদেন ডিলিট করা
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });
    }

    await connectDB();
    
    // ১. ডিলিট অপারেশন
    const deletedEntry = await Entry.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return NextResponse.json({ message: "Transaction record not found" }, { status: 404 });
    }

    return NextResponse.json({ 
        success: true,
        message: "Record permanently removed from vault" 
    }, { status: 200 });

  } catch (error: any) {
    console.error("ENTRY_DELETE_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to clear record" }, { status: 500 });
  }
}