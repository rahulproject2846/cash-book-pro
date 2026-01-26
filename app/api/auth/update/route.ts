import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const { userId, newName, newPassword } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (newName) updateData.username = newName;
    
    // যদি নতুন পাসওয়ার্ড দেওয়া হয়, তবে সেটি হ্যাশ করে সেভ করতে হবে
    if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // ডাটাবেজে ইউজার আপডেট করা
    const updatedUser = await User.findByIdAndUpdate(
        userId, 
        { $set: updateData }, 
        { new: true }
    );

    // যদি ইউজার খুঁজে না পাওয়া যায়
    if (!updatedUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // সফলভাবে আপডেট হলে নতুন ডেটা রিটার্ন করা
    return NextResponse.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}