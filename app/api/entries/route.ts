// src/app/api/entries/route.ts
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট করা হলো
import { NextResponse } from "next/server";
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

    let query: any = { userId };

    if (since && since !== '0') {
        query.updatedAt = { $gt: new Date(Number(since)) };
    }

    const entries = await Entry.find(query)
        .sort({ updatedAt: -1 })
        .lean();

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

    // 🔥 API LOGGING: Show received payload for debugging
    console.log('📦 [API-ENTRIES] Received Payload:', JSON.stringify(data));

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

    // ডুপ্লিকেট প্রোটেকশন
    if (cid) {
        const existing = await Entry.findOne({ cid }).select('_id cid');
        if (existing) {
            return NextResponse.json({ 
                success: true, 
                entry: existing,
                isActive: true,
                message: "Duplicate prevented" 
            }, { status: 409 });
        }
    }

    // 🔥 SERVER-SIDE DEDUPLICATION: Additional CID check before creation
    if (cid) {
      const existingByCid = await Entry.findOne({ cid });
      if (existingByCid) {
        return NextResponse.json({ 
            success: true, 
            entry: existingByCid,
            isActive: true,
            message: "CID match found" 
        }, { status: 200 });
      }
    }

    // Logic C: SHA-256 Checksum Validation
    const serverCalculatedChecksum = generateServerChecksum({
        amount: Number(amount),
        date: date,
        title: title || `${category || 'GENERAL'} RECORD`
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
        title: title?.trim() || `${category || 'GENERAL'} RECORD`,
        date: new Date(date),
        status: String(data.status || 'completed').toLowerCase(),
        type: String(data.type || 'expense').toLowerCase(),
        category: String(data.category || 'general').toLowerCase(),
        paymentMethod: String(data.paymentMethod || 'cash').toLowerCase(),
        vKey: vKey || 1,
        checksum: checksum
    };

    const newEntry = await Entry.create(newEntryData);

    try {
        await pusher.trigger(`vault_channel_${userId}`, 'sync_signal', { 
            refresh: true, 
            type: 'ENTRY_CREATE',
            bookId: bookId,
            cid: cid
        });
    } catch (e) {}

    return NextResponse.json({ 
        success: true, 
        entry: newEntry,
        isActive: true 
    }, { status: 201 });

  } catch (error: any) { 
    console.error('❌ [API-ENTRIES-POST] Error:', error.message);
    return NextResponse.json({ message: error.message || "Sync Engine Error" }, { status: 500 }); 
  }
}