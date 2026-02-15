// src/app/api/entries/[id]/route.ts
import connectDB from "@/lib/db";
import Entry from "@/models/Entry";
import User from "@/models/User"; // ইউজার মডেল ইমপোর্ট করা হলো
import { NextResponse } from "next/server";
import Pusher from 'pusher';
import { generateServerChecksum } from "@/lib/serverCrypto";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.NEXT_PUBLIC_PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

// PUT: লেনদেন (Transaction) আপডেট করা ও স্ট্যাবিলিটি চেক
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (!id) return NextResponse.json({ message: "Transaction ID is required" }, { status: 400 });

    await connectDB();

    // 🚨 BLIND DELETE PROTOCOL: Bypass all validations for deletion requests
    if (data.isDeleted === 1 || data.isDeleted === true) {
        console.log('🗑️ [BLIND DELETE] Processing deletion request for ID:', id);
        
        // EXECUTE IMMEDIATELY: Update record with deletion flag
        const deletedEntry = await Entry.findByIdAndUpdate(
            id,
            { 
                $set: { 
                    isDeleted: 1, 
                    vKey: data.vKey || Date.now(),
                    updatedAt: new Date() 
                } 
            },
            { new: true }
        );
        
        // Trigger real-time signal
        try {
            await pusher.trigger(`vault-channel-${deletedEntry.userId}`, 'ENTRY_DELETED', { 
                ...deletedEntry,
                vKey: deletedEntry.vKey,
                cid: deletedEntry.cid,
                _id: deletedEntry._id,
                bookId: deletedEntry.bookId,
                userId: deletedEntry.userId,
                isDeleted: Number(deletedEntry.isDeleted || 1)
            });
        } catch (e) {}
        
        return NextResponse.json({ 
            success: true,
            entry: deletedEntry,
            isActive: true 
        }, { status: 200 });
    }

    // এন্ট্রিটি খুঁজে বের করা (UserId এবং vKey চেক করার জন্য)
    const existingEntry = await Entry.findById(id);
    if (!existingEntry) return NextResponse.json({ message: "Entry not found" }, { status: 404 });

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(existingEntry.userId).select('isActive');
    if (!user) return NextResponse.json({ message: "Owner not found" }, { status: 404 });
    if (user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // --- Logic C: SHA-256 Checksum Validation (Data Solidity) ---
    // 🔧 SERVER AUTHORITY: Strict data parsing for conflict resolution
    const strictAmount = Number(data.amount) || 0;
    const strictIsDeleted = data.isDeleted ? 1 : 0; // Force Number type
    const strictDate = new Date(data.date);
    const strictTitle = String(data.title || '').trim().toLowerCase();
    
    const serverCalculatedChecksum = generateServerChecksum({
        amount: strictAmount,
        date: strictDate,
        title: strictTitle
    });
    
    // 🔧 MASTER TRUST & RESET: Handle Conflict Resolution Updates
    const isConflictResolution = data.conflicted === 0 && (data.vKey > (existingEntry.vKey || 0));
    
    // 🚨 DELETION HANDLING: Bypass validation for deleted items
    const isDeletionRequest = data.isDeleted === 1;
    
    // 🚨 SERVER AUTHORITY: For conflict resolutions, ignore client checksum and use server-generated
    if (isConflictResolution || isDeletionRequest) {
        console.warn(`⚠️ [SECURITY] Server Authority: ${isConflictResolution ? 'Conflict resolution' : 'Deletion request'} for CID: ${existingEntry.cid || existingEntry._id}`);
        
        // Generate server-authoritative checksum from strictly parsed data
        const serverAuthorityChecksum = generateServerChecksum({
            amount: strictAmount,
            date: strictDate,
            title: strictTitle
        });
        
        // Create update payload with server-generated checksum
        const updatePayload: any = {
            title: strictTitle,
            amount: strictAmount,
            type: String(data.type || 'expense').toLowerCase(),
            status: String(data.status || 'completed').toLowerCase(),
            category: String(data.category || 'general').toLowerCase(),
            paymentMethod: String(data.paymentMethod || 'cash').toLowerCase(),
            note: String(data.note || '').trim(),
            date: strictDate,
            time: String(data.time || ''),
            vKey: Number(data.vKey || 0) + 1, // 🔧 FORCE VKEY INCREMENT
            checksum: serverAuthorityChecksum, // 🚨 SERVER AUTHORITY CHECKSUM
            isDeleted: strictIsDeleted, // 🔥 BOOLEAN NORMALIZATION
            updatedAt: new Date() // 🔧 NORMALIZED TIMESTAMP
        };
        
        const updatedEntry = await Entry.findByIdAndUpdate(
            id, 
            { $set: updatePayload }, 
            { new: true }
        );
        
        console.log(`✅ [SECURITY] Server Authority: ${isConflictResolution ? 'Conflict resolution' : 'Deletion'} applied with fresh checksum for CID: ${existingEntry.cid || existingEntry._id}`);
        console.log('🔍 [DEBUG] Update result:', updatedEntry);
        console.log('🔍 [DEBUG] Update payload vKey:', updatePayload.vKey);
        console.log('🔍 [DEBUG] Updated entry vKey:', updatedEntry?.vKey);
        
        return NextResponse.json({ 
            success: true, 
            entry: updatedEntry, 
            isActive: true 
        }, { status: 200 });
    }
    
    // Normal checksum validation for non-conflict updates
    if (serverCalculatedChecksum !== data.checksum) {
        return NextResponse.json({ 
            message: "Data solidarity failure: Checksum mismatch",
            errorCode: "CHECKSUM_ERROR",
            isActive: true
        }, { status: 400 });
    }
    
    // --- Logic B: Logical Clock (Conflict Resolution) ---
    // যদি সার্ভারের vKey ক্লায়েন্টের পাঠানো vKey এর চেয়ে বড় হয়, তবে কনফ্লিক্ট
    if (data.vKey < existingEntry.vKey) {
        return NextResponse.json({ 
            message: "Version conflict: Client has stale data",
            serverVKey: existingEntry.vKey,
            clientVKey: data.vKey,
            errorCode: "VERSION_CONFLICT",
            isActive: true
        }, { status: 409 });
    }

    const updatePayload: any = {
        title: data.title.trim(),
        amount: Number(data.amount),
        type: String(data.type).toLowerCase(),
        status: String(data.status || 'completed').toLowerCase(),
        category: String(data.category || 'general').toLowerCase(),
        paymentMethod: String(data.paymentMethod || 'cash').toLowerCase(),
        note: data.note?.trim() || "",
        date: new Date(data.date),
        time: data.time || "",
        vKey: Number(data.vKey || 0) + 1, // 🔧 FORCE VKEY INCREMENT: Always increment
        checksum: data.checksum,
        isDeleted: false,
        updatedAt: new Date() // 🔧 NORMALIZED TIMESTAMP: Fresh timestamp
    };

    const updatedEntry = await Entry.findByIdAndUpdate(
      id, 
      { $set: updatePayload }, 
      { new: true }
    );

    console.log('🔍 [DEBUG] Normal update result:', updatedEntry);
    console.log('🔍 [DEBUG] Normal update payload vKey:', updatePayload.vKey);
    console.log('🔍 [DEBUG] Normal updated entry vKey:', updatedEntry?.vKey);

    // সিগন্যাল ট্রিগার
    try {
        await pusher.trigger(`vault-channel-${updatedEntry.userId}`, 'ENTRY_UPDATED', { 
            ...updatedEntry,
            vKey: updatedEntry.vKey,
            cid: updatedEntry.cid,
            _id: updatedEntry._id,
            bookId: updatedEntry.bookId,
            userId: updatedEntry.userId,
            isDeleted: Number(updatedEntry.isDeleted || 0)
        });
    } catch (e) {}

    return NextResponse.json({ success: true, entry: updatedEntry, isActive: true }, { status: 200 });

  } catch (error: any) {
    console.error("API Error [PUT]:", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

// DELETE: লেনদেনের সফট ডিলিট ও ভার্সন আপডেট
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json().catch(() => ({})); 

    if (!id) return NextResponse.json({ message: "ID missing" }, { status: 400 });

    await connectDB();
    
    // এন্ট্রি এবং ইউজার স্ট্যাটাস চেক
    const existingEntry = await Entry.findById(id);
    if (!existingEntry) return NextResponse.json({ message: "Entry not found" }, { status: 404 });

    // --- সিকিউরিটি চেক: ইউজার ব্লকড কি না ---
    const user = await User.findById(existingEntry.userId).select('isActive');
    if (user && user.isActive === false) {
        return NextResponse.json({ isActive: false, message: "Account Suspended" }, { status: 403 });
    }

    // ডিলিট করার আগেও ভার্সন চেক (Logic B)
    if (data.vKey && existingEntry.vKey >= data.vKey) {
        return NextResponse.json({ message: "Version conflict during deletion", errorCode: "VERSION_CONFLICT", isActive: true }, { status: 409 });
    }

    const nextVKey = data.vKey || (existingEntry.vKey + 1);

    const deletedEntry = await Entry.findByIdAndUpdate(
      id,
      { 
        $set: { 
            isDeleted: true, 
            vKey: nextVKey,
            updatedAt: new Date() 
        } 
      },
      { new: true }
    );
        
    // রিয়েল-টাইম সিগন্যাল ট্রিগার
    try {
        await pusher.trigger(`vault-channel-${deletedEntry.userId}`, 'ENTRY_DELETED', { 
            ...deletedEntry,
            vKey: deletedEntry.vKey,
            cid: deletedEntry.cid,
            _id: deletedEntry._id,
            bookId: deletedEntry.bookId,
            userId: deletedEntry.userId,
            isDeleted: Number(deletedEntry.isDeleted || 1)
        });
    } catch (e) {}

    return NextResponse.json({ 
        success: true,
        message: "Record terminated and synchronized",
        isActive: true 
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Termination failed" }, { status: 500 });
  }
}