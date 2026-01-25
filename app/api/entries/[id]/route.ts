import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// ১. নির্দিষ্ট একটি ট্রানজেকশন ডিলিট করা
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const deletedEntry = await Entry.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Entry deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}

// ২. ট্রানজেকশন এডিট করা
export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    await connectDB();
    
    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      data, 
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}