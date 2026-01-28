import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import { NextResponse } from "next/server";

// GET: একটি নির্দিষ্ট লেজারের (Book) সব ট্রানজেকশন লিস্ট দেখা
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');
    
    // ১. সেফটি চেক: bookId না থাকলে ডাটাবেসে কল না করে খালি লিস্ট পাঠানো
    if (!bookId || bookId === 'undefined' || bookId === 'null') {
      return NextResponse.json({ success: true, entries: [] });
    }

    await connectDB();
    
    // ২. সর্টিং লজিক: লেটেস্ট তারিখের ট্রানজেকশন সবার আগে আসবে
    const entries = await Entry.find({ bookId }).sort({ date: -1, createdAt: -1 }); 
    
    return NextResponse.json({
        success: true,
        count: entries.length,
        entries: entries
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET_ENTRIES_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to fetch transactions" }, { status: 500 });
  }
}

// POST: নতুন ট্রানজেকশন (Entry) তৈরি করা
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { bookId, title, amount, type, category, paymentMethod, note, date, status } = data;

    // ১. ভ্যালিডেশন
    if (!bookId || !title || amount === undefined) {
        return NextResponse.json({ message: "Mandatory fields (Book, Title, Amount) are missing" }, { status: 400 });
    }

    await connectDB();

    // ২. ডুপ্লিকেট চেক (Data Integrity Protocol)
    // একই বইতে, একই দিনে, একই পরিমাণ টাকা এবং একই টাইটেলের এন্ট্রি আছে কি না চেক করা
    const entryDate = new Date(date);
    const startOfDay = new Date(entryDate.setHours(0,0,0,0));
    const endOfDay = new Date(entryDate.setHours(23,59,59,999));

    const isDuplicate = await Entry.findOne({
        bookId,
        title: title.trim(),
        amount: Number(amount),
        type,
        date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (isDuplicate) {
        return NextResponse.json({ 
            message: "A matching transaction already exists for this date. Potential duplicate blocked.",
            duplicate: true 
        }, { status: 409 }); // 409 Conflict
    }

    // ৩. ডাটা স্যানিটাইজ এবং সেভ করা
    const newEntry = await Entry.create({
      bookId,
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category || "General",
      paymentMethod: paymentMethod || "Cash",
      note: note?.trim() || "",
      date: new Date(date),
      status: status || "Completed"
    });

    return NextResponse.json({
        success: true,
        message: "Transaction secured in vault",
        entry: newEntry
    }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_ENTRY_ERROR:", error.message);
    return NextResponse.json({ message: "Failed to synchronize transaction" }, { status: 500 });
  }
}