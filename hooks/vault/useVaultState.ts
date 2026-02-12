"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db } from '@/lib/offlineDB';
import { normalizeTimestamp } from './helpers';

/**
 * 🔥 VAULT STATE HOOK (Modularized)
 * Handles all useLiveQuery calls and state management
 */
export const useVaultState = (currentUser: any, currentBook: any, forceRefresh: number) => {
    // 🔒 ID VALIDATION: Strict checks for undefined IDs
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId;
    
    // 📚 BOOKS: Reactive books list with pinned sorting
    const books = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            return db.books.where('userId').equals(userId).toArray();
        },
        [userId, forceRefresh]
    );

    // 📝 ENTRIES: Reactive entries list
    const allEntries = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            return db.entries.where('userId').equals(userId).toArray();
        },
        [userId, forceRefresh]
    );

    // 🎯 FILTERED ENTRIES: Filter by current book with pinned sorting
    const entries = useMemo(() => {
        const entriesArray = allEntries || [];
        const currentBookId = String(bookId || '');
        
        return entriesArray
            .filter(entry => {
                const entryBookId = String(entry.bookId || '');
                return entryBookId === currentBookId && entry.isDeleted === 0;
            })
            .sort((a, b) => {
                // 📌 PIN TO TOP
                const aPinned = Number(a.isPinned) || 0;
                const bPinned = Number(b.isPinned) || 0;
                if (aPinned !== bPinned) return bPinned - aPinned;
                // Then by createdAt
                return normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt);
            });
    }, [allEntries, bookId]);

    // 🔄 UNSYNCED COUNTER
    const unsyncedCount = useLiveQuery(
        () => db.entries.where('synced').equals(0).count(),
        [forceRefresh]
    );

    // 📊 LOADING STATE: Force stop loading when database opens
    // isLoading becomes false as soon as books array exists (even if empty)
    const isLoading = books === undefined;
    
    return {
        books: books || [],
        allEntries: allEntries || [],
        entries: entries || [],
        unsyncedCount: unsyncedCount || 0,
        isLoading,
        userId: userId || '',
        bookId: bookId || ''
    };
};