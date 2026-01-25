// src/app/api/auth/register/route.ts (Full Code: HASHING ADDED)
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs'; // ইমপোর্ট করা হয়েছে

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { username, email, password } = data; 

    await connectDB();
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // পাসওয়ার্ড হ্যাশ করা
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // হ্যাশড পাসওয়ার্ড দিয়ে ইউজার তৈরি করা
    const user = await User.create({ username, email, password: hashedPassword });
    
    return NextResponse.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    }, { status: 201 });

  } catch (error) {
    console.error("REGISTER API ERROR (FIXED):", error);
    return NextResponse.json({ message: "Server error during registration" }, { status: 500 });
  }
}