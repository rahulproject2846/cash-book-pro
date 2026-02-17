"use client";

import { useState, useCallback, useRef } from 'react';
import { db, generateCID, generateEntryChecksum } from '@/lib/offlineDB';
import { logVaultError } from '@/lib/vault/Telemetry';
import { normalizeRecord } from '@/lib/vault/core/VaultUtils';
import { orchestrator as syncOrchestrator } from '@/lib/vault/SyncOrchestrator';
import type { LocalEntry } from '@/lib/offlineDB';

/**
 * 🔥 VAULT ACTIONS HOOK
 * Handles all save, delete, and toggle operations with Invalid Key Protection
 */
export const useVaultActions = (currentUser: any, currentBook: any, forceRefresh: number, setForceRefresh: React.Dispatch<React.SetStateAction<number>>) => {
    // 🔒 ID VALIDATION: Use userId as-is (Single Source of Truth in SyncOrchestrator)
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId || '';

    //  SAVE ENTRY: Simplified with ID integrity
    const saveEntry = useCallback(async (entryData: Partial<LocalEntry>, editTarget?: any) => {
        if (!userId) {
            logVaultError('saveEntry', new Error('Invalid user ID'), { userId, entryData });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            // � DELETE AUTHORITY: Check if book is deleted before saving entry
            if (bookId) {
                const currentBook = await db.books.where('_id').equals(bookId).first();
                if (currentBook && currentBook.isDeleted === 1) {
                    console.warn(`🚫 [DELETE AUTHORITY] Blocked entry save for deleted book: ${bookId}`);
                    // Show toast notification
                    if (typeof window !== 'undefined') {
                        // This would be handled by the UI component
                        console.error('Book is deleted - UI should show toast');
                    }
                    return { success: false, error: new Error('This ledger no longer exists') };
                }
            }

            // �🛡️ INDUSTRIAL GRADE FIND-BEFORE-MERGE PROTOCOL
            const cidToFind = editTarget?.cid || entryData.cid;
            const existingRecord = cidToFind ? await db.entries.where('cid').equals(cidToFind).first() : null;
            const finalLocalId = existingRecord?.localId || editTarget?.localId;
            
            console.log('🛡️ SAVER PROTECTOR:', { 
                foundId: existingRecord?.localId, 
                action: finalLocalId ? 'UPDATE' : 'INSERT',
                cidToFind,
                editTargetLocalId: editTarget?.localId
            });

            const finalAmount = Number(entryData.amount) || 0;
            const finalDate = entryData.date || new Date().toISOString().split('T')[0];
            const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.toUpperCase()} RECORD` : 'GENERAL RECORD');

            // 🔥 PAYLOAD CONSTRUCTION: Explicit localId attachment
            const entryPayload = {
                title: finalTitle,
                date: finalDate,
                amount: finalAmount,
                type: entryData.type || 'expense',
                category: entryData.category || 'general',
                paymentMethod: entryData.paymentMethod || 'cash',
                note: entryData.note || '',
                time: entryData.time || new Date().toTimeString().split(' ')[0],
                status: entryData.status || 'completed',
                userId: userId, // 🔥 ID INTEGRITY: Use as-is from SyncOrchestrator
                bookId: bookId, // 🔥 ID INTEGRITY: Use as-is from SyncOrchestrator
                localId: finalLocalId, // ✅ CRITICAL: This links update to existing record
                _id: editTarget?._id || entryData._id,
                cid: editTarget?.cid || entryData.cid || generateCID(),
                synced: 0, // 🔥 SYNC STATE: Always mark as unsynced
                isDeleted: 0,
                updatedAt: Date.now(),
                vKey: Date.now(), // 🚨 DICTATOR vKey: Always wins sync battles
                syncAttempts: 0
            } as any;

            if (!editTarget?.createdAt) entryPayload.createdAt = Date.now();

            // 🔥 NORMALIZE FIRST: Pass through normalizeRecord to ensure data integrity
            const normalized = normalizeRecord(entryPayload, userId);
            
            // 🔥 GENERATE CHECKSUM AFTER NORMALIZATION: Use normalized data for consistency
            const checksum = await generateEntryChecksum({
                amount: normalized.amount,
                date: normalized.date,
                time: normalized.time || "",  // 🚨 ADD TIME FIELD
                title: normalized.title,
                note: normalized.note || "",
                category: normalized.category || "",
                paymentMethod: normalized.paymentMethod || "",
                type: normalized.type || "",
                status: normalized.status || ""
            });
            
            // 🔥 ADD CHECKSUM TO NORMALIZED DATA
            normalized.checksum = checksum;
            
            // 🛡️ INDUSTRIAL SAVE: put() is smarter - updates if localId exists, otherwise inserts
            const id = await db.entries.put(normalized);

            // � PARENT BOOK TOUCH: Update parent book's timestamp for activity sorting
            const parentBookId = entryData.bookId || entryPayload.bookId;
            if (parentBookId) {
                await db.books.update(String(parentBookId), { updatedAt: Date.now() });
            }

            // �🚀 IMMEDIATE SYNC: Trigger sync as soon as data hits Dexie
            syncOrchestrator.triggerSync();

            setForceRefresh(prev => prev + 1);
            
            return { success: true, entry: { ...entryPayload, localId: id } };
        } catch (error) {
            logVaultError('saveEntry', error, { userId, entryData });
            return { success: false, error: error as Error };
        }
    }, [userId, bookId, setForceRefresh]);

    // 🗑️ DELETE ENTRY
    const deleteEntry = useCallback(async (entry: any) => {
        if (!userId || !entry?.localId) return { success: false };

        try {
            // Get existing entry to increment vKey
            const existingEntry = await db.entries.get(Number(entry.localId));
            const currentVKey = existingEntry?.vKey || 0;
            
            await db.entries.update(Number(entry.localId), { 
                isDeleted: 1, 
                synced: 0, 
                vKey: Date.now(), // 🚨 CRITICAL: Force timestamp to guarantee server acceptance over any version
                updatedAt: Date.now()
            });
            
            // � PARENT BOOK TOUCH: Update parent book's timestamp for activity sorting
            const parentBookId = entry.bookId;
            if (parentBookId) {
                await db.books.update(String(parentBookId), { updatedAt: Date.now() });
            }
            
            // �🚀 TRIGGER SYNC: Ensure orchestrator.triggerSync() is called immediately after delete
            if (userId) {
                const { orchestrator } = await import('@/lib/vault/SyncOrchestrator');
                await orchestrator.triggerSync(userId);
            }
            
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('deleteEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 TOGGLE STATUS
    const toggleEntryStatus = useCallback(async (entry: any) => {
        if (!userId || !entry?.localId) return { success: false };

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
        if (!userId || !entry?.localId) return { success: false };

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

    // 📚 SAVE BOOK: Simplified with ID integrity
    const saveBook = useCallback(async (bookData: any, editTarget?: any) => {
        if (!userId) return { success: false };
        
        try {
            const bookPayload = {
                ...bookData,
                _id: editTarget?._id || bookData?._id, // ✅ Essential for Server Sync
                cid: editTarget?.cid || bookData?.cid || generateCID(),
                userId: String(userId),
                vKey: (editTarget?.vKey || 0) + 1,
                synced: 0,
                updatedAt: Date.now()
            };

            if (!editTarget?.createdAt) bookPayload.createdAt = Date.now();

            // Normalize the payload before saving
            const normalized = normalizeRecord(bookPayload, String(userId));
            if (!normalized) {
                throw new Error('Failed to normalize book data');
            }

            // 🔍 CRITICAL DEBUG: Check final object before Dexie
            console.log('🔍 [SAVEBOOK DEBUG] Final object to Dexie:', {
                cid: normalized.cid,
                _id: normalized._id,
                synced: normalized.synced,
                userId: normalized.userId,
                localId: normalized.localId
            });

            let id: number;
            if (editTarget?.cid) {
                // Find existing record by CID to get its localId
                const existingRecord = await db.books.where('cid').equals(editTarget.cid).first();
                if (existingRecord) {
                    // Update existing book
                    normalized.localId = existingRecord.localId;
                    console.log('🔍 [SAVEBOOK DEBUG] Updating existing record with localId:', existingRecord.localId);
                    id = await db.books.put(normalized);
                } else {
                    // Add new book (CID not found)
                    delete normalized.localId;
                    console.log('🔍 [SAVEBOOK DEBUG] Creating new record (CID not found)');
                    id = await db.books.put(normalized);
                }
            } else {
                // Add new book (no CID)
                delete normalized.localId;
                console.log('🔍 [SAVEBOOK DEBUG] Creating new record (no CID)');
                id = await db.books.put(normalized);
            }

            console.log('🔍 [SAVEBOOK DEBUG] Record saved to Dexie. About to call triggerSync...');
            console.log('🔍 [SAVEBOOK DEBUG] isSyncing flag before triggerSync:', (window as any).syncOrchestrator?.isSyncing);

            // 🚀 IMMEDIATE SYNC: Trigger sync as soon as data hits Dexie
            syncOrchestrator.triggerSync();

            setForceRefresh(prev => prev + 1);
            
            return { success: true, book: { ...normalized, localId: id } };
        } catch (error) {
            logVaultError('saveBook', error, { userId, bookData });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🗑️ DELETE BOOK
    const deleteBook = useCallback(async (book: any) => {
        if (!userId || !book?.localId) return { success: false };

        try {
            await db.books.update(Number(book.localId), { 
                isDeleted: 1, 
                synced: 0, 
                vKey: Date.now(), // 🚨 CRITICAL: Add vKey for version tracking
                updatedAt: Date.now()
            });
            
            // 🚨 CRITICAL: Trigger sync immediately to push delete to server
            syncOrchestrator.triggerSync();
            
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('deleteBook', error, { userId, book });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE ENTRY
    const restoreEntry = useCallback(async (entry: any) => {
        if (!userId || !entry?.localId) return { success: false };

        try {
            const updateResult = await db.entries.update(Number(entry.localId), { 
                isDeleted: 0, 
                synced: 0, 
                conflicted: 0, // 🚨 DICTATOR RESET: Clear conflict state
                serverData: null, // 🚨 DICTATOR RESET: Clear server conflict data
                vKey: Date.now(), // 🚨 CRITICAL: Force timestamp to guarantee server acceptance
                updatedAt: Date.now()
            });
            
            console.log('🔄 RESTORE DB UPDATE RESULT:', { 
                success: updateResult === 1, 
                result: updateResult, 
                entryLocalId: entry.localId,
                updateCount: updateResult === 1 ? 'SUCCESS' : 'FAILURE'
            });
            
            // 🚀 IMMEDIATE SYNC: Trigger sync as soon as data hits Dexie
            syncOrchestrator.triggerSync();
            
            // 🔄 UI REFRESH: Force immediate UI update
            window.dispatchEvent(new Event('vault-updated'));
            
            setForceRefresh(prev => prev + 1);
            return { success: true };
        } catch (error) {
            logVaultError('restoreEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE BOOK
    const restoreBook = useCallback(async (book: any) => {
        if (!userId || !book?.localId) return { success: false };

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
            checkPotentialDuplicate: async () => null
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
        checkPotentialDuplicate
    };
};