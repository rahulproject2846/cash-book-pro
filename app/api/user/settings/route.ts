import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

// 🔥 PUT (Update) Logic - এটি আগে থেকেই ছিল
export async function PUT(req: Request) {
    // ... আপনার আগের PUT লজিক ...
    // (এটি অক্ষুণ্ণ রাখুন)
    try {
        await connectDB();
        const body = await req.json();
        const { userId, categories, currency, preferences } = body;
        
        // ... PUT লজিক এবং ইউজার আপডেট কোড ...

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    categories: Array.isArray(categories) ? categories.map(c => c.trim()).filter(c => c !== "") : [], 
                    currency: currency || "BDT (৳)", 
                    preferences: preferences || {} 
                } 
            },
            { new: true }
        ).select('-password -__v');

        if (!updatedUser) {
            return NextResponse.json({ message: "User identity not found" }, { status: 404 });
        }

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
        return NextResponse.json(
            { message: "Protocol failure during system sync" }, 
            { status: 500 }
        );
    }
}

// 🔥 GET (Fetch) Logic - এটি নতুন যোগ করা হলো
export async function GET(req: Request) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required for fetching settings" }, 
                { status: 400 }
            );
        }

        const user = await User.findById(userId).select('categories currency preferences');

        if (!user) {
            return NextResponse.json({ message: "User identity not found" }, { status: 404 });
        }

        // শুধুমাত্র সেটিংস ডেটা ক্লায়েন্টকে পাঠানো হচ্ছে
        return NextResponse.json({
            success: true,
            user: {
                categories: user.categories || [],
                currency: user.currency || 'BDT (৳)',
                preferences: user.preferences || {}
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("🔥 SYSTEM_SETTINGS_GET_ERROR:", error.message);
        return NextResponse.json(
            { message: "Protocol failure during settings fetch" }, 
            { status: 500 }
        );
    }
}