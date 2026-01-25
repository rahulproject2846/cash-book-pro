import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get('bookId');
  await connectDB();
  const entries = await Entry.find({ bookId }).sort({ date: -1 });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await connectDB();
    // তারিখটিকে স্ট্রিং থেকে ডেট অবজেক্টে রূপান্তর করা
    const entryData = {
      ...data,
      date: new Date(data.date),
      amount: Number(data.amount)
    };
    const newEntry = await Entry.create(entryData);
    return NextResponse.json(newEntry);
  } catch (err) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}