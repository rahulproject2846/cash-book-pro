import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const { userId, currentPassword, newName, newPassword } = await req.json();

    if (!userId || !currentPassword) {
      return NextResponse.json({ message: "Identity verification failed: Current key missing" }, { status: 400 });
    }

    await connectDB();

    // ১. ইউজার খুঁজে বের করা
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "Identity not found in vault" }, { status: 404 });
    }

    // ২. বর্তমান পাসওয়ার্ড চেক করা (Verification Protocol)
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Access Denied: Current security key is incorrect" }, { status: 401 });
    }

    // ৩. আপডেট ডাটা তৈরি করা
    const updateData: any = {};
    if (newName) updateData.username = newName.trim();
    
    if (newPassword) {
        if (newPassword.length < 6) {
          return NextResponse.json({ message: "New key must be at least 6 characters" }, { status: 400 });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // ৪. আপডেট সম্পাদন করা
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updateData }, 
        { new: true }
    ).select("-password -__v");

    return NextResponse.json({
        success: true,
        message: "Identity protocol synchronized",
        user: updatedUser
    }, { status: 200 });

  } catch (error: any) {
    console.error("IDENTITY_UPDATE_ERROR:", error.message);
    return NextResponse.json({ message: "Protocol failure" }, { status: 500 });
  }
}