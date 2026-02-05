import connectDB from "@/lib/db";
import Book from "@/models/Book";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    await connectDB();
    const books = await Book.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, books }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to sync" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, userId, type, phone, image } = await req.json();
    await connectDB();
    
    // চেক: এই ইউজারের এই নামে অন্য কোনো বই আছে কি না
    const existingBook = await Book.findOne({ 
        userId, 
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
    });

    if (existingBook) {
        return NextResponse.json({ message: "Vault name exists" }, { status: 400 });
    }

    const newBook = await Book.create({ 
        name: name.trim(), description, userId, type, phone, image 
    });
    
    return NextResponse.json({ success: true, book: newBook }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Creation failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const { _id, name, description, userId, type, phone, image } = await req.json();

    if (!_id || !userId) {
      return NextResponse.json({ message: "Auth/Book ID missing" }, { status: 400 });
    }

    // 🔥 স্মার্ট ডুপ্লিকেট চেক: নিজের আইডি বাদে অন্য কারও সাথে নাম মিলছে কি না
    const duplicate = await Book.findOne({
        userId,
        _id: { $ne: _id }, // নিজের আইডি বাদে চেক
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (duplicate) {
        return NextResponse.json({ message: "Another vault has this name" }, { status: 400 });
    }

    const updatedBook = await Book.findOneAndUpdate(
      { _id, userId },
      { $set: { name, description, type, phone, image, updatedAt: Date.now() } },
      { new: true }
    );

    return NextResponse.json({ success: true, book: updatedBook }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}