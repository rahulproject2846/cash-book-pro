import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ১. ইনপুট ভ্যালিডেশন: ইমেইল বা পাসওয়ার্ড না থাকলে এরর রিটার্ন
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please provide both email and password" }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // ২. ইউজার খোঁজা (কেস-সেনসিটিভ ইমেইল হ্যান্ডলিং)
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // ৩. সিকিউরিটি চেক: ইউজার না থাকলে বা পাসওয়ার্ড না মিললে
    // (দুটি ক্ষেত্রেই একই মেসেজ দেওয়া সিকিউর)
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid email or security key" }, 
        { status: 401 }
      );
    }

    // ৪. সফল লগইন রেসপন্স (পাসওয়ার্ড বাদে প্রয়োজনীয় ডাটা)
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        categories: user.categories || [], // ক্যাটাগরি সাপোর্ট
        currency: user.currency || "BDT (৳)" // কারেন্সি সাপোর্ট
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("LOGIN_API_ERROR:", error.message);
    return NextResponse.json(
      { message: "Authentication system failure" }, 
      { status: 500 }
    );
  }
}