import { StateCreator } from 'zustand';

import { VaultStore } from '../index';

import { getTimestamp } from '@/lib/shared/utils';



// --- Interfaces ---

export interface SyncState {

  isOnline: boolean;

  networkMode: 'OFFLINE' | 'DEGRADED' | 'SYNCING' | 'ONLINE' | 'RESTRICTED';

  syncStatus: 'idle' | 'syncing' | 'error' | 'success';

  lastSyncedAt: number | null;

  isSecurityLockdown: boolean;

  emergencyHydrationStatus: 'idle' | 'hydrating' | 'failed';

  securityErrorMessage: string;

  bootStatus: 'IDLE' | 'IDENTITY_WAIT' | 'PROFILE_SYNC' | 'DATA_HYDRATION' | 'READY';

  conflicts: Array<{

    id: string; // Map from cid

    type: 'book' | 'entry';

    cid: string;

    localId?: number;

    record: any; // The actual Dexie record

    serverData?: any; // Extracted from record.serverData

    conflictType: 'version' | 'parent_deleted';

  }>;

  syncStats: {

    totalSynced: number;

    totalFailed: number;

    lastSyncDuration: number | null;

  };

  syncProgress: {

    total: number;

    processed: number;

    percentage: number;

    eta: number;

  };

  // 🎯 CENTRAL UI STATE MANAGEMENT

  activeOverlays: string[]; // Track all active overlays: ['Modal', 'SuperMenu', 'UserMenu']

  

  // 🛡️ ELITE SAFE ACTION SHIELD STATE

  isGlobalAnimating: boolean;

  activeActions: string[]; // Track actions in progress

  

  // 🌍 GLOBAL SEARCH STATE

  searchQuery: string; // Global search query across all sections

  isSearchOpen: boolean; // Global search open state

}



export interface SyncActions {

  setOnlineStatus: (status: boolean) => void;

  setNetworkMode: (mode: 'OFFLINE' | 'DEGRADED' | 'SYNCING' | 'ONLINE' | 'RESTRICTED') => void;

  setSyncStatus: (status: SyncState['syncStatus']) => void;

  updateLastSyncedAt: () => void;

  registerConflict: (conflict: SyncState['conflicts'][0]) => void;

  resolveConflict: (id: string) => void;

  updateSyncStats: (stats: Partial<SyncState['syncStats']>) => void;

  setSyncProgress: (progress: Partial<SyncState['syncProgress']>) => void;

  triggerManualSync: () => Promise<void>;

  initializeNetworkListeners: () => void;

  cleanupNetworkListeners: () => void;

  setSecurityLockdown: (lockdown: boolean) => void;

  setEmergencyHydrationStatus: (status: SyncState['emergencyHydrationStatus']) => void;

  setSecurityErrorMessage: (message: string) => void;

  setBootStatus: (status: SyncState['bootStatus']) => void;

  // 🎯 OVERLAY MANAGEMENT ACTIONS

  registerOverlay: (id: string) => void;

  unregisterOverlay: (id: string) => void;

  clearOverlays: () => void;

  

  // 🛡️ ELITE SAFE ACTION SHIELD ACTIONS

  setGlobalAnimating: (animating: boolean) => void;

  registerAction: (actionId: string) => void;

  unregisterAction: (actionId: string) => void;

  isActionInProgress: (actionId: string) => boolean;

  

  // 🌍 GLOBAL SEARCH ACTIONS

  setSearchQuery: (query: string) => void;

  toggleSearch: (val?: boolean) => void;

}



export type SyncSlice = SyncState & SyncActions;



// --- Slice Implementation ---

export const createSyncSlice: StateCreator<

  VaultStore,

  [["zustand/immer", never]],

  [],

  SyncSlice

