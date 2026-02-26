"use client";

import { getTimestamp } from '@/lib/shared/utils';
import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';

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
   * 📝 REFRESH ENTRIES - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db.entries, get, set
   */
  async refreshEntries(get: any, set: any): Promise<void> {
    // 🛡️ IDENTITY SYNC: Get userId directly from identityManager
    const userId = identityManager.getUserId();
    if (!userId) {
      console.warn('🚨 [FINANCE SERVICE] No userId available, retrying in 100ms...');
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
      console.error('❌ [FINANCE SERVICE] Entries refresh failed:', error);
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
    // 🔍 VALIDATION FIRST - NO LOCK YET
    const userId = identityManager.getUserId();
    if (!userId) {
      console.error('❌ [FINANCE SERVICE] Invalid user ID for saveEntry');
      return { success: false, error: new Error('Invalid user ID') };
    }

    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [FINANCE SERVICE] Blocked entry save during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || `save-entry-${Date.now()}`;
    if (isGlobalAnimating) {
      console.warn('🚫 [FINANCE SERVICE] Blocked entry save during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [FINANCE SERVICE] Blocked duplicate entry save action');
      return { success: false, error: new Error('Entry save already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const bookId = get().activeBook?._id || get().activeBook?.localId || '';
      
      if (bookId) {
        const currentBook = await db.books.where('_id').equals(bookId).first();
        if (currentBook && currentBook.isDeleted === 1) {
          console.warn(`🚫 [FINANCE SERVICE] Blocked entry save for deleted book: ${bookId}`);
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
      const finalDate = entryData.date || new Date().toISOString().split('T')[0];
      const finalTitle = entryData.title?.trim() || (entryData.category ? `${entryData.category.to ()} RECORD` : 'GENERAL RECORD');

      // 🎯 SAFE VKEY LOGIC: Handle NEW vs EXISTING records
      let finalVKey: number;
      
      // Check if this is a NEW entry (no editTarget and no localId)
      if (!editTarget && !entryData.localId) {
        finalVKey = 1; // NEW record starts at vKey: 1
        console.log('🆕 [FINANCE SERVICE] New entry detected, vKey set to 1');
      } else {
        // EXISTING record - increment current vKey safely
        const recordId = entryData.localId || editTarget?.localId || editTarget?._id;
        let currentVKey = entryData.vKey || editTarget?.vKey || 0;
        
        if (recordId) {
          // Only search if recordId is valid (NOT undefined/null)
          try {
            const dbRecord = await db.entries.get(recordId);
            currentVKey = dbRecord?.vKey || currentVKey || 0;
            console.log('🔄 [FINANCE SERVICE] Existing entry found, current vKey:', currentVKey);
          } catch (error) {
            console.warn('⚠️ [FINANCE SERVICE] Failed to fetch existing record, using fallback vKey:', currentVKey);
          }
        }
        
        finalVKey = Number(currentVKey) + 1;
        console.log('📈 [FINANCE SERVICE] Final vKey calculated:', finalVKey);
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
      
      // 🎯 STEP A: CONSTRUCT BOOK SIGNAL PAYLOAD
      let bookSignalPayload: { _id: string; cid: string; name: string; userId: string; synced: number; isDeleted: number; vKey: number; updatedAt: number } | null = null;
      
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const activeBook = get().activeBook;
      if (activeBook && (String(activeBook._id) === String(bookId) || String(activeBook.localId) === String(bookId))) {
        // 🎯 LIGHTWEIGHT BOOK SIGNAL: Only send sorting fields
        bookSignalPayload = {
          _id: activeBook._id,
          cid: activeBook.cid,
          name: activeBook.name,
          userId: String(activeBook.userId || get().userId || ''),
          synced: 0,
          isDeleted: Number(activeBook.isDeleted || 0),
          vKey: Number(activeBook.vKey || 1) + 1,
          updatedAt: getTimestamp()
        };
      }
      
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
      
      // 🎯 ATOMIC BALANCE PULSE: Update cached balance after successful batch
      if (bookSignalPayload && activeBook) {
        const newBalance = this.getBookBalance(get, String(activeBook._id || activeBook.localId));
        set((state: any) => ({
          activeBook: { ...state.activeBook, cachedBalance: newBalance }
        }));
      }
      
      // 🆕 SAFE IGNITION: Trigger sync for non-image updates
      // Sync will be triggered by HydrationController's vault-updated event
      
      return { success: true, entry: { ...normalized, localId: batchResult.count || 0 } };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] saveEntry failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: ALWAYS UNREGISTER ACTION
      unregisterAction(actionId);
    }
  }

  /**
   * 🗑️ DELETE ENTRY - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async deleteEntry(
    get: any, 
    set: any, 
    entry: any, 
    customActionId?: string
  ): Promise<{ success: boolean; error?: Error }> {
    // 🔍 VALIDATION FIRST - NO LOCK YET
    const userId = identityManager.getUserId();
    if (!userId || !entry?.localId) return { success: false };
    
    // 🛡️ LOCKDOWN GUARD: Block local writes during security breach
    const { isSecurityLockdown, isGlobalAnimating, activeActions, registerAction, unregisterAction } = get();
    if (isSecurityLockdown) {
      console.warn('🚫 [FINANCE SERVICE] Blocked entry delete during security lockdown');
      return { success: false, error: new Error('App in security lockdown') };
    }
    
    // 🛡️ SAFE ACTION SHIELD: Block during animations and prevent duplicates
    const actionId = customActionId || 'delete-entry';
    if (isGlobalAnimating) {
      console.warn('🚫 [FINANCE SERVICE] Blocked entry delete during animation');
      return { success: false, error: new Error('System busy - animation in progress') };
    }
    
    if (activeActions.includes(actionId)) {
      console.warn('🚫 [FINANCE SERVICE] Blocked duplicate entry delete action');
      return { success: false, error: new Error('Entry delete already in progress') };
    }
    
    // ✅ ALL VALIDATIONS PASSED - NOW REGISTER ACTION
    registerAction(actionId);

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      // 🛡️ SAFE ID EXTRACTION: Validate localId before Dexie operations
      const entryLocalId = entry.localId;
      if (!entryLocalId) {
        console.error('❌ [FINANCE SERVICE] Cannot delete entry: missing localId');
        return { success: false, error: new Error('Entry localId is required for deletion') };
      }
      
      // 🎯 STEP A: DECLARE DELETE PAYLOAD FIRST (Fix hoisting)
      const deletePayload = {
        ...entry,
        userId: String(userId || get().userId || entry.userId || ''),
        bookId: String(entry.bookId || get().activeBook?._id || get().activeBook?.localId || ''),
        title: entry.title || 'Unnamed Entry', // Mandatory for schema
        isDeleted: 1,
        synced: 0,
        vKey: 0, // Will be updated after vKey calculation
        updatedAt: getTimestamp()
      };
      
      // 🎯 STEP B: DECLARE BOOK SIGNAL PAYLOAD
      let bookSignalPayload: { _id: string; cid: string; name: string; userId: string; synced: number; isDeleted: number; vKey: number; updatedAt: number } | null = null;
      
      const existingEntry = await db.entries.get(Number(entryLocalId));
      
      // 🎯 SAFE VKEY LOGIC: Increment existing vKey safely
      let currentVKey = existingEntry?.vKey || 0;
      
      if (entryLocalId) {
        // Only search if recordId is valid (NOT undefined/null)
        try {
          const dbRecord = await db.entries.get(entryLocalId);
          currentVKey = dbRecord?.vKey || currentVKey || 0;
          console.log('🔄 [FINANCE SERVICE] Existing entry found for delete, current vKey:', currentVKey);
        } catch (error) {
          console.warn('⚠️ [FINANCE SERVICE] Failed to fetch existing record for delete, using fallback vKey:', currentVKey);
        }
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      // Update vKey in deletePayload now that we have it
      deletePayload.vKey = finalVKey;
      
      // 🛡️ UNSYNCED HARD-DELETE: If entry is not on server yet, delete permanently to avoid 409 conflicts
      if (!entry._id || entry.synced === 0) {
          await db.entries.delete(entry.localId);
          await this.refreshEntries(get, set);
          return { success: true };
      }
      
      // 🎯 ATOMIC BATCH: Entry delete + Book signal in SINGLE transaction
      const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
        { type: 'ENTRY' as const, records: [deletePayload] }
      ];
      
      // Add Book update only if needed
      const parentBookId = entry.bookId;
      if (parentBookId) {
        const activeBook = get().activeBook;
        if (activeBook && (String(activeBook._id) === String(parentBookId) || String(activeBook.localId) === String(parentBookId))) {
          // 🎯 LIGHTWEIGHT BOOK SIGNAL: Only send sorting fields
          bookSignalPayload = {
            _id: activeBook._id,
            cid: activeBook.cid,
            name: activeBook.name, // 🛡️ ADDED: To satisfy the Iron Gate validator
            userId: String(activeBook.userId || get().userId || ''),
            synced: 0,
            isDeleted: Number(activeBook.isDeleted || 0),
            vKey: Number(activeBook.vKey || 1) + 1,
            updatedAt: getTimestamp()
            // 🚨 INTENTIONALLY OMITTED: description, image, mediaCid, isPinned
          };
          
          atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });
        }
      }
      
      // 🎯 SINGLE BATCH CALL: Process Entry delete + Book signal atomically
      const batchResult = await controller.ingestBatchMutation(atomicOperations);
      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Failed to perform atomic batch mutation');
      }
      
      // 🆕 UI REACTIVITY GUARD: Instant UI update
      set((state: any) => ({
        allEntries: state.allEntries.filter((e: any) => e.cid !== entry.cid),
        entries: state.entries.filter((e: any) => e.cid !== entry.cid)
      }));
      
      // ✅ CRITICAL: Trigger processing engine to update processedEntries
      get().processEntries();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] deleteEntry failed:', error);
      return { success: false, error: error as Error };
    } finally {
      // 🛡️ SAFE ACTION SHIELD: ALWAYS UNREGISTER ACTION
      unregisterAction(actionId);
    }
  }

  /**
   * 🔄 UPDATE ENTRY - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async updateEntry(
    get: any, 
    set: any, 
    id: string, 
    entryPayload: any
  ): Promise<{ success: boolean; entry?: any; error?: string }> {
    const userId = identityManager.getUserId();
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
          userId: String(activeBook.userId || get().userId || ''),
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
      if (bookSignalPayload && activeBook) {
        const newBalance = this.getBookBalance(get, String(activeBook._id || activeBook.localId));
        set((state: any) => ({
          activeBook: { ...state.activeBook, cachedBalance: newBalance }
        }));
      }
      
      // Sync will be triggered by HydrationController's vault-updated event
      
      return { success: true, entry: updatePayload };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] updateEntry failed:', error);
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
      console.warn(`🚨 [FINANCE SERVICE] Book not found for balance calculation: ${bookId}`);
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
   * 🔄 RESTORE ENTRY - Extracted from entrySlice.ts
   * 
   * Dependencies: identityManager, db, get, set
   */
  async restoreEntry(
    get: any, 
    set: any, 
    entry: any
  ): Promise<{ success: boolean; error?: Error }> {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      let currentVKey = existingEntry?.vKey || 0;
      
      // 🎯 HIGH-PRECISION SEQUENTIAL VKEY: Current + 1 Rule
      if (!currentVKey || isNaN(currentVKey) || currentVKey === 0) {
        const dbEntry = await db.entries.get(Number(entry.localId));
        currentVKey = dbEntry?.vKey || 0;
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      const restorePayload = {
        ...entry,
        isDeleted: 0,
        synced: 0,
        vKey: finalVKey,
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [restorePayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to restore entry');
      }
      
      await this.refreshEntries(get, set);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] restoreEntry failed:', error);
      return { success: false, error: error as Error };
    }
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
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      let currentVKey = existingEntry?.vKey || 0;
      
      const newStatus = entry.status === 'completed' ? 'pending' : 'completed';
      
      // 🎯 HIGH-PRECISION SEQUENTIAL VKEY: Current + 1 Rule
      if (!currentVKey || isNaN(currentVKey) || currentVKey === 0) {
        const dbEntry = await db.entries.get(Number(entry.localId));
        currentVKey = dbEntry?.vKey || 0;
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      const statusPayload = {
        ...entry,
        status: newStatus,
        synced: 0,
        vKey: finalVKey,
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [statusPayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update entry status');
      }
      
      await this.refreshEntries(get, set);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] toggleEntryStatus failed:', error);
      return { success: false, error: error as Error };
    }
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
    const userId = identityManager.getUserId();
    if (!userId) return { success: false, error: new Error('User not authenticated') };

    try {
      const { HydrationController } = await import('../hydration/HydrationController');
      const controller = HydrationController.getInstance();
      
      const existingEntry = await db.entries.get(Number(entry.localId));
      let currentVKey = existingEntry?.vKey || 0;
      
      const newPinStatus = !entry.isPinned;
      
      // 🎯 HIGH-PRECISION SEQUENTIAL VKEY: Current + 1 Rule
      if (!currentVKey || isNaN(currentVKey) || currentVKey === 0) {
        const dbEntry = await db.entries.get(Number(entry.localId));
        currentVKey = dbEntry?.vKey || 0;
      }
      
      const finalVKey = Number(currentVKey) + 1;
      
      const pinPayload = {
        ...entry,
        isPinned: newPinStatus,
        synced: 0,
        vKey: finalVKey,
        updatedAt: getTimestamp()
      };
      
      const result = await controller.ingestLocalMutation('ENTRY', [pinPayload]);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update entry pin status');
      }
      
      await this.refreshEntries(get, set);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [FINANCE SERVICE] togglePin failed:', error);
      return { success: false, error: error as Error };
    }
  }
}

// 🎯 EXPORT SINGLETON INSTANCE
export const financeService = FinanceService.getInstance();
