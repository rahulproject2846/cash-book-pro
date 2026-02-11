"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db, generateCID } from '@/lib/offlineDB';
import { orchestrator } from '@/lib/vault/SyncOrchestrator';
import { generateChecksum } from '@/lib/utils/helpers';

/**
 * VAULT PRO: MASTER LOGIC ENGINE (V13.1 - FIX CHECKSUM PARITY)
 */

export const useVault = (currentUser: any, currentBook?: any) => {
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId;

    const books = useLiveQuery(async () => {
        const data = await db.books.where('isDeleted').equals(0).toArray();
        return data.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }, []) || [];

    const allEntries = useLiveQuery(() => 
        db.entries.where('isDeleted').equals(0).toArray()
    ) || [];

    const entries = useMemo(() => {
        if (!allEntries || !bookId) return [];
        return allEntries
            .filter(e => String(e.bookId) === String(bookId))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }, [allEntries, bookId]);

    const stats = useMemo(() => {
        const target = bookId ? entries : allEntries;
        const income = target
            .filter(e => String(e.type).toLowerCase() === 'income' && String(e.status).toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        const expense = target
            .filter(e => String(e.type).toLowerCase() === 'expense' && String(e.status).toLowerCase() === 'completed')
            .reduce((s, e) => s + Number(e.amount), 0);
        const pending = target
            .filter(e => String(e.status).toLowerCase() === 'pending')
            .reduce((s, e) => s + Number(e.amount), 0);
            
        const balance = income - expense;
        // Logic: (Surplus / Income) * 100. Handles division by zero.
        const healthScore = income > 0 ? Math.max(0, Math.floor((balance / income) * 100)) : 0;

        return { 
            inflow: income, 
            outflow: expense, 
            balance: balance, 
            pending: pending,
            healthScore: healthScore
        };
    }, [entries, allEntries, bookId]);

    /**
     * লোডাল ইন্টেলিজেন্স: ডুপ্লিকেট এন্ট্রি চেক (১০ মিনিটের উইন্ডো)
     */
    const checkPotentialDuplicate = async (amount: number, type: string) => {
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        try {
            const matches = await db.entries
                .where('updatedAt')
                .above(tenMinutesAgo)
                .filter(e => 
                    e.amount === Number(amount) && 
                    e.type.toLowerCase() === type.toLowerCase() && 
                    e.isDeleted === 0
                )
                .toArray();
            return matches.length > 0;
        } catch (err) {
            return false;
        }
    };

    // এন্ট্রি সেভ লজিক (FIXED)
    const saveEntry = async (entryForm: any, editTarget?: any) => {
        if (!bookId || !userId) return false;
        const timestamp = Date.now();
        
        // ১. টাইটেল নরমালাইজেশন (সার্ভারের সাথে মিল রেখে)
        const finalTitle = entryForm.title?.trim() || `${(entryForm.category || 'GENERAL').toUpperCase()} RECORD`;

        // ২. Logic B: Increment vKey
        const currentVKey = Number(editTarget?.vKey || 0);
        const nextVKey = Math.max(Number(editTarget?.vKey || 0) + 1, (editTarget?.vKey || 0) + 1);

        // ৩. Logic C: Generate Checksum (Using normalized title)
        const checksum = generateChecksum({
            amount: Number(entryForm.amount),
            date: entryForm.date,
            title: finalTitle
        });

        const dbData: any = {
            ...entryForm,
            localId: editTarget?.localId || entryForm?.localId || undefined, 
            _id: editTarget?._id || entryForm?._id || undefined,
            title: finalTitle, // স্টোর করার সময়ও ফাইনাল টাইটেল রাখা ভালো
            amount: Number(entryForm.amount),
            bookId: String(bookId),
            userId: String(userId),
            type: String(entryForm.type).toLowerCase(),
            status: String(entryForm.status || 'completed').toLowerCase(),
            updatedAt: timestamp,
            synced: 0,
            isDeleted: 0,
            cid: editTarget?.cid || entryForm?.cid || generateCID(),
            vKey: nextVKey,
            checksum: checksum,
            syncAttempts: 0 
        };

        try {
            await db.entries.put(dbData);
            
            const bKey = currentBook?.localId || currentBook?._id;
            if (bKey) {
                const bookVKey = (currentBook?.vKey || 0) + 1;
                await db.books.update(Number(bKey) || bKey, { 
                    updatedAt: timestamp, 
                    synced: 0,
                    vKey: bookVKey,
                    syncAttempts: 0 
                });
            }

            window.dispatchEvent(new Event('vault-updated'));
            orchestrator.triggerSync(userId); 
            return true;
        } catch (err) { return false; }
    };

    const deleteEntry = async (target: any) => {
        try {
            const key = Number(target.localId);
            if (!key) return false;
            const timestamp = Date.now();
            await db.entries.update(key, { isDeleted: 1, synced: 0, updatedAt: timestamp, vKey: (target.vKey || 0) + 1, syncAttempts: 0 });
            const bKey = String(target.bookId);
            const book = await db.books.where('_id').equals(bKey).or('localId').equals(Number(bKey) || 0).first();
            if (book?.localId) await db.books.update(book.localId, { updatedAt: timestamp, synced: 0, vKey: (book.vKey || 0) + 1, syncAttempts: 0 });
            window.dispatchEvent(new Event('vault-updated'));
            orchestrator.triggerSync(userId);
            return true;
        } catch (err) { return false; }
    };

    const restoreEntry = async (target: any) => {
        try {
            const key = Number(target.localId);
            if (!key) return false;
            await db.entries.update(key, { isDeleted: 0, synced: 0, updatedAt: Date.now(), vKey: (target.vKey || 0) + 1, syncAttempts: 0 });
            window.dispatchEvent(new Event('vault-updated'));
            orchestrator.triggerSync(userId);
            return true;
        } catch (err) { return false; }
    };

    const toggleEntryStatus = async (entry: any) => {
        if (!entry.localId) return false;
        const newStatus = entry.status === 'pending' ? 'completed' : 'pending';
        const timestamp = Date.now();
        try {
            await db.entries.update(Number(entry.localId), { status: newStatus, synced: 0, updatedAt: timestamp, vKey: (entry.vKey || 0) + 1, syncAttempts: 0 });
            const bKey = String(entry.bookId);
            const book = await db.books.where('_id').equals(bKey).or('localId').equals(Number(bKey) || 0).first();
            if (book?.localId) await db.books.update(book.localId, { updatedAt: timestamp, synced: 0, vKey: (book.vKey || 0) + 1, syncAttempts: 0 });
            orchestrator.triggerSync(userId); 
            return true;
        } catch (err) { return false; }
    };

    const deleteBook = async (target: any) => {
        try {
            const key = Number(target.localId || target.id);
            if (!key) return false;
            await db.books.update(key, { isDeleted: 1, synced: 0, updatedAt: Date.now(), vKey: (target.vKey || 0) + 1, syncAttempts: 0 });
            window.dispatchEvent(new Event('vault-updated'));
            orchestrator.triggerSync(userId);
            return true;
        } catch (err) { return false; }
    };

    const restoreBook = async (target: any) => {
        try {
            const key = Number(target.localId || target.id);
            if (!key) return false;
            await db.books.update(key, { isDeleted: 0, synced: 0, updatedAt: Date.now(), vKey: (target.vKey || 0) + 1, syncAttempts: 0 });
            window.dispatchEvent(new Event('vault-updated'));
            orchestrator.triggerSync(userId);
            return true;
        } catch (err) { return false; }
    };

    return { 
        books, 
        entries, 
        allEntries, 
        stats, 
        checkPotentialDuplicate,
        saveEntry, 
        deleteEntry, 
        restoreEntry, 
        toggleEntryStatus, 
        deleteBook, 
        restoreBook, 
        isLoading: !books 
    };
};