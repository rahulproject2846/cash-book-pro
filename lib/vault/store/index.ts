"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { clearSessionCache as sessionCleanup } from './sessionGuard';
import { createBookSlice, BookState, BookActions } from './slices/bookSlice';
import { createEntrySlice, EntryState, EntryActions } from './slices/entrySlice';
import { createSyncSlice, SyncState, SyncActions } from './slices/syncSlice';
import { createToastSlice, ToastState, ToastActions } from './slices/toastSlice';

// UNIFIED VAULT STORE TYPE
export interface VaultStore extends BookState, BookActions, EntryState, EntryActions, SyncState, SyncActions, ToastState, ToastActions {
  // Stats state
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
  
  // USER SETTINGS STATE
  categories: string[];
  currency: string;
  preferences: {
    dailyReminder: boolean;
    weeklyReports: boolean;
    highExpenseAlert: boolean;
    isMidnight?: boolean;
    compactMode?: boolean;
    autoLock?: boolean;
    turboMode?: boolean;
    showTooltips?: boolean;
    expenseLimit?: number;
  };
  
  // Cross-cutting state
  userId: string;
  currentUser: any;
  isLoading: boolean;
  activeSection: string;
  nextAction: string | null;
  isGlobalAnimating: boolean;
  lastScrollPosition: number; // SCROLL MEMORY
  dynamicHeaderHeight: number;
  isCleaning: boolean; // 🧹 Nuclear logout state
  
  // 🔄 LOOP PREVENTION: Remote mutation flag
  isRemoteMutation: boolean;
  
  // Cross-cutting actions
  refreshData: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  refreshCounters: () => Promise<void>;
  calculateGlobalStats: (allEntries: any[]) => void;
  checkForNewConflicts: () => Promise<void>;
  setActiveSection: (section: string) => void;
  setDynamicHeaderHeight: (height: number) => void;
  setNextAction: (action: string | null) => void;
  
  // USER SETTINGS ACTIONS
  setCategories: (categories: string[]) => void;
  setCurrency: (currency: string) => void;
  setPreferences: (preferences: any) => void;
  
  // SESSION MANAGEMENT: Clear session cache on logout
  clearSessionCache: () => void;
  
  // USER AUTH ACTIONS
  loginSuccess: (user: any) => void;
  logout: () => Promise<void>;
}

