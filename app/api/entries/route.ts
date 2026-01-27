// src/app/api/entries/route.ts (Final Fix for MongoDB Crash)
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// GET - Entry List
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');
  
  // FIX 1: bookId না থাকলে খালি array রিটার্ন করবে, MongoDB কে কল করবে না
  if (!bookId || bookId === 'undefined') {
    return NextResponse.json([]);
  }

  await connectDB();
  // FIX 2: Mongoose কে সরাসরি ObjectId দিয়ে খুঁজলে ক্র্যাশ করে, তাই শুধু bookId দিয়ে খুঁজছি
  const entries = await Entry.find({ bookId }).sort({ date: -1 }); 
  return NextResponse.json(entries);
}

// POST - New Entry
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { bookId, title, amount, type, category, paymentMethod, note, date } = data;

    // FIX 3: bookId না থাকলে এরর দেবে
    if (!bookId || bookId === 'undefined') {
        return NextResponse.json({ message: "Book ID is missing from entry data" }, { status: 400 });
    }

    await connectDB();
    const entryData = {
      bookId, title, amount: Number(amount), type, category, paymentMethod, note, date: new Date(date)
    };
    const newEntry = await Entry.create(entryData);
    return NextResponse.json(newEntry);
  } catch (err) {
    console.error("Entry POST Error:", err);
    return NextResponse.json({ message: "Failed to save entry" }, { status: 500 });
  }
}