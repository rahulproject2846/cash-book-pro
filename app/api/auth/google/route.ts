import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const { access_token } = await req.json();

        if (!access_token) {
            return NextResponse.json({ message: "Token missing" }, { status: 400 });
        }

        // ১. গুগল এপিআই থেকে ইউজার প্রোফাইল ফেচ করা
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        
        const payload = await googleRes.json();
        if (!payload.email) throw new Error("Google Identity not found");

        await connectDB();
        const { email, name, picture, sub: googleId } = payload;

        // ২. ইউজার সিঙ্ক প্রোটোকল (অপরিবর্তিত লজিক)
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            let isModified = false;
            if (!user.googleId) { user.googleId = googleId; user.authProvider = 'google'; isModified = true; }
            if (!user.isVerified) { user.isVerified = true; isModified = true; }
            if (!user.isCustomImage && picture && user.image !== picture) { user.image = picture; isModified = true; }
            if (isModified) await user.save();
        } else {
            user = await User.create({
                username: name || email.split('@')[0],
                email: email.toLowerCase(),
                googleId,
                image: picture || "",
                authProvider: 'google',
                isVerified: true,
                categories: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
                currency: 'BDT (৳)',
                preferences: { language: 'en', compactMode: false, isMidnight: false, autoLock: false }
            });
        }

        return NextResponse.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                image: user.image,
                authProvider: user.authProvider,
                categories: user.categories,
                currency: user.currency,
                preferences: user.preferences
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ GOOGLE_SYNC_ERROR:", error.message);
        return NextResponse.json({ message: "Handshake Failed" }, { status: 401 });
    }
}