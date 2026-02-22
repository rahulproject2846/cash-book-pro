"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';

// 📝 ENTRY STATE INTERFACE
export interface EntryState {
  entries: any[];
  allEntries: any[];
  // 🎯 UNIFIED ENTRY FILTERING STATE
  entrySortConfig: { key: string; direction: 'asc' | 'desc' };
  entryCategoryFilter: string;
  entrySearchQuery: string;
  processedEntries: any[];
  entryPagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

// 📝 ENTRY ACTIONS INTERFACE
export interface EntryActions {
  refreshEntries: () => Promise<void>;
  saveEntry: (entryData: any, editTarget?: any, customActionId?: string) => Promise<{ success: boolean; entry?: any; error?: Error }>;
  updateEntry: (id: string, entryPayload: any) => Promise<{ success: boolean; entry?: any; error?: string }>;
  deleteEntry: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  restoreEntry: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  toggleEntryStatus: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  togglePin: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  // 🎯 UNIFIED ENTRY FILTERING ACTIONS
  setEntrySortConfig: (config: { key: string; direction: 'asc' | 'desc' }) => void;
  setEntryCategoryFilter: (filter: string) => void;
  setEntrySearchQuery: (query: string) => void;
  processEntries: () => void;
  setEntryPage: (page: number) => void;
}

// 📝 COMBINED ENTRY STORE TYPE
export type EntryStore = EntryState & EntryActions;

// 🛡️ ENTRY SLICE CREATOR FUNCTION
export const createEntrySlice = (set: any, get: any, api: any): EntryState & EntryActions => ({
  // 📊 INITIAL STATE
  entries: [],
  allEntries: [],
  // 🎯 UNIFIED ENTRY FILTERING STATE
  entrySortConfig: { key: 'createdAt', direction: 'desc' },
  entryCategoryFilter: 'all',
  entrySearchQuery: '',
  processedEntries: [],
  entryPagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10
  },

  // 📝 REFRESH ENTRIES
  refreshEntries: async () => {
    const userId = identityManager.getUserId();
    if (!userId) return;

    set({ isRefreshing: true });
    
    try {
      // Get pagination state
      const pagination = get().entryPagination || { currentPage: 1, itemsPerPage: 15 };
      const currentPage = Math.max(1, pagination.currentPage || 1);
      const itemsPerPage = pagination.itemsPerPage || 15;
      
      // Get filter state
      const categoryFilter = get().entryCategoryFilter || 'all';
      const searchQuery = get().entrySearchQuery || '';
      const sortConfig = get().entrySortConfig || { key: 'createdAt', direction: 'desc' };
      
      // 🎯 STRICT BOOK SCOPING: Get active book ID
      const activeBookId = get().activeBook?._id || get().activeBook?.localId || '';
      
      // 🚨 EARLY RETURN: No active book = no entries
      if (!activeBookId) {
        set({
          entries: [],
          allEntries: [],
          entryPagination: {
            currentPage: 1,
            totalPages: 0,
            itemsPerPage
          }
        });
        return;
      }
      
      // Build base query with strict book filtering
      let query = db.entries
        .where('userId')
        .equals(String(userId))
        .and((entry: any) => 
          entry.isDeleted === 0 && 
          String(entry.bookId || '') === String(activeBookId)
        );
      
      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.and((entry: any) => entry.category === categoryFilter);
      }
      
      // Apply search filter
      if (searchQuery.trim()) {
        query = query.and((entry: any) => 
          entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Get all filtered entries
      const allFilteredEntries = await query.reverse().sortBy(sortConfig.key);
      
      // Apply sorting direction
      const sortedEntries = sortConfig.direction === 'asc' 
        ? allFilteredEntries 
        : allFilteredEntries.reverse();
      
      // Calculate pagination
      const totalItems = sortedEntries.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedEntries = sortedEntries.slice(startIndex, endIndex);
      
      // Update state
      set({
        entries: paginatedEntries,
        allEntries: sortedEntries,
        entryPagination: {
          currentPage,
          totalPages,
          itemsPerPage
        }
      });
      
      // Process entries for UI
      get().processEntries();
      
    } catch (error) {
      console.error('❌ [ENTRY SLICE] Entries refresh failed:', error);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 📝 SAVE ENTRY - ZOMBIE LOCK PREVENTION
  saveEntry: async (entryData: any, editTarget?: any, customActionId?: string) => {
    // 🔍 VALIDATION FIRST - NO LOCK YET
    const userId = identityManager.getUserId();
    if (!userId) {
      console.error('❌ [ENTRY SLICE] Invalid user ID for saveEntry');
      return { success: false, error: new Error('Invalid user ID') };
    }

    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry save during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || `save-entry-${Date.now()}`;
    if (isGlobalAnimating) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry save during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [ENTRY SLICE] Blocked duplicate entry save action');
      return { success: false, error: new Error('Entry save already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const bookId = get().activeBook?._id || get().activeBook?.localId || '';
      
      if (bookId) {
        const currentBook = await db.books.where('_id').equals(bookId).first();
        if (currentBook && currentBook.isDeleted === 1) {
          console.warn(`🚫 [ENTRY SLICE] Blocked entry save for deleted book: ${bookId}`);
          return { success: false, error: new Error('This ledger no longer exists') };
        }
      }

      const { generateCID, generateEntryChecksum } = await import('@/lib/offlineDB');
      const { normalizeRecord } = await import('../../core/VaultUtils');
      
      const cidToFind = editTarget?.cid || entryData.cid;
      const existingRecord = cidToFind ? await db.entries.where('cid').equals(cidToFind).first() : null;
      const finalLocalId = existingRecord?.localId || editTarget?.localId;
      
      const finalAmount = Number(entryData.amount) || 0;
      const finalDate = entryData.date || new Date().toISOString().split('T')[0];
      const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.toUpperCase()} RECORD` : 'GENERAL RECORD');

      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);

      const entryPayload = {
        title: finalTitle,
        date: finalDate,
        amount: finalAmount,
        type: entryData.type || 'expense',
        category: entryData.category || 'general',
        paymentMethod: entryData.paymentMethod || 'cash',
        note: entryData.note || '',
        time: entryData.time || new Date().toTimeString().split(' ')[0],
        status: entryData.status || 'completed',
        isPinned: entryData.isPinned || false,  // ✅ ADDED isPinned FIELD
        userId: userId,
        bookId: bookId,
        localId: finalLocalId,
        _id: editTarget?._id || entryData._id,
        cid: editTarget?.cid || entryData.cid || generateCID(),
        synced: 0,
        isDeleted: 0,
        updatedAt: getTimestamp(),
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        syncAttempts: 0
      } as any;

      if (!editTarget?.createdAt) entryPayload.createdAt = getTimestamp();

      const normalized = normalizeRecord(entryPayload, userId);
      const checksum = await generateEntryChecksum({
        amount: normalized.amount,
        date: normalized.date,
        time: normalized.time || "",
        title: normalized.title,
        note: normalized.note || "",
        category: normalized.category || "",
        paymentMethod: normalized.paymentMethod || "",
        type: normalized.type || "",
        status: normalized.status || ""
      });
      
      normalized.checksum = checksum;
      
      // 🔄 INGEST LOCAL MUTATION: Use HydrationController for atomic writes
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const result = await controller.ingestLocalMutation('ENTRY', [normalized]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save entry via HydrationController');
      }
      
      // 🆕 OPTIMISTIC UPDATE: Add to Zustand immediately
      const currentEntries = get().entries;
      const newEntry = { ...normalized, localId: result.count || 0 };
      const updatedEntries = [newEntry, ...currentEntries.filter((e: any) => (e._id || e.localId) !== (newEntry._id || newEntry.localId))];
      set({ entries: updatedEntries });
      
      // 🆕 OPTIMISTIC RE-SORT: Apply filters and sort immediately
      get().processEntries();
      
      // 🆕 SAFE IGNITION: Trigger sync for non-image updates
      const hasNoImageChange = !entryData.image || !entryData.image.startsWith('cid_');
      if (hasNoImageChange) {
        const { orchestrator } = await import('../../core/SyncOrchestrator');
        orchestrator.triggerSync();
        console.log(`🚀 [SYNC TRIGGER] Manual sync ignited for TEXT-ONLY entry`);
      }
      
      // 🆕 DEFERRED REFRESH: Wait for transaction to settle
      setTimeout(async () => {
        await get().refreshEntries();
      }, 100);
      
      return { success: true, entry: { ...normalized, localId: result.count || 0 } };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] saveEntry failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: ALWAYS UNREGISTER ACTION
      unregisterAction(actionId);
    }
  },

  // 🗑️ DELETE ENTRY - ZOMBIE LOCK PREVENTION
  deleteEntry: async (entry: any, customActionId?: string) => {
    // 🔍 VALIDATION FIRST - NO LOCK YET
    const userId = identityManager.getUserId();
    if (!userId || !entry?.localId) return { success: false };
    
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry delete during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || 'delete-entry';
    if (isGlobalAnimating) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry delete during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [ENTRY SLICE] Blocked duplicate entry delete action');
      return { success: false, error: new Error('Entry delete already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      const currentVKey = existingEntry?.vKey || 0;
      
      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      
      const deletePayload = {
        ...entry,
        isDeleted: 1,
        synced: 0,
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [deletePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete entry via HydrationController');
      }
      
      const parentBookId = entry.bookId;
      if (parentBookId) {
        const bookUpdatePayload = {
          _id: parentBookId,
          updatedAt: getTimestamp()
        };
        await controller.ingestLocalMutation('BOOK', [bookUpdatePayload]);
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] deleteEntry failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: ALWAYS UNREGISTER ACTION
      unregisterAction(actionId);
    }
  },

  // 🔄 RESTORE ENTRY
  restoreEntry: async (entry: any, customActionId?: string) => {
    // � VALIDATION FIRST - NO LOCK YET
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };
    
    // ��️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry restore during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || `restore-entry-${Date.now()}`;
    if (isGlobalAnimating) {
      console.warn('🚫 [ENTRY SLICE] Blocked entry restore during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [ENTRY SLICE] Blocked duplicate entry restore action');
      return { success: false, error: new Error('Entry restore already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      const currentVKey = existingEntry?.vKey || 0;
      
      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      
      const restorePayload = {
        ...entry,
        isDeleted: 0,
        synced: 0,
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [restorePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore entry via HydrationController');
      }
      
      const parentBookId = entry.bookId;
      if (parentBookId) {
        const bookUpdatePayload = {
          _id: parentBookId,
          updatedAt: getTimestamp()
        };
        await controller.ingestLocalMutation('BOOK', [bookUpdatePayload]);
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] restoreEntry failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: Always unregister action
      unregisterAction(actionId);
    }
  },

  // 🔄 TOGGLE ENTRY STATUS
  toggleEntryStatus: async (entry: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
      
      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      
      const statusPayload = {
        ...entry,
        status: newStatus,
        synced: 0,
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [statusPayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update entry status');
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] toggleEntryStatus failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 📌 TOGGLE PIN
  togglePin: async (entry: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const newPinStatus = !entry.isPinned;
      
      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      
      const pinPayload = {
        ...entry,
        isPinned: newPinStatus,
        synced: 0,
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [pinPayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update entry pin status');
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] togglePin failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔄 UPDATE ENTRY
  updateEntry: async (id: string, entryPayload: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: 'User not authenticated' };

    try {
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      // 🎯 UNIQUE VKEY GENERATION - BETTER LOGIC
      const uniqueVKey = Date.now() * 1000 + Math.floor(Math.random() * 1000);
      
      const updatePayload = {
        ...entryPayload,
        vKey: uniqueVKey,  // ✅ UNIQUE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [updatePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update entry');
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true, entry: updatePayload };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] updateEntry failed:', error);
      return { success: false, error: 'Failed to update entry' };
    }
  },

  // 🎯 UNIFIED ENTRY FILTERING ACTIONS
  setEntrySortConfig: (config: { key: string; direction: 'asc' | 'desc' }) => {
    set({ entrySortConfig: config });
    get().processEntries();
  },

  setEntryCategoryFilter: (filter: string) => {
    set({ entryCategoryFilter: filter });
    get().processEntries();
  },

  setEntrySearchQuery: (query: string) => {
    set({ entrySearchQuery: query });
    get().processEntries();
  },

  processEntries: () => {
    const { allEntries, entrySortConfig, entryCategoryFilter, entrySearchQuery } = get();
    
    let processed = [...allEntries];
    
    // Apply category filter
    if (entryCategoryFilter !== 'all') {
      processed = processed.filter((entry: any) => entry.category === entryCategoryFilter);
    }
    
    // Apply search filter
    if (entrySearchQuery.trim()) {
      const searchLower = entrySearchQuery.toLowerCase();
      processed = processed.filter((entry: any) => 
        entry.title.toLowerCase().includes(searchLower) ||
        entry.note.toLowerCase().includes(searchLower) ||
        entry.category.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    processed.sort((a: any, b: any) => {
      const aValue = a[entrySortConfig.key];
      const bValue = b[entrySortConfig.key];
      
      if (entrySortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    set({ processedEntries: processed });
  },

  setEntryPage: (page: number) => {
    const { entryPagination } = get();
    set({
      entryPagination: {
        ...entryPagination,
        currentPage: page
      }
    });
    get().refreshEntries();
  }
});
