import { NextResponse } from "next/server";
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import connectDB from "@/lib/db";
import User, { IUser } from "@/models/User";

/**
 * GOOGLE AUTHENTICATION API (SERVER-SIDE)
 * ---------------------------------------
 * Project: Vault Pro (Financial OS)
 * Logic: Verifies Google Token -> Checks DB -> Creates/Updates User (Account Linking)
 * Security: Validates 'aud' (Audience) to prevent token injection attacks.
 */

// Environment Variables Check
if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    throw new Error("FATAL: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in .env");
}

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json(
                { message: "Access Denied: No token provided" }, 
                { status: 400 }
            );
        }

        // ১. গুগল টোকেন ভেরিফিকেশন
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
            throw new Error("Invalid Token Payload: Email missing");
        }

        // ২. ডাটাবেস কানেকশন
        await connectDB();

        const { email, name, picture, sub: googleId } = payload;

        // ৩. ইউজার সার্চ (Email দিয়ে)
        // আমরা গুগল আইডি দিয়ে খুঁজছি না কারণ কেউ আগে ইমেইল দিয়ে একাউন্ট খুলে থাকলে আমরা সেটা লিংক করব।
        let user = await User.findOne({ email });

        if (user) {
            /**
             * SCENARIO A: EXISTING USER (ACCOUNT LINKING)
             * ইউজার আগে থেকেই আছে (Email/Pass বা Google দিয়ে)।
             * আমরা এখন Google ID লিংক করব এবং প্রোফাইল আপডেট করব।
             */
            let isModified = false;

            // Google ID লিংক করা (যদি আগে না থাকে)
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google'; // হাইব্রিড লজিক: এখন থেকে প্রাইমারি মেথড গুগল
                isModified = true;
            }

            // ইমেইল ভেরিফিকেশন কনফার্ম করা (যেহেতু গুগল ট্রাস্টেড সোর্স)
            if (!user.isVerified) {
                user.isVerified = true;
                isModified = true;
            }

            // ইমেজ সিঙ্ক (Lazy Sync Strategy)
            // ইউজার যদি ম্যানুয়ালি ছবি আপলোড না করে থাকে, তবেই গুগলের ছবি নেব
            if (!user.isCustomImage && picture && user.image !== picture) {
                user.image = picture;
                isModified = true;
            }

            // নাম মিসিং থাকলে আপডেট (Optional)
            if (!user.username && name) {
                user.username = name;
                isModified = true;
            }

            if (isModified) await user.save();

        } else {
            /**
             * SCENARIO B: NEW USER REGISTRATION
             * সম্পূর্ণ নতুন ইউজার তৈরি করা হচ্ছে।
             */
            user = await User.create({
                username: name || email.split('@')[0], // নাম না থাকলে ইমেইলের প্রথম অংশ
                email: email,
                googleId: googleId, // Security ID
                image: picture || "",
                authProvider: 'google',
                isVerified: true, // Google Verified
                isCustomImage: false,
                // ডিফল্ট ফিনান্সিয়াল সেটিংস
                categories: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
                currency: 'BDT (৳)',
                preferences: {
                    dailyReminder: false,
                    weeklyReports: false,
                    highExpenseAlert: false
                }
            });
        }

        // ৪. ফ্রন্টএন্ডের জন্য ক্লিন ডাটা রিটার্ন (Password/OTP বাদ দিয়ে)
        const userData = {
            _id: user._id,
            username: user.username,
            email: user.email,
            image: user.image,
            authProvider: user.authProvider,
            categories: user.categories,
            currency: user.currency,
            isVerified: user.isVerified,
            createdAt: user.createdAt
        };

        return NextResponse.json({
            success: true,
            message: "Authentication Successful",
            user: userData
        }, { status: 200 });

    } catch (error: any) {
        console.error("❌ GOOGLE_AUTH_ERROR:", error.message);
        return NextResponse.json(
            { message: "Authentication failed. Please try again." }, 
            { status: 401 }
        );
    }
}