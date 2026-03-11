// app/api/books/verify/route.ts
// 🎯 GHOST DETECTION API: Verifies which book IDs exist on server
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Book from "@/models/Book";
import User from "@/models/User";
import { NextResponse } from "next/server";

/**
 * POST: Verify which book IDs exist on server
 * Input: { bookIds: string[] }
 * Output: { missingIds: string[] } - IDs that exist in request but NOT in DB
 */
export async function POST(req: Request) {
  try {
    const { bookIds, userId } = await req.json();

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { message: "bookIds array required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: "userId required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Security check
    let user;
    try {
      user = await User.findById(userId).select("isActive");
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "Identity not found" },
        { status: 404 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { isActive: false, message: "Account Suspended" },
        { status: 403 }
      );
    }

    // 🎯 Convert string IDs to MongoDB ObjectIds for querying
    const validObjectIds = bookIds
      .map((id: string) => {
        try {
          if (mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return null;
        } catch {
          return null;
        }
      })
      .filter((id): id is mongoose.Types.ObjectId => id !== null);

    if (validObjectIds.length === 0) {
      return NextResponse.json(
        { missingIds: [], message: "No valid IDs to verify" },
        { status: 200 }
      );
    }

    // 🔍 Query MongoDB for existing books
    const existingBooks = await Book.find({
      _id: { $in: validObjectIds },
      userId: userId,
      isDeleted: { $ne: 1 }
    })
      .select("_id")
      .lean();

    // 🎯 Extract existing IDs as strings
    const existingIds = new Set(
      existingBooks.map((book) => String(book._id))
    );

    // 🎯 Find missing IDs (exist in request but NOT in DB)
    const missingIds = bookIds.filter(
      (id: string) => !existingIds.has(String(id))
    );

    console.log(
      `👻 [VERIFY] Checked ${bookIds.length} IDs, found ${missingIds.length} missing`
    );

    return NextResponse.json(
      {
        success: true,
        missingIds,
        checkedCount: bookIds.length,
        existingCount: existingBooks.length,
        missingCount: missingIds.length
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("👻 [VERIFY] Error:", error);
    return NextResponse.json(
      { message: "Verification failed" },
      { status: 500 }
    );
  }
}
