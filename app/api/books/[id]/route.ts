// src/app/api/books/[id]/route.ts
import connectDB from "@/lib/db";
import Book from "@/models/Book";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    await connectDB();
    const updatedBook = await Book.findByIdAndUpdate(id, data, { new: true });
    if (!updatedBook) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json(updatedBook);
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      await connectDB();
      await Entry.deleteMany({ bookId: id });
      await Book.findByIdAndDelete(id);
      return NextResponse.json({ message: "Deleted" });
    } catch (err) {
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}