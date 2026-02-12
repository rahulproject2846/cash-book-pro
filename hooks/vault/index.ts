"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVaultState } from './useVaultState';
import { useVaultCalculations } from './useVaultCalculations';
import { useVaultActions } from './useVaultActions';

export const useVault = (currentUser: any, currentBook?: any) => {
    const [forceRefresh, setForceRefresh] = useState(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const lastRefreshTime = useRef(Date.now());

    // 📊 STATE
    const {
        books,
        allEntries,
        entries,
        unsyncedCount,
        isLoading,
        userId,
        bookId
    } = useVaultState(currentUser, currentBook, forceRefresh);

    // 💰 CALCULATIONS
    const {
        totalCash,
        stats
    } = useVaultCalculations(allEntries, forceRefresh);

    // 🔥 ACTIONS
    const {
        saveEntry,
        deleteEntry,
        toggleEntryStatus,
        togglePin,
        saveBook,
        deleteBook,
        restoreEntry,
        restoreBook,
        checkPotentialDuplicate
    } = useVaultActions(currentUser, currentBook, forceRefresh, setForceRefresh);

    // 🌐 EVENT HANDLERS
    const handleDatabaseUpdate = useCallback((event: any) => {
        const { operation, type, timestamp } = event.detail;
        
        // 🔇 KILL UI LOOP: Stop UI flickering during sync operations
        // This is the CRITICAL FIX for the infinite loop
        if (operation === 'create' || operation === 'hydrate' || operation === 'server-create' || operation === 'server-overwrite') {
            return; 
        }
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        debounceTimer.current = setTimeout(() => {
            const currentTime = Date.now();
            const timeSinceLastRefresh = currentTime - lastRefreshTime.current;
            
            // Aggressive cooldown of 1 second
            if (timeSinceLastRefresh < 1000) return;
            
            if (timestamp > lastRefreshTime.current) {
                // Only trigger refresh for user actions, not background sync
                if (type === 'entry' && operation === 'update') {
                     setForceRefresh(prev => prev + 1);
                     lastRefreshTime.current = currentTime;
                }
            }
        }, 500);
    }, []); 

const handleTotalCashUpdate = useCallback((event: any) => {
        // 🛡️ SAFETY CHECK: Handle legacy events without detail
        if (!event.detail) {
            // If no detail, it means a generic write happened (legacy signal)
            // So we force a refresh to be safe
            setForceRefresh(prev => prev + 1);
            return;
        }

        const { operation, type } = event.detail;
        // Only force refresh total cash on specific impactful operations
        if (type === 'entry' && ['delete', 'restore', 'server-create', 'server-overwrite'].includes(operation)) {
            setForceRefresh(prev => prev + 1);
        }
    }, []);

    // 🔄 RE-FETCH LOGIC
    useEffect(() => {
        const dbHandler = (e: Event) => handleDatabaseUpdate(e as CustomEvent);
        const cashHandler = (e: Event) => handleTotalCashUpdate(e as CustomEvent);

        window.addEventListener('database-updated', dbHandler);
        window.addEventListener('totals-recalculate', dbHandler);
        window.addEventListener('vault-updated', cashHandler);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            window.removeEventListener('database-updated', dbHandler);
            window.removeEventListener('totals-recalculate', dbHandler);
            window.removeEventListener('vault-updated', cashHandler);
        };
    }, [handleDatabaseUpdate, handleTotalCashUpdate]);

    return {
        books: books || [],
        allEntries: allEntries || [],
        entries: entries || [],
        stats,
        totalCash,
        isLoading: isLoading || false,
        unsyncedCount: unsyncedCount || 0,
        saveEntry,
        deleteEntry,
        restoreEntry,
        toggleEntryStatus,
        deleteBook,
        restoreBook,
        togglePin,
        checkPotentialDuplicate,
        forceRefresh
    };
};