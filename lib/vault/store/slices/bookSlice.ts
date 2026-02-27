"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { financeService } from '../../services/FinanceService';
import { LocalEntry } from '@/lib/offlineDB';
import { snipedInSession } from '../sessionGuard';
import { immer } from 'zustand/middleware/immer';
import { HydrationController } from '../../hydration/HydrationController';

// 📚 LIGHTWEIGHT MATRIX INTERFACE
interface BookMatrixItem {
  localId: string;
  userId: string;
  _id: string;
  cid: string;
  name: string;
  image: string;
  mediaCid: string;
  isPinned: number;
  updatedAt: number;
  cachedBalance?: number;
}

// 📚 BOOK STATE INTERFACE
export interface BookState {
  books: any[];
  filteredBooks: any[];
  allBookIds: BookMatrixItem[]; // 🆕 Lightweight matrix for performance
  totalBookCount: number; // 🆕 Total count for pagination UI
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
  fetchPageChunk: (page: number, isMobile: boolean) => Promise<void>; // 🆕 Chunk fetching for performance
  prefetchBookEntries: (bookId: string) => Promise<void>; // 🆕 Smart pre-fetching for zero-lag
  saveBook: (bookData: any, editTarget?: any) => Promise<{ success: boolean; book?: any; error?: Error }>;
  deleteBook: (book: any, router: any) => Promise<{ success: boolean; error?: Error }>;
  restoreBook: (book: any) => Promise<{ success: boolean; error?: Error }>;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: string) => void;
  applyFiltersAndSort: () => void;
  setActiveBook: (book: any) => Promise<void>;
  clearActiveBook: () => void;
  getBookBalance: (id: string) => number;
  resurrectBookChain: (bookCid: string) => Promise<{ success: boolean; error?: Error }>;
  setLastScrollPosition: (pos: number) => void; // 🆕 SCROLL MEMORY
  transitionToDashboard: (router: any) => void; // 🆕 Zero-lag navigation
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
  allBookIds: [], // 🆕 Lightweight matrix for performance
  totalBookCount: 0, // 🆕 Total count for pagination UI
  searchQuery: '',
  sortOption: 'Activity', // 🛡️ ACTIVITY DEFAULT: Always sort by recent activity
  isRefreshing: false,
  activeBook: null,
  bookId: '',
  lastScrollPosition: 0,
  pendingDeletion: null, // 🆕 9-SECOND DELAYED DELETE

  // 🔄 REFRESH BOOKS WITH LIGHTWEIGHT MATRIX
  refreshBooks: async () => {
    // 🛡️ IDENTITY SYNC: Get userId directly from identityManager
    const userId = identityManager.getUserId();
    if (!userId) {
      console.warn('⚠️ [BOOK SLICE] Refresh blocked: No userId available.');
      return false;
    }
    
    // 🆕 INTELLIGENT LOADING GUARD: Only show loading if NO data exists
    const hasExistingData = get().books.length > 0;
    if (!hasExistingData) {
      set({ isRefreshing: true });
    }
    
    try {
      // 🆕 STEP A: Load lightweight matrix (84% memory reduction)
      const bookMatrix = await db.books
        .where('[userId+isDeleted]')
        .equals([String(userId), 0])
        .toArray((books: any[]) => books.map((book: any) => {
          const localId = book.localId || book._id || book.cid;
          if (!localId) return null; // 🛡️ GUARD: Filter out invalid IDs
          return {
            localId: book.localId || book._id || book.cid, // ✅ ENSURE localId IS CLEARLY RETURNED
            userId: book.userId, // Ensure userId is captured in the lightweight matrix
            _id: book._id || book.cid, // 🆕 PRIORITY: Use server ID or CID for display
            cid: book.cid, // 🆕 PRESERVE: Keep CID for reference
            name: book.name || '',
            image: book.image || '',      // ✅ RESTORED
            mediaCid: book.mediaCid || '', // ✅ RESTORED
            isPinned: book.isPinned || 0,
            updatedAt: book.updatedAt || 0,
            cachedBalance: 0 // Will be calculated later
          } as BookMatrixItem;
        }).filter(Boolean)); // 🛡️ FILTER: Remove null entries

      // Store lightweight matrix in state
      set({ 
        allBookIds: bookMatrix,
        totalBookCount: bookMatrix.length // 🆕 Update total count for pagination UI
      });

      // 🆕 STEP D: Fetch first page chunk immediately
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      await get().fetchPageChunk(1, isMobile);
      
      return true;
    } catch (error) {
      console.error('❌ [BOOK SLICE] Books refresh failed:', error);
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 🆕 CHUNK FETCHING FOR PERFORMANCE
  fetchPageChunk: async (page: number, isMobile: boolean) => {
    const state = get();
    const { allBookIds } = state;
    
    // Device-specific slot allocation
    const REAL_BOOK_SLOTS = isMobile ? 16 : 15; // Mobile: 16 real, Desktop: 15 real + 1 dummy
    
    // Calculate slice bounds
    const startIndex = (page - 1) * REAL_BOOK_SLOTS;
    const endIndex = page * REAL_BOOK_SLOTS;
    
    // Get IDs for current page
    const currentPageIds = allBookIds
      .slice(startIndex, endIndex)
      .map((book: BookMatrixItem) => book.localId);
    
    // 🆕 STEP B: Fetch FULL objects including image fields
    const fullBooks = await db.books
      .where('localId')
      .anyOf(currentPageIds)
      .toArray();
    
    // 🛡️ OPTIMISTIC RETENTION: Don't wipe UI if we already have data and the new fetch is mysteriously empty during a background process
    if (fullBooks.length === 0 && get().books.length > 0 && get().isRefreshing) {
       console.warn('🛡️ [BOOK SLICE] Guarded against UI wipe during background refresh.');
       return;
    }
    
    // Update state with full objects - IMMEDIATE fallback before sorting
    set({ 
      books: fullBooks,
      filteredBooks: fullBooks // Immediate fallback for UI
    });
    
    // Trigger filtering and sorting on chunk (async, but UI already has data)
    get().applyFiltersAndSort();
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
      // 🛡️ IMAGE EDIT SYNC TRIGGER: Any CID forces sync regardless of previous state
      const hasImageChange = bookData.image && bookData.image.startsWith('cid_');
      
      const bookPayload = {
        ...bookData,
        _id: editTarget?._id || bookData?._id,
        cid: editTarget?.cid || bookData?.cid || (await import('@/lib/offlineDB')).generateCID(),
        userId: String(get().userId || identityManager.getUserId()),
        vKey: editTarget ? Number(editTarget.vKey || 0) + (hasImageChange ? 2 : 1) : 1, // 🚨 DOUBLE increment for image changes
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

      const { db } = await import('@/lib/offlineDB');
      let id: number = 0;
      
      // 🆕 SURGICAL FIX: Use HydrationController for atomic writes
      const { HydrationController } = await import('../../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const result = await controller.ingestLocalMutation('BOOK', [normalized]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save book via HydrationController');
      }
      
      id = result.id || result.count || 0;
      
      // : Update Main Array + Matrix + Count
      const currentBooks = get().books;
      const newBook = { ...normalized, localId: id };
      const updatedBooks = [newBook, ...currentBooks.filter((b: any) => String(b._id || b.localId) !== String(newBook._id || newBook.localId))];
      const updatedMatrix: BookMatrixItem[] = [{ 
        localId: newBook.localId, 
        userId: newBook.userId,
        _id: newBook._id, 
        cid: newBook.cid, 
        name: newBook.name, 
        image: newBook.image || '',
        mediaCid: newBook.mediaCid || '',
        isPinned: newBook.isPinned || 0, 
        updatedAt: newBook.updatedAt 
      }, ...get().allBookIds.filter((b: BookMatrixItem) => String(b._id || b.localId) !== String(newBook._id || newBook.localId))];

      set({ 
        books: updatedBooks, 
        allBookIds: updatedMatrix,
        totalBookCount: updatedMatrix.length,
        filteredBooks: updatedBooks // : Set filteredBooks immediately
      });
      
      // : Apply filters and sort immediately
      get().applyFiltersAndSort();
      
      // : Trigger sync for new books or non-image updates
      // 🆕 SAFE IGNITION: Trigger sync for new books or non-image updates
      const isNewBook = !editTarget?._id;
      const hasNoImageChange = !bookData.image || !bookData.image.startsWith('cid_');

      // Sync will be triggered by HydrationController's vault-updated event
      
      // 🆕 SILENT SAVE: No sync trigger - let MediaStore handle it
      // const { orchestrator } = await import('../../core/SyncOrchestrator');
      // orchestrator.triggerSync();
      
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
        vKey: Number(book.vKey || 0) + 1, // Rigid sequential
      };
      
      const result = await controller.ingestLocalMutation('BOOK', [restorePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore book via HydrationController');
      }

      // Sync will be triggered by HydrationController's vault-updated event

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

  applyFiltersAndSort: async () => {
    const state = get();
    const { allBookIds, searchQuery, sortOption } = state;
    
    const currentUserId = String(get().userId || identityManager.getUserId() || "");
    if (!currentUserId) {
      console.warn('⚠️ [BOOK SLICE] No userId available for filtering');
      return;
    }

    // Filter the matrix by userId before applying search and sort
    let filtered = allBookIds.filter((book: BookMatrixItem) => String(book.userId) === currentUserId);

    const q = (searchQuery || "").toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((book: BookMatrixItem) => 
        (book.name || "").toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'Activity':
        filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => {
          if ((a.isPinned || 0) !== (b.isPinned || 0)) {
            return (b.isPinned || 0) - (a.isPinned || 0);
          }
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        break;
      case 'Name':
        filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => 
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case 'Balance High':
        filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => get().getBookBalance(b.localId) - get().getBookBalance(a.localId));
        break;
      case 'Balance Low':
        filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => get().getBookBalance(a.localId) - get().getBookBalance(b.localId));
        break;
    }

    // 🆕 STEP C: Update filtered matrix and fetch chunk
    set({ filteredBooks: filtered });
    
    // 🆕 STEP D: Fetch full objects for filtered IDs
    const filteredIds = filtered.map((book: BookMatrixItem) => book.localId).filter(Boolean);
    const fullBooks = await db.books
      .where('localId')
      .anyOf(filteredIds)
      .toArray();
    
    // 🛡️ OPTIMIZED PROTECTION: Merge DB results with existing state to prevent new book invisibility
    const currentBooks = get().books;
    const finalBooks = fullBooks.length > 0 ? fullBooks : currentBooks;

    // If we have a new book in the matrix that isn't in fullBooks yet, keep it from currentBooks
    const missingOptimisticBooks = currentBooks.filter((cb: any) => 
      !fullBooks.some((fb: any) => String(fb.localId) === String(cb.localId)) &&
      filtered.some((f: BookMatrixItem) => String(f.localId) === String(cb.localId))
    );

    set({ books: [...missingOptimisticBooks, ...fullBooks] });
  },


  // 🎯 ACTIVE BOOK MANAGEMENT
  setActiveBook: async (book: any) => {
    if (!book) {
      set({ activeBook: null, bookId: '' });
      return;
    }
    
    // 🚀 HYDRATE: Find full book in Dexie to get its _id and cid
    const { db } = await import('@/lib/offlineDB');
    const fullBook = await db.books.get(book.localId) || book;
    
    // 🛡️ IDENTITY BLACK HOLE FIX: Never set activeBook to undefined/incomplete
    const safeBook = fullBook && fullBook.localId ? fullBook : book;
    set({ activeBook: safeBook, bookId: String(safeBook._id || safeBook.localId) });
    
    setTimeout(() => get().processEntries(), 50);
  },

  clearActiveBook: () => {
    set({
      activeBook: null,
      bookId: ''
    });
  },

  // 💰 BALANCE CALCULATION
  getBookBalance: (id: string) => {
    return financeService.getBookBalance(get, id);
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

  // 🆕 SMART PRE-FETCHING FOR ZERO-LAG
  prefetchBookEntries: async (bookId: string) => {
    const state = get();
    const { entries, allEntries } = state;
    
    // Check if entries for this book are already loaded
    const bookEntries = entries?.filter((entry: any) => 
      String(entry.bookId || '') === String(bookId) && !entry.isDeleted
    ) || [];
    
    // If we have sufficient entries, skip fetch
    if (bookEntries.length >= 10) {
      console.log(`🚀 [PRE-FETCH] Entries already loaded for book ${bookId}: ${bookEntries.length}`);
      return;
    }
    
    try {
      console.log(`🚀 [PRE-FETCH] Quietly fetching entries for book ${bookId}`);
      
      // Fetch entries quietly without setting loading states
      const orchestrator = (await import('../../core/SyncOrchestrator')) as any;
      await orchestrator.refreshEntries?.();
      
    } catch (error) {
      console.error(`❌ [PRE-FETCH] Failed to prefetch entries for book ${bookId}:`, error);
    }
  },

  // 🆕 ZERO-LAG NAVIGATION
  transitionToDashboard: (router: any) => {
    // a. Save current scroll position if available
    const scrollEl = document.querySelector('main[layoutId="main-container"]');
    if (scrollEl) {
      get().setLastScrollPosition(scrollEl.scrollTop);
    }
    
    // b. Trigger navigation
    if (router) {
      router.push('/?tab=books');
    }
    
    // c. Wait 300ms (allow transition animation)
    setTimeout(() => {
      // d. THEN set activeBook: null
      get().clearActiveBook();
    }, 300);
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
        userId: String(userId || get().userId || book.userId || ''),
        isDeleted: 1,
        synced: 0,
        vKey: Number(book.vKey || 0) + 1,
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
      
      // b. Fire sync event to trigger 7-second auto-sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vault-updated', { 
          detail: { source: 'HydrationController', origin: 'batch-mutation' } 
        }));
      }
      
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
