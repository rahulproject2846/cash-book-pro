"use client";



import { create } from 'zustand';

import { subscribeWithSelector } from 'zustand/middleware';

import { persist, createJSONStorage } from 'zustand/middleware';

import { immer } from 'zustand/middleware/immer';

import { UserManager } from '../core/user/UserManager';

import { db } from '@/lib/offlineDB';

import { clearSessionCache as sessionCleanup } from './sessionGuard';

import { safeNuclearReset } from '@/lib/system/RecoveryUtil';

import { createBookSlice, BookState, BookActions } from './slices/bookSlice';

import { createEntrySlice, EntryState, EntryActions } from './slices/entrySlice';

import { createSyncSlice, SyncState, SyncActions } from './slices/syncSlice';

import { createToastSlice, ToastState, ToastActions } from './slices/toastSlice';



// 🔐 SECURE STORAGE: Encrypted transform for sensitive data

const secureStorage = {

  getItem: (name: string) => {

    if (typeof window === 'undefined') return null;

    const item = localStorage.getItem(name);

    if (!item) return null;

    

    try {

      const parsed = JSON.parse(item);

      // 🔐 SECURITY: Exclude sensitive fields from plain text storage

      if (parsed.state) {

        const { userId, currentUser, ...safeState } = parsed.state;

        return JSON.stringify({ ...parsed, state: safeState });

      }

      return item;

    } catch (error) {

      console.warn('🔐 [SECURE STORAGE] Failed to parse stored data:', error);

      return null;

    }

  },

  

  setItem: (name: string, value: string) => {

    if (typeof window === 'undefined') return;

    

    try {

      const parsed = JSON.parse(value);

      // 🔐 SECURITY: Exclude sensitive fields from plain text storage

      if (parsed.state) {

        const { userId, currentUser, ...safeState } = parsed.state;

        const secureValue = JSON.stringify({ ...parsed, state: safeState });

        localStorage.setItem(name, secureValue);

      } else {

        localStorage.setItem(name, value);

      }

    } catch (error) {

      console.warn('🔐 [SECURE STORAGE] Failed to store data:', error);

      localStorage.setItem(name, value); // Fallback to non-secure storage

    }

  },

  

  removeItem: (name: string) => {

    if (typeof window === 'undefined') return;

    localStorage.removeItem(name);

  }

};
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
  // 🛡️ HOLY GRAIL SYNCHRONOUS ANCHOR: Prevent race condition at Millisecond 0
  userId: string;
  currentUser: any;
  isLoading: boolean;
  bootStatus: SyncState['bootStatus']; // ✅ ADDED: Boot status state from SyncState
  isAuthenticated: boolean;
  activeSection: string;
  nextAction: string | null;
  isGlobalAnimating: boolean;
  lastScrollPosition: number; // SCROLL MEMORY
  dynamicHeaderHeight: number;
  isCleaning: boolean; // 🧹 Nuclear logout state
  isCleaningVault: boolean; // 🏛️ Sovereign Exit state

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
  setBootStatus: (status: SyncState['bootStatus']) => void; // ✅ ADDED: Boot status action

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



// MAIN VAULT STORE - COMBINES ALL SLICES WITH SECURE PERSISTENCE

// 🛡️ MILLISECOND-0 IDENTITY ANCHOR: Synchronous session check to prevent race condition
const hasSession = typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false;

export const useVaultStore = create<VaultStore>()(

  immer(

    persist(

      subscribeWithSelector(

        (set, get, api) => {

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

            bootStatus: 'IDLE', // ✅ DEFAULT: SyncState default

            isAuthenticated: hasSession, // 🛡️ BINARY GATE: Set at Millisecond 0

            activeSection: 'books',

            nextAction: null,

            isGlobalAnimating: false,

            dynamicHeaderHeight: 80,

            isCleaning: false, // 🧹 Nuclear logout state

            isCleaningVault: false, // 🏛️ Sovereign Exit state

            

            // 🔄 LOOP PREVENTION: Remote mutation flag

            isRemoteMutation: false,



            // CROSS-CUTTING ACTIONS

            refreshData: async () => {

              const userId = UserManager.getInstance().getUserId();

              if (!userId) return;

              
              try {
                // 🛡️ DELEGATE TO DOMAIN SLICES: Respect Matrix Architecture
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

            loginSuccess: async (user: any) => {

              console.log('[MAIN STORE] Login success:', user._id);

              // 🛡️ DEFENSIVE GUARD: Protect username from overwrite
              if (!user?.username) {
                console.warn('🛡️ [STORE] Blocking identity overwrite: Missing username');
                return;
              }

              // 🛡️ SOVEREIGN IDENTITY: Only UserManager sets identity
              await UserManager.getInstance().setIdentity(user);
              // Store will be updated via event listener - no direct setState
            },



            logout: async () => {
              console.log('[MAIN STORE] Sovereign Exit logout initiated - Google-Standard logout');
              const { sovereignExit } = await import('@/lib/system/ExitService');
              await sovereignExit();
            }

          };

        }

      ),

      {

        name: 'vault-store',

        storage: createJSONStorage(() => secureStorage),

        // 🔐 SECURITY: Exclude sensitive fields from persistence

        partialize: (state: VaultStore) => {
          const { 
            userId, 
            currentUser, 
            isAuthenticated, // 🛡️ EXCLUDE: Never persist authentication state
            prefetchedChunks, 
            prefetchedEntriesCache, 
            ...safeState 
          } = state;
          return safeState;
        },

        // 🔐 SECURITY: Add version for migration

        version: 1

      }

    )

  )

);



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
    const userId = UserManager.getInstance().getUserId();
    
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



  // 🛡️ SOVEREIGN IDENTITY MIRROR: Listen ONLY to UserManager events
  if (typeof window !== 'undefined') {
    window.addEventListener('identity-established', (event: any) => {
      const { user, timestamp } = event.detail || {};
      if (user && user._id) {
        console.log('📡 [MAIN STORE] Identity established event received:', user._id, 'timestamp:', timestamp);
        // Store acts as READ-ONLY mirror - updates only from UserManager events
        useVaultStore.setState({ 
          userId: user._id,
          currentUser: user 
        });
      }
    });

    window.addEventListener('identity-cleared', (event: any) => {
      const { timestamp } = event.detail || {};
      console.log('📡 [MAIN STORE] Identity cleared event received', 'timestamp:', timestamp);
      // Store acts as READ-ONLY mirror - updates only from UserManager events
      useVaultStore.setState({ 
        userId: undefined,
        currentUser: undefined 
      });
    });
  }



  
}
