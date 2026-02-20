"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord, validateCompleteness } from '../core/VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import toast from 'react-hot-toast';
import { validateBook, validateEntry } from '../core/schemas';
import { useVaultStore } from '../store';

/**
 * 🚀 SMART BATCH PROCESSOR - Intelligent batching with payload size detection
 */
class SmartBatchProcessor<T> {
  private readonly DEFAULT_BATCH_SIZE = 10;
  private readonly LARGE_PAYLOAD_THRESHOLD = 10240; // 10KB in bytes

  /**
   * 📊 Create intelligent batches based on JSON payload size
   */
  createSmartBatches(items: T[]): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 🎯 SIZE CHECK: Calculate JSON string size
      const jsonSize = JSON.stringify(item).length;
      
      if (jsonSize > this.LARGE_PAYLOAD_THRESHOLD) {
        // 📦 SINGLE-ITEM BATCH: Large payload (likely image)
        console.log(`📦 [SMART BATCH] Large payload detected (${jsonSize} bytes), creating single-item batch`);
        batches.push([item]);
      } else {
        // 📦 NORMAL BATCHING: Group small items together
        let currentBatch = batches[batches.length - 1];
        if (!currentBatch || currentBatch.length >= this.DEFAULT_BATCH_SIZE) {
          currentBatch = [];
          batches.push(currentBatch);
        }
        currentBatch.push(item);
      }
    }
    
    return batches;
  }

  /**
   * 📏 Calculate optimal delay based on server response time
   */
  calculateOptimalDelay(previousResponseTime: number, previousFailed: boolean): number {
    const BASE_DELAY = 2000; // 2 seconds
    const SLOW_RESPONSE_THRESHOLD = 3000; // 3 seconds
    const SLOW_RESPONSE_DELAY = 5000; // 5 seconds
    
    if (previousFailed) {
      // 🔄 EXPONENTIAL BACKOFF: Double delay on failure
      return BASE_DELAY * 2;
    }
    
    if (previousResponseTime > SLOW_RESPONSE_THRESHOLD) {
      // ⏰ ADAPTIVE THROTTLING: Increase delay for slow responses
      return SLOW_RESPONSE_DELAY;
    }
    
    return BASE_DELAY;
  }
}

/**
 * 📊 SYNC PROGRESS TRACKER - State management integration
 */
class SyncProgressTracker {
  private currentBatch = 0;
  private totalBatches = 0;
  private totalItems = 0;
  private processedItems = 0;
  private startTime = Date.now();

  start(totalItems: number): void {
    this.totalItems = totalItems;
    this.processedItems = 0;
    this.currentBatch = 0;
    this.startTime = Date.now();
    
    // 📊 UPDATE ZUSTAND STATE
    const store = useVaultStore.getState();
    store.updateSyncStats({
      totalSynced: 0,
      totalFailed: 0,
      lastSyncDuration: null
    });
    store.setSyncStatus('syncing');
    
    console.log(`📊 [PROGRESS TRACKER] Starting sync: ${totalItems} items`);
  }

  updateBatch(batchNumber: number, batchSize: number): void {
    this.currentBatch = batchNumber;
    this.processedItems += batchSize;
    
    const progress = (this.processedItems / this.totalItems) * 100;
    const elapsed = Date.now() - this.startTime;
    const estimatedRemaining = this.processedItems > 0 
      ? (elapsed / this.processedItems) * (this.totalItems - this.processedItems)
      : 0;
    
    // 📊 UPDATE ZUSTAND STATE (DEBOUNCED)
    const store = useVaultStore.getState();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed,
      lastSyncDuration: elapsed
    });
    
    console.log(`📊 [PROGRESS TRACKER] Batch ${batchNumber} - ${this.processedItems}/${this.totalItems} (${progress.toFixed(1)}%) - Est. remaining: ${(estimatedRemaining/1000).toFixed(1)}s`);
  }

  recordFailure(): void {
    const store = useVaultStore.getState();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed + 1,
      lastSyncDuration: store.syncStats.lastSyncDuration
    });
  }

  complete(): void {
    const totalTime = Date.now() - this.startTime;
    
    // 📊 UPDATE ZUSTAND STATE
    const store = useVaultStore.getState();
    store.updateSyncStats({
      totalSynced: this.processedItems,
      totalFailed: store.syncStats.totalFailed,
      lastSyncDuration: totalTime
    });
    store.setSyncStatus('success');
    store.updateLastSyncedAt();
    
    console.log(`📊 [PROGRESS TRACKER] Sync completed in ${totalTime}ms`);
  }

  error(): void {
    const store = useVaultStore.getState();
    store.setSyncStatus('error');
  }
}

