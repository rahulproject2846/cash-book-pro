import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    const userId = searchParams.get('userId'); // অনেক সময় ইউজার আইডি দিয়েও সব আনতে হয়

    if (!bookId && !userId) {
      return NextResponse.json({ success: true, entries: [] });
    }

    await connectDB();
    
    // কুয়েরি বিল্ডার
    const query = bookId ? { bookId } : {}; 
    
    // 🔥 cid সহ সব ডাটা ফেরত পাঠানো হচ্ছে
    const entries = await Entry.find(query).sort({ date: -1, createdAt: -1 });
    
    return NextResponse.json({
        success: true,
        count: entries.length,
        entries: entries
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Fetch failed" }, { status: 500 });
  }
}

// src/app/api/entries/route.ts এর POST ফাংশনটি এভাবে আপডেট করুন

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
        cid, bookId, userId, title, amount, type, 
        category, paymentMethod, note, date, time, status 
    } = data;

    // 🔥 ১. ফ্লেক্সিবল ভ্যালিডেশন (টাইটেল আর রিকোয়ার্ড নয়)
    if (!bookId || !userId || amount === undefined || !date) {
        return NextResponse.json({ 
            message: "Mandatory fields (Book, User, Amount) missing" 
        }, { status: 400 });
    }

    await connectDB();

    // ২. ডুপ্লিকেট চেক (CID দিয়ে)
    if (cid) {
        const existingEntry = await Entry.findOne({ cid });
        if (existingEntry) return NextResponse.json({ message: "Synced", entry: existingEntry }, { status: 409 });
    }

    // ৩. সেভ প্রোটোকল
    const newEntry = await Entry.create({
      cid: cid || `server_${Date.now()}`,
      bookId,
      userId,
      // 🔥 যদি টাইটেল না থাকে, তবে ক্যাটাগরির নাম বা 'UNNAMED' বসবে
      title: title?.trim() || `${category || 'GENERAL'} PROTOCOL`, 
      amount: Number(amount),
      type: type?.toLowerCase() || 'expense',
      category: category || "General",
      paymentMethod: paymentMethod || "Cash",
      note: note?.trim() || "",
      date: new Date(date),
      time: time || "", 
      status: status || "completed"
    });

    return NextResponse.json({ success: true, entry: newEntry }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ message: "Sync Error" }, { status: 500 });
  }
}