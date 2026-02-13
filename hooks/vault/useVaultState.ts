"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState, useEffect } from 'react';
import { db } from '@/lib/offlineDB';
import { normalizeTimestamp } from '@/lib/vault/core/VaultUtils';

/**
 * 🔥 VAULT STATE HOOK (Modularized with Persisted Cache)
 * Handles all useLiveQuery calls and state management
 */
export const useVaultState = (currentUser: any, forceRefresh: number, currentBook?: any) => {
    // 🔒 ID VALIDATION: Strict checks for undefined IDs
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId || '';
    
    // 🔥 LOCAL REFRESH STATE: For vault-updated events
    const [localRefresh, setLocalRefresh] = useState(0);
    
    // 🗃️ PERSISTED CACHE: Store last known good data
    const cacheRef = useRef<{
        books: any[];
        allEntries: any[];
        entries: any[];
    }>({
        books: [],
        allEntries: [],
        entries: []
    });
    
    // 📚 BOOKS: Reactive books list with bulletproof safety and pinned sorting
    const books = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            const books = db.books.where('userId').equals(userId).reverse().sortBy('updatedAt'); // 🔥 SORTING: UpdatedAt descending
            // 🔥 SAFETY FILTER: Filter out null/undefined items at source
            return books.then((result: any) => (result || []).filter((book: any) => !!book));
        },
        [userId, forceRefresh]
    );

    // 📝 ENTRIES: Reactive entries list with bulletproof safety
    const allEntries = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            const entries = db.entries.where('userId').equals(userId).reverse().sortBy('updatedAt'); // 🔥 SORTING: UpdatedAt descending
            // 🔥 SAFETY FILTER: Filter out null/undefined items at source
            return entries.then((result: any) => (result || []).filter((entry: any) => !!entry));
        },
        [userId, forceRefresh]
    );

    // 🎯 FILTERED ENTRIES: Bulletproof ID Bridge with Stale-While-Revalidate
    const entryIdBridge = useRef<Map<string, string>>(new Map());
    const entries = useMemo(() => {
        // 🔥 FALLBACK: If entries is undefined, return []
        const entriesArray = (allEntries || []).filter((entry: any) => !!entry);
        
        // 🗃️ CACHE UPDATE: Update cache when we have valid data
        if (entriesArray.length > 0) {
            entryIdBridge.current = new Map(
                entriesArray.map((entry: any) => [entry._id || entry.localId, String(entry.bookId)])
            );
        }
        
        if (!currentBook?._id) return [];
        
        // � BULLETPROOF TYPE-AGNOSTIC MATCHING: Handle string/number/undefined bookId
        const targetBookId = String(currentBook._id);
        const filtered = entriesArray.filter((entry: any) => {
            const entryBookId = entryIdBridge.current.get(entry._id || entry.localId) || String(entry.bookId || '');
            return entryBookId === targetBookId;
        });
        
        // � PINNED SORT: Pinned entries first, then by date descending
        return filtered.sort((a: any, b: any) => {
            // 📌 PIN TO TOP
            const aPinned = Number(a.isPinned) || 0;
            const bPinned = Number(b.isPinned) || 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            // Then by createdAt
            return normalizeTimestamp(b.createdAt) - normalizeTimestamp(a.createdAt);
        });
    }, [allEntries, currentBook, forceRefresh]);

    // 🔄 UNSYNCED COUNTER
    const unsyncedCount = useLiveQuery(
        () => db.entries.where('synced').equals(0).count(),
        [forceRefresh, localRefresh]  // 🔥 COMBINED: Watch both forceRefresh and localRefresh
    );

    // 🔥 VAULT-UPDATED LISTENER: Force refresh when sync completes
    useEffect(() => {
        const handleVaultUpdate = () => {
            console.log('🔄 [VAULT-STATE] vault-updated event detected, refreshing unsynced count');
            setLocalRefresh((prev: number) => prev + 1);  // 🔥 FIXED: Use proper typing
        };
        
        window.addEventListener('vault-updated', handleVaultUpdate);
        
        return () => {
            window.removeEventListener('vault-updated', handleVaultUpdate);
        };
    }, []);

    // �📊 LOADING STATE: Force stop loading when database opens
    // isLoading becomes false as soon as books array exists (even if empty)
    const isLoading = books === undefined;
    
    // 🗃️ PERSISTED CACHE MODE: Stale-While-Revalidate pattern
    // Never drop to empty state during sync - keep last known valid data
    const safeBooks = books && books.length > 0 ? books : cacheRef.current.books;
    const safeAllEntries = allEntries && allEntries.length > 0 ? allEntries : cacheRef.current.allEntries;
    
    // 🛡️ STALE-WHILE-REVALIDATE: Only update entries if we have valid new data
    // If entries become empty during sync, keep the cached version
    const hasValidNewEntries = entries.length > 0 || (allEntries && allEntries.length > 0);
    const safeEntries = hasValidNewEntries ? entries : cacheRef.current.entries;
    
    return {
        books: safeBooks || [],
        allEntries: safeAllEntries || [],
        entries: safeEntries || [],
        unsyncedCount: unsyncedCount || 0,
        isLoading,
        userId: userId || '',
        bookId: bookId || ''
    };
};