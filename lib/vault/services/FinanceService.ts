"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { db } from '@/lib/offlineDB';
import { getNextVKey } from '@/lib/vault/core/VaultUtils';

/**
 * 🎯 FINANCE SERVICE (V1.0) - Extracted Entry Logic
 * 
 * Atomic extraction of entry operations from entrySlice.ts
 * Maintains store connectivity through get/set parameters
 * 
 * Architecture: Service Layer → HydrationController → Dexie
 */

export class FinanceService {
  private static instance: FinanceService | null = null;

  private constructor() {}

  /**
   * 🎯 GET INSTANCE - Singleton pattern
   */
  public static getInstance(): FinanceService {
    if (!FinanceService.instance) {
      FinanceService.instance = new FinanceService();
    }
    return FinanceService.instance;
  }

  /**
   * 🛠️ HELPER: Construct Book Signal Payload
   * Generates the lightweight update object for the parent book
   * @param entryData - Optional entry data for proactive balance calculation
   */
  private async createBookSignal(get: any, bookId: string, userId: string, entryData?: { type: string; amount: number }): Promise<{ signal: any | null; book: any | null }> {
    if (!bookId) return { signal: null, book: null };
    
    // 🎯 DEXIE-FIRST: Fetch latest book record from Dexie for absolute truth
    // First get the store's activeBook to find its localId/_id
    const storeBook = get().activeBook;
    const lookupId = storeBook?.localId || storeBook?._id || bookId;
    let activeBook = await db.books.get(lookupId);
    
    // Fallback to store if Dexie doesn't have it
    if (!activeBook) {
      if (!storeBook || (String(storeBook._id) !== bookId && String(storeBook.localId) !== bookId)) {
        const dbBook = await db.books.where('localId').equals(Number(bookId)).or('_id').equals(bookId).first();
        if (dbBook) activeBook = dbBook;
      } else {
        activeBook = storeBook;
      }
    }

    // 🛡️ DEFENSIVE: If activeBook still has no name, try alternative DB query
    if (activeBook && !activeBook.name) {
      console.warn('⚠️ [FINANCE SERVICE] Book missing name field, attempting alternative fetch...');
      const altBook = await db.books
        .filter((book: any) => book.cid === bookId || String(book.localId) === String(bookId) || String(book._id) === String(bookId))
        .first();
      if (altBook?.name) {
        activeBook = altBook;
      }
    }

    // 🛡️ GUARD: If still no valid name, don't create invalid signal (would fail Zod validation)
    if (!activeBook?.name) {
      console.error('🚨 [FINANCE SERVICE] Cannot create Book Signal - book name is undefined');
      return { signal: null, book: null };
    }

    if (activeBook) {
      // 🎯 TOTAL RECALL: Use getBookBalance (same as UI) for 100% accuracy
      // This reads from state.allEntries and calculates absolute sum
      const lookupBookId = String(activeBook._id || activeBook.localId);
      const finalBalance = this.getBookBalance(get, lookupBookId);
      
      console.log("🎯 [TOTAL RECALL] Calculated from all entries:", finalBalance);
      
      // 🚨 LEAN SIGNAL: For entry mutations, only send essential sync fields
      const isEntryMutation = !!entryData;
      
      const signal = isEntryMutation ? {
        // 🚨 LEAN PAYLOAD: Include localId for proper Dexie merge
        localId: activeBook.localId,
        _id: activeBook._id,
        cid: activeBook.cid,
        userId: String(activeBook.userId || userId || ''),
        vKey: getNextVKey(Number(activeBook.vKey || 1), false),
        updatedAt: getTimestamp(),
        cachedBalance: Number(finalBalance),
        synced: 0
      } : {
        // Full payload for other operations
        _id: activeBook._id,
        cid: activeBook.cid,
        name: activeBook.name,
        userId: String(activeBook.userId || userId || ''),
        synced: 0,
        isDeleted: Number(activeBook.isDeleted || 0),
        vKey: getNextVKey(Number(activeBook.vKey || 1), false),
        updatedAt: getTimestamp(),
        cachedBalance: Number(finalBalance)
      };
      
      return { signal, book: activeBook };
    }
    return { signal: null, book: null };
  }

