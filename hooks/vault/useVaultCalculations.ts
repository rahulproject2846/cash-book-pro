"use client";

import { useMemo, useRef } from 'react';
import { normalizeTimestamp } from '@/lib/vault/core/VaultUtils';
import { logCalculation } from '@/lib/vault/Telemetry';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * 💰 VAULT CALCULATIONS HOOK (Modularized with Anti-Jitter)
 * Handles all useMemo calculations for stats and totals
 * Holds last non-empty state to prevent UI flicker during hydration
 */
export const useVaultCalculations = (entries: LocalEntry[] = [], forceRefresh: number) => {
    // � SSR SAFETY: Return safe defaults during server-side rendering
    if (typeof window === "undefined") {
        return { 
            inflow: 0, 
            outflow: 0, 
            balance: 0, 
            healthScore: 0,
            totalCash: 0,
            stats: {
                inflow: 0,
                outflow: 0,
                balance: 0,
                healthScore: 0,
                _debug: {
                    totalEntries: 0,
                    activeEntries: 0,
                    incomeCount: 0,
                    expenseCount: 0
                }
            }
        };
    }
    // �🛡️ ANTI-JITTER: Store last successful calculation
    const lastGoodStats = useRef<{
        inflow: number;
        outflow: number;
        balance: number;
        healthScore: number;
        totalCash: number;
        lastValidCount: number;
        syncCycleActive: boolean;
    }>({
        inflow: 0,
        outflow: 0,
        balance: 0,
        healthScore: 0,
        totalCash: 0,
        lastValidCount: 0,
        syncCycleActive: false
    });
    
    // 🔄 SYNC CYCLE DETECTION: Track when entries drop to 0 (likely sync in progress)
    const currentCount = (entries || []).length;
    const wasPreviouslyNonZero = lastGoodStats.current.lastValidCount > 0;
    const isCurrentlyZero = currentCount === 0;
    
    // 🛡️ FREEZE JITTER: Detect sync cycle start and freeze state
    if (wasPreviouslyNonZero && isCurrentlyZero && !lastGoodStats.current.syncCycleActive) {
        lastGoodStats.current.syncCycleActive = true;
        logCalculation('Sync Cycle Detected - Freezing State', { 
            previousCount: lastGoodStats.current.lastValidCount, 
            currentCount: 0 
        });
    }
    
    // Detect sync cycle end (entries restored)
    if (lastGoodStats.current.syncCycleActive && currentCount > 0) {
        lastGoodStats.current.syncCycleActive = false;
        lastGoodStats.current.lastValidCount = currentCount;
        logCalculation('Sync Cycle Ended - State Unfrozen', { 
            restoredCount: currentCount 
        });
    }
    
    // 💰 TOTAL CASH: Enhanced Logic Shielding - Prevent flickering during sync
    const totalCash = useMemo(() => {
        // 🔒 SAFETY CHECK: Prevent undefined array crashes with enhanced null filtering
        const entriesArray = (entries || []) as LocalEntry[];
        const safeEntries = entriesArray.filter((e): e is LocalEntry => e !== null && e !== undefined);
        
        // 🛡️ ENHANCED STATE GUARD: Hold last known non-zero value during active sync cycles
        const hasValidEntries = safeEntries.length > 0;
        const isInSyncCycle = lastGoodStats.current.syncCycleActive;
        const hasPreviousGoodData = lastGoodStats.current.totalCash > 0;
        
        if (!hasValidEntries && isInSyncCycle && hasPreviousGoodData) {
            logCalculation('Total Cash (Sync Shield)', { 
                entriesCount: 0, 
                total: lastGoodStats.current.totalCash,
                syncCycle: true
            });
            return lastGoodStats.current.totalCash;
        }
        
        // Fallback to regular stale logic
        if (!hasValidEntries && hasPreviousGoodData) {
            logCalculation('Total Cash (Stale)', { entriesCount: 0, total: lastGoodStats.current.totalCash });
            return lastGoodStats.current.totalCash;
        }
        
        // Calculate total cash for the provided entries (could be global or book-specific)
        const calculatedTotal = safeEntries
            .filter((e): e is LocalEntry => !e?.isDeleted) // 🔥 OPTIMISTIC UI: Include both synced and unsynced records
            .reduce((sum: number, entry: LocalEntry): number => {
                const entryType = entry?.type || 'unknown';
                const amount = Number(entry?.amount) || 0; // 🔥 SAFETY: Handle malformed amount data
                return entryType === 'income' 
                    ? sum + amount 
                    : sum - amount;
            }, 0);
            
        logCalculation('Total Cash', { entriesCount: safeEntries.length, total: calculatedTotal });
            
        // 🛡️ ANTI-JITTER: Update last good state if we have valid data
        if (safeEntries.length > 0) {
            lastGoodStats.current.totalCash = calculatedTotal;
            lastGoodStats.current.lastValidCount = safeEntries.length;
            lastGoodStats.current.syncCycleActive = false;
        }
        
        return calculatedTotal;
    }, [entries?.length, forceRefresh]); // 🔧 DEPENDENCY: Include forceRefresh for sync detection

    // 📊 STATS: Reactive statistics calculation with anti-jitter
    const stats = useMemo(() => {
        // 🔒 SAFETY CHECK: Prevent undefined array crashes
        const entriesArray = (entries || []) as LocalEntry[];
        const safeEntries = entriesArray.filter((e): e is LocalEntry => e !== null && e !== undefined);
        
        // 🛡️ ANTI-JITTER: Use last good state if array is empty during hydration
        if (safeEntries.length === 0 && (lastGoodStats.current.inflow > 0 || lastGoodStats.current.outflow > 0)) {
            logCalculation('Stats (Stale)', { inflow: lastGoodStats.current.inflow, outflow: lastGoodStats.current.outflow });
            return {
                inflow: lastGoodStats.current.inflow,
                outflow: lastGoodStats.current.outflow,
                balance: lastGoodStats.current.balance,
                healthScore: lastGoodStats.current.healthScore,
                _debug: {
                    totalEntries: entriesArray.length,
                    activeEntries: 0,
                    incomeCount: 0,
                    expenseCount: 0
                }
            };
        }
        
        // 🛡️ PERSISTENT STATE GUARD: Never drop to 0 during sync cycles
        // Keep last known valid stats if entries become empty during hydration
        const hasValidStats = safeEntries.length > 0 || (lastGoodStats.current.inflow > 0 || lastGoodStats.current.outflow > 0);
        if (!hasValidStats) {
            logCalculation('Stats (Stale)', { inflow: lastGoodStats.current.inflow, outflow: lastGoodStats.current.outflow });
            return {
                inflow: lastGoodStats.current.inflow,
                outflow: lastGoodStats.current.outflow,
                balance: lastGoodStats.current.balance,
                healthScore: lastGoodStats.current.healthScore,
                _debug: {
                    totalEntries: entriesArray.length,
                    activeEntries: 0,
                    incomeCount: 0,
                    expenseCount: 0
                }
            };
        }
        
        const activeEntries = safeEntries
            .filter((e): e is LocalEntry => !e?.isDeleted && e?.synced === 1);
        const income = activeEntries
            .filter((e): e is LocalEntry => e?.type === 'income')
            .reduce((sum: number, entry: LocalEntry): number => sum + (Number(entry?.amount) || 0), 0); // 🔥 SAFETY: Handle malformed amount
        const outflow = activeEntries
            .filter((e): e is LocalEntry => e?.type === 'expense')
            .reduce((sum: number, entry: LocalEntry): number => sum + (Number(entry?.amount) || 0), 0); // 🔥 SAFETY: Handle malformed amount
        const balance = income - outflow;
        
        // 🔥 NaN PROTECTION: Ensure valid numbers for animations
        const safeIncome = isNaN(income) ? 0 : income;
        const safeOutflow = isNaN(outflow) ? 0 : outflow;
        const safeBalance = isNaN(balance) ? 0 : balance;
        
        // 🔥 HEALTH SCORE: Calculate financial health
        const healthScore = safeIncome > 0 
            ? Math.min(100, Math.round((safeBalance / safeIncome) * 100))
            : 0;

        // 🛡️ ANTI-JITTER: Update last good state if we have valid data
        if (safeEntries.length > 0) {
            lastGoodStats.current.inflow = safeIncome;
            lastGoodStats.current.outflow = safeOutflow;
            lastGoodStats.current.balance = safeBalance;
            lastGoodStats.current.healthScore = isNaN(healthScore) ? 0 : healthScore;
        }

        return {
            inflow: safeIncome,
            outflow: safeOutflow,
            balance: safeBalance,
            healthScore: isNaN(healthScore) ? 0 : healthScore,
            _debug: {
                totalEntries: entriesArray.length,
                activeEntries: activeEntries.length,
                incomeCount: activeEntries.filter(e => e.type === 'income').length,
                expenseCount: activeEntries.filter(e => e.type === 'expense').length
            }
        };
    }, [entries?.length]); // 🔧 DEPENDENCY: Only recalculate when length changes

    return {
        totalCash,
        stats
    };
};
