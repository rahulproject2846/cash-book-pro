"use client";
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { db, saveEntryToLocal } from '@/lib/offlineDB';

/**
 * VAULT PRO: MASTER LOGIC ENGINE (V8.0 - ISOLATION PROTOCOL)
 * --------------------------------------------------------
 * Fixed: Infinite render loop by eliminating unstable dependencies.
 * Status: Stable & Reactive
 */

// এই হুকটি শুধু গ্লোবাল ডাটা লোড করবে, currentBook এর উপর নির্ভর করবে না
export const useGlobalVaultData = (userId: string | undefined) => {
    // শুধুমাত্র userId কে ডিপেন্ডেন্সি হিসেবে ব্যবহার করা হলো
    const books = useLiveQuery(
        () => userId ? db.books.orderBy('updatedAt').reverse().toArray() : [],
        [userId]
    ) || [];

    const allEntries = useLiveQuery(
        () => userId ? db.entries.where('isDeleted').equals(0).toArray() : [],
        [userId]
    ) || [];
       
    return { books, allEntries };
};

export const useVault = (currentUser: any, currentBook?: any) => {

    // 🔥 ১. ডাটা লোড করতে এখন নতুন হুক ব্যবহার করা হলো (Stable Reference)
    const { books, allEntries } = useGlobalVaultData(currentUser?._id);

    // ২. সর্টিং এবং ফিল্টারিং ইঞ্জিন (entries ভ্যারিয়েবল)
    const entries = useMemo(() => {
        if (!allEntries) return [];
        const filtered = currentBook?._id
            ? allEntries.filter(e => String(e.bookId) === String(currentBook._id)) 
            : allEntries;
        
        // সর্টিং: createdAt দিয়ে, লেটেস্ট সবার ওপরে।
        return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [allEntries, currentBook?._id]); // 🔥 শুধু allEntries ও currentBook._id এর ওপর নির্ভর করছে

    // ৩. রিয়েল-টাইম ক্যালকুলেশন (Stats)
    const stats = useMemo(() => {
        const inflow = entries
            .filter(e => e.type.toLowerCase() === 'income' && e.status.toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        
        const outflow = entries
            .filter(e => e.type.toLowerCase() === 'expense' && e.status.toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);

        const pending = entries
            .filter(e => e.status.toLowerCase() === 'pending')
            .reduce((s, e) => s + Number(e.amount), 0);

        return { inflow, outflow, pending, balance: inflow - outflow };
    }, [entries]);

    // ৪. সেভ প্রোটোকল (এটমিক রাইট)
    const saveEntry = async (entryForm: any, editTarget: any) => {
        if (!currentBook?._id || !currentUser?._id) return false;

        const timestamp = Date.now();
        const dbData = {
            ...entryForm,
            amount: Number(entryForm.amount),
            type: entryForm.type.toLowerCase(),
            status: (entryForm.status || 'completed').toLowerCase(),
            title: (entryForm.title || "").trim(),
            bookId: currentBook._id,
            userId: currentUser._id,
            synced: 0 as any,
            isDeleted: 0,
            updatedAt: timestamp,
            createdAt: editTarget ? editTarget.createdAt : timestamp,
            cid: editTarget?.cid || `cid_${timestamp}_${Math.random().toString(36).substr(2, 5)}`
        };

        try {
            await db.transaction('rw', db.entries, db.books, async () => {
                if (editTarget) {
                    await db.entries.put({ ...dbData, localId: editTarget.localId, _id: editTarget._id });
                } else {
                    await db.entries.add(dbData);
                }
                await db.books.update(currentBook._id, { updatedAt: timestamp });
            });
            
            // ম্যানুয়াল ইভেন্ট ট্রিগার (অন্যান্য লিসেনারের জন্য)
            window.dispatchEvent(new Event('vault-updated'));
            return true;
        } catch (err) {
            console.error("Critical Save Fault:", err);
            return false;
        }
    };

    // ৫. ডিলিট প্রোটোকল
    const deleteEntry = async (target: any) => {
        try {
            const key = target.localId || target._id;
            await db.entries.update(key, { isDeleted: 1 as any, synced: 0 as any });
            await db.books.update(target.bookId, { updatedAt: Date.now() });
            
            window.dispatchEvent(new Event('vault-updated'));
            return true;
        } catch (err) { return false; }
    };

    // ৬. স্ট্যাটাস টগল
    const toggleEntryStatus = async (entry: any) => {
        const newStatus = entry.status.toLowerCase() === 'pending' ? 'completed' : 'pending';
        try {
            const key = entry.localId || entry._id;
            await db.entries.update(key, { status: newStatus, synced: 0 as any, updatedAt: Date.now() });
            await db.books.update(entry.bookId, { updatedAt: Date.now() });
            
            window.dispatchEvent(new Event('vault-updated'));
            return true;
        } catch (err) { return false; }
    };

    // ৭. লিগ্যাসি সাপোর্ট
    const fetchData = () => { /* Logic now handled by useLiveQuery through useGlobalVaultData */ }; 
    const fetchBookEntries = (id: string) => { /* Logic now handled by useLiveQuery */ }; 
    console.log("LOG_ENGINE: Books Count ->", books.length);
    console.log("LOG_ENGINE: All Entries Count ->", allEntries.length);
    console.log("DEBUG [useVault]: Current Entries Count:", entries.length);

    return {
        books,
        entries,
        allEntries,
        isLoading: books === undefined || allEntries === undefined,
        stats,
        fetchData,
        fetchBookEntries,
        saveEntry,
        toggleEntryStatus,
        deleteEntry
    };
};