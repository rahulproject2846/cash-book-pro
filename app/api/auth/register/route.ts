import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { sendOTP } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    await connectDB();

    // ১. চেক করি ইউজার আগে থেকেই আছে কি না
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // যদি ইউজার থাকে এবং ভেরিফাইড হয় -> এরর দেখাবো
      if (existingUser.isVerified) {
        return NextResponse.json({ message: "Account already exists! Please Login." }, { status: 400 });
      }
      // যদি ইউজার থাকে কিন্তু ভেরিফাইড না হয় -> আমরা নতুন করে ওটিপি পাঠাবো (পাসওয়ার্ড আপডেট সহ)
      // (নিচে লজিক কন্টিনিউ হবে)
    }

    // ২. ৬ ডিজিটের র‍্যান্ডম কোড তৈরি
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // ১০ মিনিট মেয়াদ

    // ৩. পাসওয়ার্ড হ্যাশ করা
    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
        // আপডেট (আগের আন-ভেরিফাইড ইউজার)
        existingUser.username = username;
        existingUser.password = hashedPassword;
        existingUser.otpCode = otpCode;
        existingUser.otpExpiry = otpExpiry;
        await existingUser.save();
    } else {
        // নতুন ইউজার তৈরি
        await User.create({
            username,
            email,
            password: hashedPassword,
            otpCode,
            otpExpiry,
            isVerified: false, // ডিফল্ট ফলস
            authProvider: 'credentials',
            categories: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
            currency: 'BDT (৳)'
        });
    }

    // ৪. ইমেইল পাঠানো
    const emailSent = await sendOTP(email, otpCode);

    if (!emailSent) {
        return NextResponse.json({ message: "Failed to send email. Check connection." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP Sent Successfully" });

  } catch (error: any) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json({ message: "System Error" }, { status: 500 });
  }
}