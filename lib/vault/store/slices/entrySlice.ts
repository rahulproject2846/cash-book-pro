"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { financeService } from '../../services/FinanceService';

// 📝 ENTRY STATE INTERFACE
export interface EntryState {
  entries: any[];
  allEntries: any[];
  // 🎯 UNIFIED ENTRY FILTERING STATE
  entrySortConfig: { key: string; direction: 'asc' | 'desc' };
  entryCategoryFilter: string;
  entrySearchQuery: string;
  processedEntries: any[];
  isMobileFilterOpen: boolean;
  entryPagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
  isRefreshing: boolean;
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
  setMobileFilterOpen: (open: boolean) => void;
  processEntries: () => void;
  setEntryPage: (page: number) => void;
  applyEntryFilters: () => Promise<void>;
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
  isMobileFilterOpen: false,
  entryPagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0
  },
  isRefreshing: false,

  // 📝 REFRESH ENTRIES
  refreshEntries: async () => {
    return await financeService.refreshEntries(get, set);
  },

  // 📝 SAVE ENTRY - ZOMBIE LOCK PREVENTION
  saveEntry: async (entryData: any, editTarget?: any, customActionId?: string) => {
    return await financeService.saveEntry(get, set, entryData, editTarget, customActionId);
  },

  // 🗑️ DELETE ENTRY - ZOMBIE LOCK PREVENTION
  deleteEntry: async (entry: any, customActionId?: string) => {
    return await financeService.deleteEntry(get, set, entry, customActionId);
  },

  // 🔄 RESTORE ENTRY
  restoreEntry: async (entry: any) => await financeService.restoreEntry(get, set, entry),

  //  TOGGLE ENTRY STATUS
  toggleEntryStatus: async (entry: any) => await financeService.toggleEntryStatus(get, set, entry),

  // 📌 TOGGLE PIN
  togglePin: async (entry: any) => await financeService.togglePin(get, set, entry),

  // 🔄 UPDATE ENTRY
  updateEntry: async (id: string, entryPayload: any) => {
    return await financeService.updateEntry(get, set, id, entryPayload);
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

  setMobileFilterOpen: (open: boolean) => {
    set({ isMobileFilterOpen: open });
  },

  processEntries: () => {
    const { entries, entrySortConfig, entryCategoryFilter, entrySearchQuery, allEntries, activeBook, entryPagination } = get();
    
    // 🆕 TRIPLE-LINK PROTOCOL: Start with all entries and filter by active book
    let processed = [];
    if (activeBook) {
      processed = allEntries.filter((entry: any) => {
        const eBookId = String(entry.bookId || "");
        const bId = String(activeBook?._id || "");
        const bLocalId = String(activeBook?.localId || "");
        const bCid = String(activeBook?.cid || "");

        // 🛡️ TRIPLE-LINK LAW: Match ANY of 3 IDs
        const isMatch = (eBookId === bId || eBookId === bLocalId || eBookId === bCid);
        const isNotDeleted = (entry.isDeleted === 0 || entry.isDeleted === undefined || entry.isDeleted === null);

        return isMatch && isNotDeleted;
      });
    } else {
      processed = []; // No active book = no entries
    }
    
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
    
    // Calculate pagination
    const totalItems = processed.length;
    const totalPages = Math.ceil(totalItems / entryPagination.itemsPerPage);
    
    set({ 
      processedEntries: processed,
      entryPagination: {
        ...entryPagination,
        totalItems,
        totalPages
      }
    });
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
  },

  applyEntryFilters: async () => {
    get().processEntries();
  }
});
