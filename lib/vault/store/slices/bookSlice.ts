"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { LocalEntry } from '@/lib/offlineDB';
import { snipedInSession } from '../sessionGuard';
import { immer } from 'zustand/middleware/immer';

// 📚 BOOK STATE INTERFACE
export interface BookState {
  books: any[];
  filteredBooks: any[];
  searchQuery: string;
  sortOption: string;
  isRefreshing: boolean;
  activeBook: any;
  bookId: string;
  lastScrollPosition: number; // 🆕 SCROLL MEMORY
  pendingDeletion: { bookId: string; timeoutId: any; expiresAt: number } | null; // 🆕 9-SECOND DELAYED DELETE
}

// 📚 BOOK ACTIONS INTERFACE
export interface BookActions {
  refreshBooks: () => Promise<boolean>;
  saveBook: (bookData: any, editTarget?: any) => Promise<{ success: boolean; book?: any; error?: Error }>;
  deleteBook: (book: any, router: any) => Promise<{ success: boolean; error?: Error }>;
  restoreBook: (book: any) => Promise<{ success: boolean; error?: Error }>;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: string) => void;
  applyFiltersAndSort: () => void;
  setActiveBook: (book: any) => void;
  clearActiveBook: () => void;
  getBookBalance: (id: string) => number;
  resurrectBookChain: (bookCid: string) => Promise<{ success: boolean; error?: Error }>;
  setLastScrollPosition: (pos: number) => void; // 🆕 SCROLL MEMORY
  cancelDeletion: () => void; // 🆕 CANCEL PENDING DELETION
  completeDeletionAndRedirect: (router: any) => void; // 🆕 COMPLETE DELETION AND REDIRECT
  executeFinalDeletion: (book: any, userId: string) => Promise<void>; // 🆕 EXECUTE FINAL DELETION
}

// 📚 COMBINED BOOK STORE TYPE
export type BookStore = BookState & BookActions;

