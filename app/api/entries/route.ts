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
  const data = await req.json();
  await connectDB();
  const newEntry = await Entry.create(data);
  return NextResponse.json(newEntry);
}

// DELETE এবং PUT (Edit) আমরা পরের ধাপে যোগ করছি