"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import Dexie from 'dexie';
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
  filteredBookMatrix: BookMatrixItem[]; // 🆕 Filtered matrix for current search/sort
  totalBookCount: number; // 🆕 Total count for pagination UI
  searchQuery: string;
  sortOption: string;
  isRefreshing: boolean;
  activeBook: any;
  bookId: string;
  lastScrollPosition: number; // 🆕 SCROLL MEMORY
  pendingDeletion: { bookId: string; timeoutId: any; expiresAt: number } | null; // 🆕 9-SECOND DELAYED DELETE
  lastSearchId: number; // 🆕 Race condition guard
}

// 📚 BOOK ACTIONS INTERFACE
export interface BookActions {
  refreshBooks: () => Promise<boolean>;
  fetchPageChunk: (page: number, isMobile: boolean, overrideMatrix?: BookMatrixItem[]) => Promise<void>; // 🆕 Chunk fetching for performance
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
  syncMatrixItem: (bookId: string) => Promise<void>; // 🆕 MATRIX SYNC FOR ACTIVITY SORT
}

// 📚 COMBINED BOOK STORE TYPE
export type BookStore = BookState & BookActions;

// 🛡️ BOOK SLICE CREATOR FUNCTION
export const createBookSlice = (set: any, get: any, api: any): BookState & BookActions => ({
  // 📊 INITIAL STATE
  books: [],
  filteredBooks: [],
  allBookIds: [], // 🆕 Lightweight matrix for performance
  filteredBookMatrix: [], // 🆕 Filtered matrix for current search/sort
  totalBookCount: 0, // 🆕 Total count for pagination UI
  searchQuery: '',
  sortOption: 'Activity', // 🛡️ ACTIVITY DEFAULT: Always sort by recent activity
  isRefreshing: false,
  activeBook: null,
  bookId: '',
  lastScrollPosition: 0,
  pendingDeletion: null, // 🆕 9-SECOND DELAYED DELETE
  lastSearchId: 0, // 🆕 Race condition guard

  // 🔄 REFRESH BOOKS WITH LIGHTWEIGHT MATRIX
  refreshBooks: async () => {
    // 🛡️ IDENTITY SYNC: Get userId directly from identityManager
    const userId = identityManager.getUserId();
    if (!userId) {
      return false;
    }
    
    // 🆕 INTELLIGENT LOADING GUARD: Only show loading if NO data exists
    const hasExistingData = get().books.length > 0;
    if (!hasExistingData) {
      set({ isRefreshing: true });
    }
    
    try {
      // 🆕 STEP A: Load lightweight matrix with TRIPLE COMPOUND INDEX
      const bookMatrix = await db.books
        .where('[userId+isDeleted+updatedAt]')
        .between([String(userId), 0, Dexie.minKey], [String(userId), 0, Dexie.maxKey])
        .reverse() // 🚀 Get newest records first at DB level
        .toArray((books: any[]) => books.map((book: any) => {
          const localId = book.localId || book._id || book.cid;
          if (!localId) return null; // 🛡️ GUARD: Filter out invalid IDs
          return {
            localId: book.localId || book._id || book.cid, // ✅ ENSURE localId IS CLEARLY RETURNED
            userId: book.userId, // Ensure userId is captured in lightweight matrix
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
        filteredBookMatrix: bookMatrix, // 🆕 Initialize filtered matrix with full matrix
        totalBookCount: bookMatrix.length // 🆕 Update total count for pagination UI
      });

      // 🆕 RE-APPLY EXISTING FILTER: Instead of resetting to full list
      get().applyFiltersAndSort();
      
      return true;
    } catch (error) {
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 🆕 CHUNK FETCHING FOR PERFORMANCE
  fetchPageChunk: async (page: number, isMobile: boolean, overrideMatrix?: BookMatrixItem[], currentId?: number) => {
    const state = get();
    const { filteredBookMatrix } = state;
    
    // 🆕 RACE CONDITION GUARD: Abort if newer search is running
    if (currentId && currentId !== get().lastSearchId) {
      console.log("🛡️ ABORT: Newer search detected, skipping chunk fetch");
      return;
    }
    
    // 🆕 DIRECT MATRIX ACCESS: Use overrideMatrix if provided (for search)
    const matrixToUse = overrideMatrix || filteredBookMatrix;
    
    // Device-specific slot allocation
    const REAL_BOOK_SLOTS = isMobile ? 16 : 15; // Mobile: 16 real, Desktop: 15 real + 1 dummy
    
    // Calculate slice bounds
    const startIndex = (page - 1) * REAL_BOOK_SLOTS;
    const endIndex = page * REAL_BOOK_SLOTS;
    
    // Get IDs for current page from MATRIX
    const currentPageIds = matrixToUse
      .slice(startIndex, endIndex)
      .map((book: BookMatrixItem) => book.localId);
    
    // 🆕 STEP B: Fetch FULL objects including image fields
    const fullBooks = await db.books
      .where('localId')
      .anyOf(currentPageIds)
      .toArray();
    
    // 🛡️ RACE CONDITION GUARD: Check again after async operation
    if (currentId && currentId !== get().lastSearchId) {
      console.log("🛡️ ABORT: Newer search detected after DB fetch");
      return;
    }
    
    // 🛡️ OPTIMISTIC RETENTION: Don't wipe UI if we already have data and the new fetch is mysteriously empty during a background process
    if (fullBooks.length === 0 && get().books.length > 0 && get().isRefreshing) {
       return;
    }
    
    // 🆕 RESTORE MATRIX ORDER: Re-sort to match currentPageIds order
    let sortedBooks = currentPageIds.map((id: string) => 
      fullBooks.find((book: any) => String(book.localId) === String(id))
    ).filter(Boolean);
    
    // 🆕 EMERGENCY FALLBACK: If sorting fails but we have data, use fullBooks
    if (sortedBooks.length === 0 && fullBooks.length > 0) {
      console.log("⚠️ SORTING FAILED - USING FALLBACK");
      sortedBooks = fullBooks;
    }
    
    // Update state with SORTED objects - ONLY STATE WRITER
    set({ 
      books: sortedBooks,
      filteredBooks: sortedBooks
    });
    
    console.log("Chunk Fetched. Displaying:", sortedBooks.length, "items for search:", get().searchQuery);
  },

  // 📚 SAVE BOOK
  saveBook: async (bookData: any, editTarget?: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false };
    
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = 'save-book';
    if (isGlobalAnimating) {
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
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
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    try {
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
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  // 🔍 SEARCH & SORT ACTIONS
  setSearchQuery: (query: string) => {
    console.log("STORE: searchQuery updated to:", query);
    set({ searchQuery: query });
    get().applyFiltersAndSort();
  },

  setSortOption: (option: string) => {
    set({ sortOption: option });
    get().applyFiltersAndSort();
  },

  applyFiltersAndSort: async () => {
    const { allBookIds, searchQuery, sortOption } = get();
    const userId = identityManager.getUserId();
    const q = (searchQuery || "").toLowerCase().trim();
    
    // 🆕 RACE CONDITION GUARD: Increment search ID to track current operation
    const currentId = ++get().lastSearchId;
    
    // 🆕 MATRIX DIRTY CHECK: Force refresh if matrix is stale after entry updates
    const needsMatrixRefresh = !allBookIds || allBookIds.length === 0;
    
    // 🆕 STEP A: Load lightweight matrix with TRIPLE COMPOUND INDEX
    let matrix = allBookIds;
    if (needsMatrixRefresh) {
      matrix = await db.books
        .where('[userId+isDeleted+updatedAt]')
        .between([String(userId), 0, Dexie.minKey], [String(userId), 0, Dexie.maxKey])
        .reverse() // 🚀 Get newest records first at DB level
        .toArray((books: any[]) => books.map((book: any) => {
          const localId = book.localId || book._id || book.cid;
          if (!localId) return null; // 🛡️ GUARD: Filter out invalid IDs
          return {
            localId: book.localId || book._id || book.cid, // ✅ ENSURE localId IS CLEARLY RETURNED
            userId: book.userId, // Ensure userId is captured in lightweight matrix
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
    }
    
    // 1. Filter Master Matrix by name (matrix is pre-sorted from DB)
    let filtered = q 
      ? matrix.filter((b: BookMatrixItem) => (b.name || "").toLowerCase().includes(q))
      : [...matrix];

    // 2. Sort by updatedAt (only needed if not Activity sort, since DB already pre-sorted)
    if (sortOption === 'Activity') {
      filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    }

    // 3. 🆕 UPDATE FILTERED MATRIX
    set({ filteredBookMatrix: filtered });

    // 🆕 EMPTY STATE HANDLING: If no results, ensure UI shows empty state
    if (filtered.length === 0) {
      set({ books: [], filteredBooks: [] });
      return; // 🚨 EARLY RETURN - Don't call fetchPageChunk
    }

    // 4. 🆕 TRIGGER CHUNK FETCH WITH DIRECT MATRIX PASS
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    await get().fetchPageChunk(1, isMobile, filtered, currentId);
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
      }
      
      // 🎯 STEP 6: TRIGGER BATCHED SYNC
      const { triggerManualSync } = get();
      if (triggerManualSync) {
        await triggerManualSync();
      }
      
      return { success: true, error: undefined };
      
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  // 🆕 SCROLL MEMORY
  setLastScrollPosition: (pos: number) => {
    set({ lastScrollPosition: pos });
  },

  // 🔄 MATRIX SYNC ACTION
  syncMatrixItem: async (bookId: string) => {
    const state = get();
    const { allBookIds } = state;
    
    // Find and update the specific book in matrix
    const updatedMatrix = allBookIds.map((item: BookMatrixItem) => {
      if (String(item.localId) === bookId) {
        return {
          ...item,
          updatedAt: getTimestamp() // Update timestamp to trigger re-sort
        };
      }
      return item;
    });
    
    // Update matrix with new timestamp
    set({ allBookIds: updatedMatrix });
    
    // Trigger re-sort to reflect the update
    get().applyFiltersAndSort();
    
    console.log('⚡ [RE-SYNC] Matrix and UI Aligned');
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
      return;
    }
    
    try {
      
      // Fetch entries quietly without setting loading states
      const orchestrator = (await import('../../core/SyncOrchestrator')) as any;
      await orchestrator.refreshEntries?.();
      
    } catch (error) {
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
      throw error;
    }
  },

  // 🧭 COMPLETE DELETION AND REDIRECT
  completeDeletionAndRedirect: (router: any) => {
    try {
      if (typeof window !== 'undefined') {
        if (router) {
          // Using Next.js router for soft navigation
          router.push('/?tab=books');
        } else {
          // 🚫 NO HARD RELOAD: Throw error instead of window.location
          throw new Error('Router instance required for soft navigation');
        }
      }
    } finally {
      // Ensure UI is unlocked even if navigation fails
      set({ isInteractionLocked: false });
    }
  }
});
