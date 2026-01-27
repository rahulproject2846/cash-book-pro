import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ message: "User ID missing" }, { status: 400 });
  }

  await connectDB();
  
  // UPDATE: Sort by 'updatedAt' descending instead of 'createdAt'
  // This ensures books with recent entries or edits appear first
  const books = await Book.find({ userId }).sort({ updatedAt: -1 });
  
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  try {
    const { name, description, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    }

    await connectDB();
    
    // Mongoose with { timestamps: true } in Schema will automatically handle createdAt and updatedAt
    const newBook = await Book.create({ name, description, userId });
    
    return NextResponse.json(newBook);
  } catch (err) {
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}