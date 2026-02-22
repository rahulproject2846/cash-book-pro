"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { clearSessionCache } from './sessionGuard';
import { createBookSlice, BookState, BookActions } from './slices/bookSlice';
import { createEntrySlice, EntryState, EntryActions } from './slices/entrySlice';
import { createSyncSlice, SyncState, SyncActions } from './slices/syncSlice';

// 🚀 UNIFIED VAULT STORE TYPE
export interface VaultStore extends BookState, BookActions, EntryState, EntryActions, SyncState, SyncActions {
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
  
  // 🎯 USER SETTINGS STATE
  categories: string[];
  currency: string;
  preferences: {
    dailyReminder: boolean;
    weeklyReports: boolean;
    highExpenseAlert: boolean;
  };
  
  // 🚀 Cross-cutting state
  userId: string;
  isLoading: boolean;
  activeSection: string;
  nextAction: string | null;
  isGlobalAnimating: boolean;
  lastScrollPosition: number; // 🆕 SCROLL MEMORY
  dynamicHeaderHeight: number;
  
  // 🔄 Cross-cutting actions
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  refreshCounters: () => Promise<void>;
  calculateGlobalStats: (allEntries: any[]) => void;
  checkForNewConflicts: () => Promise<void>;
  setActiveSection: (section: string) => void;
  setDynamicHeaderHeight: (height: number) => void;
  setNextAction: (action: string | null) => void;
  
  // 🎯 USER SETTINGS ACTIONS
  setCategories: (categories: string[]) => void;
  setCurrency: (currency: string) => void;
  setPreferences: (preferences: any) => void;
  
  // 🔥 SESSION MANAGEMENT: Clear session cache on logout
  clearSessionCache: () => void;
}

// 🛡️ MAIN VAULT STORE - COMBINES ALL SLICES
export const useVaultStore = create<VaultStore>()(
  immer(
    subscribeWithSelector((set, get, api) => {
      return {
        // 📚 BOOK SLICE
        ...createBookSlice(set, get, api),
        
        // 📝 ENTRY SLICE  
        ...createEntrySlice(set, get, api),
        
        // 🔄 SYNC SLICE
        ...createSyncSlice(set, get, api),
      
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
      
      // 🎯 USER SETTINGS STATE
      categories: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
      currency: 'BDT (৳)',
      preferences: {
        dailyReminder: false,
        weeklyReports: false,
        highExpenseAlert: false
      },
      
      // Cross-cutting state
      userId: '',
      isLoading: false,
      activeSection: 'books',
      nextAction: null,
      isGlobalAnimating: false,
      dynamicHeaderHeight: 80,

      // CROSS-CUTTING ACTIONS
      refreshData: async () => {
        const userId = identityManager.getUserId();
        
        console.log(' [MAIN STORE] Starting refresh for user:', userId);
        
        if (!userId) {
          console.warn(' [MAIN STORE] No userId found, skipping refresh');
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, userId: String(userId) });
        
        try {
          console.log(' [MAIN STORE] Starting coordinated data refresh...');
          
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

          // 📊 STATS: Defer to refreshCounters to prevent duplicate calculations
          // get().calculateGlobalStats(allEntries); // REMOVED

          const activeBookId = get().activeBook?._id || get().activeBook?.localId || '';
          const entries = activeBookId 
            ? allEntries.filter((entry: any) => String(entry.bookId || '') === String(activeBookId))
            : [];

          console.log(' [MAIN STORE] Coordinated refresh complete:', {
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
          console.error(' [MAIN STORE] Refresh failed:', error);
          set({ isLoading: false });
        }
      },

      forceRefresh: async () => {
        console.log(' [MAIN STORE] Force refresh triggered');
        await get().refreshData();
      },

      // STATS ACTIONS
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

          console.log(' [MAIN STORE] Counters refreshed:', { conflictedCount });
        } catch (error) {
          console.error(' [MAIN STORE] Counters refresh failed:', error);
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
        
        console.log(' [MAIN STORE] Global stats calculated:', globalStats);
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
            
            console.log(` [MAIN STORE] Found ${totalConflicts} conflicts and updated global store`);
          } else {
            console.log(' [MAIN STORE] No conflicts found');
          }

          set({
            conflictedBooksCount: conflictedBooks.length,
            conflictedEntriesCount: conflictedEntries.length,
            conflictedCount: totalConflicts,
            hasConflicts: totalConflicts > 0
          });
        } catch (error) {
          console.error(' [MAIN STORE] Failed to check for conflicts:', error);
        }
      },

      setActiveSection: (section: string) => {
        console.log(' [MAIN STORE] Active section set:', section);
        set({ activeSection: section });
      },

      setDynamicHeaderHeight: (height: number) => {
        set({ dynamicHeaderHeight: height });
      },

      setNextAction: (action: string | null) => {
        console.log(' [MAIN STORE] Next action set:', action);
        set({ nextAction: action });
      },
      
      // 🎯 USER SETTINGS ACTIONS
      setCategories: (categories: string[]) => {
        console.log(' [MAIN STORE] Categories updated:', categories);
        set({ categories });
      },
      
      setCurrency: (currency: string) => {
        console.log(' [MAIN STORE] Currency updated:', currency);
        set({ currency });
      },
      
      setPreferences: (preferences: any) => {
        console.log(' [MAIN STORE] Preferences updated:', preferences);
        set({ preferences });
      },

      // SESSION MANAGEMENT: Clear session cache on logout
      clearSessionCache: () => {
        console.log(' [SESSION GUARD] Clearing session cache');
        clearSessionCache();
      }
    };
  })
));

