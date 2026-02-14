"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState, useEffect } from 'react';
import { db } from '@/lib/offlineDB';

/**
 * 🔥 VAULT STATE HOOK (Pure State Mirror)
 * Fast, side-effect-free hook that only reads from Dexie and returns state
 */
export const useVaultState = (currentUser: any, forceRefresh: number, currentBook?: any) => {
    // 🔒 ID VALIDATION: Strict checks for undefined IDs
    const userId = currentUser?._id;
    const bookId = currentBook?._id || currentBook?.localId || '';
    
    //  LOCAL REFRESH STATE: For vault-updated events
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
    
    // 📚 BOOKS: Resilient query with JavaScript filtering
    const books = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            // 🔥 ENSURE STRING FORMAT: Normalize userId to string for query compatibility
            const stringUserId = String(userId);
            return db.books
                .where('userId').equals(stringUserId)
                .reverse()
                .sortBy('updatedAt')
                .then((res: any[]) => res.filter((book: any) => book.isDeleted === 0)); // 🔥 CLIENT-SIDE FILTER
        },
        [userId, forceRefresh]
    );

    // 📝 ENTRIES: Resilient query with JavaScript filtering
    const allEntries = useLiveQuery(
        () => {
            if (!userId || typeof userId !== 'string') return [];
            // 🔥 LOOSE FILTERING: Get all entries first, then filter
            const stringUserId = String(userId);
            return db.entries
                .where('userId').equals(stringUserId)
                .toArray() // Get all entries without sorting first
                .then((res: any[]) => {
                    // 🔍 DEBUG: Check for ghost entries
                    db.entries.toArray().then((allRaw: any[]) => {
                        if (allRaw.length > 0 && res.length === 0) {
                            console.warn('👻 GHOST DETECTED: All entries filtered out!', {
                                totalInDb: allRaw.length,
                                visibleEntries: res.length,
                                sampleEntry: allRaw[0] ? {
                                    cid: allRaw[0].cid,
                                    userId: allRaw[0].userId,
                                    isDeleted: allRaw[0].isDeleted,
                                    bookId: allRaw[0].bookId
                                } : null
                            });
                        }
                    });
                    
                    // Apply filters after getting all data
                    return res
                        .filter((entry: any) => entry.isDeleted === 0) // 🔥 CLIENT-SIDE FILTER
                        .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)); // Manual sort
                });
        },
        [userId, forceRefresh]
    );

    // 🎯 FILTERED ENTRIES: Universal ID Bridge - Type-Agnostic
    const entries = useMemo(() => {
        // 🔍 UNIVERSAL ID BRIDGE: Type-agnostic string conversion
        const targetBookId = String(currentBook?._id || currentBook?.localId || (books && books[0]?._id) || (books && books[0]?.localId) || '');
        
        const entriesArray = (allEntries || []).filter((entry: any) => !!entry);
        const filtered = entriesArray.filter((entry: any) => {
            // 🔍 TYPE-AGNOSTIC: Ensure both sides are strings
            const entryBookId = String(entry.bookId || '');
            return entryBookId === targetBookId;
        });
        
        // 🔍 DEBUG RECOVERY LOG: Check if data is hidden vs deleted
        if (typeof window !== "undefined" && userId) {
            db.entries.toArray().then((allRaw: any[]) => {
                // 👻 GHOST HUNTING: Find entries hiding due to corrupted fields
                const ghosts = allRaw.filter(e => e.isDeleted !== 0 || e.userId !== String(userId));
                if (ghosts.length > 0) {
                    console.warn('👻 GHOST IDENTIFIED:', ghosts.map(g => ({
                        cid: g.cid,
                        localId: g.localId,
                        userId: g.userId,
                        isDeleted: g.isDeleted,
                        bookId: g.bookId
                    })));
                }
                
                console.log('🔍 [GHOST CHECK]', { 
                    totalInDb: allRaw.length, 
                    totalVisible: entriesArray.length,
                    filteredVisible: filtered.length,
                    ghostCount: ghosts.length,
                    targetBookId,
                    userId
                });
            });
        }
        
        console.log('📊 [UI STATE] Total:', allEntries?.length, 'Filtered:', filtered.length);
        
        return filtered;
    }, [allEntries, currentBook, books]);

    // 🔄 UNSYNCED COUNTER
    const unsyncedCount = useLiveQuery(
        () => db.entries.where('synced').equals(0).count(),
        [forceRefresh, localRefresh]
    );

    // � CONFLICT COUNTERS
    const conflictedBooksCount = useLiveQuery(
        () => db.books.where('conflicted').equals(1).count(),
        [forceRefresh, localRefresh]
    );

    const conflictedEntriesCount = useLiveQuery(
        () => db.entries.where('conflicted').equals(1).count(),
        [forceRefresh, localRefresh]
    );

    // �🔥 VAULT-UPDATED LISTENER: Force refresh when sync completes
    useEffect(() => {
        const handleVaultUpdate = () => {
            setLocalRefresh((prev: number) => prev + 1);
        };
        
        window.addEventListener('vault-updated', handleVaultUpdate);
        
        return () => {
            window.removeEventListener('vault-updated', handleVaultUpdate);
        };
    }, []);

    // 📊 LOADING STATE: Force stop loading when database opens
    const isLoading = books === undefined;
    
    // 🗃️ PERSISTED CACHE MODE: Stale-While-Revalidate pattern
    const safeBooks = books && books.length > 0 ? books : cacheRef.current.books;
    const safeAllEntries = allEntries && allEntries.length > 0 ? allEntries : cacheRef.current.allEntries;
    
    // 🛡️ STALE-WHILE-REVALIDATE: Only update entries if we have valid new data
    const hasValidNewEntries = entries.length > 0 || (allEntries && allEntries.length > 0);
    const safeEntries = hasValidNewEntries ? entries : cacheRef.current.entries;
    
    return {
        books: safeBooks || [],
        allEntries: safeAllEntries || [],
        entries: safeEntries || [],
        unsyncedCount: unsyncedCount || 0,
        conflictedBooksCount: conflictedBooksCount || 0,
        conflictedEntriesCount: conflictedEntriesCount || 0,
        conflictedCount: ((conflictedBooksCount || 0) + (conflictedEntriesCount || 0)),
        hasConflicts: ((conflictedBooksCount || 0) + (conflictedEntriesCount || 0)) > 0,
        isLoading,
        userId: userId || '',
        bookId: bookId || ''
    };
};