// 🛡️ BOOK SLICE CREATOR FUNCTION
export const createBookSlice = (set: any, get: any, api: any): BookState & BookActions => ({
  // 📊 INITIAL STATE
  books: [],
  filteredBooks: [],
  searchQuery: '',
  sortOption: 'Activity',
  isRefreshing: false,
  activeBook: null,
  bookId: '',
  lastScrollPosition: 0,
  pendingDeletion: null, // 🆕 9-SECOND DELAYED DELETE

  // 🔄 REFRESH BOOKS WITH SNIPER LOGIC
  refreshBooks: async () => {
    const userId = identityManager.getUserId();
    if (!userId) return true;
    set({ isRefreshing: true });
    
    try {
      const books = await db.books
        .where('[userId+isDeleted+updatedAt]')
        .between([String(userId), 0, 0], [String(userId), 0, Date.now()])
        .reverse()
        .toArray();

      // 🆕 MODULE 1: LEGACY DATA REPAIR - Silent Repair for books with mediaCid but missing _id
      const legacyBooks = books.filter((book: any) => 
        book.mediaCid && !book._id && book.synced === 1
      );
      
      if (legacyBooks.length > 0) {
        console.log(`🔧 [LEGACY REPAIR] Found ${legacyBooks.length} legacy books needing _id repair`);
        
        // Attempt to repair by re-syncing to get server _id
        for (const legacyBook of legacyBooks) {
          try {
            // Force re-sync to get server _id using HydrationController
            const { HydrationController } = await import('../../hydration/HydrationController');
            const controller = HydrationController.getInstance();
            
            const repairPayload = {
              ...legacyBook,
              synced: 0,
              updatedAt: getTimestamp()
            };
            
            await controller.ingestLocalMutation('BOOK', [repairPayload]);
          } catch (repairErr) {
            console.error(`❌ [LEGACY REPAIR] Failed to repair book ${legacyBook.cid}:`, repairErr);
          }
        }
        
        // 🚨 DISABLED: Do NOT trigger sync during refresh to prevent infinite loop
        // Legacy repair should be handled by separate background service
        // const { orchestrator } = await import('../../core/SyncOrchestrator');
        // orchestrator.triggerSync();
      }

      // Only set state if data actually changed significantly
      const currentBooks = get().books;

      // 🧊 COLD START: Empty store -> hydrate directly from Dexie
      if (currentBooks.length === 0) {
        set({ books });
        get().applyFiltersAndSort();
        return true;
      }

      if (JSON.stringify(currentBooks) === JSON.stringify(books)) {
        return true; // Stop if data is identical
      }

      // 🆕 PARTIAL UPDATE: Use Immer to update only changed books
      const booksMap = new Map(currentBooks.map((book: any) => [book._id || book.localId, book]));
      const newBooksMap = new Map(books.map((book: any) => [book._id || book.localId, book]));
      
      const updatedBooks = currentBooks.map((existingBook: { _id?: string; localId?: string; vKey?: number }) => {
        const bookId = existingBook._id || existingBook.localId;
        const newBook = newBooksMap.get(bookId);
        
        // 🛡️ VERSION AWARE: Don't overwrite higher vKey
        if (newBook && (newBook as any).vKey > (existingBook as any).vKey) {
          return existingBook; // Keep existing version
        }
        
        return newBook || existingBook; // Use new book if available
      });

      // 🆕 INCLUDE NEW BOOKS: Anything fetched that's not already in the store
      for (const [id, newBook] of newBooksMap.entries()) {
        if (!booksMap.has(id)) {
          // 🛡️ CID DEDUPLICATION: Check if book with same cid already exists
          const existingCid = (newBook as any).cid;
          const cidExists = updatedBooks.some((book: any) => book.cid === existingCid);
          
          if (!cidExists) {
            updatedBooks.push(newBook);
          } else {
            // 🔄 UPDATE EXISTING: Replace existing book with same cid
            const existingIndex = updatedBooks.findIndex((book: any) => book.cid === existingCid);
            if (existingIndex !== -1) {
              updatedBooks[existingIndex] = newBook;
            }
          }
        }
      }

      // 🆕 SMART UPDATE: Only set if data actually changed
      if (JSON.stringify(updatedBooks) !== JSON.stringify(currentBooks)) {
        set({ books: updatedBooks });
        get().applyFiltersAndSort();
      }
      
      return true;
    } catch (error) {
      console.error('❌ [BOOK SLICE] Books refresh failed:', error);
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 📚 SAVE BOOK
  saveBook: async (bookData: any, editTarget?: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false };
    
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [BOOK SLICE] Blocked book save during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = 'save-book';
    if (isGlobalAnimating) {
      console.warn('🚫 [BOOK SLICE] Blocked book save during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [BOOK SLICE] Blocked duplicate book save action');
      return { success: false, error: new Error('Book save already in progress') };
    }
    
    // Register action for protection
    registerAction(actionId);
    
    try {
      const bookPayload = {
        ...bookData,
        _id: editTarget?._id || bookData?._id,
        cid: editTarget?.cid || bookData?.cid || (await import('@/lib/offlineDB')).generateCID(),
        userId: String(userId),
        vKey: (editTarget?.vKey || 0) + 1,
        synced: 0,
        syncAttempts: 0, // ✅ Ensure initialization
        updatedAt: getTimestamp()
      };

      if (!editTarget?.createdAt) bookPayload.createdAt = getTimestamp();

      const { normalizeRecord } = await import('../../core/VaultUtils');
      const normalized = normalizeRecord(bookPayload, String(userId));
      if (!normalized) {
        throw new Error('Failed to normalize book data');
      }

      // 🔵 [FORENSIC AUDIT] Log what we're saving to Dexie
      console.log(`🔵 [SAVE BOOK] Saving book to Dexie with image:`, normalized.image || 'EMPTY');

      const { db } = await import('@/lib/offlineDB');
      let id: number = 0;
      
      // 🆕 SURGICAL FIX: Use HydrationController for atomic writes
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const result = await controller.ingestLocalMutation('BOOK', [normalized]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save book via HydrationController');
      }
      
      id = result.count || 0;
      
      // 🆕 OPTIMISTIC UPDATE: Add to Zustand immediately
      const currentBooks = get().books;
      const newBook = { ...normalized, localId: id };
      const updatedBooks = [newBook, ...currentBooks.filter((b: any) => (b._id || b.localId) !== (newBook._id || newBook.localId))];
      set({ books: updatedBooks });
      
      // 🆕 OPTIMISTIC RE-SORT: Apply filters and sort immediately
      get().applyFiltersAndSort();
      
      // 🆕 SAFE IGNITION: Trigger sync for new books or non-image updates
      const isNewBook = !editTarget?._id;
      const hasNoImageChange = !bookData.image || !bookData.image.startsWith('cid_');

      if (isNewBook || hasNoImageChange) {
        const { orchestrator } = await import('../../core/SyncOrchestrator');
        orchestrator.triggerSync();
        console.log(`🚀 [SYNC TRIGGER] Manual sync ignited for ${isNewBook ? 'NEW' : 'TEXT-ONLY'} book`);
      }
      
      // 🆕 SILENT SAVE: No sync trigger - let MediaStore handle it
      // const { orchestrator } = await import('../../core/SyncOrchestrator');
      // orchestrator.triggerSync();
      
      // 🆕 DEFERRED REFRESH: Wait for transaction to settle
      setTimeout(async () => {
        await get().refreshBooks();
      }, 100);
      
      return { success: true, book: { ...normalized, localId: id } };
    } catch (error) {
      console.error('❌ [BOOK SLICE] saveBook failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: Always unregister action
      unregisterAction(actionId);
    }
  },

  // 🗑️ DELETE BOOK
  deleteBook: async (book: any, router: any) => {
    const userId = identityManager.getUserId();
    if (!userId || !book?.localId) return { success: false };
    
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown || isGlobalAnimating || activeActions.includes('delete-book')) return { success: false };
    
    registerAction('delete-book');

    try {
      const bookId = String(book._id || book.localId);
      const expiresAt = Date.now() + 7000; // 7 seconds total
      
      // 1. Lock UI
      set({ isInteractionLocked: true });
      
      // 2. Trigger Apple Toast and Capture ID
      const activeToastId = get().showToast({
        type: 'undo',
        message: `Deleting "${book.name || 'Ledger'}" in 6 seconds...`,
        countdown: 6,
        onUndo: () => {
          const { pendingDeletion } = get();
          if (pendingDeletion?.timeoutId) clearTimeout(pendingDeletion.timeoutId);
          set({ pendingDeletion: null, isInteractionLocked: false });
          get().hideToast(activeToastId);
        }
      });
      
      // 3. Set 7s Delayed Commit
      const timeoutId = setTimeout(async () => {
        try {
          // FIRST: Execute final deletion
          await get().executeFinalDeletion(book, userId);
          // SECOND: Hide toast and navigate
          get().hideToast(activeToastId);
          get().completeDeletionAndRedirect(router);
        } catch (err) {
          console.error('Final Deletion Failed:', err);
          // THIRD: Unlock UI on error
          set({ isInteractionLocked: false });
        }
      }, 7000);
      
      set({ pendingDeletion: { bookId, timeoutId, expiresAt } });
      return { success: true };
      
    } catch (error) {
      set({ isInteractionLocked: false });
      return { success: false, error: error as Error };
    } finally {
      unregisterAction('delete-book');
    }
  },

  // 🔄 RESTORE BOOK
  restoreBook: async (book: any) => {
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [BOOK SLICE] Blocked book restore during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    try {
      console.log('🔄 [BOOK SLICE] Restoring book:', book.localId);
      
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const restorePayload = {
        ...book,
        isDeleted: 0,
        synced: 0,
        updatedAt: getTimestamp(),
        vKey: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('BOOK', [restorePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore book via HydrationController');
      }

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshBooks();
      
      console.log('✅ [BOOK SLICE] Book restored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [BOOK SLICE] Failed to restore book:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔍 SEARCH & SORT ACTIONS
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFiltersAndSort();
  },

  setSortOption: (option: string) => {
    set({ sortOption: option });
    get().applyFiltersAndSort();
  },

  applyFiltersAndSort: () => {
    const state = get();
    const { books, searchQuery, sortOption } = state;
    
    let filtered = [...books];

    const q = (searchQuery || "").toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((book: any) => 
        (book.name || "").toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'Activity':
        filtered.sort((a: any, b: any) => {
          if ((a.isPinned || 0) !== (b.isPinned || 0)) {
            return (b.isPinned || 0) - (a.isPinned || 0);
          }
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        break;
      case 'Name':
        filtered.sort((a: any, b: any) => 
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case 'Balance High':
        filtered.sort((a: any, b: any) => get().getBookBalance(b._id || b.localId) - get().getBookBalance(a._id || a.localId));
        break;
      case 'Balance Low':
        filtered.sort((a: any, b: any) => get().getBookBalance(a._id || a.localId) - get().getBookBalance(b._id || b.localId));
        break;
    }

    set({ filteredBooks: filtered });
  },


  // 🎯 ACTIVE BOOK MANAGEMENT
  setActiveBook: (book: any) => {
    const bookId = String(book?._id || book?.localId || '');
    
    console.log('🎯 [BOOK SLICE] Active book set:', { 
      bookId, 
      bookName: book?.name
    });

    set({
      activeBook: book,
      bookId
    });
  },

  clearActiveBook: () => {
    set({
      activeBook: null,
      bookId: ''
    });
  },

  // 💰 BALANCE CALCULATION
  getBookBalance: (id: string) => {
    const state = get();
    const entries = state.allEntries?.filter((entry: any) => 
      String(entry.bookId || '') === String(id) && !entry.isDeleted
    ) || [];
    
    const income = entries
      .filter((e: any) => e.type === 'income')
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expense = entries
      .filter((e: any) => e.type === 'expense')
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    
    return income - expense;
  },

  // 🛡️ RESURRECT BOOK CHAIN: Handle parent_deleted conflict resolution
  resurrectBookChain: async (bookCid: string) => {
    try {
      console.log(`🛡️ [BOOK SLICE] Starting resurrection for book: ${bookCid}`);
      
      // 🎯 STEP 1: FIND THE BOOK
      const book = await db.books.where('cid').equals(bookCid).first();
      if (!book) {
        throw new Error(`Book not found: ${bookCid}`);
      }
      
      // 🎯 STEP 2: CLEAR SERVER IDENTITY
      const resurrectedBook = {
        ...book,
        _id: undefined, // Remove server ID
        vKey: (book.vKey || 0) + 100, // 🛡️ VKEY UPGRADE: +100 ensures override of any server drift
        synced: 0, // Mark as unsynced
        conflicted: 0, // Clear conflict
        conflictReason: '', // Clear conflict reason
        serverData: null, // Clear server data
        updatedAt: getTimestamp()
      };
      
      // 🎯 STEP 3: UPDATE BOOK AND ENTRIES IN SINGLE TRANSACTION
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      // Update the book first
      const bookResult = await controller.ingestLocalMutation('BOOK', [resurrectedBook]);
      if (!bookResult.success) {
        throw new Error(bookResult.error || 'Failed to resurrect book via HydrationController');
      }
      
      // 🎯 STEP 4: FIND ALL ENTRIES
      const allEntries = await db.entries
        .where('bookId').equals(bookCid)
        .and((entry: any) => entry.isDeleted === 0)
        .toArray();
      
      // 🎯 STEP 5: RESET ALL ENTRIES ATOMICALLY
      if (allEntries.length > 0) {
        const entryUpdates = allEntries.map((entry: LocalEntry) => ({
          ...entry,
          synced: 0, // Mark as unsynced
          vKey: (entry.vKey || 0) + 100, // 🛡️ VKEY UPGRADE: +100 for entries too
          updatedAt: getTimestamp()
        }));
        
        const entryResult = await controller.ingestLocalMutation('ENTRY', entryUpdates);
        if (!entryResult.success) {
          throw new Error(entryResult.error || 'Failed to resurrect entries via HydrationController');
        }
        console.log(`🛡️ [BOOK SLICE] Reset ${entryUpdates.length} entries for resurrection`);
      }
      
      // 🎯 STEP 6: TRIGGER BATCHED SYNC
      const { triggerManualSync } = get();
      if (triggerManualSync) {
        await triggerManualSync();
      }
      
      console.log(`✅ [BOOK SLICE] Resurrection complete for book: ${bookCid}`);
      return { success: true, error: undefined };
      
    } catch (error) {
      console.error(`❌ [BOOK SLICE] Resurrection failed for book ${bookCid}:`, error);
      return { success: false, error: error as Error };
    }
  },

  setLastScrollPosition: (pos: number) => {
    set({ lastScrollPosition: pos });
  },

  // 🆕 CANCEL PENDING DELETION
  cancelDeletion: () => {
    const { pendingDeletion } = get();
    if (pendingDeletion?.timeoutId) {
      clearTimeout(pendingDeletion.timeoutId);
    }
    set({ pendingDeletion: null });
  },

  // 🗑️ EXECUTE FINAL DELETION
  executeFinalDeletion: async (book: any, userId: string): Promise<void> => {
    const bookId = String(book._id || book.localId);
    
    try {
      console.log(`🗑️ [BOOK SLICE] Executing final deletion for book: ${bookId}`);
      
      // Create delete payload with mandatory name field
      const deletePayload = {
        _id: book._id,
        localId: book.localId,
        cid: book.cid,
        name: book.name || 'Deleted Ledger', // ✅ MANDATORY for Validator
        userId: book.userId,
        isDeleted: 1,
        synced: 0,
        vKey: getTimestamp(),
        updatedAt: getTimestamp()
      };
      
      // a. Execute Dexie Transaction (Book + Entries marked isDeleted: 1)
      await db.transaction('rw', db.books, db.entries, db.users, async () => {
        // Mark book as deleted
        await db.books.put(deletePayload);
        
        // Cascade delete all entries for this book
        await db.entries
          .where('bookId')
          .equals(bookId)
          .modify({ isDeleted: 1, synced: 0, updatedAt: getTimestamp() });
        
        console.log(`✅ [BOOK SLICE] Book ${bookId} and entries marked as deleted`);
      });
      
      // b. Trigger orchestrator.triggerSync() (Fire-and-forget sync)
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      // c. Call get().refreshBooks() to update the local list
      get().refreshBooks();
      
      // d. Set get().setActiveBook(null) to clear the current view state
      get().clearActiveBook();
      
    } catch (error) {
      console.error(`❌ [BOOK SLICE] Final deletion failed for book ${bookId}:`, error);
      throw error;
    }
  },

  // 🧭 COMPLETE DELETION AND REDIRECT
  completeDeletionAndRedirect: (router: any) => {
    try {
      console.log('✅ Database committed. Navigating now.');
      if (typeof window !== 'undefined') {
        if (router) {
          // Using Next.js router for soft navigation
          router.push('/?tab=books');
        } else {
          // 🚫 NO HARD RELOAD: Throw error instead of window.location
          console.error('[NAVIGATION] Router instance missing, cannot perform soft redirect');
          throw new Error('Router instance required for soft navigation');
        }
      }
    } finally {
      // Ensure UI is unlocked even if navigation fails
      set({ isInteractionLocked: false });
    }
  }
});
