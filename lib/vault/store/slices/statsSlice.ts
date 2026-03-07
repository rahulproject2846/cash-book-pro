"use client";



import { create } from 'zustand';

import { subscribeWithSelector } from 'zustand/middleware';

import { db } from '@/lib/offlineDB';

import { UserManager } from '@/lib/vault/core/user/UserManager';



// 📊 STATS STATE INTERFACE

export interface StatsState {

  globalStats: {

    totalIncome: number;

    totalExpense: number;

    netBalance: number;

  };

  unsyncedCount: number;

  conflictedBooksCount: number;

  conflictedEntriesCount: number;

  conflictedCount: number;

  hasConflicts: boolean;

  isLoading: boolean;

  // 🚀 PERFORMANCE: Memoization cache

  _statsCache: {

    entriesHash: string;

    globalStats: StatsState['globalStats'];

  };

  _debounceTimeout?: NodeJS.Timeout;

}



// 📊 STATS ACTIONS INTERFACE

export interface StatsActions {

  // Data Operations

  refreshCounters: () => Promise<void>;

  calculateGlobalStats: (allEntries: any[]) => void;

  

  // Conflict Management

  checkForNewConflicts: () => Promise<void>;

  

  // 🚀 PERFORMANCE: Debounced stats calculation

  debouncedCalculateStats: (allEntries: any[]) => void;

}



// 📊 COMBINED STATS STORE TYPE

export type StatsStore = StatsState & StatsActions;



// 🛡️ STATS SLICE WITH ZUSTAND

export const useStatsStore = create<StatsStore>()(

  subscribeWithSelector((set, get) => ({

    // 📊 INITIAL STATE

    globalStats: {

      totalIncome: 0,

      totalExpense: 0,

      netBalance: 0

    },

    unsyncedCount: 0,

    conflictedBooksCount: 0,

    conflictedEntriesCount: 0,

    conflictedCount: 0,

    hasConflicts: false,

    isLoading: false,

    

    // 🚀 PERFORMANCE: Memoization cache

    _statsCache: {

      entriesHash: '',

      globalStats: {

        totalIncome: 0,

        totalExpense: 0,

        netBalance: 0

      }

    },

    

    // 🚀 PERFORMANCE: Debounce timeout

    _debounceTimeout: undefined as NodeJS.Timeout | undefined,



    // �📊 REFRESH COUNTERS

    refreshCounters: async () => {

      set({ isLoading: true });

      

      try {

        const [unsyncedCount, conflictedBooksCount, conflictedEntriesCount] = await Promise.all([

          db.entries.where('synced').equals(0).count(),

          db.books.where('conflicted').equals(1).count(),

          db.entries.where('conflicted').equals(1).count(),

        ]);



        const conflictedCount = conflictedBooksCount + conflictedEntriesCount;



        set({

          unsyncedCount,

          conflictedBooksCount,

          conflictedEntriesCount,

          conflictedCount,

          hasConflicts: conflictedCount > 0,

          isLoading: false

        });



        console.log('📊 [STATS SLICE] Counters refreshed:', { conflictedCount });

      } catch (error) {

        console.error('❌ [STATS SLICE] Counters refresh failed:', error);

        set({ isLoading: false });

      }

    },



    // 📊 CALCULATE GLOBAL STATS - OPTIMIZED

    calculateGlobalStats: (allEntries: any[]) => {

      // 🚀 PERFORMANCE: Create hash for memoization

      const entriesHash = JSON.stringify(allEntries.map((e: any) => ({

        id: e._id || e.cid,

        type: e.type,

        amount: e.amount

      })));

      

      // 🚀 PERFORMANCE: Check cache first

      const { _statsCache } = get();

      if (_statsCache.entriesHash === entriesHash) {

        console.log('📊 [STATS SLICE] Using cached global stats');

        return; // Use cached value

      }

      

      // 🚀 PERFORMANCE: Single-pass accumulator loop

      const globalStats = {

        totalIncome: 0,

        totalExpense: 0,

        netBalance: 0

      };

      

      // 🚀 PERFORMANCE: Single pass through all entries

      for (const entry of allEntries) {

        const amount = Number(entry.amount || 0);

        if (entry.type === 'income') {

          globalStats.totalIncome += amount;

        } else if (entry.type === 'expense') {

          globalStats.totalExpense += amount;

        }

      }

      

      // Calculate net balance

      globalStats.netBalance = globalStats.totalIncome - globalStats.totalExpense;

      

      // 🚀 PERFORMANCE: Update cache

      set({ 

        globalStats,

        _statsCache: {

          entriesHash,

          globalStats

        }

      });

      

      console.log('📊 [STATS SLICE] Global stats calculated:', globalStats);

    },

    

    // 🚀 PERFORMANCE: Debounced stats calculation

    debouncedCalculateStats: (allEntries: any[]) => {

      // Clear existing timeout

      const { _debounceTimeout } = get();

      if (_debounceTimeout) {

        clearTimeout(_debounceTimeout);

      }

      

      // Set new timeout

      const timeout = setTimeout(() => {

        get().calculateGlobalStats(allEntries);

      }, 500); // 500ms debounce

      

      set({ _debounceTimeout: timeout });

    },



    // 🚨 CONFLICT DETECTION

    checkForNewConflicts: async (): Promise<void> => {

      try {

        // Dynamic import to avoid circular dependency

        const { useConflictStore } = await import('../../ConflictStore');

        

        // Query for all conflicted records

        const conflictedBooks = await db.books.where('conflicted').equals(1).toArray();

        const conflictedEntries = await db.entries.where('conflicted').equals(1).toArray();

        

        const totalConflicts = conflictedBooks.length + conflictedEntries.length;

        

        if (totalConflicts > 0) {

          // Map conflicts for store

          const mappedConflicts = [

            ...conflictedBooks.map((book: any) => ({

              type: 'book' as const,

              cid: book.cid,

              localId: book.localId,

              record: book,

              conflictType: 'version' // Map VERSION_CONFLICT to 'version'

            })),

            ...conflictedEntries.map((entry: any) => ({

              type: 'entry' as const,

              cid: entry.cid,

              localId: entry.localId,

              record: entry,

              conflictType: 'version' // Map VERSION_CONFLICT to 'version'

            }))

          ];

          

          // Update global conflict store

          const { setConflicts } = useConflictStore.getState();

          setConflicts(mappedConflicts);

          

          // Toast notification

          const toast = (await import('react-hot-toast')).toast;

          toast.error(`${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} detected!`, {

            duration: 8000,

          });

          

          console.log(`🚨 [STATS SLICE] Found ${totalConflicts} conflicts and updated global store`);

        } else {

          console.log('✅ [STATS SLICE] No conflicts found');

        }



        // Update local state

        set({

          conflictedBooksCount: conflictedBooks.length,

          conflictedEntriesCount: conflictedEntries.length,

          conflictedCount: totalConflicts,

          hasConflicts: totalConflicts > 0

        });

      } catch (error) {

        console.error('🚨 [STATS SLICE] Failed to check for conflicts:', error);

      }

    },

  }))

);

