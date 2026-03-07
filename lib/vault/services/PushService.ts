"use client";

import { db } from '@/lib/offlineDB';

import { normalizeRecord, validateCompleteness } from '../core/VaultUtils';

import { getTimestamp } from '@/lib/shared/utils';

import { UserManager } from '../core/user/UserManager';

import toast from 'react-hot-toast';

import { validateBook, validateEntry } from '../core/schemas';

import { getVaultStore } from '../store/storeHelper';

import { LicenseVault, RiskManager } from '../security';

import { SecureApiClient } from '../utils/SecureApiClient';

import { SyncGuard } from '../guards/SyncGuard';



// 🛡️ API PATH MAPPING - Prevent pluralization typos

const API_PATH_MAP: Record<string, string> = {

  'BOOK': 'books',

  'ENTRY': 'entries',

  'USER': 'user/profile'

};



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

    const store = getVaultStore();

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

    const store = getVaultStore();

    store.updateSyncStats({

      totalSynced: this.processedItems,

      totalFailed: store.syncStats.totalFailed,

      lastSyncDuration: elapsed

    });

    store.setSyncProgress({

      total: this.totalItems,

      processed: this.processedItems,

      percentage: progress,

      eta: estimatedRemaining / 1000

    });

    

    console.log(`📊 [PROGRESS TRACKER] Batch ${batchNumber} - ${this.processedItems}/${this.totalItems} (${progress.toFixed(1)}%) - Est. remaining: ${(estimatedRemaining/1000).toFixed(1)}s`);

  }



  recordFailure(): void {

    const store = getVaultStore();

    store.updateSyncStats({

      totalSynced: this.processedItems,

      totalFailed: store.syncStats.totalFailed + 1,

      lastSyncDuration: store.syncStats.lastSyncDuration

    });

  }



  complete(): void {

    const totalTime = Date.now() - this.startTime;

    

    // 📊 UPDATE ZUSTAND STATE

    const store = getVaultStore();

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

    const store = getVaultStore();

    store.setSyncStatus('error');

  }

}



/**

 * 🚀 INDUSTRIAL-GRADE BATCH SYNC ENGINE - Handles large data volumes efficiently
 */

export class PushService {

  private static instance: PushService;

  private isSyncing = false;

  private userId: string = '';

  private pendingDeletions = new Map<string, NodeJS.Timeout>();

  private shadowCache = new Map<string, any>();

  private readonly SHADOW_CACHE_TTL = 15000; // 15 seconds

  

  // 🎯 SMART COMPONENTS

  private batchProcessor = new SmartBatchProcessor();

  private _progressTracker = new SyncProgressTracker();

  

  // Expose progress tracker to UI

  get progressTracker() {

    return this._progressTracker;

  }

  // Singleton pattern for centralized access

  static getInstance(): PushService {

    if (!PushService.instance) {

      PushService.instance = new PushService();

    }

    return PushService.instance;

  }

  constructor() {
    // Remove top-level userId initialization to prevent circular dependency
    // userId will be retrieved lazily when methods are called
  }

  /**
   * Provides signed fetch with HMAC-SHA256 headers for secure API calls
   */
  public async secureFetch(url: string, options: RequestInit): Promise<Response> {
    return SecureApiClient.signedFetch(url, options, 'PushService');
  }

  /**
   * Centralized API: Fetch books batch (replaces HydrationService direct fetch)
   */
  public async fetchBooksBatch(userId: string, limit: number = 1000, offset: number = 0): Promise<{ data: any[]; success: boolean; error?: string }> {
    try {
      console.log(`📚 [PUSH SERVICE] Fetching books batch for user ${userId}, limit: ${limit}, offset: ${offset}`);
      const response = await SecureApiClient.signedFetch(`/api/books?userId=${encodeURIComponent(userId)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, 'PushService');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result.books || [];
      
      console.log(`✅ [PUSH SERVICE] Retrieved ${data.length} books`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PUSH SERVICE] Books batch fetch failed:`, error);
      return { success: false, error: String(error), data: [] };
    }
  }

  /**
   * Centralized API: Fetch entries batch (replaces HydrationService direct fetch)
   */
  public async fetchEntriesBatch(userId: string, limit: number = 5000, offset: number = 0): Promise<{ data: any[]; success: boolean; error?: string }> {
    try {
      console.log(`📝 [PUSH SERVICE] Fetching entries batch for user ${userId}, limit: ${limit}, offset: ${offset}`);
      const response = await SecureApiClient.signedFetch(`/api/entries?userId=${encodeURIComponent(userId)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, 'PushService');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result.entries || [];
      
      console.log(`✅ [PUSH SERVICE] Retrieved ${data.length} entries`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PUSH SERVICE] Entries batch fetch failed:`, error);
      return { success: false, error: String(error), data: [] };
    }
  }