// 🎯 INITIAL DATA LOAD
if (typeof window !== 'undefined') {
  // 🧠 ACTIVATE MEDIA ENGINE: Background Base64 cleanup
  import('../services/MediaMigrator').then(({ mediaMigrator }) => {
    mediaMigrator.migrateLegacyImages().catch(error => {
      console.error('🧠 [MIGRATION] Background cleanup failed:', error);
    });
  }).catch(error => {
    console.error('🧠 [MIGRATION] Failed to load MediaMigrator:', error);
  });

  // Load data on first mount
  setTimeout(() => {
    // 🛡️ SECURITY GUARD: Only refresh if not in lockdown
    const { isSecurityLockdown } = useVaultStore.getState();
    if (!isSecurityLockdown) {
      useVaultStore.getState().refreshData();
    } else {
      console.log('🛡️ [MAIN STORE] Initial refresh blocked - App in lockdown mode');
    }
  }, 100);

  // 🆕 UNIFIED DEBOUNCE: Single source of truth for refresh prevention
  let lastRefreshTime = 0;
  let lastRefreshSource = '';
  const REFRESH_DEBOUNCE_MS = 3000; // 3 seconds unified cooldown
  let isBackgroundRefresh = false;

  // Listen for vault update events
  window.addEventListener('vault-updated', (event: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('📡 [MAIN STORE] Vault update event received');
    }
    
    const now = Date.now();
    const source = event.detail?.source || 'unknown';
    
    // 🔄 LOOP DETECTION: Same source within 1s = ignore
    if (source === lastRefreshSource && 
        now - lastRefreshTime < 1000) {
      console.log(`🛡️ [MAIN STORE] Loop detected: ${source} refresh ignored`);
      return;
    }
    
    if (now - lastRefreshTime < REFRESH_DEBOUNCE_MS) {
      console.log(`🛡️ [MAIN STORE] Refresh blocked - too soon (${now - lastRefreshTime}ms ago)`);
      return;
    }
    
    // 🛡️ SELF-REFRESH GUARD: Ignore SyncOrchestrator's own broadcasts
    if (source === 'SyncOrchestrator' && 
        event.detail?.origin === 'SyncOrchestrator') {
      console.log(`🛡️ [MAIN STORE] Self-refresh ignored: ${source}`);
      return;
    }
    
    // 🛡️ BACKGROUND SERVICE GUARD: Skip refresh if from background service
    if (source === 'IntegrityService' || 
        source === 'MaintenanceService') {
      console.log(`🛡️ [MAIN STORE] Skipping refresh from background service: ${source}`);
      isBackgroundRefresh = true;
      return;
    }
    
    lastRefreshSource = source;
    lastRefreshTime = now;
    isBackgroundRefresh = false;
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
