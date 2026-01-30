import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

/**
 * STANDARD LOGIN API (EMAIL/PASSWORD)
 * -----------------------------------
 * Project: Vault Pro (Financial OS)
 * Updates: 
 * - Checks if user is a 'Google-only' account (no password).
 * - Returns 'isVerified' and 'image' to match Google Auth response structure.
 */

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ১. ইনপুট ভ্যালিডেশন
    if (!email || !password) {
      return NextResponse.json(
        { message: "Please provide both email and password" }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // ২. ইউজার খোঁজা (কেস-সেনসিটিভ ইমেইল হ্যান্ডলিং)
    // + password ফিল্ড সিলেক্ট করা কারণ কিছু ক্ষেত্রে এটি ডিফল্ট হাইড থাকতে পারে
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // ৩. ইউজার চেকিং
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or security key" }, 
        { status: 401 }
      );
    }

    // ৪. Google-Only একাউন্ট চেক (পাসওয়ার্ড নেই মানে সে গুগল দিয়ে খুলেছে)
    if (!user.password) {
      return NextResponse.json(
        { message: "This account uses Google Login. Please sign in with Google." }, 
        { status: 400 }
      );
    }

    // ৫. পাসওয়ার্ড ভেরিফিকেশন
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid email or security key" }, 
        { status: 401 }
      );
    }

    // ৬. সফল লগইন রেসপন্স (Google Auth এর সাথে সামঞ্জস্যপূর্ণ ডাটা স্ট্রাকচার)
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        image: user.image || "", // ইমেজ ইউআরএল
        authProvider: user.authProvider,
        categories: user.categories,
        currency: user.currency,
        isVerified: user.isVerified, // ভেরিফিকেশন স্ট্যাটাস
        createdAt: user.createdAt
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