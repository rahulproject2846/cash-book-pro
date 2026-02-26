// src/app/api/entries/route.ts
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট করা হলো
import { NextResponse } from "next/server";
import mongoose from "mongoose"; // mongoose import added
import Pusher from 'pusher';
import { generateServerChecksum } from "@/lib/serverCrypto";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

/**
 * GET: ডাটা সিংক্রোনাইজেশন এবং হেলথ চেক (Logic D + Security Check)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since'); 

    if (!userId) return NextResponse.json({ message: "UID missing" }, { status: 400 });

    await connectDB();

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(userId).select('isActive');
    if (!user) return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // 🔥 UNIVERSAL QUERY: Handle both String and ObjectId formats
    let query: any = { userId, isDeleted: false }; // 🚨 CRITICAL: Exclude deleted records
    if (mongoose.Types.ObjectId.isValid(userId)) {
      query.$or = [
        { userId, isDeleted: false }, // String format
        { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } // ObjectId format
      ];
    }

    if (since && since !== '0') {
        query.updatedAt = { $gt: new Date(Number(since)) };
    }

    // 🔥 APPLE STANDARD EGRESS FILTER: Unique result set guarantee
    const entries = await Entry.aggregate([
        { $match: query }, // আপনার ফিল্টার (userId, isDeleted: false)
        { $sort: { updatedAt: -1, createdAt: -1 } }, // লেটেস্ট ডাটা সবার উপরে
        { 
            $group: { 
                _id: "$cid", // প্রতিটি CID-র জন্য একটি গ্রুপ
                doc: { $first: "$$ROOT" } // গ্রুপ থেকে শুধু প্রথম (সবচেয়ে নতুন) ডকুমেন্টটি নাও
            } 
        },
        { $replaceRoot: { newRoot: "$doc" } }, // গ্রুপের স্ট্রাকচার ভেঙ্গে অরিজিনাল মডেলে ফেরাও
        { $sort: { updatedAt: -1 } } // ফাইনাল ইউআই সর্টিং
    ]);

    return NextResponse.json({ 
        success: true, 
        entries, 
        isActive: true, // অর্কেস্ট্রেটরকে সিগন্যাল দেওয়া
        serverTime: Date.now() 
    }, { status: 200 });

  } catch (error: any) { 
    return NextResponse.json({ message: "Fail" }, { status: 500 }); 
  }
}

/**
 * POST: নতুন এন্ট্রি তৈরি এবং চেকসাম ভ্যালিডেশন (Logic C + Security Check)
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { cid, bookId, userId, amount, date, title, category, checksum, vKey } = data;

    if (!bookId || !userId || amount === undefined || !date || !checksum) {
        return NextResponse.json({ message: "Solidarity fields missing" }, { status: 400 });
    }

    await connectDB();

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(userId).select('isActive');
    if (!user) return NextResponse.json({ message: "Identity not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // � GOOGLE/PAYPAL LEVEL IDEMPOTENCY: Atomic check + insert in single operation
    if (cid) {
        // 🚀 ATOMIC OPERATION: findOneAndUpdate prevents race conditions
        const idempotentRecord = await Entry.findOneAndUpdate(
            { cid: cid }, // Filter: Check if same CID exists
            { 
                $setOnInsert: {
                    ...data,
                    title: title?.trim() || `${category || 'GENERAL'} RECORD`,
                    date: date,
                    status: String(data.status || 'completed'),
                    type: String(data.type || 'expense'),
                    category: String(data.category || 'general'),
                    paymentMethod: String(data.paymentMethod || 'cash'),
                    vKey: vKey || 1,
                    checksum: checksum,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
            }, // Only insert this data if new
            { 
                upsert: true, // Create if not exists, don't update if exists
                new: true, // Always return latest data
                setDefaultsOnInsert: true,
                lean: true 
            }
        );

        // 🚨 DUPLICATE DETECTION: If record existed before this request
        // isNew = true only when record was just created (createdAt === updatedAt)
        const isNew = Number(idempotentRecord.createdAt) === Number(idempotentRecord.updatedAt);

        if (!isNew) {
            // 🔄 IDEMPOTENCY TRIGGER: Return existing record, prevent duplicate creation
            return NextResponse.json({ 
                success: true, 
                entry: idempotentRecord,
                message: "Idempotency trigger: Duplicate prevented, returning existing record." 
            }, { status: 200 }); 
        }
        
        // 🆕 NEW RECORD: Continue with normal flow for newly created records
        return NextResponse.json({ 
            success: true, 
            entry: idempotentRecord,
            isActive: true 
        }, { status: 201 });
    }

    // Logic C: SHA-256 Checksum Validation (Enhanced with all 8 fields)
    const serverCalculatedChecksum = generateServerChecksum({
        amount: Number(amount),
        date: date,  // 🚨 RAW STRING: Pass directly without Date conversion
        time: data.time || "",  // 🚨 ADD TIME FIELD
        title: title || `${category || 'GENERAL'} RECORD`,  // Respect user's case
        note: data.note || "",
        category: data.category || "general",
        paymentMethod: data.paymentMethod || "cash",
        type: data.type || "expense",
        status: data.status || "completed"
    });

    if (serverCalculatedChecksum !== checksum) {
        return NextResponse.json({ 
            message: "Data integrity failure",
            errorCode: "CHECKSUM_MISMATCH",
            isActive: true
        }, { status: 400 });
    }

    // ডাটা ক্রিয়েশন
    const newEntryData = {
        ...data,
        title: title?.trim() || `${category || 'GENERAL'} RECORD`,  // Respect user's case
        date: date,  // 🚨 RAW STRING: Let Mongoose handle conversion internally
        status: String(data.status || 'completed'),  // Remove manual lowercase
        type: String(data.type || 'expense'),  // Remove manual lowercase
        category: String(data.category || 'general'),  // Remove manual lowercase
        paymentMethod: String(data.paymentMethod || 'cash'),  // Remove manual lowercase
        vKey: vKey || 1,
        checksum: checksum
    };

    const newEntry = await Entry.create(newEntryData);

    try {
        await pusher.trigger(`vault-channel-${userId}`, 'ENTRY_CREATED', { 
            cid: newEntry.cid,
            _id: newEntry._id,
            userId: userId,
            bookId: newEntry.bookId,
            vKey: newEntry.vKey
        });
    } catch (e) {}

    return NextResponse.json({ 
        success: true, 
        entry: newEntry,
        isActive: true 
    }, { status: 201 });

  } catch (error: any) { 
    return NextResponse.json({ message: error.message || "Sync Engine Error" }, { status: 500 }); 
  }
}