> = (set, get) => {

  // Return only sync slice properties

  return {

    // Initial State

    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

    networkMode: 'OFFLINE', // ✅ CAUTIOUS: Let ModeController determine actual state

    syncStatus: 'idle',

    lastSyncedAt: null,

    isSecurityLockdown: false,

    emergencyHydrationStatus: 'idle',

    securityErrorMessage: '',

    bootStatus: 'IDLE',

    conflicts: [],

    syncStats: { totalSynced: 0, totalFailed: 0, lastSyncDuration: null },

    syncProgress: { total: 0, processed: 0, percentage: 0, eta: 0 },

    // 🎯 CENTRAL UI STATE MANAGEMENT

    activeOverlays: [], // Track all active overlays: ['Modal', 'SuperMenu', 'UserMenu']

    

    // 🛡️ ELITE SAFE ACTION SHIELD INITIAL STATE

    isGlobalAnimating: false,

    activeActions: [], // Track actions in progress



    // 🌍 GLOBAL SEARCH INITIAL STATE

    searchQuery: '', // Global search query across all sections

    isSearchOpen: false, // Global search open state



    // Actions (Immer allows direct mutation)

    setOnlineStatus: (status) => {

      set((state) => {

        state.isOnline = status;

        state.networkMode = status ? 'ONLINE' : 'OFFLINE';

      });

    },



    setNetworkMode: (mode) => {

      set((state) => {

        state.networkMode = mode;

        // Keep isOnline synced for legacy support

        if (mode === 'OFFLINE') state.isOnline = false;

        if (mode === 'ONLINE') state.isOnline = true;

      });

    },



    setSyncStatus: (status) => {

      set((state) => {

        state.syncStatus = status;

      });

    },



    updateLastSyncedAt: () => {

      set((state) => {

        state.lastSyncedAt = getTimestamp();

      });

    },



    registerConflict: (conflict) => {

      set((state) => {

        const conflicts = state.conflicts || [];

        // Generate id from cid if not provided (legacy compatibility)

        const conflictWithId = {

          ...conflict,

          id: conflict.id || conflict.cid,

          serverData: conflict.serverData || conflict.record?.serverData

        };

        const exists = conflicts.some((c) => c.id === conflictWithId.id);

        if (!exists) conflicts.push(conflictWithId);

        state.conflicts = conflicts;

      });

    },



    resolveConflict: (id) => {

      set((state) => {

        const conflicts = state.conflicts || [];

        state.conflicts = conflicts.filter((c) => c.id !== id);

      });

    },



    updateSyncStats: (stats) => {

      set((state) => {

        const syncStats = state.syncStats || {};

        Object.assign(syncStats, stats);

        state.syncStats = syncStats;

      });

    },

    setSyncProgress: (progress) => {

      set((state) => {

        state.syncProgress = { ...state.syncProgress, ...progress };

      });

    },



    triggerManualSync: async () => {

      // BATCHED PUSH SYNC - Expose progress to UI

      try {

        console.log(' [SYNC SLICE] Triggering manual batched sync...');

        

        // Import PushService dynamically to avoid circular dependency

        const PushService = (await import('../../services/PushService')).PushService;

        const pushService = new PushService();

        

        // Trigger batched push with priority and conflict guards

        const result = await pushService.pushPendingData();

        

        // 📊 UPDATE SYNC PROGRESS IN STORE

        const { setSyncProgress } = get();

        if (result.success) {

          setSyncProgress({

            total: result.itemsProcessed || 0,

            processed: result.itemsProcessed || 0,

            percentage: 100,

            eta: 0

          });

        } else {

          setSyncProgress({

            total: 0,

            processed: 0,

            percentage: 0,

            eta: 0

          });

        }

        

        if (result.success) {

          console.log(' [SYNC SLICE] Manual sync completed successfully');

          get().showToast({

            type: 'success',

            message: 'All data synced successfully.',

            duration: 3000

          });

        } else {

          console.error(' [SYNC SLICE] Manual sync failed:', result.errors);

          

          // 🍎 APPLE-STYLE ERROR CLASSIFICATION
          const errorType = {
            toastType: 'error' as const,
            message: 'Sync failed. Please check your connection.',
            duration: 5000,
            canRetry: true
          };

          

          get().showToast({

            type: errorType.toastType,

            message: errorType.message,

            duration: errorType.duration,

            onRetry: errorType.canRetry ? () => get().triggerManualSync() : undefined

          });

        }

        

      } catch (error) {

        console.error(' [SYNC SLICE] Manual sync error:', error);

        get().showToast({

          type: 'error',

          message: 'Sync encountered an issue. Please try again.',

          duration: 5000,

          onRetry: () => get().triggerManualSync()

        });

      }

    },



    // 🎯 HELPER METHOD - Apple-style error classification

    classifySyncError: (errors: string[]) => {

      if (!errors || errors.length === 0) {

        return {

          toastType: 'warning' as const,

          message: 'Sync failed. Please check your internet connection.',

          duration: 5000,

          canRetry: true

        };

      }

      

      const error = errors[0]; // Primary error

      

      if (error.includes('Already syncing')) {

        return {

          toastType: 'warning' as const,

          message: 'Sync in progress. Please wait a moment.',

          duration: 3000,

          canRetry: false

        };

      }

      

      if (error.includes('restricted') || error.includes('lockdown')) {

        return {

          toastType: 'error' as const,

          message: 'Sync temporarily unavailable for security reasons.',

          duration: 7000,

          canRetry: false

        };

      }

      

      if (error.includes('License') || error.includes('User profile')) {

        return {

          toastType: 'error' as const,

          message: 'Account verification required. Please check your settings.',

          duration: 7000,

          canRetry: false

        };

      }

      

      if (error.includes('Media upload pending')) {

        return {

          toastType: 'sync-delay' as const,

          message: 'Network unstable. Data safe offline.',

          countdown: 7,

          canRetry: true

        };

      }

      

      // Fallback for unknown errors

      return {

        toastType: 'error' as const,

        message: 'Sync encountered an issue. Retrying shortly...',

        duration: 5000,

        canRetry: true

      };

    },



    initializeNetworkListeners: () => {

      if (typeof window === 'undefined') return;

      const handleOnline = () => {

        const currentState = get();

        currentState.setOnlineStatus(true);

      };

      const handleOffline = () => {

        const currentState = get();

        currentState.setOnlineStatus(false);

      };

      window.addEventListener('online', handleOnline);

      window.addEventListener('offline', handleOffline);

      (window as any)._syncListeners = { handleOnline, handleOffline };

    },



    cleanupNetworkListeners: () => {

      if (typeof window === 'undefined') return;

      const listeners = (window as any)._syncListeners;

      if (listeners) {

        window.removeEventListener('online', listeners.handleOnline);

        window.removeEventListener('offline', listeners.handleOffline);

      }

    },



    setSecurityLockdown: (lockdown) => {

      set((state) => {

        state.isSecurityLockdown = lockdown;

        if (lockdown) {

          state.networkMode = 'RESTRICTED';

          state.isOnline = false;

        } else {

          // Only lift restriction if network was actually restricted

          if (state.networkMode === 'RESTRICTED') {

            state.networkMode = 'OFFLINE';

            state.isOnline = false;

          }

        }

      });

    },



    setEmergencyHydrationStatus: (status) => {

      set((state) => {

        state.emergencyHydrationStatus = status;

      });

    },



    setSecurityErrorMessage: (message) => {

      set((state) => {

        state.securityErrorMessage = message;

      });

    },



    setBootStatus: (status) => {

      set((state) => {

        state.bootStatus = status;

      });

    },



    // 🎯 OVERLAY MANAGEMENT IMPLEMENTATIONS

    registerOverlay: (id) => {

      set((state) => {

        const overlays = state.activeOverlays || [];

        if (!overlays.includes(id)) {

          overlays.push(id);

          state.activeOverlays = overlays;

        }

      });

    },



    unregisterOverlay: (id) => {

      set((state) => {

        const overlays = state.activeOverlays || [];

        state.activeOverlays = overlays.filter(overlay => overlay !== id);

      });

    },



    clearOverlays: () => {

      set((state) => {

        state.activeOverlays = [];

      });

    },



    // 🛡️ ELITE SAFE ACTION SHIELD IMPLEMENTATIONS

    setGlobalAnimating: (animating) => {

      set((state) => {

        state.isGlobalAnimating = animating;

        console.log(`🎬 [SAFE ACTION] Global animating: ${animating}`);

      });

    },



    registerAction: (actionId) => {

      set((state) => {

        const actions = state.activeActions || [];

        if (!actions.includes(actionId)) {

          actions.push(actionId);

          state.activeActions = actions;

          console.log(`🛡️ [SAFE ACTION] Registered: ${actionId}`);

        }

      });

    },



    unregisterAction: (actionId) => {

      set((state) => {

        const actions = state.activeActions || [];

        const index = actions.indexOf(actionId);

        if (index > -1) {

          actions.splice(index, 1);

          state.activeActions = actions;

          console.log(`🛡️ [SAFE ACTION] Unregistered: ${actionId}`);

        }

      });

    },



    isActionInProgress: (actionId) => {

      const actions = get().activeActions || [];

      return actions.includes(actionId);

    },



    // 🌍 GLOBAL SEARCH IMPLEMENTATIONS

    setSearchQuery: (query) => {

      set((state) => {

        state.searchQuery = query;

      });

    },



    toggleSearch: (val) => {

      set((state) => {

        state.isSearchOpen = val !== undefined ? val : !state.isSearchOpen;

      });

    },

  };

};

