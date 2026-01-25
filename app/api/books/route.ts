import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const books = await Book.find().sort({ createdAt: -1 });
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  await connectDB();
  const newBook = await Book.create({ name, description });
  return NextResponse.json(newBook);
}