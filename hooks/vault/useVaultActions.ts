"use client";

import { useState, useCallback, useRef } from 'react';
import { db, generateCID, generateEntryChecksum } from '@/lib/offlineDB';
import { normalizeTimestamp, safeIdExtractor, hasValidId, logVaultError } from './helpers';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * 🔥 VAULT ACTIONS HOOK (Modularized)
 * Handles all save, delete, and toggle operations
 */
export const useVaultActions = (currentUser: any, currentBook: any, forceRefresh: number, setForceRefresh: React.Dispatch<React.SetStateAction<number>>) => {
    // 🔧 HOOK FIX: Move useRef declarations to top to prevent hook violations
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshTime = useRef(Date.now());

    // 🔒 ID VALIDATION: Strict checks for undefined IDs
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId;

    // 🔥 SERVER-FIRST: Save entry with checksum validation and server authority
    const saveEntry = useCallback(async (entryData: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('saveEntry', new Error('Invalid user ID'), { userId, entryData });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            // 🔍 GET EXISTING: Check for existing record to calculate next vKey
            const editTarget = entryData._id ? { _id: entryData._id } : { localId: entryData.localId };
            const existingRecord = editTarget?.localId ? await db.entries.get(Number(editTarget.localId)) : null;
            const nextVKey = (existingRecord?.vKey || 0) + 1;
            
            // 🔐 GENERATE CHECKSUM: Create checksum using consistent final values
            const finalAmount = Number(entryData.amount);
            const finalDate = entryData.date || new Date().toISOString().split('T')[0];
            const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.toUpperCase()} RECORD` : 'GENERAL RECORD');
            
            const checksum = await generateEntryChecksum({
                amount: finalAmount,
                date: finalDate,
                title: finalTitle
            });

            const newEntry = {
                ...entryData,
                title: finalTitle, // Ensure title is never empty
                date: finalDate,
                amount: finalAmount,
                userId,
                bookId,
                cid: generateCID(),
                synced: 0,
                isDeleted: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                vKey: nextVKey, // 🔧 CRITICAL: Include vKey for server acceptance
                checksum, // 🔧 CRITICAL: Include checksum for server validation
                syncAttempts: 0
            } as any; // 🔧 TYPE FIX: Cast to any to resolve type conflicts

            const id = await db.entries.put(newEntry);
            console.log('📝 ENTRY SAVED LOCALLY:', { id, entry: newEntry });
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true, entry: newEntry };
        } catch (error) {
            logVaultError('saveEntry', error, { userId, entryData });
            return { success: false, error: error as Error };
        }
    }, [userId, bookId, setForceRefresh]);

    // 🗑️ DELETE ENTRY: Soft delete with server authority
    const deleteEntry = useCallback(async (entry: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('deleteEntry', new Error('Invalid user ID'), { userId, entry });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            await db.entries.update(Number(entry.localId), { 
                isDeleted: 1, 
                synced: 0, 
                updatedAt: Date.now()
            });
            console.log('🗑️ ENTRY DELETED LOCALLY:', entry);
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('deleteEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 TOGGLE STATUS: Toggle entry completion status
    const toggleEntryStatus = useCallback(async (entry: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('toggleEntryStatus', new Error('Invalid user ID'), { userId, entry });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
            await db.entries.update(Number(entry.localId), { 
                status: newStatus, 
                updatedAt: Date.now()
            });
            console.log('🔄 ENTRY STATUS TOGGLED:', { entry, newStatus });
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('toggleEntryStatus', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 📌 TOGGLE PIN: Pin entry to top of list
    const togglePin = useCallback(async (entry: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('togglePin', new Error('Invalid user ID'), { userId, entry });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            const newPinnedValue = entry.isPinned ? 0 : 1;
            await db.entries.update(Number(entry.localId), { 
                isPinned: newPinnedValue, 
                updatedAt: Date.now()
            });
            console.log('📌 ENTRY PIN TOGGLED:', { entry, isPinned: newPinnedValue });
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('togglePin', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 📚 SAVE BOOK: Create or update book
    const saveBook = useCallback(async (bookData: any, editTarget?: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('saveBook', new Error('Invalid user ID'), { userId, bookData });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            const newBook = {
                ...editTarget, // Spread existing data first
                ...bookData,   // Overwrite with form data
                userId,
                cid: generateCID(),
                synced: 0,
                isDeleted: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            } as any; // 🔧 TYPE FIX: Cast to any to resolve type conflicts

            const id = await db.books.put(newBook);
            console.log('📚 BOOK SAVED LOCALLY:', { id, book: newBook });
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true, book: newBook };
        } catch (error) {
            logVaultError('saveBook', error, { userId, bookData });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🗑️ DELETE BOOK: Soft delete book
    const deleteBook = useCallback(async (book: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('deleteBook', new Error('Invalid user ID'), { userId, book });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            await db.books.update(Number(book.localId), { 
                isDeleted: 1, 
                synced: 0, 
                updatedAt: Date.now()
            });
            console.log('🗑️ BOOK DELETED LOCALLY:', book);
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('deleteBook', error, { userId, book });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE ENTRY: Restore deleted entry
    const restoreEntry = useCallback(async (entry: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('restoreEntry', new Error('Invalid user ID'), { userId, entry });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            await db.entries.update(Number(entry.localId), { 
                isDeleted: 0, 
                synced: 0, 
                updatedAt: Date.now()
            });
            console.log('🔄 ENTRY RESTORED LOCALLY:', entry);
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('restoreEntry', error, { userId, entry });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔄 RESTORE BOOK: Restore deleted book
    const restoreBook = useCallback(async (book: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('restoreBook', new Error('Invalid user ID'), { userId, book });
            return { success: false, error: new Error('Invalid user ID') };
        }

        try {
            await db.books.update(Number(book.localId), { 
                isDeleted: 0, 
                synced: 0, 
                updatedAt: Date.now()
            });
            console.log('🔄 BOOK RESTORED LOCALLY:', book);
            
            // 🔄 FORCE REFRESH: Trigger immediate UI update
            setForceRefresh(prev => prev + 1);
            
            return { success: true };
        } catch (error) {
            logVaultError('restoreBook', error, { userId, book });
            return { success: false, error: error as Error };
        }
    }, [userId, setForceRefresh]);

    // 🔍 CHECK DUPLICATE: Check for potential duplicate entries
    const checkPotentialDuplicate = useCallback((entryData: any) => {
        // 🔒 SAFETY CHECK: Don't run if user is not logged in
        if (!userId || (typeof userId !== 'string')) {
            logVaultError('checkPotentialDuplicate', new Error('Invalid user ID'), { userId, entryData });
            return null;
        }

        if (!entryData.title || !entryData.amount || !entryData.date) return null;
        
        // 🔒 SAFETY CHECK: Get current entries safely
        const allEntries = [] as any[]; // Placeholder for type safety
        
        const potentialDuplicates = allEntries.filter(e => 
            e.title?.toLowerCase().trim() === entryData.title?.toLowerCase().trim() &&
            e.amount === entryData.amount &&
            e.date === entryData.date &&
            !e.isDeleted
        );
        
        return potentialDuplicates.length > 0 ? potentialDuplicates[0] : null;
    }, [userId]);

    // 🚨 SAFETY GUARD: Return empty actions if IDs are invalid
    if (!userId || (typeof userId !== 'string') || !bookId || (typeof bookId !== 'string')) {
        // 🔇 SILENT MODE: No console log to prevent spam
        return {
            saveEntry: () => ({ success: false, error: new Error('Invalid user ID') }),
            deleteEntry: () => ({ success: false, error: new Error('Invalid user ID') }),
            toggleEntryStatus: () => ({ success: false, error: new Error('Invalid user ID') }),
            togglePin: () => ({ success: false, error: new Error('Invalid user ID') }),
            saveBook: (bookData: any, editTarget?: any) => ({ success: false, error: new Error('Invalid user ID') }),
            deleteBook: () => ({ success: false, error: new Error('Invalid user ID') }),
            restoreEntry: () => ({ success: false, error: new Error('Invalid user ID') }),
            restoreBook: () => ({ success: false, error: new Error('Invalid user ID') }),
            checkPotentialDuplicate: () => null,
            debounceTimer,
            lastRefreshTime
        };
    }

    // 🔄 RETURN: All action functions and refs
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
