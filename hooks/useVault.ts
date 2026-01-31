"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { db, saveEntryToLocal } from '@/lib/offlineDB';

/**
 * VAULT PRO: LOGIC ENGINE (V3)
 * ----------------------------
 * এটি পুরো অ্যাপের মেইন ফাংশনালিটিগুলো কন্ট্রোল করে।
 */

export const useVault = (currentUser: any, currentBook: any, setCurrentBook: any) => {
    const [books, setBooks] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const hydrationDoneRef = useRef(false);

    // ১. গ্লোবাল ডেটা লোড (Books & All Entries)
    const fetchData = useCallback(async () => {
        if (!currentUser?._id) {
            setIsLoading(false); 
            return;
        }
        
        setIsLoading(true); 

        try {
            if (!db.isOpen()) await db.open();
            
            // 🔥 Fix 1: Books Data Load
            const booksRaw = await db.books.toArray();
            const localEntries = await db.entries.where('isDeleted').equals(0).toArray();
            
            // 🔥 Fix 2: লোড হওয়ার সাথে সাথে বইগুলোকে অ্যাকটিভিটি অনুযায়ী সর্ট করে দেওয়া
            const sortedBooks = booksRaw.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

            setBooks(sortedBooks);
            setAllEntries(localEntries);
            
        } catch (err) {
            console.error("Dexie Load Error:", err);
        } finally {
            setIsLoading(false); 
        }
    }, [currentUser]);

    // ২. নির্দিষ্ট বইয়ের এন্ট্রি লোড
    const fetchBookEntries = useCallback(async (bookId: string) => {
        if (!bookId) return;
        try {
            const data = await db.entries
                .where('bookId').equals(bookId)
                .and(item => item.isDeleted === 0)
                .toArray();
            
            // Sorting Logic: Date + TimeStamp
            const sortedData = data.sort((a, b) => {
                const timeA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                const timeB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                return timeB - timeA;
            });
            setEntries([...sortedData]);
        } catch (err) {
            console.error("Fetch Entries Error:", err);
        }
    }, []);

    // ৩. রিয়েল-টাইম ক্যালকুলেশন (Stats)
    const stats = useMemo(() => {
        const targetEntries = currentBook ? entries : allEntries;
        const inflow = targetEntries
            .filter(e => e.type === 'income' && e.status === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        const outflow = targetEntries
            .filter(e => e.type === 'expense' && e.status === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        return { inflow, outflow, balance: inflow - outflow };
    }, [entries, allEntries, currentBook]);

    // ৪. এন্ট্রি সেভ/এডিট লজিক
    const saveEntry = async (entryForm: any, editTarget: any) => {
        if (!currentBook?._id) return false;

        const dbData = {
            ...entryForm,
            amount: Number(entryForm.amount),
            status: (entryForm.status || 'completed').toLowerCase(),
            type: entryForm.type.toLowerCase(),
            title: entryForm.title.trim(),
            category: entryForm.category,
            paymentMethod: entryForm.paymentMethod,
            note: entryForm.note || "",
            bookId: currentBook._id,
            userId: currentUser._id,
            synced: 0 as any,
            isDeleted: 0,
            updatedAt: Date.now(),
            createdAt: editTarget ? editTarget.createdAt : Date.now()
        };

        try {
            if (editTarget) {
                await db.entries.put({ 
                    ...dbData, 
                    localId: editTarget.localId, 
                    _id: editTarget._id,
                    cid: editTarget.cid 
                } as any);
                toast.success("Record Updated");
            } else {
                await saveEntryToLocal(dbData);
                toast.success("Record Secured");
            }

            // 🔥 Fix 1: বইয়ের updatedAt আপডেট করা হলো
            await db.books.update(currentBook._id, { updatedAt: Date.now() });

            await fetchBookEntries(currentBook._id);
            await fetchData();
            
            // 🔥 Fix 2: UI কে রিফ্রেশ করার জন্য currentBook কে ট্রিগার করা
            
            window.dispatchEvent(new Event('vault-updated'));
            if (navigator.onLine) window.dispatchEvent(new Event('online'));
            
            return true;
        } catch (err) {
            console.error("Save Error:", err);
            toast.error("Process failed");
            return false;
        }
    };

    // ৫. স্ট্যাটাস টগল প্রোটোকল
    const toggleEntryStatus = async (entry: any) => {
        const newStatus = entry.status === 'pending' ? 'completed' : 'pending';
        try {
            await db.entries.update(entry.localId || entry._id, { 
                status: newStatus, 
                synced: 0 as any,
                updatedAt: Date.now()
            });
            
            // 🔥 Fix: স্ট্যাটাস টগলের পর বইয়ের updatedAt আপডেট করা
            await db.books.update(currentBook._id, { updatedAt: Date.now() });

            await fetchBookEntries(currentBook._id);
            await fetchData();
            
            // UI Trigger for Book Update
            if (currentBook) setCurrentBook((prev: any) => ({ ...prev, __uiKey: Date.now() }));

            if (navigator.onLine) window.dispatchEvent(new Event('online'));
            return true;
        } catch (err) {
            toast.error("Status toggle failed");
            return false;
        }
    };

    // ৬. সফট ডিলিট প্রোটোকল
    const deleteEntry = async (target: any) => {
        try {
            await db.entries.update(target.localId || target._id, { 
                isDeleted: 1 as any, 
                synced: 0 as any 
            });

            // 🔥 Fix: ডিলিটের পর বইয়ের updatedAt আপডেট করা
            await db.books.update(target.bookId, { updatedAt: Date.now() });

            await fetchBookEntries(currentBook._id);
            await fetchData();
            
            // UI Trigger
            if (currentBook) setCurrentBook((prev: any) => ({ ...prev, __uiKey: Date.now() }));

            toast.success('Terminated from Vault');
            if (navigator.onLine) window.dispatchEvent(new Event('online'));
            return true;
        } catch (err) {
            toast.error("Deletion failed");
            return false;
        }
    };

    // --- EFFECT HANDLERS ---

    // Initial Load
    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    // Global Listener
    useEffect(() => {
        if (currentBook?._id) {
            fetchBookEntries(currentBook._id);
        }

        const handleUpdate = () => {
            fetchData();
            if (currentBook?._id) fetchBookEntries(currentBook._id);
        };

        window.addEventListener('vault-updated', handleUpdate);
        window.addEventListener('vault-synced', handleUpdate);

        return () => {
            window.removeEventListener('vault-updated', handleUpdate);
            window.removeEventListener('vault-synced', handleUpdate);
        };
    }, [currentBook, currentUser, fetchData, fetchBookEntries]);

    return {
        books,
        entries,
        allEntries,
        isLoading,
        stats,
        fetchData,
        fetchBookEntries,
        saveEntry,
        toggleEntryStatus,
        deleteEntry
    };
};