  /**
   * �📝 REFRESH ENTRIES - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db.entries, get, set
   */
  async refreshEntries(get: any, set: any): Promise<void> {
    // 🛡️ IDENTITY SYNC: Get userId directly from UserManager
    const { UserManager } = await import('../core/user/UserManager');
    const userId = UserManager.getInstance().getUserId();
    if (!userId) {
      setTimeout(() => this.refreshEntries(get, set), 100);
      return;
    }
    
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
      
      // 🆕 ACTIVE FETCH: Get fresh data directly from Dexie
      const allEntries = await db.entries
        .where('userId')
        .equals(String(userId))
        .and((entry: any) => entry.isDeleted === 0)
        .reverse()
        .sortBy('updatedAt');
      
      // Update store with fresh data
      set({ allEntries });
      
      // � RESTORE SSOT: Only fetch data, let's engine process it
      set({ allEntries, isLoading: false });
      get().processEntries();
      
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] refreshEntries failed:', error);
    } finally {
      set({ isRefreshing: false });
    }
  }

  /**
   * 📝 SAVE ENTRY - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async saveEntry(
    get: any, 
    set: any, 
    entryData: any, 
    editTarget?: any, 
    customActionId?: string
  ): Promise<{ success: boolean; entry?: any; error?: Error }> {
    // 🛡️ IDENTITY GATE: Ensure UserManager has ID before mutation
    const { UserManager } = await import('../core/user/UserManager');
    if (!UserManager.getInstance().getUserId()) {
      await UserManager.getInstance().waitForIdentity();
    }
    const userId = UserManager.getInstance().getUserId();
    if (!userId) {
      throw new Error("SOVEREIGN_IDENTITY_MISSING");
    }

    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || `save-entry-${Date.now()}`;
    if (isGlobalAnimating) {
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      return { success: false, error: new Error('Entry save already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const bookId = get().activeBook?._id || get().activeBook?.localId || '';
      
      if (bookId) {
        const currentBook = await db.books.where('_id').equals(bookId).first();
        if (currentBook && currentBook.isDeleted === 1) {
          return { success: false, error: new Error('This ledger no longer exists') };
        }
      }

      const { generateCID, generateEntryChecksum } = await import('@/lib/offlineDB');
      const { normalizeRecord } = await import('../core/VaultUtils');
      
      const cidToFind = editTarget?.cid || entryData.cid;
      const existingRecord = cidToFind ? await db.entries.where('cid').equals(cidToFind).first() : null;
      const finalLocalId = existingRecord?.localId || editTarget?.localId;
      const existingEntry = existingRecord; // ✅ Fix vKey reference
      
      const finalAmount = Number(entryData.amount) || 0;
      // 🚨 DNA HARDENING: Ensure date is always a Unix ms number
      const finalDate = typeof entryData.date === 'number' 
        ? entryData.date 
        : (entryData.date ? new Date(entryData.date).getTime() : Date.now());
      const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category?.toUpperCase()} RECORD` : 'GENERAL RECORD');

      // 🎯 SAFE VKEY LOGIC: Handle NEW vs EXISTING records
      let finalVKey: number;
      
      // Check if this is a NEW entry (no editTarget and no localId)
      if (!editTarget && !entryData.localId) {
        finalVKey = 1; // NEW record starts at vKey: 1
      } else {
        // EXISTING record - increment current vKey safely
        const recordId = entryData.localId || editTarget?.localId || editTarget?._id;
        let currentVKey = entryData.vKey || editTarget?.vKey || 0;
        
        if (recordId) {
          // Only search if recordId is valid (NOT undefined/null)
          try {
            const dbRecord = await db.entries.get(recordId);
            currentVKey = dbRecord?.vKey || currentVKey || 0;
          } catch (error) {
            console.warn('⚠️ [FINANCE SERVICE] Failed to get vKey from DB, using default:', error);
          }
        }
        
        finalVKey = Number(currentVKey) + 1;
      }

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
        bookCid: get().activeBook?.cid || '', // 🆕 CRITICAL: Include book CID for future safety
        localId: finalLocalId,
        _id: editTarget?._id || entryData._id,
        cid: editTarget?.cid || entryData.cid || generateCID(),
        synced: 0,
        isDeleted: 0,
        updatedAt: getTimestamp(),
        vKey: finalVKey,  // ✅ SAFE VKEY IMPLEMENTED
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
      
      // � STEP A: CONSTRUCT BOOK SIGNAL PAYLOAD - OPTIMIZED FOR ENTRY TRIGGERS
      // 🎯 PROACTIVE: Pass entry data for balance calculation
      const { signal: bookSignalPayload, book: activeBook } = await this.createBookSignal(get, bookId, userId, { type: normalized.type, amount: normalized.amount });
      
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      // 🎯 STEP B: CONSTRUCT ATOMIC OPERATIONS
      const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
        { type: 'ENTRY' as const, records: [normalized] }
      ];
      
      // Add Book signal if available
      if (bookSignalPayload) {
        atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });
      }
      
      // 🎯 STEP C: ATOMIC BATCH EXECUTION
      const batchResult = await controller.ingestBatchMutation(atomicOperations);
      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Failed to perform atomic batch mutation');
      }
      
      // 🆕 OPTIMISTIC UPDATE: Add to Zustand immediately
      const currentEntries = get().entries;
      const newEntry = { ...normalized, localId: batchResult.count || 0 };
      
      // 🛡️ UNIFIED TRIPLE-LINK FILTER: Match ANY of cid, _id, or localId
      const entryMatchFilter = (e: any) => 
        (e.cid && e.cid === newEntry.cid) || 
        (e._id && e._id === newEntry._id) || 
        (e.localId && e.localId === newEntry.localId);
      
      set((state: any) => ({
        allEntries: [newEntry, ...state.allEntries.filter((e: any) => !entryMatchFilter(e))],
        entries: [newEntry, ...state.entries.filter((e: any) => !entryMatchFilter(e))]
      }));
      
      // 🆕 OPTIMISTIC RE-SORT: Apply filters and sort immediately
      get().processEntries();
      
      // 🎯 ACTIVITY HEARTBEAT: Update parent book timestamp for Activity sort
      // ✅ ATOMIC: Only update UI after successful HydrationController batch
      if (bookSignalPayload) {
        // 🛡️ UNIFIED PIPELINE TRIGGER: Update matrix first, then refresh
        const { getVaultStore } = await import('../store/storeHelper');
        const vaultStore = getVaultStore();
        
        // 1. Update memory matrix (Activity sort) - ONLY after successful batch
        if (bookSignalPayload) {
          await vaultStore.syncMatrixItem(String(bookSignalPayload._id || bookId));
        }
        
        // 🔄 RE-HYDRATION SAFETY: Ensure Dexie truth is reflected FIRST
        await vaultStore.refreshBooks('ENTRY_ADDED');
        
        // 🛡️ [PATHOR GUARD] Ensure dashboard is 100% ready before navigation
        // Wait for state to settle before allowing user to navigate back
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 🎯 LIGHTWEIGHT REFRESH: Skip full refresh for activity updates
        // await vaultStore.refreshBooks('DATA_CHANGE'); // ❌ REMOVED: Prevents heavy book sync
        
        // 3. 🛡️ ATOMIC CACHE BUSTING: Clear entry cache to show updated balance
        const { useVaultStore } = await import('../store/index');
        useVaultStore.setState({ prefetchedEntriesCache: {} });
      }
      
      // �� ATOMIC BALANCE PULSE: Update cached balance after successful batch
      if (bookSignalPayload && activeBook) {
        const newBalance = this.getBookBalance(get, String(activeBook._id || activeBook.localId));
        set((state: any) => ({
          activeBook: { ...state.activeBook, cachedBalance: bookSignalPayload.cachedBalance }
        }));
      }
      
      // 🆕 SAFE IGNITION: Trigger sync for non-image updates
      // Sync will be triggered by HydrationController's vault-updated event
      
      return { success: true, entry: { ...normalized, localId: batchResult.count || 0 } };
    } catch (error) {
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: ALWAYS UNREGISTER ACTION
      unregisterAction(actionId);
    }
  }

  /**
   * 🗑️ DELETE ENTRY - 7-SECOND SAFETY NET
   * 
   * Dependencies: identityManager, db, get, set
   * Implements undo functionality like deleteBook
   */
  async deleteEntry(
    get: any, 
    set: any, 
    entry: any, 
    customActionId?: string
  ): Promise<{ success: boolean; error?: Error }> {
    // 🔍 VALIDATION FIRST - NO LOCK YET
    const { UserManager } = await import('../core/user/UserManager');
    // 🛡️ IDENTITY GATE: Ensure UserManager has ID before mutation (like saveEntry)
    if (!UserManager.getInstance().getUserId()) {
      await UserManager.getInstance().waitForIdentity();
    }
    const userId = UserManager.getInstance().getUserId();
    if (!userId || !entry?.localId) return { success: false };
    
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction, pendingEntryDeletion } = get();
    if (isSecurityLockdown) {
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || 'delete-entry';
    if (isGlobalAnimating) {
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      return { success: false, error: new Error('Entry delete already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      // Check if there's already a pending deletion - if so, clear it first
      if (pendingEntryDeletion?.timeoutId) {
        clearTimeout(pendingEntryDeletion.timeoutId);
      }

      const entryId = String(entry.localId);
      const expiresAt = Date.now() + 7000; // 7 seconds total
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      // 🛡️ SAFE ID EXTRACTION: Validate localId before Dexie operations
      const entryLocalId = entry.localId;
      if (!entryLocalId) {
        return { success: false, error: new Error('Entry localId is required for deletion') };
      }
      
      // 🎯 STEP 1: OPTIMISTIC UI - Hide entry from UI immediately
      set((state: any) => ({
        entries: state.entries.filter((e: any) => e.cid !== entry.cid),
        allEntries: state.allEntries.filter((e: any) => e.cid !== entry.cid)
      }));
      
      // Trigger processing to update processedEntries
      get().processEntries();
      
      // 🎯 STEP 2: SHOW UNDO TOAST
      const activeToastId = get().showToast({
        type: 'undo',
        message: `Deleting "${entry.title || 'Entry'}" in 6 seconds...`,
        countdown: 6,
        onUndo: () => {
          // 🛡️ UNDO GUARD: Check if entry already exists before adding (prevents duplicates)
          set((state: any) => {
            const exists = state.allEntries?.some((e: any) => e.cid === entry.cid);
            if (exists) {
              console.log('🛡️ [UNDO] Entry already exists, skipping restore');
              return state;
            }
            return {
              allEntries: [entry, ...(state.allEntries || [])],
              entries: [entry, ...(state.entries || [])],
              pendingEntryDeletion: null
            };
          });
          
          get().processEntries();
          get().hideToast(activeToastId);
        }
      });
      
      // 🎯 STEP 3: SET 7-SECOND DELAYED COMMIT
      const timeoutId = setTimeout(async () => {
        // 🛡️ HARDENED: Try-catch with proper error logging
        try {
          console.log('⏰ [DELETE] Timeout reached, executing final deletion...');
          // FIRST: Execute final deletion
          await this.executeFinalEntryDeletion(get, set, entry, userId);
          console.log('✅ [DELETE] Final deletion completed');
        } catch (err) {
          // THIRD: On error, restore entry to UI
          console.error('❌ [FINANCE SERVICE] Final deletion failed:', err);
          set((state: any) => {
            // 🛡️ GUARD: Check if entry already exists before adding
            const exists = state.allEntries?.some((e: any) => e.cid === entry.cid);
            if (exists) return state;
            return {
              entries: [...(state.entries || []), entry],
              allEntries: [...(state.allEntries || []), entry],
              pendingEntryDeletion: null
            };
          });
          get().processEntries();
        } finally {
          // 🎯 ALWAYS: Hide toast regardless of success or error
          console.log('🏁 [DELETE] Hiding toast, deletion process complete');
          get().hideToast(activeToastId);
        }
      }, 7000);
      
      // Store pending deletion with entry data for undo
      set({ 
        pendingEntryDeletion: { 
          entryId, 
          entry, // Store full entry for restoration
          timeoutId, 
          expiresAt 
        } 
      });
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error as Error };
    } finally {
      unregisterAction(actionId);
    }
  }

  /**
   * 🗑️ EXECUTE FINAL ENTRY DELETION
   * 
   * Called after 7-second undo window expires
   */
  async executeFinalEntryDeletion(get: any, set: any, entry: any, userId: string): Promise<void> {
    const { HydrationController } = await import('../hydration/HydrationController');
    const controller = HydrationController.getInstance();
    
    try {
      // 🎯 STEP A: DECLARE DELETE PAYLOAD FIRST
      const deletePayload = {
        ...entry,
        userId: String(userId || entry.userId || ''),
        bookId: String(entry.bookId || get().activeBook?._id || get().activeBook?.localId || ''),
        title: entry.title || 'Unnamed Entry', // Mandatory for schema
        isDeleted: 1,
        synced: 0,
        vKey: 0, // Will be updated after vKey calculation
        updatedAt: getTimestamp()
      };
      
      // 🛡️ ID GUARD: Ensure localId is defined before Number conversion
      const safeLocalId = entry?.localId;
      if (!safeLocalId) {
        console.error('❌ [FINANCE SERVICE] Cannot process entry - missing localId');
        return;
      }
      
      const existingEntry = await db.entries.get(Number(safeLocalId));
      
      // 🎯 SAFE VKEY LOGIC: Increment existing vKey safely
      let currentVKey = existingEntry?.vKey || 0;
      
      if (entry.localId) {
        try {
          const dbRecord = await db.entries.get(entry.localId);
          currentVKey = dbRecord?.vKey || currentVKey || 0;
        } catch (error) {
          console.warn('⚠️ [FINANCE SERVICE] Failed to get vKey from DB, using default:', error);
        }
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      // Update vKey in deletePayload
      deletePayload.vKey = finalVKey;
      
      // 🛡️ UNSYNCED HARD-DELETE: If entry is not on server yet, delete permanently
      // BUT always update book balance first, AND continue to sync!
      if (!entry._id || entry.synced === 0) {
        // 🎯 MUST: Recalculate and update parent book balance BEFORE deleting entry
        // Pass entry data with INVERTED type for delete (remove entry's effect from balance)
        const deleteEntryData = { 
          type: entry.type === 'income' ? 'expense' : 'income', // Invert: removing income = expense, removing expense = income
          amount: entry.amount 
        };
        const { signal: bookSignal } = await this.createBookSignal(get, entry.bookId, userId, deleteEntryData);
        let bookUpdated = false;
        if (bookSignal && bookSignal.localId) {
          await db.books.update(bookSignal.localId, {
            cachedBalance: bookSignal.cachedBalance,
            updatedAt: getTimestamp(),
            synced: 0
          });
          bookUpdated = true;
        }
        
        // Now delete the entry
        await db.entries.delete(entry.localId);
        await this.refreshEntries(get, set);
        
        // 🚨 CRITICAL: Continue to syncMatrixItem instead of returning early!
        console.log('🎯 [HARD DELETE] Entry deleted, triggering sync...');
        
        // Set parentBookId for sync below
        const parentBookId = entry.bookId;
        
        // Continue to sync code below instead of returning!
        if (bookSignal && bookUpdated) {
          const { getVaultStore } = await import('../store/storeHelper');
          const vaultStore = getVaultStore();
          await vaultStore.syncMatrixItem(String(bookSignal._id || parentBookId));
          get().refreshBooks();
        }
        
        set({ pendingEntryDeletion: null });
        return;
      }
      
      // 🎯 ATOMIC BATCH: Entry delete + Book signal in SINGLE transaction
      const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
        { type: 'ENTRY' as const, records: [deletePayload] }
      ];
      
      // Add Book update only if needed
      // Pass entry data with INVERTED type for delete (remove entry's effect from balance)
      const parentBookId = entry.bookId;
      const deleteEntryData = { 
        type: entry.type === 'income' ? 'expense' : 'income', // Invert: removing income = expense, removing expense = income
        amount: entry.amount 
      };
      const { signal: bookSignalPayload } = await this.createBookSignal(get, parentBookId, userId, deleteEntryData);
      if (bookSignalPayload) {
        atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });
      }
      
      // 🔗 SYNC ENGINE STATE: Ensure HydrationEngine has userId before batch mutation
      controller.setUserId(userId);
      
      // 🎯 SINGLE BATCH CALL: Process Entry delete + Book signal atomically
      const batchResult = await controller.ingestBatchMutation(atomicOperations);
      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Failed to perform atomic batch mutation');
      }
      
      // 🆕 UI REACTIVITY GUARD: Already updated optimistically, just refresh
      await this.refreshEntries(get, set);
      
      // ✅ CRITICAL: Trigger processing engine to update processedEntries
      get().processEntries();
      
      // 🆕 ACTIVITY HEARTBEAT: Update parent book timestamp for Activity sort
      if (bookSignalPayload) {
          const { getVaultStore } = await import('../store/storeHelper');
          const vaultStore = getVaultStore();
          
          if (bookSignalPayload) {
            await vaultStore.syncMatrixItem(String(bookSignalPayload._id || parentBookId));
          }
          
          // 2. Refresh books to reflect changes
          get().refreshBooks();
      }
      
      // Clear pending deletion state
      set({ pendingEntryDeletion: null });
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔄 UPDATE ENTRY - DEPRECATED
   * 
   * @deprecated This method is deprecated. Use saveEntry instead, which handles both create and update.
   *              Calling this method will result in a console warning.
   * 
   * Dependencies: identityManager, db, get, set
   */
  async updateEntry(
    get: any, 
    set: any, 
    id: string, 
    entryPayload: any
  ): Promise<{ success: boolean; entry?: any; error?: string }> {
    // 🛡️ DEPRECATION WARNING
    console.warn('⚠️ DEPRECATION WARNING: updateEntry() is deprecated. Use saveEntry() instead, which handles both create and update operations.');

    // 🛡️ SECURITY LOCKDOWN CHECK
    const { isSecurityLockdown } = get();
    if (isSecurityLockdown) {
      throw new Error('App in security lockdown');
    }

    const { UserManager } = await import('../core/user/UserManager');
    const userId = UserManager.getInstance().getUserId();
    if (!userId) return { success: false, error: 'User not authenticated' };

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entryPayload.localId)); // ✅ Fix vKey reference
      let currentVKey = existingEntry?.vKey || 0;
      
      // 🎯 HIGH-PRECISION SEQUENTIAL VKEY: Current + 1 Rule
      
      // 🚨 CRITICAL: If vKey is invalid, search database for real current vKey
      if (!currentVKey || isNaN(currentVKey) || currentVKey === 0) {
        const dbEntry = await db.entries.get(Number(entryPayload.localId));
        currentVKey = dbEntry?.vKey || 0;
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      const updatePayload = {
        ...entryPayload,
        vKey: finalVKey,  // ✅ SAFE VKEY IMPLEMENTED
        updatedAt: getTimestamp()
      };
      
      // 🎯 STEP A: CONSTRUCT BOOK SIGNAL PAYLOAD
      let bookSignalPayload: { _id: string; cid: string; name: string; userId: string; synced: number; isDeleted: number; vKey: number; updatedAt: number } | null = null;
      
      const activeBook = get().activeBook;
      if (activeBook && (String(activeBook._id) === String(entryPayload.bookId) || String(activeBook.localId) === String(entryPayload.bookId))) {
        // 🎯 LIGHTWEIGHT BOOK SIGNAL: Only send sorting fields
        bookSignalPayload = {
          _id: activeBook._id,
          cid: activeBook.cid,
          name: activeBook.name,
          userId: String(activeBook.userId || userId || ''),
          synced: 0,
          isDeleted: Number(activeBook.isDeleted || 0),
          vKey: Number(activeBook.vKey || 1) + 1,
          updatedAt: getTimestamp()
        };
      }
      
      // 🎯 STEP B: CONSTRUCT ATOMIC OPERATIONS
      const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
        { type: 'ENTRY' as const, records: [updatePayload] }
      ];
      
      // Add Book signal if available
      if (bookSignalPayload) {
        atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });
      }
      
      // 🎯 STEP C: ATOMIC BATCH EXECUTION
      const batchResult = await controller.ingestBatchMutation(atomicOperations);
      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Failed to perform atomic batch mutation');
      }
      
      // 🎯 ATOMIC BALANCE PULSE: Update cached balance after successful batch
      const signalPayload = bookSignalPayload as any;
      if (signalPayload && typeof signalPayload.cachedBalance === 'number') {
        set((state: any) => ({
          activeBook: { ...state.activeBook, cachedBalance: signalPayload.cachedBalance }
        }));
      }
      
      // Sync will be triggered by HydrationController's vault-updated event
      
      return { success: true, entry: updatePayload };
    } catch (error) {
      return { success: false, error: 'Failed to update entry' };
    }
  }

  /**
   * 💰 GET BOOK BALANCE - Extracted from bookSlice.ts
   * 
   * Dependencies: get (no direct Dexie calls)
   */
  getBookBalance(get: any, id: string): number {
    const state = get();
    const bookId = String(id);
    
    // 🆕 MATRIX SEARCH: Search in allBookIds matrix to ensure all cards get balance
    const book = state.allBookIds?.find((b: any) => 
      String(b._id) === bookId || String(b.localId) === bookId || String(b.cid) === bookId
    ) || state.books?.find((b: any) => 
      String(b._id) === bookId || String(b.localId) === bookId || String(b.cid) === bookId
    );
    
    if (!book) {
      return 0;
    }
    
    // Triple-Link Protocol: Match entries with ANY of the book's possible IDs
    const bookEntries = (state.allEntries || []).filter((entry: any) => {
      const eBookId = String(entry.bookId || "");
      return (eBookId === String(book._id) || 
              eBookId === String(book.localId) || 
              eBookId === String(book.cid)) && entry.isDeleted === 0;
    }) || [];
    
    const income = bookEntries.filter((e: any) => e.type === 'income').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expense = bookEntries.filter((e: any) => e.type === 'expense').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    return income - expense;
  }

  /**
   * 🎯 SIGNAL BALANCE: Async version for createBookSignal - reads from Dexie
   * Use this for creating book signals to ensure 100% accuracy with new entries
   */
  async getBookBalanceForSignal(get: any, id: string): Promise<number> {
    const state = get();
    const bookId = String(id);
    
    // 🆕 MATRIX SEARCH: Find the book
    const book = state.allBookIds?.find((b: any) => 
      String(b._id) === bookId || String(b.localId) === bookId || String(b.cid) === bookId
    ) || state.books?.find((b: any) => 
      String(b._id) === bookId || String(b.localId) === bookId || String(b.cid) === bookId
    );
    
    if (!book) {
      return 0;
    }
    
    // Triple-Link Protocol: Match entries with ANY of the book's possible IDs
    // 🎯 DEXIE-FIRST: Read directly from Dexie for 100% accuracy
    const lookupId = book.localId || book._id || book.cid;
    let bookEntries: any[] = [];
    
    try {
      // Query Dexie directly - this ensures we get the latest entries including newly saved ones
      bookEntries = await db.entries.where('bookId').equals(String(lookupId)).toArray();
      // Filter: exclude deleted entries
      bookEntries = bookEntries.filter((e: any) => e.isDeleted !== 1);
    } catch (dexieError) {
      // Fallback to state if Dexie fails
      console.warn("⚠️ [DEXIE FALLBACK] Could not query Dexie, using state:", dexieError);
      bookEntries = (state.allEntries || []).filter((entry: any) => {
        const eBookId = String(entry.bookId || "");
        return (eBookId === String(book._id) || 
                eBookId === String(book.localId) || 
                eBookId === String(book.cid)) && entry.isDeleted === 0;
      });
    }
    
    const income = bookEntries.filter((e: any) => e.type === 'income').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expense = bookEntries.filter((e: any) => e.type === 'expense').reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    return income - expense;
  }

  /**
   * 🔄 RESTORE ENTRY - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async restoreEntry(
    get: any, 
    set: any, 
    entry: any
  ): Promise<{ success: boolean; error?: Error }> {
    return this.performStatusUpdate(get, set, entry, { isDeleted: 0 });
  }

  /**
   * 🔄 TOGGLE ENTRY STATUS - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async toggleEntryStatus(
    get: any, 
    set: any, 
    entry: any
  ): Promise<{ success: boolean; error?: Error }> {
    const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
    return this.performStatusUpdate(get, set, entry, { status: newStatus });
  }

  /**
   * 📌 TOGGLE PIN - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async togglePin(
    get: any, 
    set: any, 
    entry: any
  ): Promise<{ success: boolean; error?: Error }> {
    return this.performStatusUpdate(get, set, entry, { isPinned: !entry.isPinned });
  }

  /**
   * 🛠️ GENERIC STATUS UPDATE HELPER
   * Handles vKey increment, Book signaling, and batch execution for small updates
   */
  private async performStatusUpdate(get: any, set: any, entry: any, changes: any): Promise<{ success: boolean; error?: Error }> {
    const { UserManager } = await import('../core/user/UserManager');
    const userId = UserManager.getInstance().getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      const finalVKey = Number(existingEntry?.vKey || entry.vKey || 0) + 1;
      
      const payload = {
        ...entry,
        ...changes,
        synced: 0,
        vKey: finalVKey,
        updatedAt: getTimestamp()
      };
      
      const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
        { type: 'ENTRY' as const, records: [payload] }
      ];
      
      // Add Book Signal to ensure list sorting and sync
      const { signal: bookSignal } = await this.createBookSignal(get, entry.bookId, userId);
      if (bookSignal) {
        atomicOperations.push({ type: 'BOOK' as const, records: [bookSignal] });
      }
      
      const result = await HydrationController.getInstance().ingestBatchMutation(atomicOperations);
      if (!result.success) throw new Error(result.error);
      
      await this.refreshEntries(get, set);
      
      // Update Matrix
      if (bookSignal?.signal) {
        const { getVaultStore } = await import('../store/storeHelper');
        getVaultStore().syncMatrixItem(String(bookSignal.signal._id || bookSignal.signal.localId || entry.bookId));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// 🎯 EXPORT SINGLETON INSTANCE
export const financeService = FinanceService.getInstance();