// MAIN VAULT STORE - COMBINES ALL SLICES
export const useVaultStore = create<VaultStore>()(
  immer(
    subscribeWithSelector((set, get, api) => {
      // UNIFIED DEBOUNCE: Single source of truth for refresh prevention
      let lastRefreshTime = 0;
      let lastRefreshSource = '';
      const REFRESH_DEBOUNCE_MS = 5000; // 5 seconds unified cooldown
      let isBackgroundRefresh = false;


      return {
        // BOOK SLICE
        ...createBookSlice(set, get, api),
        
        // ENTRY SLICE  
        ...createEntrySlice(set, get, api),
        
        // SYNC SLICE
        ...createSyncSlice(set, get, api),
      
        // TOAST SLICE
        ...createToastSlice(set, get, api),
      
      // STATS STATE
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
      
      // USER SETTINGS STATE
      categories: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
      currency: 'BDT (৳)',
      preferences: {
        dailyReminder: false,
        weeklyReports: false,
        highExpenseAlert: false,
        isMidnight: false,
        compactMode: false,
        autoLock: false,
        turboMode: false,
        showTooltips: true,
        expenseLimit: 0
      },
      
      // Cross-cutting state
      userId: '',
      currentUser: null,
      isLoading: false,
      activeSection: 'books',
      nextAction: null,
      isGlobalAnimating: false,
      dynamicHeaderHeight: 80,
      isCleaning: false, // 🧹 Nuclear logout state
      
      // 🔄 LOOP PREVENTION: Remote mutation flag
      isRemoteMutation: false,

      // CROSS-CUTTING ACTIONS
      refreshData: async () => {
        const userId = identityManager.getUserId();
        if (!userId) return;
        
        set({ isLoading: true });
        try {
          // 🛡️ DELEGATE TO DOMAIN SLICES: Respect the Matrix Architecture
          await get().refreshBooks('BACKGROUND_SYNC');
          await get().refreshEntries();
          await get().refreshCounters();
        } catch (error) {
          console.error('❌ [MAIN STORE] Data refresh failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      forceRefresh: async () => {
        console.log('[MAIN STORE] Force refresh triggered');
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

          console.log('[MAIN STORE] Counters refreshed:', { conflictedCount });
        } catch (error) {
          console.error('[MAIN STORE] Counters refresh failed:', error);
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
        
        console.log('[MAIN STORE] Global stats calculated:', globalStats);
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

            console.log(`[MAIN STORE] Found ${totalConflicts} conflicts and updated global store`);
          } else {
            console.log('[MAIN STORE] No conflicts found');
          }

          set({
            conflictedBooksCount: conflictedBooks.length,
            conflictedEntriesCount: conflictedEntries.length,
            conflictedCount: totalConflicts,
            hasConflicts: totalConflicts > 0
          });
        } catch (error) {
          console.error('[MAIN STORE] Failed to check for conflicts:', error);
        }
      },

      setActiveSection: (section: string) => {
        console.log('[MAIN STORE] Active section set:', section);
        set({ activeSection: section });
      },

      setDynamicHeaderHeight: (height: number) => {
        set({ dynamicHeaderHeight: height });
      },

      setNextAction: (action: string | null) => {
        console.log('[MAIN STORE] Next action set:', action);
        set({ nextAction: action });
      },
      
      // USER SETTINGS ACTIONS
      setCategories: (categories: string[]) => {
        console.log('[MAIN STORE] Categories updated:', categories);
        set({ categories });
      },

      setCurrency: (currency: string) => {
        console.log('[MAIN STORE] Currency updated:', currency);
        set({ currency });
      },

      setPreferences: (newPrefs: any) => set((state) => ({ 
        preferences: { ...state.preferences, ...newPrefs } 
      })),

      // SESSION MANAGEMENT: Clear session cache on logout
      clearSessionCache: () => {
        console.log('[SESSION GUARD] Clearing session cache');
        sessionCleanup();
      },

      // USER AUTH ACTIONS
      loginSuccess: (user: any) => {
        console.log('[MAIN STORE] Login success:', user._id);
        identityManager.setIdentity(user);
        set({ 
          userId: user._id,
          currentUser: user 
        });
      },

      logout: async () => {
        console.log('[MAIN STORE] Nuclear logout initiated');
        
        // 🛡️ STEP A: Refresh counters to get current sync state
        await get().refreshCounters();
        
        // 🛡️ STEP B: Check for unsynced/conflicted data
        const { unsyncedCount, conflictedCount } = get();
        
        if (unsyncedCount > 0 || conflictedCount > 0) {
          // 🚨 STEP C: Show data loss warning modal
          const message = `⚠️ DATA LOSS WARNING\n\nYou have:\n• ${unsyncedCount} unsynced items\n• ${conflictedCount} conflicted items\n\nThese will be permanently deleted. Continue?`;
          
          if (!confirm(message)) {
            console.log('[MAIN STORE] Logout cancelled by user');
            return;
          }
        }
        
        // 🧹 STEP D: Execute nuclear reset
        console.log('[MAIN STORE] Executing nuclear reset...');
        set({ isCleaning: true });
        
        try {
          // Clear identity first to prevent new operations
          identityManager.clearIdentity();
          
          // Delete entire database
          await db.delete();
          console.log('[MAIN STORE] Database deleted successfully');
          
          // Clear store state
          set({ 
            userId: '',
            currentUser: null,
            isCleaning: false
          });
          
          // Clear session cache
          sessionCleanup();
          
          // 🔄 STEP E: Controlled redirect
          console.log('[MAIN STORE] Redirecting to login...');
          window.location.href = '/';
          
        } catch (error) {
          console.error('[MAIN STORE] Nuclear reset failed:', error);
          set({ isCleaning: false });
          alert('❌ Logout failed. Please try again.');
        }
      }
    };
  })
));

// INITIAL DATA LOAD
if (typeof window !== 'undefined') {
  // ACTIVATE MEDIA ENGINE: Background Base64 cleanup
  import('../services/MediaMigrator').then(({ mediaMigrator }) => {
    mediaMigrator.migrateLegacyImages().catch(error => {
      console.error('[MIGRATION] Background cleanup failed:', error);
    });
  }).catch(error => {
    console.error('[MIGRATION] Failed to load MediaMigrator:', error);
  });

  // Load data on first mount
  setTimeout(() => {
    // 🆕 STRICT USER GUARD: Only refresh if user is valid
    const userId = identityManager.getUserId();
    if (!userId) {
      console.log('[MAIN STORE] No user available, skipping initial refresh');
      return;
    }
    
    // SECURITY GUARD: Only refresh if not in lockdown
    const { isSecurityLockdown } = useVaultStore.getState();
    if (!isSecurityLockdown) {
      useVaultStore.getState().refreshData();
    } else {
      console.log('[MAIN STORE] Initial refresh blocked - App in lockdown mode');
    }
  }, 100);

  // Listen for identity changes
  if (identityManager.subscribe) {
    identityManager.subscribe(async (newUserId) => {
      // ✅ CRITICAL: Update store's userId state BEFORE refreshing data
      useVaultStore.setState({ userId: newUserId || undefined });
      await useVaultStore.getState().refreshData();
    });
  }

  // 🆕 GLOBAL LISTENER: Handle vault-updated events with source attribution
  if (typeof window !== 'undefined') {
    window.addEventListener('vault-updated', (event: any) => {
      const source = event.detail?.source || 'BACKGROUND_SYNC';
      console.log(`📡 [MAIN STORE] Vault update detected from source: ${source}`);
      
      // 🛡️ SECURITY GUARD: Only refresh if not in lockdown
      const { isSecurityLockdown } = useVaultStore.getState();
      if (!isSecurityLockdown) {
        useVaultStore.getState().refreshBooks(source);
      } else {
        console.log('[MAIN STORE] Vault update blocked - App in lockdown mode');
      }
    });
  }
}
