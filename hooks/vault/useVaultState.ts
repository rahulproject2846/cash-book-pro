"use client";

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState, useEffect } from 'react';
import { db } from '@/lib/offlineDB';
import { identityManager } from '../../lib/vault/core/IdentityManager';

/**
 * 🔥 VAULT STATE HOOK (Pure State Mirror)
 * Fast, side-effect-free hook that only reads from Dexie and returns state
 */
export const useVaultState = (currentUser: any, forceRefresh: number, currentBook?: any) => {
    // 🔒 ID VALIDATION: Use unified IdentityManager for single source of truth
    const userId = identityManager.getUserId();
    
    console.log(`🔍 [USER ID DEBUG] useVaultState userId:`, {
        fromIdentityManager: identityManager.getUserId(),
        finalUserId: userId
    });
    
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
            if (!userId || typeof userId !== 'string') {
                console.log('🔍 [BOOKS QUERY] No valid userId, returning empty array');
                return [];
            }
            
            // 🔥 ENSURE STRING FORMAT: Normalize userId to string for query compatibility
            const stringUserId = String(userId);
            console.log(`🔍 [BOOKS QUERY] Querying books for userId: ${stringUserId} (type: ${typeof stringUserId})`);
            
            return db.books
                .where('userId').equals(stringUserId)
                .reverse()
                .sortBy('updatedAt')
                .then((res: any[]) => {
                    // 🔍 DEBUG: Check total books vs filtered books
                    db.books.toArray().then((allBooks: any[]) => {
                        console.log('🔍 [TOTAL BOOKS CHECK]', {
                            totalBooksInDb: allBooks.length,
                            booksForCurrentUser: res.length,
                            userId: stringUserId,
                            sampleBook: res[0] || null,
                            allBookIds: allBooks.map(b => ({ _id: b._id, localId: b.localId, userId: b.userId, isDeleted: b.isDeleted })),
                            filteredBookIds: res.map(b => ({ _id: b._id, localId: b.localId, userId: b.userId, isDeleted: b.isDeleted }))
                        });
                    });
                    
                    // 🔍 DEBUG: Log raw DB data to see actual fields
                    console.log('RAW DB DATA (first 2):', res.slice(0, 2));
                    
                    // 🔍 DEBUG: Check isDeleted values before filtering
                    const deletedBooks = res.filter((book: any) => book.isDeleted !== 0);
                    console.log('🔍 [DELETED BOOKS CHECK]', {
                        booksBeforeFilter: res.length,
                        booksMarkedDeleted: deletedBooks.length,
                        booksAfterFilter: res.filter((book: any) => book.isDeleted === 0).length,
                        isDeletedValues: res.map(b => b.isDeleted)
                    });
                    
                    return res.filter((book: any) => book.isDeleted === 0); // 🔥 CLIENT-SIDE FILTER
                });
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
                    const filteredEntries = res
                        .filter((entry: any) => entry.isDeleted === 0) // 🔥 CLIENT-SIDE FILTER
                        .sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)); // Manual sort
                    
                    console.log('📊 UI STATE REFRESHED', filteredEntries.length);
                    return filteredEntries;
                });
        },
        [userId, forceRefresh, localRefresh]
    );

    // 🎯 FILTERED ENTRIES: Universal ID Bridge - Type-Agnostic
    const entries = useMemo(() => {
        // � HANDLE UNDEFINED: Prevent undefined state from breaking counts
        if (!allEntries) return [];
        
        // 🔍 SMART TARGET BOOK ID: Fallback logic for loading states
        let targetBookId: string | null = null;
        if (currentBook?._id || currentBook?.localId) {
            targetBookId = String(currentBook._id || currentBook.localId);
        } else if (books?.[0]?._id || books?.[0]?.localId) {
            targetBookId = String(books[0]._id || books[0].localId);
        }
        
        const entriesArray = (allEntries || []).filter((entry: any) => !!entry);
        const filtered = entriesArray.filter((entry: any) => {
            // 🔥 RELAXED FILTER: Show all entries while books are loading
            if (!targetBookId || targetBookId === 'undefined' || targetBookId === '') return true;
            
            // 🔍 TYPE-AGNOSTIC: Ensure both sides are strings
            const entryBookId = String(entry.bookId || '');
            
            // 🔥 ORPHANED ENTRY RECOVERY: Show entries with fallback bookId
            if (!entry.bookId || entry.bookId === 'undefined' || entry.bookId === '' || entry.bookId.includes('orphaned-data')) {
                // Show orphaned entries when viewing the first/default book
                const isFirstBook = targetBookId === String(books?.[0]?._id || books?.[0]?.localId || '');
                return isFirstBook;
            }
            
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
                    userId: userId, // 🚨 CRITICAL: Log userId being used
                    sampleEntry: allRaw[0] ? {
                        cid: allRaw[0].cid,
                        userId: allRaw[0].userId,
                        isDeleted: allRaw[0].isDeleted,
                        bookId: allRaw[0].bookId
                    } : null
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

    // 🔥 VAULT-UPDATED LISTENER: Force refresh when sync completes
    useEffect(() => {
        const handleVaultUpdate = () => {
            setLocalRefresh((prev: number) => prev + 1);
        };
        
        window.addEventListener('vault-updated', handleVaultUpdate);
        
        return () => {
            window.removeEventListener('vault-updated', handleVaultUpdate);
        };
    }, []);

    // 🔐 IDENTITY MANAGER SUBSCRIPTION: React to identity changes
    useEffect(() => {
        const unsubscribe = identityManager.subscribe((newUserId) => {
            console.log(`🔍 [IDENTITY SUBSCRIPTION] useVaultState received userId change:`, {
                newUserId,
                timestamp: new Date().toISOString()
            });
            // Trigger local refresh when identity changes
            setLocalRefresh((prev: number) => prev + 1);
        });
        
        return () => {
            unsubscribe();
        };
    }, []);

    // 📊 LOADING STATE: Force stop loading when database opens
    const isLoading = books === undefined;
    
    // 🛡️ DIRECT DATA: Use fresh useLiveQuery results instead of cache fallback
    const safeBooks = books;
    const safeAllEntries = allEntries;
    
    return {
        books: safeBooks || [],
        allEntries: safeAllEntries || [],
        entries: entries || [],
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