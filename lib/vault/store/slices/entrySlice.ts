"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';

// 📝 ENTRY STATE INTERFACE
export interface EntryState {
  entries: any[];
  allEntries: any[];
}

// 📝 ENTRY ACTIONS INTERFACE
export interface EntryActions {
  refreshEntries: () => Promise<void>;
  saveEntry: (entryData: any, editTarget?: any) => Promise<{ success: boolean; entry?: any; error?: Error }>;
  deleteEntry: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  restoreEntry: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  toggleEntryStatus: (entry: any) => Promise<{ success: boolean; error?: Error }>;
  togglePin: (entry: any) => Promise<{ success: boolean; error?: Error }>;
}

// 📝 COMBINED ENTRY STORE TYPE
export type EntryStore = EntryState & EntryActions;

// 🛡️ ENTRY SLICE CREATOR FUNCTION
export const createEntrySlice = (set: any, get: any, api: any): EntryState & EntryActions => ({
  // 📊 INITIAL STATE
  entries: [],
  allEntries: [],

  // 📝 REFRESH ENTRIES
  refreshEntries: async () => {
    const userId = identityManager.getUserId();
    if (!userId) return;

    set({ isRefreshing: true });
    
    try {
      const allEntries = await db.entries
        .where('userId')
        .equals(String(userId))
        .and((entry: any) => entry.isDeleted === 0)
        .reverse()
        .sortBy('updatedAt');

      const activeBookId = get().activeBook?._id || get().activeBook?.localId || '';
      const entries = activeBookId 
        ? allEntries.filter((entry: any) => String(entry.bookId || '') === String(activeBookId))
        : [];

      set({ allEntries, entries });
      console.log('📝 [ENTRY SLICE] Entries refreshed:', entries.length);
    } catch (error) {
      console.error('❌ [ENTRY SLICE] Entries refresh failed:', error);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 📝 SAVE ENTRY
  saveEntry: async (entryData: any, editTarget?: any) => {
    const userId = identityManager.getUserId();
    if (!userId) {
      console.error('❌ [ENTRY SLICE] Invalid user ID for saveEntry');
      return { success: false, error: new Error('Invalid user ID') };
    }

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
        userId: userId,
        bookId: bookId,
        localId: finalLocalId,
        _id: editTarget?._id || entryData._id,
        cid: editTarget?.cid || entryData.cid || generateCID(),
        synced: 0,
        isDeleted: 0,
        updatedAt: getTimestamp(),
        vKey: getTimestamp(),
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
      
      const id = await db.entries.put(normalized);

      const parentBookId = entryData.bookId || entryPayload.bookId;
      if (parentBookId) {
        await db.books.update(String(parentBookId), { updatedAt: getTimestamp() });
      }

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshEntries();
      
      return { success: true, entry: { ...entryPayload, localId: id } };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] saveEntry failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🗑️ DELETE ENTRY
  deleteEntry: async (entry: any) => {
    const userId = identityManager.getUserId();
    if (!userId || !entry?.localId) return { success: false };

    try {
      const existingEntry = await db.entries.get(Number(entry.localId));
      const currentVKey = existingEntry?.vKey || 0;
      
      await db.entries.update(Number(entry.localId), { 
        isDeleted: 1, 
        synced: 0, 
        vKey: getTimestamp(),
        updatedAt: getTimestamp()
      });
      
      const parentBookId = entry.bookId;
      if (parentBookId) {
        await db.books.update(String(parentBookId), { updatedAt: getTimestamp() });
      }
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] deleteEntry failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔄 RESTORE ENTRY
  restoreEntry: async (entry: any) => {
    try {
      console.log('🔄 [ENTRY SLICE] Restoring entry:', entry.localId);
      
      await db.entries.update(Number(entry.localId), {
        isDeleted: 0,
        synced: 0,
        updatedAt: getTimestamp(),
        vKey: getTimestamp()
      });

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshEntries();
      
      console.log('✅ [ENTRY SLICE] Entry restored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] Failed to restore entry:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔄 TOGGLE ENTRY STATUS
  toggleEntryStatus: async (entry: any) => {
    try {
      const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
      
      await db.entries.update(Number(entry.localId), {
        status: newStatus,
        synced: 0,
        updatedAt: getTimestamp(),
        vKey: getTimestamp()
      });

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
    try {
      const newPinStatus = entry.isPinned ? 0 : 1;
      
      await db.entries.update(Number(entry.localId), {
        isPinned: newPinStatus,
        synced: 0,
        updatedAt: getTimestamp(),
        vKey: getTimestamp()
      });

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [ENTRY SLICE] togglePin failed:', error);
      return { success: false, error: error as Error };
    }
  }
});
