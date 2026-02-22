import connectDB from "@/lib/db";
import User from "@/models/User";
import Media from "@/models/Media";
import { NextResponse } from "next/server";

/**
 * USER PROFILE API ROUTE (V1.1 - IDENTITY MANAGEMENT)
 * -----------------------------------------------
 * Purpose: Handle user profile fetching, registration, and updates
 * Supports: GET (fetch profile), POST (register default), PUT (update profile)
 */

/**
 * GET: ইউজার প্রোফাইল ফেচ করা
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID required" 
      }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId)
      .select('-password -otpCode -otpExpiry')
      .lean();

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile fetched successfully",
      user
    }, { status: 200 });

  } catch (error: any) {
    console.error("PROFILE_GET_ERROR:", error.message);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch profile"
    }, { status: 500 });
  }
}

/**
 * POST: ইউজার রেজিস্ট্রেশন বা ডিফল্ট প্রোফাইল তৈরি
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile, action } = body;

    if (!userId || !profile || !action) {
      return NextResponse.json(
        { message: "userId, profile, and action are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (action === 'register') {
      const existingUser = await User.findOne({ email: profile.email });
      if (existingUser) {
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 400 }
        );
      }

      const newUser = await User.create({
        username: profile.username,
        email: profile.email,
        password: profile.password,
        authProvider: profile.authProvider || 'credentials',
        googleId: profile.googleId,
        image: profile.image || "",
        isCustomImage: profile.isCustomImage || false,
        mediaCid: profile.mediaCid || "",
        categories: profile.categories || ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
        currency: profile.currency || 'BDT (৳)',
        preferences: profile.preferences || {
          dailyReminder: false,
          weeklyReports: false,
          highExpenseAlert: false
        }
      });

      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          image: newUser.image,
          isCustomImage: newUser.isCustomImage,
          mediaCid: newUser.mediaCid,
          categories: newUser.categories,
          currency: newUser.currency,
          preferences: newUser.preferences
        }
      }, { status: 201 });
    }

    return NextResponse.json(
      { message: "Invalid action" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("PROFILE_POST_ERROR:", error.message);
    return NextResponse.json({
      success: false,
      message: "Profile operation failed"
    }, { status: 500 });
  }
}

/**
 * PUT: ইউজার প্রোফাইল আপডেট করা (mediaCid সহ)
 */
export async function PUT(req: Request) {
  try {
    const { userId, image, mediaCid, isCustomImage, username } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID required" 
      }, { status: 400 });
    }

    await connectDB();
    
    // 🔄 [PROFILE UPDATE] Handle both CID and URL
    let imageToUpdate = image;
    if (image && image.startsWith('cid_')) {
      // CID provided - check if we have URL
      const mediaRecord = await Media.findOne({ cid: image });
      if (mediaRecord?.cloudinaryUrl) {
        imageToUpdate = mediaRecord.cloudinaryUrl;
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          image: imageToUpdate,
          mediaCid: mediaCid || undefined, // ✅ ADDED: Store mediaCid
          isCustomImage: isCustomImage || false,
          username: username || undefined,
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-password -otpCode -otpExpiry');
    
    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("PROFILE_PUT_ERROR:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Profile update failed" 
    }, { status: 500 });
  }
}
