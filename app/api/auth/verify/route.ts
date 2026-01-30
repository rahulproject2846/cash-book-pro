import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    await connectDB();

    // ১. ইউজার খোঁজা (OTP ফিল্ড সহ আনতে হবে কারণ এটি বাই-ডিফল্ট হাইড করা)
    const user = await User.findOne({ email }).select('+otpCode +otpExpiry');

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ২. কোড ম্যাচিং লজিক
    if (user.otpCode !== otp) {
      return NextResponse.json({ message: "Invalid Code! Please try again." }, { status: 400 });
    }

    // ৩. মেয়াদ চেক করা
    if (new Date() > user.otpExpiry) {
        return NextResponse.json({ message: "Code Expired! Please resend." }, { status: 400 });
    }

    // ৪. সব ঠিক থাকলে ভেরিফাই করা এবং OTP মুছে ফেলা
    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return NextResponse.json({ 
        success: true, 
        message: "Account Verified Successfully",
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            image: user.image,
            // অন্যান্য দরকারি ডাটা...
        }
    });

  } catch (error: any) {
    return NextResponse.json({ message: "Verification Error" }, { status: 500 });
  }
}