import { StateCreator } from 'zustand';
import { VaultStore } from '../index';
import { getTimestamp } from '@/lib/shared/utils';

// --- Interfaces ---
export interface SyncState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncedAt: number | null;
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
}

export interface SyncActions {
  setOnlineStatus: (status: boolean) => void;
  setSyncStatus: (status: SyncState['syncStatus']) => void;
  updateLastSyncedAt: () => void;
  registerConflict: (conflict: SyncState['conflicts'][0]) => void;
  resolveConflict: (id: string) => void;
  updateSyncStats: (stats: Partial<SyncState['syncStats']>) => void;
  triggerManualSync: () => Promise<void>;
  initializeNetworkListeners: () => void;
  cleanupNetworkListeners: () => void;
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
    syncStatus: 'idle',
    lastSyncedAt: null,
    conflicts: [],
    syncStats: { totalSynced: 0, totalFailed: 0, lastSyncDuration: null },

    // Actions (Immer allows direct mutation)
    setOnlineStatus: (status) => {
      set((state) => {
        state.isOnline = status;
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

    triggerManualSync: async () => {
      // 🚀 TRIGGER BATCHED PUSH SYNC
      try {
        console.log('🚀 [SYNC SLICE] Triggering manual batched sync...');
        
        // Import PushService dynamically to avoid circular dependency
        const PushService = (await import('../../services/PushService')).PushService;
        const pushService = new PushService();
        
        // Trigger batched push with priority and conflict guards
        const result = await pushService.pushPendingData();
        
        if (result.success) {
          console.log('✅ [SYNC SLICE] Manual sync completed successfully');
        } else {
          console.error('❌ [SYNC SLICE] Manual sync failed:', result.errors);
        }
        
      } catch (error) {
        console.error('❌ [SYNC SLICE] Manual sync error:', error);
      }
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
    }
  };
};
