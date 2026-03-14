/**
 * 🚨 CONFLICT STORE - DEPRECATED (PATHOR V2)
 * 
 * ⚠️ DEPRECATION NOTICE (2026-03-11):
 * This store is DEPRECATED. All conflict tracking has been centralized to syncSlice.ts (Zustand).
 * 
 * MIGRATION GUIDE:
 * - Use getVaultStore().registerConflict() to register conflicts
 * - Use getVaultStore().conflicts for reading conflicts
 * - This file is kept for backward compatibility only
 * 
 * @deprecated Use syncSlice from lib/vault/store/slices/syncSlice.ts instead
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { db } from '@/lib/offlineDB';
import { UserManager } from '@/lib/vault/core/user/UserManager';
import { mapConflictType } from './ConflictMapper';
import { getTimestamp } from '@/lib/shared/utils';
import { getPlatform } from '@/lib/platform';
import toast from 'react-hot-toast';
import { ConflictBackgroundService } from './ConflictBackgroundService';
import { Book, FileText } from 'lucide-react';
import { conflictService } from './services/ConflictService';
import { getVaultStore } from './store/storeHelper';

// 🚨 CONFLICT ITEM INTERFACE
export interface ConflictItem {
    type: 'book' | 'entry';
    cid: string;
    localId?: number;
    record: any;               
    conflictType: 'version' | 'parent_deleted';
    icon: React.ElementType; // 🚀 ADDED: To hold specific icon component
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
        conflicts: [] as ConflictItem[],
        pendingResolutions: {},
        isProcessing: false,

        setConflicts: (conflicts: ConflictItem[]) => {
            // 🛡️ PATHOR V2: Sync with single source of truth (syncSlice)
            const store = getVaultStore();
            
            // Clear existing conflicts in syncSlice and add new ones
            conflicts.forEach(conflict => {
                store.registerConflict({
                    id: conflict.cid,
                    type: conflict.type,
                    cid: conflict.cid,
                    localId: conflict.localId,
                    record: conflict.record,
                    conflictType: conflict.conflictType
                });
            });
            
            // Also keep local state for backward compatibility
            set({ conflicts });
        },

        addPendingResolution: (item: ConflictItem, resolution: 'local' | 'server') => {
            const key = `${item.type}:${item.cid}`;
            const expiresAt = getTimestamp() + 8000; 
            
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
            const now = getTimestamp();
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
                const userId = UserManager.getInstance().getUserId();
                if (userId) {
                    getPlatform().events.dispatch('sync-request', {
                        trigger: 'automatic',
                        priority: 'normal',
                        timestamp: Date.now()
                    });
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
                        conflictType: mapConflictType(book.conflictReason || 'VERSION_CONFLICT'),
                        icon: Book
                    })),
                    ...conflictedEntries.map((entry: any) => ({
                        type: 'entry' as const,
                        cid: entry.cid,
                        localId: entry.localId,
                        record: entry,
                        conflictType: mapConflictType(entry.conflictReason || 'VERSION_CONFLICT'),
                        icon: FileText
                    }))
                ];
                
                set({ conflicts: mappedConflicts });
            } catch (error) {
                console.error('🚨 [CONFLICT DETECTION] Failed:', error);
            }
        },

        getConflictCount: () => get().conflicts.length,

        openConflictModal: (item: ConflictItem) => {
            getPlatform().events.dispatch('open-conflict-modal', {
                source: 'ConflictStore',
                timestamp: Date.now()
            });
        },

        openBulkConflictModal: () => {
            getPlatform().events.dispatch('open-bulk-conflict-modal', {
                source: 'ConflictStore',
                timestamp: Date.now()
            });
        },

        createSafetySnapshot: async (item: ConflictItem) => {
            try {
                const snapshot = {
                    cid: item.cid,
                    type: item.type,
                    record: JSON.parse(JSON.stringify(item.record)),
                    timestamp: getTimestamp(),
                    reason: 'pre_resolution_backup',
                    userId: UserManager.getInstance().getUserId() || 'unknown'
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
                
                // 🎯 USE CONFLICT SERVICE for atomic resolution
                const getState = () => getVaultStore();
                
                if (item.type === 'entry') {
                    // For entries, use ConflictService to handle parent book sync
                    await conflictService.resolveEntryConflict(item.cid, getState);
                } else {
                    // For books, use direct update with HydrationController
                    const { HydrationController } = await import('./hydration/HydrationController');
                    const controller = HydrationController.getInstance();
                    
                    const updateData = resolution === 'local' 
                        ? {
                            conflicted: 0,
                            synced: 0,
                            serverData: null,
                            vKey: (item.record.vKey || 0) + 1,
                            updatedAt: getTimestamp()
                        }
                        : {
                            ...item.record.serverData,
                            conflicted: 0,
                            synced: 1,
                            serverData: null,
                            updatedAt: getTimestamp()
                        };
                    
                    await controller.ingestLocalMutation('BOOK', [{ ...item.record, ...updateData }]);
                }
                
                await db.auditLogs.add({
                    cid: item.cid,
                    type: item.type,
                    decision: resolution,
                    timestamp: getTimestamp(),
                    userId: UserManager.getInstance().getUserId() || 'unknown'
                });
                
                // 🧹 MEMORY CLEANUP: Remove resolved conflict from state
                set(state => ({
                    conflicts: state.conflicts.filter(c => c.cid !== item.cid)
                }));
                
            } catch (error) {
                console.error(`🚨 [RESOLUTION] Failed for ${item.cid}:`, error);
            }
        }
    }))
);