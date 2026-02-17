import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { db } from '@/lib/offlineDB';
import { identityManager } from './core/IdentityManager';
import { mapConflictType } from './ConflictMapper';
import toast from 'react-hot-toast';
import { ConflictBackgroundService } from './ConflictBackgroundService';

// 🚨 CONFLICT ITEM INTERFACE
export interface ConflictItem {
    type: 'book' | 'entry';
    cid: string;
    localId?: number;
    record: any;               
    conflictType: 'version' | 'parent_deleted';
}

// 🚨 PENDING RESOLUTION INTERFACE
export interface PendingResolution {
    expiresAt: number;           
    resolution: 'local' | 'server';
    item: ConflictItem;          
}

// 🚨 CONFLICT STATE INTERFACE
interface ConflictState {
    conflicts: ConflictItem[];    
    pendingResolutions: Record<string, PendingResolution>;  
    isProcessing: boolean;        
}

// 🚨 CONFLICT STORE INTERFACE
interface ConflictStore extends ConflictState {
    setConflicts: (conflicts: ConflictItem[]) => void;
    addPendingResolution: (item: ConflictItem, resolution: 'local' | 'server') => void;
    removePendingResolution: (key: string) => void;
    clearPendingResolutions: () => void;
    resolveAll: (resolution: 'local' | 'server') => Promise<void>;
    executeExpiredResolutions: () => Promise<void>;
    detectConflicts: () => Promise<void>;
    getConflictCount: () => number;
    openConflictModal: (item: ConflictItem) => void;
    openBulkConflictModal: () => void;
    createSafetySnapshot: (item: ConflictItem) => Promise<void>;
    executeSingleResolution: (item: ConflictItem, resolution: 'local' | 'server') => Promise<void>;
}

// 🚨 GLOBAL CONFLICT STORE
export const useConflictStore = create<ConflictStore>()(
    subscribeWithSelector((set, get) => ({
        conflicts: [],
        pendingResolutions: {},
        isProcessing: false,

        setConflicts: (conflicts: ConflictItem[]) => set({ conflicts }),

        addPendingResolution: (item: ConflictItem, resolution: 'local' | 'server') => {
            const key = `${item.type}:${item.cid}`;
            const expiresAt = Date.now() + 8000; 
            
            set(state => ({
                pendingResolutions: {
                    ...state.pendingResolutions,
                    [key]: { expiresAt, resolution, item }
                }
            }));
            
            ConflictBackgroundService.getInstance().scheduleExecution(key, expiresAt);
        },

        removePendingResolution: (key: string) => {
            set(state => {
                const updated = { ...state.pendingResolutions };
                delete updated[key];
                return { pendingResolutions: updated };
            });
        },

        clearPendingResolutions: () => set({ pendingResolutions: {} }),

        resolveAll: async (resolution: 'local' | 'server') => {
            const { conflicts } = get();
            if (conflicts.length === 0) return;
            
            conflicts.forEach(conflict => {
                get().addPendingResolution(conflict, resolution);
            });
            
            toast.success(`Queued ${conflicts.length} items for resolution`);
        },

        executeExpiredResolutions: async () => {
            const { pendingResolutions } = get();
            const now = Date.now();
            const expiredKeys = Object.keys(pendingResolutions).filter(
                key => pendingResolutions[key].expiresAt <= now
            );
            
            for (const key of expiredKeys) {
                const resolution = pendingResolutions[key];
                if (resolution) {
                    await get().executeSingleResolution(resolution.item, resolution.resolution);
                    get().removePendingResolution(key);
                }
            }
            
            if (expiredKeys.length > 0) {
                const userId = identityManager.getUserId();
                if (userId) {
                    window.dispatchEvent(new CustomEvent('sync-request', { detail: { userId } }));
                }
            }
        },

        detectConflicts: async () => {
            try {
                // ✅ Explicitly typing the records to avoid 'any' error
                const conflictedBooks: any[] = await db.books.where('conflicted').equals(1).toArray();
                const conflictedEntries: any[] = await db.entries.where('conflicted').equals(1).toArray();
                
                const mappedConflicts: ConflictItem[] = [
                    ...conflictedBooks.map((book: any) => ({
                        type: 'book' as const,
                        cid: book.cid,
                        localId: book.localId,
                        record: book,
                        conflictType: mapConflictType(book.conflictReason || 'VERSION_CONFLICT')
                    })),
                    ...conflictedEntries.map((entry: any) => ({
                        type: 'entry' as const,
                        cid: entry.cid,
                        localId: entry.localId,
                        record: entry,
                        conflictType: mapConflictType(entry.conflictReason || 'VERSION_CONFLICT')
                    }))
                ];
                
                set({ conflicts: mappedConflicts });
            } catch (error) {
                console.error('🚨 [CONFLICT DETECTION] Failed:', error);
            }
        },

        getConflictCount: () => get().conflicts.length,

        openConflictModal: (item: ConflictItem) => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openConflictModal', { 
                    detail: { record: item.record, type: item.type, conflictType: item.conflictType } 
                }));
            }
        },

        openBulkConflictModal: () => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openBulkConflictModal', { 
                    detail: { conflicts: get().conflicts } 
                }));
            }
        },

        createSafetySnapshot: async (item: ConflictItem) => {
            try {
                const snapshot = {
                    cid: item.cid,
                    type: item.type,
                    record: JSON.parse(JSON.stringify(item.record)),
                    timestamp: Date.now(),
                    reason: 'pre_resolution_backup',
                    userId: identityManager.getUserId() || 'unknown'
                };
                await db.snapshots.add(snapshot);
            } catch (error) {
                console.error('🛡️ [SAFETY SNAPSHOT] Failed:', error);
            }
        },

        executeSingleResolution: async (item: ConflictItem, resolution: 'local' | 'server') => {
            try {
                if (resolution === 'server') {
                    await get().createSafetySnapshot(item);
                }
                
                const updateData = resolution === 'local' 
                    ? {
                        conflicted: 0,
                        synced: 0,
                        serverData: null,
                        vKey: (item.record.vKey || 0) + 1,
                        updatedAt: Date.now()
                    }
                    : {
                        ...item.record.serverData,
                        conflicted: 0,
                        synced: 1,
                        serverData: null,
                        updatedAt: Date.now()
                    };
                
                if (item.type === 'book') {
                    await db.books.update(item.localId!, updateData);
                } else {
                    await db.entries.update(item.localId!, updateData);
                }
                
                await db.auditLogs.add({
                    cid: item.cid,
                    type: item.type,
                    decision: resolution,
                    timestamp: Date.now(),
                    userId: identityManager.getUserId() || 'unknown'
                });
                
            } catch (error) {
                console.error(`🚨 [RESOLUTION] Failed for ${item.cid}:`, error);
            }
        }
    }))
);