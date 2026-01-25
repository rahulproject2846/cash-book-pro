// src/app/api/entries/status/[id]/route.ts
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json(); // Only expecting 'status' field

    await connectDB();
    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!updatedEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update status" }, { status: 500 });
  }
}