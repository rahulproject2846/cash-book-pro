// src/app/api/entries/count/route.ts
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট করা হলো
import { NextResponse } from "next/server";

/**
 * VAULT PRO: HEALTH CHECK API (Logic D + Security Gate)
 * ---------------------------------------------------
 * এটি শুধুমাত্র ইউজারের মোট এন্ট্রি সংখ্যা রিটার্ন করে।
 * অর্কেস্ট্রেটর এই সংখ্যাটি লোকাল ডাটাবেজের সাথে মিলিয়ে দেখে।
 * অ্যাডমিন ব্লকড কি না তা-ও চেক করা হয়।
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(userId).select('isActive');
    if (!user) {
        return NextResponse.json({ message: "User identity not found" }, { status: 404 });
    }
    
    // যদি ইউজার অ্যাডমিন প্যানেল থেকে ব্লকড থাকে
    if (user.isActive === false) {
        return NextResponse.json({ 
            isActive: false, 
            message: "Administrative Suspension: Account Blocked" 
        }, { status: 403 });
    }

    // শুধুমাত্র যে এন্ট্রিগুলো ডিলিট করা হয়নি (isDeleted: false) সেগুলো গোনা হবে
    const totalCount = await Entry.countDocuments({ 
      userId: userId,
      isDeleted: false 
    });

    return NextResponse.json({ 
      success: true, 
      count: totalCount,
      isActive: true, // অর্কেস্ট্রেটরকে সেশন ভ্যালিডিটি সিগন্যাল দেওয়া
      timestamp: Date.now()
    }, { status: 200 });

  } catch (error: any) {
    console.error("Health Check API Error:", error);
    return NextResponse.json({ message: "Counter fail", error: error.message }, { status: 500 });
  }
}