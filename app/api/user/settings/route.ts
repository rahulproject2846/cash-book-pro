import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, categories, currency, preferences } = body;

    // 👇 এই লাইনটি চেক করবে API কল হচ্ছে কিনা
    console.log("🚀 SETTINGS API HIT for User:", userId);

    if (!userId) return NextResponse.json({ message: "User ID missing" }, { status: 400 });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { categories, currency, preferences } },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
        console.log("❌ User not found in DB");
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("✅ Sync Successful!");
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("🔥 SETTINGS API ERROR:", error.message);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}