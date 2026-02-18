"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { clearSessionCache } from './sessionGuard';
import { createBookSlice, BookState, BookActions } from './slices/bookSlice';
import { createEntrySlice, EntryState, EntryActions } from './slices/entrySlice';

// 🚀 UNIFIED VAULT STORE TYPE
export interface VaultStore extends BookState, BookActions, EntryState, EntryActions {
  // 📊 Stats state
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
  
  // 🚀 Cross-cutting state
  userId: string;
  isLoading: boolean;
  activeSection: string;
  nextAction: string | null;
  
  // 🔄 Cross-cutting actions
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  refreshCounters: () => Promise<void>;
  calculateGlobalStats: (allEntries: any[]) => void;
  checkForNewConflicts: () => Promise<void>;
  setActiveSection: (section: string) => void;
  setNextAction: (action: string | null) => void;
  
  // 🔥 SESSION MANAGEMENT: Clear session cache on logout
  clearSessionCache: () => void;
}

// 🛡️ MAIN VAULT STORE - COMBINES ALL SLICES
export const useVaultStore = create<VaultStore>()(
  subscribeWithSelector((...args) => {
    const [set, get] = args;
    
    return {
      // 📚 BOOK SLICE
      ...createBookSlice(set, get),
      
      // 📝 ENTRY SLICE  
      ...createEntrySlice(set, get),
      
      // 📊 STATS STATE
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
      
      // 🚀 Cross-cutting state
      userId: '',
      isLoading: false,
      activeSection: 'books',
      nextAction: null,

      // 🔄 CROSS-CUTTING ACTIONS
      refreshData: async () => {
        const userId = identityManager.getUserId();
        console.log('🚀 [MAIN STORE] Starting refresh for user:', userId);
        
        if (!userId) {
          console.warn('🚨 [MAIN STORE] No userId found, skipping refresh');
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, userId: String(userId) });
        
        try {
          console.log('🔄 [MAIN STORE] Starting coordinated data refresh...');
          
          const [books, allEntries] = await Promise.all([
            db.books
              .where('userId')
              .equals(String(userId))
              .and((book: any) => book.isDeleted === 0)
              .reverse()
              .sortBy('updatedAt'),
            
            db.entries
              .where('userId')
              .equals(String(userId))
              .and((entry: any) => entry.isDeleted === 0)
              .reverse()
              .sortBy('updatedAt'),
          ]);

          get().calculateGlobalStats(allEntries);

          const activeBookId = get().activeBook?._id || get().activeBook?.localId || '';
          const entries = activeBookId 
            ? allEntries.filter((entry: any) => String(entry.bookId || '') === String(activeBookId))
            : [];

          console.log('✅ [MAIN STORE] Coordinated refresh complete:', {
            booksCount: books.length,
            entriesCount: entries.length,
            allEntriesCount: allEntries.length,
            performance: 'coordinated parallel queries'
          });

          set({
            books,
            allEntries,
            entries,
            isLoading: false,
            userId: String(userId),
            bookId: activeBookId
          });

          get().applyFiltersAndSort();
          get().refreshCounters();

        } catch (error) {
          console.error('❌ [MAIN STORE] Refresh failed:', error);
          set({ isLoading: false });
        }
      },

      forceRefresh: async () => {
        console.log('🔄 [MAIN STORE] Force refresh triggered');
        await get().refreshData();
      },

      // 📊 STATS ACTIONS
      refreshCounters: async () => {
        set({ isLoading: true });
        
        try {
          const counters = await Promise.all([
            db.entries.where('synced').equals(0).count(),
            db.books.where('conflicted').equals(1).count(),
            db.entries.where('conflicted').equals(1).count(),
          ]);

          const [unsyncedCount, conflictedBooksCount, conflictedEntriesCount] = counters;
          const conflictedCount = conflictedBooksCount + conflictedEntriesCount;

          set({
            unsyncedCount,
            conflictedBooksCount,
            conflictedEntriesCount,
            conflictedCount,
            hasConflicts: conflictedCount > 0,
            isLoading: false
          });

          console.log('📊 [MAIN STORE] Counters refreshed:', { conflictedCount });
        } catch (error) {
          console.error('❌ [MAIN STORE] Counters refresh failed:', error);
          set({ isLoading: false });
        }
      },

      calculateGlobalStats: (allEntries: any[]) => {
        const globalStats = {
          totalIncome: allEntries
            .filter((e: any) => e.type === 'income')
            .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0),
          totalExpense: allEntries
            .filter((e: any) => e.type === 'expense')
            .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0),
          netBalance: 0
        };
        
        globalStats.netBalance = globalStats.totalIncome - globalStats.totalExpense;
        
        set({ globalStats });
        
        console.log('📊 [MAIN STORE] Global stats calculated:', globalStats);
      },

      checkForNewConflicts: async (): Promise<void> => {
        try {
          const conflictedBooks = await db.books.where('conflicted').equals(1).toArray();
          const conflictedEntries = await db.entries.where('conflicted').equals(1).toArray();
          
          const totalConflicts = conflictedBooks.length + conflictedEntries.length;
          
          if (totalConflicts > 0) {
            const { useConflictStore } = await import('../ConflictStore');
            
            const mappedConflicts = [
              ...conflictedBooks.map((book: any) => ({
                type: 'book' as const,
                cid: book.cid,
                localId: book.localId,
                record: book,
                conflictType: 'version'
              })),
              ...conflictedEntries.map((entry: any) => ({
                type: 'entry' as const,
                cid: entry.cid,
                localId: entry.localId,
                record: entry,
                conflictType: 'version'
              }))
            ];
            
            const { setConflicts } = useConflictStore.getState();
            setConflicts(mappedConflicts);
            
            const toast = (await import('react-hot-toast')).toast;
            toast.error(`${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} detected!`, {
              duration: 8000,
            });
            
            console.log(`🚨 [MAIN STORE] Found ${totalConflicts} conflicts and updated global store`);
          } else {
            console.log('✅ [MAIN STORE] No conflicts found');
          }

          set({
            conflictedBooksCount: conflictedBooks.length,
            conflictedEntriesCount: conflictedEntries.length,
            conflictedCount: totalConflicts,
            hasConflicts: totalConflicts > 0
          });
        } catch (error) {
          console.error('🚨 [MAIN STORE] Failed to check for conflicts:', error);
        }
      },

      setActiveSection: (section: string) => {
        console.log('🎯 [MAIN STORE] Active section set:', section);
        set({ activeSection: section });
      },

      setNextAction: (action: string | null) => {
        console.log('🎯 [MAIN STORE] Next action set:', action);
        set({ nextAction: action });
      },

      // 🔥 SESSION MANAGEMENT: Clear session cache on logout
      clearSessionCache: () => {
        console.log('🧹 [SESSION GUARD] Clearing session cache');
        clearSessionCache();
      }
    };
  })
);

// 🎯 INITIAL DATA LOAD
if (typeof window !== 'undefined') {
  // Load data on first mount
  setTimeout(() => {
    useVaultStore.getState().refreshData();
  }, 100);

  // Listen for vault update events
  window.addEventListener('vault-updated', () => {
    console.log('📡 [MAIN STORE] Vault update event received');
    useVaultStore.getState().refreshData();
  });

  // Listen for identity changes
  if (identityManager.subscribe) {
    identityManager.subscribe((newUserId) => {
      console.log('👤 [MAIN STORE] Identity changed:', newUserId);
      useVaultStore.getState().refreshData();
    });
  }
}
