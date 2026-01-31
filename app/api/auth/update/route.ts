import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const { userId, currentPassword, newName, newPassword, image, isCustomImage } = data;

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ১. পাসওয়ার্ড ভেরিফিকেশন (শুধুমাত্র ক্রেডেনশিয়াল একাউন্টের জন্য)
    // Google বা অন্য প্রোভাইডার হলে পাসওয়ার্ড চেক স্কিপ করবে
    if (user.authProvider === 'credentials') {
        if (!currentPassword) {
            return NextResponse.json({ message: "Current password is required" }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Incorrect current password" }, { status: 401 });
        }
    }

    // ২. নাম আপডেট
    if (newName) user.username = newName.trim();

    // ৩. ইমেজ আপডেট (Avatar/Custom Image)
    // image যদি null বা string হয়, সেটা আপডেট হবে
    if (image !== undefined) {
        user.image = image;
        user.isCustomImage = isCustomImage;
    }

    // ৪. নতুন পাসওয়ার্ড সেট করা
    if (newPassword) {
        if (newPassword.length < 6) {
            return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
        }
        user.password = await bcrypt.hash(newPassword, 10);
    }

    // ডাটাবেসে সেভ করা
    await user.save();

    // রেসপন্সে পাসওয়ার্ড ফিল্ড বাদ দিয়ে ইউজার ডাটা পাঠানো
    const { password, ...userWithoutPass } = user.toObject();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: userWithoutPass
    }, { status: 200 });

  } catch (error: any) {
    console.error("PROFILE_UPDATE_ERROR:", error);
    return NextResponse.json({ message: "Update failed. Please try again." }, { status: 500 });
  }
}