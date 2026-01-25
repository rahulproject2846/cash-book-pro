// GET ও POST মেথড আপডেট করা হয়েছে
import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId'); // NEW: Get User ID
  if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

  await connectDB();
  const books = await Book.find({ userId }).sort({ createdAt: -1 }); // Filter by User ID
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  try {
    const { name, description, userId } = await req.json(); // NEW: Expect User ID
    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    await connectDB();
    const newBook = await Book.create({ name, description, userId }); // Save with User ID
    return NextResponse.json(newBook);
  } catch (err) {
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}