/**
 * 🚀 INDUSTRIAL-GRADE BATCH SYNC ENGINE - Handles large data volumes efficiently
 */
export class PushService {
  private isSyncing = false;
  private userId: string = '';
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  private shadowCache = new Map<string, any>();
  private readonly SHADOW_CACHE_TTL = 15000; // 15 seconds

  // 🎯 SMART COMPONENTS
  private batchProcessor = new SmartBatchProcessor();
  private progressTracker = new SyncProgressTracker();

  constructor() {
    this.userId = identityManager.getUserId() || '';
  }

  /**
   * 🚀 BATCHED PUSH PENDING DATA TO SERVER
   */
  async pushPendingData(): Promise<{ success: boolean; itemsProcessed: number; errors: string[] }> {
    if (this.isSyncing) {
      console.log('🚀 [BATCH PUSH SERVICE] Already syncing, skipping...');
      return { success: false, itemsProcessed: 0, errors: ['Already syncing'] };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      console.log('🚀 [BATCH PUSH SERVICE] Starting industrial-grade batched push sync...');
      
      // 📊 COUNT TOTAL ITEMS FOR PROGRESS TRACKING
      const unsyncedBooks = await db.books.where('synced').equals(0).toArray();
      const unsyncedEntries = await db.entries.where('synced').equals(0).toArray();
      const totalItems = unsyncedBooks.length + unsyncedEntries.length;
      
      this.progressTracker.start(totalItems);
      
      // 🎯 PRIORITY 1: BOOKS FIRST (MUST COMPLETE BEFORE ENTRIES)
      const booksResult = await this.pushBatchedBooks();
      itemsProcessed += booksResult.processed;
      errors.push(...booksResult.errors);
      
      // 🎯 PRIORITY 2: ENTRIES (ONLY AFTER ALL BOOKS SUCCESS)
      if (booksResult.success && unsyncedEntries.length > 0) {
        const entriesResult = await this.pushBatchedEntriesWithGuard();
        itemsProcessed += entriesResult.processed;
        errors.push(...entriesResult.errors);
      } else if (!booksResult.success) {
        errors.push('Skipping entries due to book sync failures');
      }
      
      if (errors.length === 0) {
        this.progressTracker.complete();
      } else {
        this.progressTracker.error();
      }
      
      console.log('✅ [BATCH PUSH SERVICE] Industrial-grade batched push complete:', { itemsProcessed, errors });
      return { success: errors.length === 0, itemsProcessed, errors };
      
    } catch (error) {
      console.error('❌ [BATCH PUSH SERVICE] Push sync failed:', error);
      errors.push(`Push sync failed: ${error}`);
      this.progressTracker.error();
      return { success: false, itemsProcessed, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 📚 PUSH BATCHED BOOKS with industrial-grade processing
   */
  private async pushBatchedBooks(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let previousResponseTime = 0;
    let previousFailed = false;

    try {
      const pendingBooks = await db.books.where('synced').equals(0).toArray();
      console.log('🚀 [BATCH PUSH SERVICE] Pending books found:', pendingBooks.length);
      
      if (pendingBooks.length === 0) {
        return { success: true, processed: 0, errors: [] };
      }

      // 🚀 CONFLICT GUARD: Filter out conflicted books
      const conflictedBooks = await db.books
        .where('conflicted').equals(1)
        .and((book: any) => book.isDeleted === 0)
        .toArray();
      
      const conflictedBookCids = new Set(conflictedBooks.map((book: any) => book.cid));
      const safeBooks = pendingBooks.filter((book: any) => !conflictedBookCids.has(book.cid));
      
      console.log('🚀 [BATCH PUSH SERVICE] Safe books to push:', safeBooks.length, 'conflicted books blocked:', conflictedBooks.length);
      
      // 🎯 SMART BATCHING: Create intelligent batches based on payload size
      const batches = this.batchProcessor.createSmartBatches(safeBooks);
      
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🚀 [BATCH PUSH SERVICE] Processing book batch ${i + 1}/${batches.length} with ${batch.length} items`);
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        for (const book of batch as any[]) {
          try {
            // 🛡️ SAFETY GUARD: Validate completeness before sending
            const validation = validateCompleteness(book, 'book');
            if (!validation.isValid) {
              errors.push(`Book ${book.cid} validation failed: ${validation.missingFields.join(', ')}`);
              batchSuccess = false;
              continue;
            }
            
            const result = await this.pushSingleBook(book);
            if (result.success) {
              processed++;
            } else {
              errors.push(result.error || `Failed to push book ${book.cid}`);
              batchSuccess = false;
            }
          } catch (error) {
            errors.push(`Book ${book.cid} failed: ${error}`);
            batchSuccess = false;
          }
        }
        
        // 📊 RECORD RESPONSE TIME AND CALCULATE DELAY
        const responseTime = Date.now() - batchStartTime;
        previousResponseTime = responseTime;
        previousFailed = !batchSuccess;
        
        // ⏰ ADAPTIVE THROTTLING: Calculate optimal delay
        const delay = this.batchProcessor.calculateOptimalDelay(responseTime, !batchSuccess);
        
        if (i < batches.length - 1) {
          console.log(`🚀 [BATCH PUSH SERVICE] Waiting ${delay}ms before next batch (response: ${responseTime}ms, success: ${batchSuccess})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.progressTracker.updateBatch(i + 1, batch.length);
      }

      return { success: errors.length === 0, processed, errors };
    } catch (error) {
      console.error('❌ [BATCH PUSH SERVICE] Books push failed:', error);
      errors.push(`Books push failed: ${error}`);
      return { success: false, processed, errors };
    }
  }

  /**
   * 📝 PUSH BATCHED ENTRIES WITH CONFLICT GUARD
   */
  private async pushBatchedEntriesWithGuard(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let previousResponseTime = 0;
    let previousFailed = false;

    try {
      const pendingEntries = await db.entries.where('synced').equals(0).toArray();
      console.log('🚀 [BATCH PUSH SERVICE] Pending entries found:', pendingEntries.length);

      // 🚀 CONFLICT GUARD: Filter out entries with conflicted parents
      const conflictedBooks = await db.books
        .where('conflicted').equals(1)
        .and((book: any) => book.isDeleted === 0)
        .toArray();
      
      const conflictedBookCids = new Set(conflictedBooks.map((book: any) => book.cid));
      const safeEntries = pendingEntries.filter((entry: any) => !conflictedBookCids.has(entry.bookId));
      
      console.log('🚀 [BATCH PUSH SERVICE] Safe entries to push:', safeEntries.length, 'conflicted entries blocked:', pendingEntries.length - safeEntries.length);
      
      // 🎯 SMART BATCHING: Create intelligent batches based on payload size
      const batches = this.batchProcessor.createSmartBatches(safeEntries);
      
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`🚀 [BATCH PUSH SERVICE] Processing entry batch ${i + 1}/${batches.length} with ${batch.length} items`);
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        for (const entry of batch as any[]) {
          try {
            // 🛡️ SAFETY GUARD: Validate completeness before sending
            const validation = validateCompleteness(entry, 'entry');
            if (!validation.isValid) {
              errors.push(`Entry ${entry.cid} validation failed: ${validation.missingFields.join(', ')}`);
              batchSuccess = false;
              continue;
            }
            
            const result = await this.pushSingleEntry(entry);
            if (result.success) {
              processed++;
            } else {
              errors.push(result.error || `Failed to push entry ${entry.cid}`);
              batchSuccess = false;
            }
          } catch (error) {
            errors.push(`Entry ${entry.cid} failed: ${error}`);
            batchSuccess = false;
          }
        }
        
        // 📊 RECORD RESPONSE TIME AND CALCULATE DELAY
        const responseTime = Date.now() - batchStartTime;
        previousResponseTime = responseTime;
        previousFailed = !batchSuccess;
        
        // ⏰ ADAPTIVE THROTTLING: Calculate optimal delay
        const delay = this.batchProcessor.calculateOptimalDelay(responseTime, !batchSuccess);
        
        if (i < batches.length - 1) {
          console.log(`🚀 [BATCH PUSH SERVICE] Waiting ${delay}ms before next batch (response: ${responseTime}ms, success: ${batchSuccess})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.progressTracker.updateBatch(i + 1, batch.length);
      }

      return { success: errors.length === 0, processed, errors };
    } catch (error) {
      console.error('❌ [BATCH PUSH SERVICE] Entries push failed:', error);
      errors.push(`Entries push failed: ${error}`);
      return { success: false, processed, errors };
    }
  }

  /**
   * 📚 PUSH SINGLE BOOK
   */
  private async pushSingleBook(book: any): Promise<{ success: boolean; error?: string }> {
    try {
      // 🛡️ SCHEMA GUARD: Validate local data before sending to server
      const validationResult = validateBook(book);
      if (!validationResult.success) {
        const errorMsg = `🚨 [VALIDATOR] Local book data corruption blocked for ID: ${book.cid}. ${validationResult.error}`;
        console.error(errorMsg, { book });
        return { success: false, error: errorMsg };
      }

      const url = book._id ? `/api/books/${book._id}` : '/api/books';
      
      // 🧹 CLEAN PAYLOAD
      const { serverData, conflictReason, localId, synced, ...cleanBook } = book;
      
      // 🚨 CLEANUP: Remove empty _id for new records
      if (!cleanBook._id || cleanBook._id === "") {
        delete (cleanBook as any)._id;
      }
      
      // 🛡️ PUSH VALIDATOR: Prevent empty image strings from corrupting server
      if (cleanBook.image === "") {
        delete cleanBook.image;
        console.log(`🛡️ [PUSH VALIDATOR] Removed empty image string for book ${book.cid}`);
      }
      
      // 🆕 CRITICAL: Ensure Cloudinary URLs are ALWAYS included
      if (cleanBook.image && cleanBook.image.startsWith('http')) {
        console.log(`🚀 [PUSH SERVICE] Including Cloudinary URL in payload for book ${book.cid}:`, cleanBook.image);
      }
      
      const payload = {
        ...cleanBook,
        cid: book.cid, // 🆕 CRITICAL: Include CID in creation
        userId: this.userId,
        vKey: book.vKey,
      };

      // 🟠 [FORENSIC AUDIT] Log what's being pushed to server
      console.log(`🟠 [PUSH SERVICE] Pushing book to server with image:`, payload.image || 'EMPTY');

      const res = await fetch(url, {
        method: book._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('✅ [PUSH SERVICE] Book success:', book.cid);
        const sData = await res.json();
        
        // 🗑️ HARD DELETE CHECK
        if (book.isDeleted === 1) {
          await db.books.delete(book.localId!);
          console.log(`🗑️ [PUSH SERVICE] Book ${book.cid} hard deleted after sync`);
        } else {
          // 🔍 COMPLETE SYNC UPDATE - ONLY AFTER VERIFIED SERVER SUCCESS
          await db.books.update(book.localId!, {
            _id: sData.data?._id || sData.book?._id || book._id,
            synced: 1, // 🛡️ SAFETY: Update synced flag ONLY on success
            conflicted: 0,
            conflictReason: '',
            serverData: null,
            vKey: book.vKey,
            updatedAt: book.updatedAt
          });
        }
        
        return { success: true };
      } else if (res.status === 409) {
        // 🚨 CONFLICT HANDLING
        const conflictData = await res.json();
        console.log('🚨 [PUSH SERVICE] Version conflict detected for CID:', book.cid);
        
        const conflictedRecord = normalizeRecord({
          ...book,
          conflicted: 1,
          conflictReason: 'VERSION_CONFLICT',
          serverData: conflictData,
          synced: 0
        }, this.userId);
        
        await db.books.update(book.localId!, conflictedRecord);
        
        return { success: false, error: `Version conflict for book ${book.cid}` };
      } else {
        console.error('❌ [PUSH SERVICE] Book failed:', book.cid, res.status);
        return { success: false, error: `HTTP ${res.status} for book ${book.cid}` };
      }
    } catch (error) {
      console.error('❌ [PUSH SERVICE] Single book push failed:', book.cid, error);
      return { success: false, error: `Exception for book ${book.cid}: ${error}` };
    }
  }

  /**
   * 📝 PUSH SINGLE ENTRY
   */
  private async pushSingleEntry(entry: any): Promise<{ success: boolean; error?: string }> {
    try {
      // 🛡️ SCHEMA GUARD: Validate local data before sending to server
      const validationResult = validateEntry(entry);
      if (!validationResult.success) {
        const errorMsg = `🚨 [VALIDATOR] Local entry data corruption blocked for ID: ${entry.cid}. ${validationResult.error}`;
        console.error(errorMsg, { entry });
        return { success: false, error: errorMsg };
      }

      const url = entry._id ? `/api/entries/${entry._id}` : '/api/entries';
      
      // 🧹 CLEAN PAYLOAD
      const { serverData, conflictReason, localId, synced, ...cleanEntry } = entry;
      
      // 🚨 CLEANUP: Remove empty _id for new records
      if (!cleanEntry._id || cleanEntry._id === "") {
        delete (cleanEntry as any)._id;
      }
      
      // 🔥 SYNC GUARD: Handle CID fields during sync
      if (cleanEntry.mediaId && cleanEntry.mediaId.startsWith('cid_')) {
        cleanEntry.mediaId = '';
        console.log(`🔒 [PUSH SERVICE] Preserving CID locally, sending empty to server for entry ${entry.cid}`);
      }
      
      const payload = {
        ...cleanEntry,
        userId: this.userId,
        vKey: entry.vKey,
      };

      // 🟠 [FORENSIC AUDIT] Log what's being pushed to server
      console.log(`🟠 [PUSH SERVICE] Pushing entry to server`);

      const res = await fetch(url, {
        method: entry._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('✅ [PUSH SERVICE] Entry success:', entry.cid);
        const sData = await res.json();
        
        // 🔍 COMPLETE SYNC UPDATE - ONLY AFTER VERIFIED SERVER SUCCESS
        await db.entries.update(entry.localId!, {
          _id: sData.data?._id || sData.entry?._id || entry._id,
          synced: 1, // 🛡️ SAFETY: Update synced flag ONLY on success
          conflicted: 0,
          conflictReason: '',
          serverData: null,
          vKey: entry.vKey,
          updatedAt: entry.updatedAt
        });
        
        // 🗑️ GARBAGE COLLECTION
        if (entry.isDeleted === 1) {
          await db.entries.delete(entry.localId!);
          console.log(`🗑️ [PUSH SERVICE] Entry ${entry.cid} hard deleted after sync`);
        }
        
        return { success: true };
      } else if (res.status === 409) {
        // 🚨 CONFLICT HANDLING
        const conflictData = await res.json();
        console.log('🚨 [PUSH SERVICE] Version conflict detected for CID:', entry.cid);
        
        const conflictedRecord = normalizeRecord({
          ...entry,
          conflicted: 1,
          conflictReason: 'VERSION_CONFLICT',
          serverData: conflictData,
          synced: 0
        }, this.userId);
        
        await db.entries.update(entry.localId!, conflictedRecord);
        
        return { success: false, error: `Version conflict for entry ${entry.cid}` };
      } else {
        console.error('❌ [PUSH SERVICE] Entry failed:', entry.cid, res.status);
        return { success: false, error: `HTTP ${res.status} for entry ${entry.cid}` };
      }
    } catch (error) {
      console.error('❌ [PUSH SERVICE] Single entry push failed:', entry.cid, error);
      return { success: false, error: `Exception for entry ${entry.cid}: ${error}` };
    }
  }

  /**
   * 🗑️ DEFERRED DELETION: Schedule deletion with buffer window
   */
  private scheduleDeletion(localId: string, type: 'BOOK' | 'ENTRY'): void {
    const existingTimeout = this.pendingDeletions.get(localId);
    if (existingTimeout) clearTimeout(existingTimeout);

    // Cache entry data before deletion
    const cacheData = async () => {
      try {
        if (type === 'ENTRY') {
          const entry = await db.entries.get(Number(localId));
          if (entry) {
            const clonedEntry = JSON.parse(JSON.stringify(entry));
            clonedEntry._shadowCacheTimestamp = getTimestamp();
            clonedEntry._shadowCacheId = `${localId}_${getTimestamp()}`;
            this.shadowCache.set(localId, clonedEntry);
          }
        }
      } catch (err) {
        console.warn(`Failed to cache ${type} ${localId}:`, err);
      }
    };

    // Execute deferred deletion
    const timeoutId = setTimeout(async () => {
      try {
        if (type === 'ENTRY') {
          const entry = await db.entries.get(Number(localId));
          if (entry && entry.isDeleted === 1) {
            console.log(`Deletion buffer expired for ${localId}`);
          }
        }
      } catch (err) {
        console.error('Error in deletion buffer:', err);
      }
    }, 8000); // 8-second buffer

    this.pendingDeletions.set(localId, timeoutId);
    
    // Pre-cache data for potential undo
    cacheData();
  }

  /**
   * 🌑 RESTORE FROM SHADOW CACHE
   */
  private async restoreFromShadowCache(localId: string, type: 'BOOK' | 'ENTRY'): Promise<boolean> {
    try {
      const timeoutId = this.pendingDeletions.get(String(localId));
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.pendingDeletions.delete(String(localId));
      }
      
      const cachedEntry = this.shadowCache.get(localId);
      if (!cachedEntry) return false;
      
      const cacheAge = getTimestamp() - cachedEntry._shadowCacheTimestamp;
      if (cacheAge > this.SHADOW_CACHE_TTL) {
        this.clearShadowCacheEntry(localId);
        return false;
      }
      
      const { _shadowCacheTimestamp, _shadowCacheId, ...originalEntry } = cachedEntry;
      const restoredEntry = {
        ...originalEntry,
        isDeleted: 0,
        synced: 0,
        updatedAt: getTimestamp(),
        vKey: (originalEntry.vKey || 0) + 1,
        syncAttempts: 0,
        _restoredFromShadowCache: true,
        _restoredAt: getTimestamp()
      };
      
      if (type === 'ENTRY') {
        await db.entries.update(Number(localId), restoredEntry);
        window.dispatchEvent(new CustomEvent('entry-restored-from-cache', {
          detail: { localId, restoredEntry, cacheAge }
        }));
      }
      
      this.clearShadowCacheEntry(localId);
      console.log(`🌑 [CACHE RESTORE] Restored ${type} ${localId} from shadow cache`);
      return true;
    } catch (err) {
      console.error(`Failed to restore ${type} ${localId}:`, err);
      return false;
    }
  }

  /**
   * 🗑️ CLEAR SHADOW CACHE ENTRY
   */
  private clearShadowCacheEntry(localId: string): void {
    this.shadowCache.delete(localId);
  }

  /**
   * 🔐 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
  }

  /**
   * 🔄 GET SYNC STATUS
   */
  getSyncStatus(): { isSyncing: boolean; userId: string } {
    return {
      isSyncing: this.isSyncing,
      userId: this.userId
    };
  }
}
