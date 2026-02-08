// src/hooks/useVault.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db, generateCID } from '@/lib/offlineDB';
import { orchestrator } from '@/lib/vault/SyncOrchestrator';

export const useVault = (currentUser: any, currentBook?: any) => {
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId;

    // ১. লাইভ কুয়েরি: updatedAt দিয়ে সর্ট (Latest First)
    const books = useLiveQuery(async () => {
        const data = await db.books.where('isDeleted').equals(0).toArray();
        // ম্যানুয়াল সর্ট (JS) অনেক বেশি নির্ভরযোগ্য রিঅ্যাক্টিভিটির জন্য
        return data.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }) || [];

    const allEntries = useLiveQuery(() => 
        db.entries.where('isDeleted').equals(0).toArray()
    ) || [];

    // 🔥 ফিক্স ১: এন্ট্রি সর্টিং (Newest First)
    const entries = useMemo(() => {
        if (!allEntries || !bookId) return [];
        return allEntries
            .filter(e => String(e.bookId) === String(bookId))
            // সর্টিং লজিক: লেটেস্ট এন্ট্রি সবার উপরে
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [allEntries, bookId]);

    // ৩. পাওয়ারফুল স্ট্যাটাস ইঞ্জিন
    const stats = useMemo(() => {
        const target = bookId ? entries : allEntries;
        const income = target
            .filter(e => String(e.type).toLowerCase() === 'income' && String(e.status).toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        const expense = target
            .filter(e => String(e.type).toLowerCase() === 'expense' && String(e.status).toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        
        return { 
            inflow: income, 
            outflow: expense, 
            balance: income - expense 
        };
    }, [entries, allEntries, bookId]);

    // --- ৪. কোর অ্যাকশনস (CRUD) ---

    // 🔥 ফিক্স ২: সেভ প্রোটোকল এবং বুক আপডেট
// useVault.ts এর saveEntry ফাংশনের ভেতরে:

const saveEntry = async (entryForm: any, editTarget?: any) => {
    if (!bookId || !userId) return false;
    const timestamp = Date.now();
    
    const dbData: any = {
        ...entryForm,
        amount: Number(entryForm.amount),
        bookId: String(bookId),
        userId: String(userId),
        synced: 0,
        isDeleted: 0,
        updatedAt: timestamp,
        createdAt: editTarget ? editTarget.createdAt : timestamp,
        cid: editTarget?.cid || generateCID()
    };

    try {
        if (editTarget?.localId) {
            await db.entries.update(editTarget.localId, dbData);
        } else {
            await db.entries.add(dbData);
        }
        
        // 🔥 মাস্টার ফিক্স: এন্ট্রি সেভ হওয়ার পর 'বই' এর সময় আপডেট করা
        // যাতে ড্যাশবোর্ডে "Just Now" দেখায় এবং বইটি সবার উপরে চলে আসে
        const bookToUpdate = await db.books
            .where('localId').equals(currentBook?.localId || 0)
            .or('_id').equals(String(bookId))
            .first();

        if (bookToUpdate && bookToUpdate.localId) {
            await db.books.update(bookToUpdate.localId, { updatedAt: timestamp });
        }

        orchestrator.triggerSync(userId);
        return true;
    } catch (err) { return false; }
};

    const deleteEntry = async (target: any) => {
        try {
            const id = target.localId || target._id;
            const timestamp = Date.now();
            // সফট ডিলিট
            await db.entries.update(id, { isDeleted: 1, synced: 0, updatedAt: timestamp });
            
            // ডিলিট করলেও বই সবার উপরে আসবে
            if (target.bookId) {
                const book = await db.books.where('_id').equals(String(target.bookId)).first();
                if (book && book.localId) {
                    await db.books.update(book.localId, { updatedAt: timestamp });
                }
            }
            orchestrator.triggerSync(userId);
            return true;
        } catch (err) { 
            return false; 
        }
    };

// useVault.ts এর toggleEntryStatus ফাংশন:

const toggleEntryStatus = async (entry: any) => {
    if (!entry.localId) return false;
    const newStatus = entry.status === 'pending' ? 'completed' : 'pending';
    const timestamp = Date.now();
    try {
        await db.entries.update(entry.localId, { 
            status: newStatus, 
            synced: 0, 
            updatedAt: timestamp 
        });

        // বইয়ের সময় আপডেট করা (সর্টিং ঠিক রাখতে)
        const book = await db.books.where('_id').equals(String(entry.bookId)).or('localId').equals(Number(entry.bookId) || 0).first();
        if (book && book.localId) {
            await db.books.update(book.localId, { updatedAt: timestamp });
        }
        
        // অর্কেস্ট্রেটরকে কল করো (ডাটা ডুপ্লিকেট হবে না কারণ আমরা শুধু status update করছি)
        orchestrator.triggerSync(userId); 
        return true;
    } catch (err) { return false; }
};

console.log("LOG_ENGINE: Books Count ->", books.length);
console.log("LOG_ENGINE: All Entries Count ->", allEntries.length);
console.log("DEBUG [useVault]: Current Entries Count:", entries.length);
    return {
        books,
        entries,
        allEntries,
        stats,
        saveEntry,
        deleteEntry,
        toggleEntryStatus,
        isLoading: !books,
        fetchData: () => {} 
    };
};