"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import Dexie from 'dexie';
import { LocalEntry } from '@/lib/offlineDB';
import { HydrationController } from '../hydration/HydrationController';
import { financeService } from './FinanceService';

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

/**
 * 📚 BOOK SERVICE (V1.0) - Extracted Matrix Logic
 * 
 * Atomic extraction of matrix operations from bookSlice.ts
 * Maintains store connectivity through get/set parameters
 * 
 * Architecture: Service Layer → HydrationController → Dexie
 */

export class BookService {
  private static instance: BookService | null = null;

  private constructor() {}

  /**
   * 🎯 GET INSTANCE - Singleton pattern
   */
  public static getInstance(): BookService {
    if (!BookService.instance) {
      BookService.instance = new BookService();
    }
    return BookService.instance;
  }

  /**
   * 🔄 REFRESH BOOKS WITH LIGHTWEIGHT MATRIX
   */
  async refreshBooks(get: any, set: any, source?: string): Promise<boolean> {
    // 🛡️ IDENTITY SYNC: Get userId directly from identityManager
    const userId = identityManager.getUserId();
    if (!userId) {
      // 🆕 SELF-HEALING RETRY: Wait for identity to load instead of giving up
      console.log("🔐 [IDENTITY RETRY] No userId found, retrying in 500ms...");
      setTimeout(() => get().refreshBooks('RETRY'), 500);
      return false;
    }
    
    // 🆕 COMPOUND QUERY VALIDATION: Only execute if userId is valid string
    if (typeof userId !== 'string' || userId.length === 0) {
      console.error("🔐 [IDENTITY ERROR] Invalid userId format:", userId);
      return false;
    }
    
    // 🆕 INTELLIGENT LOADING GUARD: Only show loading if NO data exists
    const hasExistingData = get().books.length > 0;
    if (!hasExistingData) {
      set({ isRefreshing: true });
    }
    
    try {
      // 🆕 DATA PROOF: Check real DB count before query
      const realCount = await db.books.count();
      console.log("📊 [DATA PROOF] Dexie count:", realCount, "userId:", userId);
      
      // 🆕 STEP A: Load lightweight matrix with TRIPLE COMPOUND INDEX
      const lowerBound = [String(userId), 0, -Infinity];
      const upperBound = [String(userId), 0, Infinity];
      
      // 🆕 DEBUG TRACE: Log query parameters
      console.log("REFRESH QUERY PARAMS:", lowerBound, upperBound);
      
      let bookMatrix = await db.books
        .where('[userId+isDeleted+updatedAt]')
        .between(lowerBound, upperBound)
        .reverse() // 🚀 Get newest records first at DB level
        .toArray((books: any[]) => books.map((book: any) => {
          const localId = String(book.localId || book._id || book.cid);
          if (!localId) return null; // 🛡️ GUARD: Filter out invalid IDs
          return {
            localId: typeof book.localId === 'number' ? book.localId : Number(book.localId), // 🛡️ NUMBER GUARD: Always Number
            userId: String(book.userId), // Ensure userId is captured in lightweight matrix
            _id: String(book._id || book.cid), // 🆕 PRIORITY: Use server ID or CID for display
            cid: String(book.cid), // 🆕 PRESERVE: Keep CID for reference
            name: String(book.name || ''), // ✅ STRING GUARD
            image: String(book.image || ''),      // ✅ RESTORED
            mediaCid: String(book.mediaCid || ''), // ✅ RESTORED
            isPinned: Number(book.isPinned || 0),
            updatedAt: Number(book.updatedAt || 0),
            cachedBalance: Number(book.cachedBalance || 0) // Will be calculated later
          } as BookMatrixItem;
        }).filter(Boolean))
        .catch(async () => {
          console.warn("🛡️ [RESCUE] Compound index corrupt, using fallback.");
          return await db.books.where('userId').equals(String(userId)).and((b: any) => b.isDeleted === 0).toArray();
        });

      // 🆕 RESILIENT FALLBACK: If compound index failed, try userId index
      if (bookMatrix.length === 0 && realCount > 0) {
        const totalInDb = await db.books.where('userId').equals(String(userId)).count();
        if (totalInDb > 0) {
          console.warn("⚠️ [RESCUE] Compound index failed. Falling back to userId index.");
          bookMatrix = await db.books.where('userId').equals(String(userId)).and((b: any) => b.isDeleted === 0).reverse().sortBy('updatedAt');
          
          // 🚨 THE MISSING LINK: Update the store so applyFiltersAndSort sees the data!
          set({ allBookIds: bookMatrix, totalBookCount: bookMatrix.length });
          console.log("✅ [RESCUE SUCCESS] Matrix updated with fallback data:", bookMatrix.length);
        }
      }

      // 🆕 DATA PROOF: Log matrix count and check for mismatch
      console.log("📊 [DATA PROOF] Matrix count:", bookMatrix.length);
      if (realCount > 0 && bookMatrix.length === 0) {
        console.error("🚨 [CRITICAL] Index mismatch detected. Matrix is empty but DB has data!");
      }

      // ✅ RESTORE ENTRIES FOR BALANCE: Fetch fresh entries data
      const allEntries = await db.entries
        .where('userId')
        .equals(String(userId))
        .and((entry: any) => entry.isDeleted === 0)
        .reverse()
        .sortBy('updatedAt');
      
      set({ allEntries }); // ✅ RESTORE ENTRIES FOR BALANCE

      // Store lightweight matrix in state
      set({ 
        allBookIds: bookMatrix,
        totalBookCount: bookMatrix.length // 🆕 Update total count for pagination UI
      });

      // 🆕 RE-APPLY EXISTING FILTER: Pass bookMatrix directly to prevent state lag
      get().applyFiltersAndSort();
      
      return true;
    } catch (error) {
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  }

  /**
   * 🆕 CHUNK FETCHING FOR PERFORMANCE
   */
  async fetchPageChunk(get: any, set: any, page: number, overrideMatrix?: BookMatrixItem[], source?: string, currentId?: number): Promise<void> {
    const state = get();
    const { filteredBookMatrix, isMobile, prefetchedChunks, allBookIds } = state;
    
    // 🆕 PRIORITY GUARD: Prevent background sync from overwriting active search
    if (source === 'BACKGROUND_SYNC' && get().isUserSearching) {
      console.log("🛡️ PRIORITY GUARD: Background sync aborted - user is actively searching");
      return;
    }
    
    // 🆕 RACE CONDITION GUARD: Use provided currentId or get current one (PASSIVE)
    const searchId = currentId || get().lastSearchId;
    
    // 🆕 DIRECT MATRIX ACCESS: Use overrideMatrix if provided (for search)
    const matrixToUse = (overrideMatrix && overrideMatrix.length > 0) ? 
      overrideMatrix : 
      (filteredBookMatrix.length > 0 ? filteredBookMatrix : allBookIds);
    
    // 🆕 DISCOVERY LOGS
    console.log("MATRIX STATUS:", { 
      all: allBookIds.length, 
      filtered: filteredBookMatrix.length, 
      using: matrixToUse.length,
      page,
      source
    });
    
    // 🛡️ ATOMIC CACHE BUSTING: Only use cache for BACKGROUND_SYNC and INITIAL_BOOT
    if (source !== 'SEARCH' && source !== 'DATA_CHANGE' && get().prefetchedChunks.has(page)) {
      const cachedBooks = get().prefetchedChunks.get(page);
      set({ books: cachedBooks, filteredBooks: cachedBooks });
      console.log(`⚡ INSTANT LOAD: Retrieved page ${page} from prefetch cache (${cachedBooks.length} books)`);
      return; // ✅ INSTANT LOAD FROM CACHE
    }
    
    // Device-specific slot allocation
    const REAL_BOOK_SLOTS = isMobile ? 16 : 15; // Mobile: 16 real, Desktop: 15 real + 1 dummy
    
    // Calculate slice bounds
    const startIndex = (page - 1) * REAL_BOOK_SLOTS;
    const endIndex = page * REAL_BOOK_SLOTS;
    
    // Get IDs for current page from MATRIX
    const currentPageIds = matrixToUse
      .slice(startIndex, endIndex)
      .map((book: BookMatrixItem) => book.localId) // ✅ PRESERVE ORIGINAL TYPES
      .filter(Boolean); // 🛡️ Safety check
    
    // 🚨 CRITICAL FIX: Prevent empty array from causing InvalidArgumentError
    if (currentPageIds.length === 0) {
      console.warn("🛡️ [SAFETY] currentPageIds is empty, skipping fetchPageChunk");
      set({ books: [], filteredBooks: [] });
      return;
    }
    
    // 🆕 DISCOVERY LOGS
    console.log("PAGE SLICE:", { startIndex, endIndex, idsCount: currentPageIds.length, sampleIds: currentPageIds.slice(0, 3) });
    
    try {
      // 🆕 STEP B: Fetch FULL objects including image fields
      const fullBooks = await db.books
        .where('localId')
        .anyOf(currentPageIds)
        .toArray();
      
      // 🆕 DISCOVERY LOGS
      console.log("DB FETCH RESULT:", fullBooks.length);
      
      // 🛡️ RACE CONDITION GUARD: Check again after async operation
      // 🆕 RELAXED ABORT: Only abort for SEARCH operations, allow INITIAL_BOOT, RETRY and BACKGROUND_SYNC
      if (source === 'SEARCH' && searchId !== get().lastSearchId) {
        console.log("🛡️ ABORT: Newer search detected after DB fetch");
        return;
      }
      
      // 🛡️ OPTIMISTIC RETENTION: Don't wipe UI if we already have data and new fetch is mysteriously empty during a background process
      if (fullBooks.length === 0 && get().books.length > 0 && get().isRefreshing) {
         return;
      }
      
      // 🆕 MANUAL RE-SORT: Strict manual re-sort to match matrix order exactly
      let sortedBooks = currentPageIds.map((id: any) => 
        fullBooks.find((book: any) => String(book.localId) === String(id))  // ✅ STRING conversion for BOTH sides
      ).filter(Boolean);
      
      // 🆕 RESCUE FALLBACK: Ensure user NEVER sees empty screen if DB returned data
      if (sortedBooks.length === 0 && fullBooks.length > 0) {
        console.warn("⚠️ [RESCUE] Sorting failed, showing raw DB results.");
        sortedBooks = fullBooks;  // 🚨 IMMEDIATE FALLBACK
      }
      
      // Update state with SORTED objects - ONLY STATE WRITER
      set({ 
        books: sortedBooks,
        filteredBooks: sortedBooks
      });
      
      console.log("Chunk Fetched. Displaying:", sortedBooks.length, "items for search:", get().searchQuery, "source:", source);
    } catch (error) {
      console.error("❌ fetchPageChunk error:", error);
    } finally {
      // 🆕 LOADING RESET: Prevent ghost loading state
      set({ isRefreshing: false, isLoading: false, isInteractionLocked: false });
    }
  }

  /**
   * 📚 SAVE BOOK
   */
  async saveBook(get: any, set: any, bookData: any, editTarget?: any): Promise<{ success: boolean; book?: any; error?: Error }> {
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
        updatedAt: Number.isNaN(getTimestamp()) ? Date.now() : getTimestamp()
      };

      if (!editTarget?.createdAt) bookPayload.createdAt = getTimestamp();

      const { normalizeRecord } = await import('../core/VaultUtils');
      const normalized = normalizeRecord(bookPayload, String(userId));
      if (!normalized) {
        throw new Error('Failed to normalize book data');
      }

      const { db } = await import('@/lib/offlineDB');
      let id: number = 0;
      
      // 🆕 SURGICAL FIX: Use HydrationController for atomic writes
      const { HydrationController } = await import('../hydration/HydrationController');
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
      // const { orchestrator } = await import('../core/SyncOrchestrator');
      // orchestrator.triggerSync();
      
      return { success: true, book: { ...normalized, localId: id } };
    } catch (error) {
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: Always unregister action
      unregisterAction(actionId);
    }
  }

  /**
   * 🗑️ DELETE BOOK
   */
  async deleteBook(get: any, set: any, book: any, router: any): Promise<{ success: boolean; error?: Error }> {
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
          await this.executeFinalDeletion(get, book, userId);
          // SECOND: Hide toast and navigate
          get().hideToast(activeToastId);
          this.completeDeletionAndRedirect(set, router);
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
  }

  /**
   * 🔄 RESTORE BOOK
   */
  async restoreBook(get: any, set: any, book: any): Promise<{ success: boolean; error?: Error }> {
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown } = get();
    if (isSecurityLockdown) {
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    try {
      const { HydrationController } = await import('../hydration/HydrationController');
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
  }

  /**
   * 🔍 SEARCH & SORT ACTIONS
   */
  async applyFiltersAndSort(get: any, set: any, matrixOverride?: BookMatrixItem[]): Promise<void> {
    const { allBookIds, searchQuery, sortOption } = get();
    const userId = identityManager.getUserId();
    
    // 🆕 DISCOVERY LOGS: Move to top to see matrix status even if empty
    console.log("🔍 [FILTER SORT] Starting filter:", { 
      allBookIds: allBookIds.length, 
      searchQuery: searchQuery, 
      sortOption,
      userId: userId ? 'VALID' : 'NULL'
    });
    
    // 🆕 IDENTITY VALIDATION: Ensure userId is available
    if (!userId) {
      console.log("🔐 [FILTER SORT] No userId available, skipping filter");
      return;
    }
    
    // 🆕 RACE CONDITION GUARD: Increment search ID to track current operation
    const currentId = ++get().lastSearchId;
    
    // 🆕 STEP A: Use allBookIds matrix as primary data source
    const matrix = matrixOverride || allBookIds;
    
    // 🆕 STEP B: Updated search logic
    const q = (searchQuery || "").toLowerCase().trim();
    let filtered = q 
      ? matrix.filter((b: any) => (b.name || "").toLowerCase().includes(q))
      : [...matrix];
    
    // 🆕 STEP C: Updated sort logic - Activity sort by updatedAt DESC
    if (sortOption === 'Activity') {
      filtered.sort((a: BookMatrixItem, b: BookMatrixItem) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    }

    // 🆕 STEP D: Update filtered matrix state and restore pagination count
    set({ filteredBookMatrix: filtered, totalBookCount: filtered.length });

    // 🆕 STEP E: EMPTY STATE HANDLING
    if (filtered.length === 0) {
      set({ books: [], filteredBooks: [] });
      return; // 🚨 EARLY RETURN - Don't call fetchPageChunk
    }

    // 🆕 STEP F: TRIGGER CHUNK FETCH - ONLY WAY UI receives new sorted/filtered data
    await get().fetchPageChunk(1, filtered, 'SEARCH', currentId);
  }

  /**
   * 🎯 ACTIVE BOOK MANAGEMENT
   */
  async setActiveBook(get: any, set: any, book: any): Promise<void> {
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
  }

  /**
   * 💰 BALANCE CALCULATION
   */
  getBookBalance(get: any, id: string): number {
    return financeService.getBookBalance(get, id);
  }

  /**
   * 🛡️ RESURRECT BOOK CHAIN: Handle parent_deleted conflict resolution
   */
  async resurrectBookChain(get: any, bookCid: string): Promise<{ success: boolean; error?: Error }> {
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
      const { HydrationController } = await import('../hydration/HydrationController');
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
  }

  /**
   * 🆕 SCROLL MEMORY
   */
  setLastScrollPosition(set: any, pos: number): void {
    set({ lastScrollPosition: pos });
  }

  /**
   * 🔄 MATRIX SYNC ACTION
   */
  async syncMatrixItem(get: any, set: any, bookId: string): Promise<void> {
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
    
    // 🛡️ ATOMIC CACHE BUSTING: Clear prefetched chunks to force fresh fetch
    set({ prefetchedChunks: new Map() });
    
    // 🆕 UNIFIED PIPELINE: Call applyFiltersAndSort directly with updated matrix
    await get().applyFiltersAndSort(updatedMatrix);
    
    console.log('⚡ [RE-SYNC] Matrix and UI Aligned');
  }

  /**
   * 🆕 SMART PRE-FETCHING FOR ZERO-LAG
   */
  async prefetchBookEntries(get: any, set: any, bookId: string): Promise<void> {
    const state = get();
    const { prefetchedEntriesCache } = state;
    
    // Check if entries for this book are already cached
    if (prefetchedEntriesCache.has(bookId)) {
      return;
    }
    
    try {
      // 🆕 SILENT FETCH: Get all entries for this book without setting loading states
      const bookEntries = await db.entries
        .where('bookId')
        .equals(String(bookId))
        .and((entry: any) => entry.isDeleted === 0)
        .toArray();
      
      // 🆕 CACHE STORAGE: Store in prefetched entries cache
      const newPrefetchedEntriesCache = new Map(prefetchedEntriesCache);
      newPrefetchedEntriesCache.set(bookId, bookEntries);
      set({ prefetchedEntriesCache: newPrefetchedEntriesCache });
      
      console.log(`🚀 Prefetched ${bookEntries.length} entries for book ${bookId}`);
    } catch (error) {
      console.error('❌ Entry prefetch failed:', error);
    }
  }

  /**
   * 🆕 PREFETCH NEXT PAGE FOR ZERO-LAG
   */
  async prefetchNextPage(get: any, set: any, page: number): Promise<void> {
    const state = get();
    const { filteredBookMatrix, isMobile, prefetchedChunks } = state;
    
    // Check if already cached
    if (prefetchedChunks.has(page)) {
      return;
    }
    
    // Device-specific slot allocation
    const REAL_BOOK_SLOTS = isMobile ? 16 : 15;
    
    // Calculate slice bounds for next page
    const startIndex = page * REAL_BOOK_SLOTS;
    const endIndex = (page + 1) * REAL_BOOK_SLOTS;
    
    // Get IDs for next page from MATRIX
    const nextPageIds = filteredBookMatrix
      .slice(startIndex, endIndex)
      .map((book: BookMatrixItem) => book.localId);
    
    if (nextPageIds.length === 0) {
      return;
    }
    
    try {
      // 🆕 SILENT FETCH: Get full objects without setting loading states
      const fullBooks = await db.books
        .where('localId')
        .anyOf(nextPageIds)
        .toArray();
      
      // 🆕 CACHE STORAGE: Store in prefetched chunks map
      const sortedBooks = nextPageIds.map((id: string) => 
        fullBooks.find((book: any) => String(book.localId) === String(id))
      ).filter(Boolean);
      
      // Update prefetched chunks cache
      const newPrefetchedChunks = new Map(prefetchedChunks);
      newPrefetchedChunks.set(page, sortedBooks);
      set({ prefetchedChunks: newPrefetchedChunks });
      
      console.log(`🚀 Prefetched page ${page} with ${sortedBooks.length} books`);
    } catch (error) {
      console.error('❌ Prefetch failed:', error);
    }
  }

  /**
   * 🆕 ZERO-LAG NAVIGATION
   */
  transitionToDashboard(get: any, set: any, router: any): void {
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
  }

  /**
   * 🆕 CANCEL PENDING DELETION
   */
  cancelDeletion(get: any, set: any): void {
    const { pendingDeletion } = get();
    if (pendingDeletion?.timeoutId) {
      clearTimeout(pendingDeletion.timeoutId);
    }
    set({ pendingDeletion: null });
  }

  /**
   * 🗑️ EXECUTE FINAL DELETION
   */
  async executeFinalDeletion(get: any, book: any, userId: string): Promise<void> {
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
  }

  /**
   * 🧭 COMPLETE DELETION AND REDIRECT
   */
  completeDeletionAndRedirect(set: any, router: any): void {
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

  /**
   * 🆕 DEVICE STATE SETTER
   */
  setIsMobile(set: any, mobile: boolean): void {
    set({ isMobile: mobile });
  }
}