  /**
   * Update user profile on server
   */
  public async updateUserProfile(userId: string, profileData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`👤 [PUSH SERVICE] Updating profile for user ${userId}`);
      const response = await SecureApiClient.signedFetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...profileData
        })
      }, 'PushService');
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result;
      
      console.log(`✅ [PUSH SERVICE] Profile updated successfully`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PUSH SERVICE] Profile update failed:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get user profile from server
   */
  public async getUserProfile(userId: string): Promise<{ data?: any; success: boolean; error?: string }> {
    try {
      console.log(`👤 [PUSH SERVICE] Getting profile for user ${userId}`);
      const response = await SecureApiClient.signedFetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }, 'PushService');
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: null }; // User not found
        }
        throw new Error(`Failed to get profile: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result;
      
      if (!data) {
        console.warn(`⚠️ [PUSH SERVICE] User profile not found for ID: ${userId}`);
        return { 
          success: false, 
          error: `User profile not found for ID: ${userId}`
        };
      }
      
      console.log(`✅ [PUSH SERVICE] Retrieved user profile`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PUSH SERVICE] Profile fetch failed:`, error);
      return { success: false, error: String(error) };
    }
  }



  /**
   * 🎯 LIGHTWEIGHT BOOK UPDATE DETECTION
   * Determines if a book update only involves lightweight fields
   */
  private isLightweightBookUpdate(book: any): boolean {
    // 🎯 ACTIVITY UPDATE: Only essential fields changed (timestamp, vKey, sorting)
    const essentialFields = ['_id', 'cid', 'name', 'userId', 'synced', 'isDeleted', 'vKey', 'updatedAt'];
    const bookKeys = Object.keys(book);
    
    // Check if any heavy fields are present in the update
    const heavyFields = ['image', 'mediaCid', 'description', 'phone', 'color', 'type'];
    const hasHeavyFields = heavyFields.some(field => bookKeys.includes(field) && book[field] !== undefined);
    
    // 🎯 LIGHTWEIGHT: No heavy fields and only essential sorting fields
    return !hasHeavyFields && bookKeys.every(key => essentialFields.includes(key));
  }



  /**

   * 🚨 PRIORITY TELEMETRY SYNC - Evidence Pipeline

   * Syncs security telemetry to server BEFORE business data

   */

  public async syncTelemetry(): Promise<{ success: boolean; error?: string; cached?: boolean }> {

    try {

      console.log('🚨 [PRIORITY TELEMETRY] Syncing security evidence to server...');

      

      // Guard clause: Ensure userId and events are valid

      if (!this.userId) {

        console.warn('⚠️ [PRIORITY TELEMETRY] No user ID available, skipping telemetry sync');

        return { success: true };

      }

      

      // Fetch all audit events

      const auditEvents = await db.audits.toArray();

      

      if (auditEvents.length === 0) {

        console.log('✅ [PRIORITY TELEMETRY] No security events to sync');

        return { success: true };

      }

      

      // Filter for SECURITY events (priority)

      const securityEvents = auditEvents.filter((event: any) => event.type === 'SECURITY');

      const otherEvents = auditEvents.filter((event: any) => event.type !== 'SECURITY');

      

      // Priority: Sync security events first

      const allEvents = [...securityEvents, ...otherEvents];

      

      // Ensure sessionId is always valid

      const sessionId = allEvents[0]?.sessionId || 'unknown-session';

      

      // Send to server

      const response = await fetch('/api/telemetry', {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          events: allEvents,

          userId: this.userId,

          sessionId: sessionId

        })

      });

      

      if (response.status === 404) {

        // 🛡️ SILENT SHIELD: Do not throw error, just log a debug message and keep data locally

        console.debug('🔍 [PRIORITY TELEMETRY] Server endpoint not ready. Keeping evidence in local vault.');

        return { success: true, cached: true };

      }

      

      if (!response.ok) {

        throw new Error(`Server response: ${response.status}`);

      }

      

      // Clear synced events on success - ATOMIC TRANSACTION

      const eventIds = allEvents.map(event => event.id!).filter(Boolean);

      if (eventIds.length > 0) {

        await db.transaction('rw', db.audits, async () => {

          await db.audits.bulkDelete(eventIds);

        });

        console.log(`✅ [PRIORITY TELEMETRY] Synced ${eventIds.length} security events to server`);

      }

      

      return { success: true };

      

    } catch (error) {

      console.error('❌ [PRIORITY TELEMETRY] Failed to sync security evidence:', error);

      return { success: false, error: String(error) };

    }

  }



  /**

   * BATCHED PUSH PENDING DATA TO SERVER

   */

  async pushPendingData(changedCid?: string): Promise<{ success: boolean; itemsProcessed: number; errors: string[] }> {

    // PRIORITY SYNC: Sync telemetry evidence FIRST

    await this.syncTelemetry();

    

    // 🆕 SYNC GUARD: Centralized validation (VERBATIM replacement)
    const guardResult = await SyncGuard.validateSyncAccess({
      serviceName: 'PushService',
      onError: (msg) => console.error(`🔒 [PUSH SERVICE] ${msg}`),
      returnError: (msg) => ({ success: false, itemsProcessed: 0, errors: [msg] })
    });
    if (!guardResult.valid) {
      return guardResult.returnValue as { success: boolean; itemsProcessed: number; errors: string[] };
    }



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
      // � SYNC TSUNAMI GUARD: Target specific CID instead of mass queries
      let unsyncedBooks: any[] = [];
      let unsyncedEntries: any[] = [];

      try {
        // 🛡️ SOVEREIGN ID GUARD: Wait for identity to be ready before aborting
        let currentSovereignId = UserManager.getInstance().getUserId();
        if (!currentSovereignId) {
          console.log('⏳ [PUSH SERVICE] Identity not ready yet, waiting...');
          try {
            currentSovereignId = await UserManager.getInstance().waitForIdentity();
            console.log('✅ [PUSH SERVICE] Identity ready, proceeding with sync');
          } catch (error) {
            console.error('🚨 [PUSH SERVICE] Identity timeout after 10s - aborting sync');
            return { success: false, itemsProcessed: 0, errors: ['Identity timeout: No user data available after 10 seconds'] };
          }
        }

        if (changedCid) {
          // 🎯 TARGETED SYNC: Only push the specific CID that changed
          console.log(`🎯 [SYNC TSUNAMI GUARD] Targeted sync for CID: ${changedCid}`);
          
          const targetBook = await db.books.where('cid').equals(changedCid)
            .and((book: any) => book.synced === 0 && book.userId === currentSovereignId)
            .first();
          if (targetBook) {
            unsyncedBooks = [targetBook];
          }
          
          // Also check for entries with this bookId
          const targetEntries = await db.entries.where('bookId').equals(changedCid)
            .and((entry: any) => entry.synced === 0 && entry.userId === currentSovereignId)
            .toArray();
          unsyncedEntries = targetEntries;
          
          console.log(`🎯 [TARGETED SYNC] Found ${unsyncedBooks.length} book and ${unsyncedEntries.length} entries for CID ${changedCid}`);
        } else {
          // 🚨 FALLBACK: Use smart filtering for general sync
          const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes ago
          
          const allUnsyncedBooks = await db.books.where('synced').equals(0)
            .and((book: any) => book.userId === currentSovereignId)
            .toArray();
          unsyncedBooks = allUnsyncedBooks.filter((book: any) => {
            const lastModified = book.lastModified || book.updatedAt || book.createdAt || 0;
            return lastModified > recentThreshold;
          });

          // For entries, we can be more permissive since entries are usually recent
          unsyncedEntries = await db.entries.where('synced').equals(0)
            .and((entry: any) => entry.userId === currentSovereignId)
            .toArray();

          console.log(`🛡️ [PUSH] Smart filtering applied: ${unsyncedBooks.length}/${allUnsyncedBooks.length} recent books, ${unsyncedEntries.length} entries`);
        }
        
      } catch (error) {
        console.error('🚨 [PUSH] Error querying unsynced items:', error);
        // Fallback to empty arrays to prevent sync tsunami
        unsyncedBooks = [];
        unsyncedEntries = [];
      }

      const totalItems = unsyncedBooks.length + unsyncedEntries.length;

      

      console.log('📡 [PUSH] Found pending items:', totalItems);

      

      this._progressTracker.start(totalItems);

      

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

        this._progressTracker.complete();

      } else {

        this._progressTracker.error();

      }

      

      console.log('✅ [BATCH PUSH SERVICE] Industrial-grade batched push complete:', { itemsProcessed, errors });

      return { success: errors.length === 0, itemsProcessed, errors };

      

    } catch (error) {

      console.error('❌ [BATCH PUSH SERVICE] Push sync failed:', error);

      errors.push(`Push sync failed: ${error}`);

      this._progressTracker.error();

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

        

        this._progressTracker.updateBatch(i + 1, batch.length);

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

      // 🛡️ SOVEREIGN ID ENFORCEMENT: Get current user ID for strict filtering
      const currentSovereignId = UserManager.getInstance().getUserId();
      if (!currentSovereignId) {
        console.error('🚨 [SOVEREIGN PUSH] No user ID available for entries - aborting');
        return { success: false, processed: 0, errors: ['No sovereign ID available for entries'] };
      }

      const pendingEntries = await db.entries.where('synced').equals(0)
        .and((entry: any) => entry.userId === currentSovereignId)
        .toArray();

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

        

        this._progressTracker.updateBatch(i + 1, batch.length);

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

      const { serverData, conflictReason, localId, synced, syncAttempts, localStatus, lastAttempt, lastSniperFetch, color, ...cleanBook } = book;

      

      // 🚨 CLEANUP: Remove empty _id for new records

      if (!cleanBook._id || cleanBook._id === "") {

        delete (cleanBook as any)._id;

      }

      

      // 🆕 LIGHTWEIGHT PATCH DETECTION: Check if this is a timestamp-only update

      const isLightweightUpdate = this.isLightweightBookUpdate(cleanBook);

      

      if (isLightweightUpdate) {

        // 🎯 STRIP HEAVY FIELDS for activity/timestamp updates

        delete cleanBook.image;

        delete cleanBook.mediaCid;

        delete cleanBook.description;

        delete cleanBook.phone;

        delete cleanBook.color;

        delete cleanBook.type; // Book type field

        console.log(`🎯 [LIGHTWEIGHT PATCH] Stripped heavy fields for book ${book.cid} - activity update`);

      }

      

      // 🛡️ PUSH VALIDATOR: Prevent empty image strings from corrupting server

      if (cleanBook.image === "") {

        delete cleanBook.image;

        console.log(`🛡️ [PUSH VALIDATOR] Removed empty image string for book ${book.cid}`);

      }

      

      // 🆕 MEDIA HANDSHAKE: Handle CID references and upload status

      if (cleanBook.image && cleanBook.image.startsWith('cid_')) {

        console.log(`🔄 [MEDIA HANDSHAKE] Book ${book.cid} has CID reference: ${cleanBook.image}`);

        

        // Check MediaStore for upload status

        const media = await db.mediaStore.where('cid').equals(cleanBook.image).first();

        if (!media) {

          console.warn(`⚠️ [MEDIA HANDSHAKE] No media record found for CID: ${cleanBook.image}`);

          cleanBook.image = ''; // Remove invalid CID

        } else if (media.localStatus !== 'uploaded') {

          console.warn(`⚠️ [OFFLINE-FIRST] Media pending, proceeding with CID for book ${book.cid}`);

          

          // 🚀 OFFLINE-FIRST: Keep CID reference, sync book anyway

          cleanBook.mediaCid = cleanBook.image; // Preserve CID for server awareness

          // Don't return false - allow sync to continue

        } else if (media.cloudinaryUrl) {

          // ✅ SUCCESS: Swap CID with actual Cloudinary URL

          console.log(`🚀 [MEDIA HANDSHAKE] Swapping CID ${cleanBook.image} with URL: ${media.cloudinaryUrl}`);

          cleanBook.image = media.cloudinaryUrl; // Update surface URL

          cleanBook.mediaCid = book.image || book.mediaCid; // 🛡️ IDENTITY DNA: Preserve original CID ALWAYS

        } else {

          console.warn(`⚠️ [MEDIA HANDSHAKE] Media marked uploaded but no URL found for CID: ${cleanBook.image}`);

          cleanBook.image = ''; // Remove broken reference

        }

      }

      

      // 🆕 CRITICAL: Ensure Cloudinary URLs are ALWAYS included

      if (cleanBook.image && cleanBook.image.startsWith('http')) {

        console.log(`🚀 [PUSH SERVICE] Including Cloudinary URL in payload for book ${book.cid}:`, cleanBook.image);

      }

      

      // 🛡️ SOVEREIGN ID ENFORCEMENT: Get fresh user ID at payload construction
      const sovereignUserId = UserManager.getInstance().getUserId();
      if (!sovereignUserId) {
        console.error('🚨 [SOVEREIGN PUSH] CRITICAL: No user ID available at payload construction - aborting push');
        return { success: false, error: 'CRITICAL: No sovereign ID available for payload' };
      }

      const payload = {

        ...cleanBook,

        cid: book.cid, // 🆕 CRITICAL: Include CID in creation

        userId: sovereignUserId, // 🛡️ SOVEREIGN ID: Fresh from UserManager

        vKey: book.vKey,

      };

      // 🟠 [FORENSIC AUDIT] Log what's being pushed to server

      console.log(`🟠 [PUSH SERVICE] Pushing book to server with image:`, payload.image || 'EMPTY');



      const res = await fetch(url, {

        method: book._id ? 'PUT' : 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(payload),

      });

      // 📡 [BLOOD-TRAIL] Log server response for forensic audit
      console.log('📡 [PUSH_AUDIT] Server Response for CID:', book.cid, 'Status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('🚨 [PUSH_AUDIT] Server Error Response:', errorText);
      }



      if (res.ok) {

        console.log('✅ [PUSH SERVICE] Book success:', book.cid);

        const sData = await res.json();

        

        // 🆕 FLEXIBLE RESPONSE PARSING: Handle multiple response formats

        const serverBook = sData.data || sData.book || sData;

        const serverId = serverBook?._id || serverBook?.id;

        

        if (!serverBook || !serverId) {

          console.error('❌ [PUSH SERVICE] Invalid server response format:', sData);

          return { success: false, error: 'Invalid server response format' };

        }

        

        console.log(`🟢 [PUSH SERVICE] Server response parsed - ID: ${serverId}, CID: ${serverBook.cid}`);

        

        // 🗑️ HARD DELETE CHECK

        if (book.isDeleted === 1) {

          await db.books.delete(book.localId!);

          console.log(`🗑️ [PUSH SERVICE] Book ${book.cid} hard deleted after sync`);

        } else {

          // 🔍 COMPLETE SYNC UPDATE - ONLY AFTER VERIFIED SERVER SUCCESS

          await db.books.update(book.localId!, {

            _id: serverId,

            synced: 1, // 🛡️ SAFETY: Update synced flag ONLY on success

            conflicted: 0,

            conflictReason: '',

            serverData: null,

            vKey: book.vKey,

            updatedAt: book.updatedAt

          });

          

          // 🆕 CASCADE ID UPDATE: Update all entries to reference new server ID

          const updatedEntries = await db.entries

            .where('bookId')

            .equals(String(book.localId))

            .modify({ bookId: String(serverId) });

          

          console.log(`✅ [PUSH SERVICE] Book ${book.cid} marked as synced (ID: ${serverId})`);

          console.log(`🔗 [CASCADE] Updated ${updatedEntries} entries to reference server ID: ${serverId}`);

          

          // 🛡️ IDENTITY BLACK HOLE FIX: Preserve activeBook during sync

          const vaultStore = getVaultStore();

          await vaultStore.refreshBooks();

          

          // Check if synced book is the current activeBook and update it

          const currentActiveBook = vaultStore.activeBook;

          if (currentActiveBook && (

            currentActiveBook.localId === book.localId || 

            currentActiveBook.cid === book.cid ||

            currentActiveBook._id === book.localId

          )) {

            // Fetch fresh book data with server ID

            const updatedBook = await db.books.get(book.localId!);

            if (updatedBook) {

              await vaultStore.setActiveBook(updatedBook);

              console.log(`🛡️ [IDENTITY FIX] Updated activeBook with server data: ${updatedBook.cid}`);

            }

          }

        }

        

        return { success: true };

      } else if (res.status === 409) {

        // 🚨 CONFLICT HANDLING

        const conflictData = await res.json();

        console.log('🚨 [PUSH SERVICE] Version conflict detected for CID:', book.cid);

        

        // 🆕 AUTOMATIC CONFLICT REPAIR: For soft-delete books, increment vKey to win next sync

        if (book.isDeleted === 1) {

          console.log(`🔧 [AUTO REPAIR] Soft-delete conflict detected for ${book.cid}, incrementing vKey to force resolution`);

          

          const repairedRecord = normalizeRecord({

            ...book,

            conflicted: 0, // Clear conflict flag

            conflictReason: '',

            serverData: null,

            synced: 0,

            vKey: (book.vKey || 0) + 100, // 🛡️ VKEY UPGRADE: +100 ensures override

            updatedAt: getTimestamp()

          }, this.userId);

          

          await db.books.update(book.localId!, repairedRecord);

          console.log(`✅ [AUTO REPAIR] Book ${book.cid} vKey incremented to ${repairedRecord.vKey} for next sync attempt`);

          

          return { success: false, error: `Version conflict for book ${book.cid} - Auto-repair applied` };

        }

        

        // Standard conflict handling for non-deleted books

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

      const { serverData, conflictReason, localId, synced, syncAttempts, lastAttempt, _emergencyFlushed, _emergencyFlushAt, ...cleanEntry } = entry;

      

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

        

        // 🆕 AUTOMATIC CONFLICT REPAIR: For soft-delete entries, increment vKey to win next sync

        if (entry.isDeleted === 1) {

          console.log(`🔧 [AUTO REPAIR] Soft-delete conflict detected for ${entry.cid}, incrementing vKey to force resolution`);

          

          const repairedRecord = normalizeRecord({

            ...entry,

            conflicted: 0, // Clear conflict flag

            conflictReason: '',

            serverData: null,

            synced: 0,

            vKey: (entry.vKey || 0) + 100, // 🛡️ VKEY UPGRADE: +100 ensures override of any server drift

            updatedAt: getTimestamp()

          }, this.userId);

          

          await db.entries.update(entry.localId!, repairedRecord);

          console.log(`✅ [AUTO REPAIR] Entry ${entry.cid} vKey incremented to ${repairedRecord.vKey} for next sync attempt`);

          

          return { success: false, error: `Version conflict for entry ${entry.cid} - Auto-repair applied` };

        }

        

        // Standard conflict handling for non-deleted entries

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

   * � PRIORITY SYSTEM CONFIG - Critical system operations

   * Bypasses normal business data queue for immediate execution

   */

  public async pushSystemConfig(config: {

    type: 'PROFILE_UPDATE' | 'SETTINGS_SYNC' | 'ACCOUNT_DELETION';

    priority: 'CRITICAL' | 'HIGH';

    data: {

      // Profile Updates

      name?: string;

      image?: string;

      password?: string;

      

      // Settings Sync

      currency?: string;

      categories?: string[];

      preferences?: Record<string, any>;

      

      // Account Deletion

      deleteReason?: string;

      confirmDeletion?: boolean;

    };

    metadata?: {

      sessionId: string;

      timestamp: number;

      userId: string;

    };

  }): Promise<{ success: boolean; error?: string }> {

    try {

      console.log(`🚨 [SYSTEM CONFIG] Processing ${config.type} with priority: ${config.priority}`);

      

      // 🛡️ SECURITY: Bypass normal business data queue

      // System configs get IMMEDIATE priority over books/entries

      

      // SECURITY GUARDS (same as business data)

      const { networkMode, isSecurityLockdown } = getVaultStore();

      if (networkMode === 'RESTRICTED' || isSecurityLockdown) {

        return { success: false, error: 'System config blocked - restricted mode' };

      }

      

      // 🎯 ROUTE TO SPECIFIC ENDPOINTS

      let endpoint: string;

      let method: 'POST' | 'PUT' | 'DELETE';

      

      switch (config.type) {

        case 'PROFILE_UPDATE':

          endpoint = '/api/auth/update';

          method = 'PUT';

          break;

        case 'SETTINGS_SYNC':

          endpoint = '/api/user/settings';

          method = 'PUT';

          break;

        case 'ACCOUNT_DELETION':

          endpoint = '/api/auth/delete';

          method = 'DELETE';

          break;

      }

      

      // 🚨 IMMEDIATE EXECUTION: No queuing, no batching

      const response = await SecureApiClient.signedFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Priority': config.priority,
          'X-System-Config': config.type
        },
        body: JSON.stringify({
          ...config.data,
          userId: this.userId,
          ...config.metadata
        })
      }, 'PushService');

      

      if (!response.ok) {

        throw new Error(`System config failed: ${response.status}`);

      }

      

      console.log(`✅ [SYSTEM CONFIG] ${config.type} completed successfully`);

      return { success: true };

      

    } catch (error) {

      console.error(`❌ [SYSTEM CONFIG] ${config.type} failed:`, error);

      return { success: false, error: String(error) };

    }

  }



  /**

   * � SET USER ID

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
