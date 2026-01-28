import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, categories, currency, preferences } = body;

    console.log("🚀 SYSTEM_SYNC_ATTEMPT for User:", userId);

    // ১. ভ্যালিডেশন
    if (!userId) {
      return NextResponse.json(
        { message: "Security token (User ID) is missing" }, 
        { status: 400 }
      );
    }

    // ২. ডেটা ক্লিনিং (Sanitization)
    // ক্যাটাগরি লিস্ট থেকে ডুপ্লিকেট সরানো এবং টেক্সট ট্রিম করা
    let cleanCategories = categories;
    if (Array.isArray(categories)) {
        cleanCategories = Array.from(new Set(
            categories
                .filter(cat => cat && typeof cat === 'string' && cat.trim() !== "")
                .map(cat => cat.trim())
        ));
    }

    // ৩. ডাটাবেসে সিস্টেম কনফিগারেশন আপডেট করা
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
            categories: cleanCategories, 
            currency: currency || "BDT (৳)", 
            preferences: preferences || {} 
        } 
      },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
        console.log("❌ SYNC_FAILED: User not found in database");
        return NextResponse.json({ message: "User identity not found" }, { status: 404 });
    }

    console.log("✅ SYSTEM_SYNC_SUCCESSFUL for:", updatedUser.username);

    // ৪. স্ট্যান্ডার্ড রেসপন্স
    return NextResponse.json({
        success: true,
        message: "System configuration synchronized with cloud",
        user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            categories: updatedUser.categories,
            currency: updatedUser.currency,
            preferences: updatedUser.preferences
        }
    }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 SYSTEM_SETTINGS_ERROR:", error.message);
    return NextResponse.json(
        { message: "Protocol failure during system sync" }, 
        { status: 500 }
    );
  }
}