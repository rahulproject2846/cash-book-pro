// src/app/api/auth/login/route.ts (Full Code: bcrypt import)
import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs'; // ইমপোর্ট করা হয়েছে

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    await connectDB();
    
    const user = await User.findOne({ email });

    // পাসওয়ার্ড চেক করা
    if (user && (await bcrypt.compare(password, user.password))) {
      return NextResponse.json({
        _id: user._id,
        username: user.username,
        email: user.email,
      }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ message: "Server error during login" }, { status: 500 });
  }
}