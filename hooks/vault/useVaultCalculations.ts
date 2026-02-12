"use client";

import { useMemo } from 'react';
import { normalizeTimestamp } from './helpers';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * 💰 VAULT CALCULATIONS HOOK (Modularized)
 * Handles all useMemo calculations for stats and totals
 */
export const useVaultCalculations = (allEntries: LocalEntry[], forceRefresh: number) => {
    // 💰 TOTAL CASH: Separate reactive calculation for instant updates
    const totalCash = useMemo(() => {
        // 🔒 SAFETY CHECK: Prevent undefined array crashes
        const entriesArray = (allEntries || []) as LocalEntry[];
        
        // Calculate total cash across ALL books and entries (global total)
        console.log('💰 CALCULATING TOTAL CASH:', { 
            allEntriesCount: entriesArray.length, 
            forceRefresh,
            entries: entriesArray.map(e => ({ id: e._id, amount: e.amount, type: e.type }))
        });
        
        return entriesArray
            .filter(e => !e.isDeleted && e.synced === 1)
            .reduce((sum, entry) => {
                return entry.type === 'income' 
                    ? sum + Number(entry.amount) 
                    : sum - Number(entry.amount);
            }, 0);
    }, [allEntries?.length]); // 🔧 DEPENDENCY: Only recalculate when length changes

    // 📊 STATS: Reactive statistics calculation
    const stats = useMemo(() => {
        // 🔒 SAFETY CHECK: Prevent undefined array crashes
        const entriesArray = (allEntries || []) as LocalEntry[];
        
        const activeEntries = entriesArray
            .filter(e => !e.isDeleted && e.synced === 1);
        const income = activeEntries
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const outflow = activeEntries
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const balance = income - outflow;
        
        // 🔥 HEALTH SCORE: Calculate financial health
        const healthScore = income > 0 
            ? Math.min(100, Math.round((balance / income) * 100))
            : 0;

        return {
            inflow: income,
            outflow: outflow,
            balance,
            healthScore,
            _debug: {
                totalEntries: entriesArray.length,
                activeEntries: activeEntries.length,
                incomeCount: activeEntries.filter(e => e.type === 'income').length,
                expenseCount: activeEntries.filter(e => e.type === 'expense').length
            }
        };
    }, [allEntries?.length]); // 🔧 DEPENDENCY: Only recalculate when length changes

    return {
        totalCash,
        stats
    };
};
