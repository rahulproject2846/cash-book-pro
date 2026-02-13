"use client";

import { useState, useCallback, useRef } from 'react';
import { db, generateCID, generateEntryChecksum } from '@/lib/offlineDB';
import { logVaultError } from '@/lib/vault/Telemetry';
import type { LocalEntry } from '@/lib/offlineDB';

/**
 * 🔥 VAULT ACTIONS HOOK
 * Handles all save, delete, and toggle operations with Invalid Key Protection
 */
export const useVaultActions = (currentUser: any, currentBook: any, forceRefresh: number, setForceRefresh: React.Dispatch<React.SetStateAction<number>>) => {
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshTime = useRef(Date.now());

    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId;

    // 🛡️ HELPER: Validate ID to prevent "Invalid Key" error
    const isValidKey = (id: any) => id !== undefined && id !== null && !isNaN(Number(id));

    // 🔥 SAVE ENTRY: Fixed to handle new vs existing entries correctly
    const saveEntry = useCallback(async (entryData: Partial<LocalEntry>, editTarget?: any) => {
        if (!userId) {
            logVaultError('saveEntry', new Error('Invalid user ID'), { userId, entryData });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            const targetId = editTarget?.localId;
            const existingRecord = isValidKey(targetId) ? await db.entries.get(Number(targetId)) : null;
            
            // 🔥 DUPLICATE CHECK: Prevent entries with same cid
            if (existingRecord && !editTarget?.localId) {
                // Update existing record instead of creating duplicate
                const nextVKey = (existingRecord?.vKey || 0) + 1;
                const finalAmount = Number(entryData.amount) || 0;
                const finalDate = entryData.date || new Date().toISOString().split('T')[0];
                const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.toUpperCase()} RECORD` : 'GENERAL RECORD');
                
                const checksum = await generateEntryChecksum({
                    amount: finalAmount,
                    date: finalDate,
                    title: finalTitle
                });
                
                const updatedEntry = {
                    ...editTarget,
                    ...entryData,
                    title: finalTitle,
                    date: finalDate,
                    amount: finalAmount,
                    userId,
                    bookId: String(currentBook?._id || currentBook?.localId || bookId || ''),
                    cid: editTarget?.cid || generateCID(),
                    synced: 0,
                    isDeleted: 0,
                    updatedAt: Date.now(),
                    vKey: nextVKey,
                    checksum,
                    syncAttempts: 0
                } as any;
                
                if (!editTarget?.createdAt) updatedEntry.createdAt = Date.now();
                
                const id = await db.entries.put(updatedEntry);
                setForceRefresh(prev => prev + 1);
                
                // 🔥 TRIGGER SYNC: Immediately push to server
                if (typeof window !== 'undefined' && window.syncOrchestrator) {
                    window.syncOrchestrator.triggerSync(userId);
                }
                
                return { success: true, entry: { ...updatedEntry, localId: id } };
            }
            
            // Original logic for new entries
            const nextVKey = (existingRecord?.vKey || 0) + 1;
            const finalAmount = Number(entryData.amount) || 0;
            const finalDate = entryData.date || new Date().toISOString().split('T')[0];
            const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.toUpperCase()} RECORD` : 'GENERAL RECORD');
            
            const checksum = await generateEntryChecksum({
                amount: finalAmount,
                date: finalDate,
                title: finalTitle
            });

            const newEntry = {
                ...editTarget,
                ...entryData,
                title: finalTitle,
                date: finalDate,
                amount: finalAmount,
                userId,
                bookId: String(bookId || ''),
                cid: editTarget?.cid || generateCID(),
                synced: 0,
                isDeleted: 0,
                updatedAt: Date.now(),
                vKey: nextVKey,
                checksum,
                syncAttempts: 0
            } as any;

            if (!editTarget?.createdAt) newEntry.createdAt = Date.now();

            // 🔧 CRITICAL FIX: Only include localId if it's an update
            if (isValidKey(targetId)) {
                newEntry.localId = Number(targetId);
            } else {
                delete newEntry.localId; // New entry must not have undefined localId
            }

            const id = await db.entries.put(newEntry);
            setForceRefresh(prev => prev + 1);
            
            // 🔥 TRIGGER SYNC: Immediately push to server
            if (typeof window !== 'undefined' && window.syncOrchestrator) {
                window.syncOrchestrator.triggerSync(userId);
            }
            
            return { success: true, entry: { ...newEntry, localId: id } };
        } catch (error) {
            logVaultError('saveEntry', error, { userId, entryData });
            return { success: false, error: error as Error };
        }
    }, [userId, bookId, setForceRefresh]);

    // 🗑️ DELETE ENTRY
    const deleteEntry = useCallback(async (entry: any) => {
        if (!userId || !isValidKey(entry?.localId)) return { success: false };

        try {
            await db.entries.update(Number(entry.localId), { 
                isDeleted: 1, 
                synced: 0, 
                updatedAt: Date.now()
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('deleteEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 TOGGLE STATUS
    const toggleEntryStatus = useCallback(async (entry: any) => {
        if (!userId || !isValidKey(entry?.localId)) return { success: false };

        try {
            const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
            await db.entries.update(Number(entry.localId), { 
                status: newStatus, 
                updatedAt: Date.now(),
                synced: 0
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('toggleEntryStatus', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 📌 TOGGLE PIN
    const togglePin = useCallback(async (entry: any) => {
        if (!userId || !isValidKey(entry?.localId)) return { success: false };

        try {
            const newPinnedValue = entry.isPinned ? 0 : 1;
            await db.entries.update(Number(entry.localId), { 
                isPinned: newPinnedValue, 
                updatedAt: Date.now(),
                synced: 0
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('togglePin', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 📚 SAVE BOOK
    const saveBook = useCallback(async (bookData: any, editTarget?: any) => {
        if (!userId) return { success: false };

        try {
            // 🔥 VERSION KEY LOGIC: Preserve CID and increment vKey for edits
            let nextVKey = 1;
            if (editTarget?.localId) {
                const existingBook = await db.books.get(editTarget.localId);
                nextVKey = (existingBook?.vKey || 0) + 1;
            }
            
            const newBook = {
                ...editTarget,
                ...bookData,
                userId,
                cid: editTarget?.cid || generateCID(),
                vKey: nextVKey,
                synced: 0,
                isDeleted: 0,
                updatedAt: Date.now()
            } as any;

            if (!editTarget?.createdAt) newBook.createdAt = Date.now();
            
            // Handle localId for books
            if (isValidKey(editTarget?.localId)) {
                newBook.localId = Number(editTarget.localId);
            } else {
                delete newBook.localId;
            }

            const id = await db.books.put(newBook);
            setForceRefresh(prev => prev + 1);
            
            // 🔥 TRIGGER SYNC: Immediately push to server
            if (typeof window !== 'undefined' && window.syncOrchestrator) {
                window.syncOrchestrator.triggerSync(userId);
            }
            
            return { success: true, book: { ...newBook, localId: id } };
        } catch (error) {
            logVaultError('saveBook', error, { userId, bookData });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🗑️ DELETE BOOK
    const deleteBook = useCallback(async (book: any) => {
        if (!userId || !isValidKey(book?.localId)) return { success: false };

        try {
            await db.books.update(Number(book.localId), { 
                isDeleted: 1, 
                synced: 0, 
                updatedAt: Date.now()
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('deleteBook', error, { userId, book });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE ENTRY
    const restoreEntry = useCallback(async (entry: any) => {
        if (!userId || !isValidKey(entry?.localId)) return { success: false };

        try {
            await db.entries.update(Number(entry.localId), { 
                isDeleted: 0, 
                synced: 0, 
                updatedAt: Date.now()
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('restoreEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE BOOK
    const restoreBook = useCallback(async (book: any) => {
        if (!userId || !isValidKey(book?.localId)) return { success: false };

        try {
            await db.books.update(Number(book.localId), { 
                isDeleted: 0, 
                synced: 0, 
                updatedAt: Date.now()
            });
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('restoreBook', error, { userId, book });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔍 CHECK DUPLICATE
    const checkPotentialDuplicate = useCallback(async (amount: number, type: string, category: string) => {
        if (!userId || !amount || !type || !category) return null;
        
        try {
            const allEntries = await db.entries.where('userId').equals(userId).toArray();
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            const potentialDuplicates = allEntries.filter((e: any) => 
                e.amount === amount &&
                e.type === type &&
                e.category === category &&
                e.createdAt > tenMinutesAgo &&
                !e.isDeleted
            );
            return potentialDuplicates.length > 0 ? potentialDuplicates[0] : null;
        } catch (error) {
            return null;
        }
    }, [userId]);

    // 🚨 SAFETY GUARD: Returns dummy functions if user/book not loaded
    if (!userId || !bookId) {
        const dummyAction = async () => ({ success: false, error: new Error('Missing User or Book ID') });
        return {
            saveEntry, deleteEntry, toggleEntryStatus, togglePin,
            saveBook, deleteBook, restoreEntry, restoreBook,
            checkPotentialDuplicate: async () => null,
            debounceTimer, lastRefreshTime
        };
    }

    return {
        saveEntry,
        deleteEntry,
        toggleEntryStatus,
        togglePin,
        saveBook,
        deleteBook,
        restoreEntry,
        restoreBook,
        checkPotentialDuplicate,
        debounceTimer,
        lastRefreshTime
    };
};