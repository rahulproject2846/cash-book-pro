"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, validateCompleteness } from '../core/VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import { validateBook, validateEntry } from '../core/schemas';
import { getVaultStore } from '../store/storeHelper';
import { LicenseVault, RiskManager } from '../security';
import { SecureApiClient } from '../utils/SecureApiClient';
import { SyncGuard } from '../guards/SyncGuard';
import { IdentityProvider } from '@/lib/utils/identityProvider';

// 🛡️ API PATH MAPPING - Prevent pluralization typos
const API_PATH_MAP: Record<string, string> = {
  'BOOK': 'books',
  'ENTRY': 'entries',
  'USER': 'user/profile'
};

/**
 * 🚀 SMART BATCH PROCESSOR - Intelligent batching with payload size detection
 * Reused from PushService for consistency
 */
class SmartBatchProcessor<T> {
  /**
   * 📏 Calculate optimal delay based on server response time
   */
  calculateOptimalDelay(previousResponseTime: number, previousFailed: boolean): number {
    const BASE_DELAY = 1000; // 1 second for pull (faster than push)
    const SLOW_RESPONSE_THRESHOLD = 3000; // 3 seconds
    const SLOW_RESPONSE_DELAY = 2000; // 2 seconds
    
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
 * Reused from PushService for consistency
 */
class SyncProgressTracker {
  private currentBatch = 0;
  private totalBatches = 0;
  private totalItems = 0;
  private processedItems = 0;
  private startTime = Date.now();
  private lastProgressUpdate = 0;
  private readonly PROGRESS_THROTTLE_MS = 1000; // Throttle updates to once per second
  private readonly BATCH_UPDATE_INTERVAL = 5; // Update after every 5 batches

  start(totalItems: number): void {
    this.totalItems = totalItems;
    this.processedItems = 0;
    this.currentBatch = 0;
    this.startTime = Date.now();
    this.lastProgressUpdate = 0;
    
    // 📊 UPDATE ZUSTAND STATE
    const store = getVaultStore();
    store.updateSyncStats({
      totalSynced: 0,
      totalFailed: 0,
      lastSyncDuration: null
    });
    store.setSyncStatus('syncing');
    
    console.log(`📊 [PULL PROGRESS] Starting pull: ${totalItems} items`);
  }

  updateBatch(batchNumber: number, batchSize: number): void {
    this.currentBatch = batchNumber;
    this.processedItems += batchSize;
    
    const progress = (this.processedItems / this.totalItems) * 100;
    const elapsed = Date.now() - this.startTime;
    const estimatedRemaining = this.processedItems > 0 
      ? (elapsed / this.processedItems) * (this.totalItems - this.processedItems)
      : 0;
    
    // 🚀 PROGRESS THROTTLING: Update UI only once per second OR every 5 batches
    const now = Date.now();
    const shouldUpdateByTime = now - this.lastProgressUpdate >= this.PROGRESS_THROTTLE_MS;
    const shouldUpdateByBatches = batchNumber % this.BATCH_UPDATE_INTERVAL === 0;
    
    if (shouldUpdateByTime || shouldUpdateByBatches) {
      this.lastProgressUpdate = now;
      
      // 📊 UPDATE ZUSTAND STATE (THROTTLED)
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
    }
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
    
    console.log(`📊 [PULL PROGRESS] Pull completed in ${totalTime}ms`);
  }

  error(): void {
    const store = getVaultStore();
    store.setSyncStatus('error');
  }
}

/**
 * 🚀 PULL SERVICE - Industrial-grade batched data synchronization from server
 * Symmetric to PushService with fault-tolerant architecture
 */
export class PullService {
  private userId: string = '';
  private isPulling: boolean = false;
  private pullStartTime: number = 0;
  
  // 🔒 PULL LOCKING SYSTEM: Prevent concurrent writes to same record
  private static pullLocks = new Set<string>();
  
  /**
   * 🔒 ACQUIRE LOCK
   * Attempts to acquire a lock for a specific record ID
   * @param id - The record ID to lock
   * @returns boolean - True if lock acquired, false if already locked
   */
  private static acquireLock(id: string): boolean {
    if (this.pullLocks.has(id)) {
      return false; // Already locked
    }
    this.pullLocks.add(id);
    return true;
  }
  
  /**
   * 🔒 RELEASE LOCK
   * Releases a lock for a specific record ID
   * @param id - The record ID to unlock
   */
  private static releaseLock(id: string): void {
    this.pullLocks.delete(id);
  }

  private batchProcessor = new SmartBatchProcessor<any>();
  private _progressTracker = new SyncProgressTracker();

  constructor() {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [PULL SERVICE] Initialized with fault-tolerant architecture');
    }
  }

  /**
   * 🔍 SECURITY CHECKS
   */
  private async performSecurityChecks(user: any): Promise<{ valid: boolean; error?: string }> {
    try {
      const licenseAccess = LicenseVault.validateAccess(user);
      if (!licenseAccess.access) {
        return { valid: false, error: 'License access denied' };
      }

      const lockdownStatus = RiskManager.isLockdown(user);
      if (lockdownStatus) {
        return { valid: false, error: 'User in lockdown' };
      }

      let signatureValid = false;
      try {
        signatureValid = await LicenseVault.verifySignature(user);
      } catch (cryptoError) {
        console.error('🔐 [PULL SERVICE] Crypto API error during signature verification:', cryptoError);
        return { valid: false, error: 'Cryptographic verification failed' };
      }
      
      if (!signatureValid) {
        return { valid: false, error: 'License signature invalid' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 🔍 TELEMETRY INTEGRITY VERIFICATION
   */
  private async verifyTelemetryIntegrity(maxRetries: number = 3): Promise<{ valid: boolean; error?: string }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { UserManager } = await import('../core/user/UserManager');
      const user = await db.users.where('userId').equals(UserManager.getInstance().getUserId() || '').first();
        if (user) {
          // Success - user found, proceed with security checks
          return await this.performSecurityChecks(user);
        }
        
        if (attempt === maxRetries) {
          return { valid: false, error: 'User profile not found after retries' };
        }
        
        // ⏱️ EXPONENTIAL BACKOFF: Non-blocking wait
        const delay = Math.min(Math.pow(2, attempt) * 100, 1000); // Cap at 1s
        console.log(`⏳ [PULL SECURITY] Retry ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        if (attempt === maxRetries) {
          return { valid: false, error: String(error) };
        }
        // Continue retry on error
      }
    }
    return { valid: false, error: 'User profile not found after maximum retries' };
  }

  /**
   * 🚀 BATCHED PULL PENDING DATA FROM SERVER
   */
  async pullPendingData(): Promise<{ success: boolean; itemsProcessed: number; errors: string[] }> {
    // 🛡️ INTEGRATE IDENTITY PROVIDER: Get sovereign ID first
    const sovereignId = await IdentityProvider.getSovereignId();
    if (!sovereignId) {
      console.error('🔒 [PULL SERVICE] No sovereign ID available - blocking data pull');
      return { success: false, itemsProcessed: 0, errors: ['No sovereign ID available'] };
    }
    
    // Set userId from sovereign ID anchor
    this.userId = sovereignId;
    
    // 🛡️ SECURITY INTERLOCK: Verify telemetry first
    const telemetryResult = await this.verifyTelemetryIntegrity();
    if (!telemetryResult.valid) {
      console.error('🔒 [PULL SERVICE] Security verification failed - blocking data pull');
      return { success: false, itemsProcessed: 0, errors: [telemetryResult.error || 'Security verification failed'] };
    }
    
    // 🆕 SYNC GUARD: Centralized validation (VERBATIM replacement)
    const guardResult = await SyncGuard.validateSyncAccess({
      serviceName: 'PullService',
      onError: (msg) => console.error(`🔒 [PULL SERVICE] ${msg}`),
      returnError: (msg) => ({ success: false, itemsProcessed: 0, errors: [msg] })
    });
    if (!guardResult.valid) {
      return guardResult.returnValue as { success: boolean; itemsProcessed: number; errors: string[] };
    }

    if (this.isPulling) {
      console.log('🚀 [BATCH PULL SERVICE] Already pulling, skipping...');
      return { success: false, itemsProcessed: 0, errors: ['Already pulling'] };
    }

    this.isPulling = true;
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [BATCH PULL SERVICE] Starting industrial-grade batched pull sync...');
      }
      
      // 🎯 PRIORITY 0: USER SETTINGS FIRST (MUST COMPLETE BEFORE DATA)
      const userSettingsResult = await this.pullUserSettings();
      if (!userSettingsResult.success) {
        errors.push(userSettingsResult.error || 'Failed to pull user settings');
      }
      
      // 🎯 PRIORITY 1: BOOKS FIRST (MUST COMPLETE BEFORE ENTRIES)
      const booksResult = await this.pullBatchedBooks();
      itemsProcessed += booksResult.processed;
      errors.push(...booksResult.errors);
      
      // 🎯 PRIORITY 2: ENTRIES (ONLY AFTER ALL BOOKS SUCCESS)
      if (booksResult.success) {
        const entriesResult = await this.pullBatchedEntries();
        itemsProcessed += entriesResult.processed;
        errors.push(...entriesResult.errors);
      } else {
        errors.push('Skipping entries due to book pull failures');
      }
      
      if (errors.length === 0) {
        this._progressTracker.complete();
      } else {
        this._progressTracker.error();
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [BATCH PULL SERVICE] Industrial-grade batched pull complete:', { itemsProcessed, errors });
      }
      return { success: errors.length === 0, itemsProcessed, errors };
      
    } catch (error) {
      console.error('❌ [BATCH PULL SERVICE] Pull sync failed:', error);
      errors.push(`Pull sync failed: ${error}`);
      this._progressTracker.error();
      return { success: false, itemsProcessed, errors };
    } finally {
      this.isPulling = false;
    }
  }

  /**
   * 🧑 PULL USER SETTINGS - Fetch user profile and update local state
   */
  public async pullUserSettings(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧑 [PULL SERVICE] Fetching user settings from server...');
      
      const { UserManager } = await import('../core/user/UserManager');
      const response = await SecureApiClient.signedFetch(`/api/user/profile?userId=${encodeURIComponent(UserManager.getInstance().getUserId() || '')}`, {
        method: 'GET'
      }, 'PullService');
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ [PULL SERVICE] User profile not found on server, using local defaults');
          return { success: true }; // Not an error, just use local defaults
        }
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      
      const result = await response.json();
      const user = result.user;
      
      if (!user) {
        console.warn('⚠️ [PULL SERVICE] No user data in response');
        return { success: true }; // Use local defaults
      }
      
      // 🎯 UPDATE LOCAL ZUSTAND STATE
      const { useVaultStore } = await import('../store/index');
      
      // 🔄 FLAG AS REMOTE MUTATION TO PREVENT LOOP
      useVaultStore.setState({ isRemoteMutation: true });
      
      // Extract user settings
      const { categories, currency, preferences } = user;
      const store = useVaultStore.getState();
      
      // Update store if values are present
      if (categories && Array.isArray(categories)) {
        // Note: You may need to add setCategories to the store if it doesn't exist
        console.log('📝 [PULL SERVICE] Updating categories:', categories);
        if (store.setCategories) {
          store.setCategories(categories);
        }
      }
      
      if (currency && typeof currency === 'string') {
        console.log('💰 [PULL SERVICE] Updating currency:', currency);
        if (store.setCurrency) {
          store.setCurrency(currency);
        }
      }
      
      if (preferences && typeof preferences === 'object') {
        console.log('⚙️ [PULL SERVICE] Updating preferences:', preferences);
        if (store.setPreferences) {
          store.setPreferences(preferences);
        }
      }
      
      // 🔄 CLEAR REMOTE MUTATION FLAG
      useVaultStore.setState({ isRemoteMutation: false });
      
      console.log('✅ [PULL SERVICE] User settings pulled successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [PULL SERVICE] Failed to pull user settings:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 📚 PULL BATCHED BOOKS with checkpoint resume capability
   */
  private async pullBatchedBooks(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let previousResponseTime = 0;
    let previousFailed = false;

    try {
      // 🔄 CHECKPOINT RESUME: Read syncPoints to avoid full fetch
      const checkpoint = await db.syncPoints.where('type').equals('books').and((item: any) => item.userId === this.userId).first();
      // 🎯 GUARD: Ensure lastSequence defaults to 0 using nullish coalescing
      let lastSequence = checkpoint?.lastSequence ?? 0;
      
      let offset = 0;
      
      console.log('🚀 [BATCH PULL SERVICE] Starting books pull from sequence:', lastSequence);
      
      let hasMore = true;
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      let batchIndex = 0;
      let consecutiveEmptyBatches = 0;
      let consecutiveInvalidBatches = 0;
      const maxLoopCount = 500;
      
      // 🎯 DYNAMIC TOTAL DETECTION: Get actual total from first batch
      let totalItems = 0;
      let isFirstBatch = true;
      
      while (hasMore && batchIndex < maxLoopCount) {
        batchIndex++;
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        try {
          // 🎯 BULK FETCH: Single large fetch to kill API storm
          const response = await SecureApiClient.signedFetch(
            `/api/books?userId=${encodeURIComponent(this.userId)}&limit=1000&offset=0&sequenceAfter=${lastSequence}`,
            { method: 'GET' },
            'PullService'
          );
          
          if (response.status === 404) {
            console.warn('⚠️ [PULL SERVICE] End of data stream (404), stopping pull');
            hasMore = false;
            break; // End of data, not an error
          }

          if (!response.ok) {
            throw new Error(`Server response: ${response.status}`);
          }
          
          const batch = await response.json();
          const books = batch.data || batch.books || [];
          
          // DYNAMIC TOTAL UPDATE: Extract from server response if available
          if (isFirstBatch && batch.total) {
            totalItems = batch.total;
            this._progressTracker.start(totalItems);
            isFirstBatch = false;
          } else if (isFirstBatch) {
            // Fallback: Estimate from first batch if no total provided
            totalItems = books.length < 20 ? books.length : 1000; // Safer estimate
            this._progressTracker.start(totalItems);
            isFirstBatch = false;
          }
          
          if (books.length === 0) {
            consecutiveEmptyBatches++;
            
            // MAX-TRY GUARD: Stop after 3 consecutive empty batches
            if (consecutiveEmptyBatches >= 3) {
              console.error(' [PULL SERVICE] Max consecutive empty batches reached, stopping pull to prevent infinite loop');
              // Log critical telemetry event
              await db.audits.add({
                userId: this.userId,
                type: 'SECURITY',
                event: 'INFINITE_LOOP_PREVENTED',
                details: `Stopped after ${batchIndex} batches with ${consecutiveEmptyBatches} consecutive empties`,
                timestamp: Date.now(),
                severity: 'CRITICAL'
              });
              hasMore = false;
              break;
            }
            
            // Continue to next batch - delta sync uses sequenceAfter
            continue;
          } else {
            consecutiveEmptyBatches = 0; // Reset counter on successful batch
          }
          
          // 🎯 KILL INFINITE PULL: Strict termination when books < 20
          if (books.length < 20) {
            hasMore = false;
            break;
          }
          
          // SEQUENCE NUMBER VERIFICATION
          const validBooks = books.filter((book: any) => 
            lastSequence === 0 ? true : book.sequenceNumber > lastSequence
          );
          
          // INVALID BATCH GUARD: Stop if we get valid=0 but books>0 for 3 consecutive batches
          if (validBooks.length === 0 && books.length > 0) {
            consecutiveInvalidBatches++;
            console.warn(` [PULL SERVICE] Invalid batch ${batchIndex} - consecutive invalid: ${consecutiveInvalidBatches}`);
            
            if (consecutiveInvalidBatches >= 3) {
              console.error(' [PULL SERVICE] Max consecutive invalid batches reached, assuming caught up - stopping pull');
              await db.audits.add({
                userId: this.userId,
                type: 'SECURITY',
                event: 'CAUGHT_UP_DETECTED',
                details: `Stopped after ${batchIndex} batches with ${consecutiveInvalidBatches} consecutive invalid batches`,
                timestamp: Date.now(),
                severity: 'INFO'
              });
              hasMore = false;
              break;
            }
          } else {
            consecutiveInvalidBatches = 0; // Reset counter on valid batch
          }
          
          // COMMIT BATCH - SINGLE TRANSACTION FOR 1000 RECORDS
          try {
            // Surround the loop with ONE transaction
            await db.transaction('rw', [db.books, db.syncPoints], async () => {
              for (const book of validBooks) {
                try {
                  // SAFETY GUARD: Validate completeness before storing
                  // SOFT VALIDATION: Accept server data, fix missing fields locally
                  const validation = validateCompleteness(book, 'book');
                  if (!validation.isValid) {
                    console.warn(`⚠️ [SOFT VALIDATION] Book ${book.cid} incomplete, fixing missing fields: ${validation.missingFields.join(', ')}`);
                    // RESCUE: Inject missing fields instead of rejecting
                    if (validation.missingFields.includes('isPinned')) book.isPinned = 0;
                    if (validation.missingFields.includes('mediaCid')) book.mediaCid = '';
                    if (validation.missingFields.includes('image')) book.image = '';
                    // Continue processing - don't skip entire record
                  }
                  
                  const result = await this.commitSingleBook(book);
                  if (result.success && result.localId) {
                    // 🛡️ DNA Law 2.A: Triple-Link ID usage
                    const bookLocalId = String(result.localId);
                    
                    // 🛡️ [PATHOR LOGIC] Fetch the CLEAN record from Dexie to get the correctly mapped fields
                    const storedRecord = await db.books.get(result.localId);
                    
                    // Only call downloader if we have a real HTTP URL and no CID locally
                    if (storedRecord?.image?.startsWith('http') && !storedRecord?.mediaCid) {
                      console.log(`🚀 [SYNC] Triggering media resolution for ID: ${bookLocalId}`);
                      // No need to await, let it run in background
                      this.hydrateMissingMedia(storedRecord.image, bookLocalId).catch(error => {
                        console.warn(`⚠️ [PULL SERVICE] Background media download failed for book ${bookLocalId}:`, error);
                      });
                    }
                  } else {
                    // 🛡️ ONLY COUNT AS FAILURE IF ACTUAL ERROR EXISTS
                    if (!result.success && result.error) {
                      errors.push(result.error || `Failed to commit book ${book.cid}`);
                      batchSuccess = false;
                    }
                  }
                } catch (error) {
                  errors.push(`Book ${book.cid} commit failed: ${error}`);
                  batchSuccess = false;
                }
              }
              
              // 🎯 BATCH PROCESSING: Simplified without checkpoint saving
              if (validBooks.length > 0) {
                const maxSequence = Math.max(...validBooks.map((b: any) => b.sequenceNumber || 0));
                console.log(`✅ [BATCH PULL SERVICE] Processed batch ${batchIndex} with ${validBooks.length} books, max sequence: ${maxSequence}`);
                lastSequence = maxSequence;
                processed += validBooks.length; // 🛡️ CRITICAL: Increment processed counter
                
                // 🎯 UPDATE SYNC PROGRESS: Reflect 1000-item jump
                this._progressTracker.updateBatch(batchIndex, validBooks.length);
              }
            });
          } catch (error: any) {
            // 💾 STORAGE QUOTA SAFETY: Handle quota exceeded gracefully
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              console.error('💾 [PULL SERVICE] Storage quota exceeded, pausing sync gracefully');
              errors.push('Storage quota exceeded - please free up space');
              hasMore = false;
              break;
            } else {
              throw error; // Re-throw non-quota errors
            }
          }
          
          // 📊 RECORD RESPONSE TIME AND CALCULATE DELAY
          const responseTime = Date.now() - batchStartTime;
          previousResponseTime = responseTime;
          previousFailed = !batchSuccess;
          
          // ⏰ ADAPTIVE THROTTLING
          const delay = this.batchProcessor.calculateOptimalDelay(responseTime, !batchSuccess);
          if (hasMore) {
            console.log(`🚀 [BATCH PULL SERVICE] Waiting ${delay}ms before next batch (response: ${responseTime}ms, success: ${batchSuccess})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // 🔄 UPDATE OFFSET: Single bulk fetch - no pagination needed
          offset += books.length;
          
          // 🔍 CHECK COMPLETION: Single bulk fetch completion
          if (books.length < 1000 || offset >= totalItems) {
            hasMore = false;
            console.log(`🏁 [PULL] Bulk fetch complete. Retrieved: ${books.length}, Total: ${totalItems}`);
          }
          
          // 🎯 UPDATE SEQUENCE: Update lastSequence with highest found in batch
          if (validBooks.length > 0) {
            const maxSequence = Math.max(...validBooks.map((b: any) => b.sequenceNumber || 0));
            lastSequence = maxSequence;
            console.log(`✅ [PULL SERVICE] Updated lastSequence: ${maxSequence}`);
          }
          
          this._progressTracker.updateBatch(batchIndex, validBooks.length);
          
        } catch (error) {
          console.error(`❌ [BATCH PULL SERVICE] Book batch ${batchIndex} failed:`, error);
          errors.push(`Book batch ${batchIndex} failed: ${error}`);
          batchSuccess = false;
          previousFailed = true;
          
          // Continue to next batch on failure - delta sync uses sequenceAfter
          hasMore = true;
        }
      }

      // 🎯 SAVE CHECKPOINT: Persist lastSequence for books
      if (lastSequence > 0) {
        try {
          await db.syncPoints.put({
            userId: this.userId,
            type: 'books',
            lastSequence: lastSequence,
            timestamp: Date.now()
          });
          console.log(`✅ [PULL SERVICE] Books checkpoint saved - lastSequence: ${lastSequence}`);
        } catch (checkpointError) {
          console.warn('⚠️ [PULL SERVICE] Failed to save books checkpoint:', checkpointError);
        }
      }

      return { success: errors.length === 0, processed, errors };
    } catch (error) {
      console.error('❌ [BATCH PULL SERVICE] Books pull failed:', error);
      errors.push(`Books pull failed: ${error}`);
      return { success: false, processed, errors };
    }
  }

  /**
   * 📝 PULL BATCHED ENTRIES with checkpoint resume capability
   */
  private async pullBatchedEntries(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;
    let previousResponseTime = 0;
    let previousFailed = false;

    try {
      // 🔄 CHECKPOINT RESUME: Read syncPoints to avoid full fetch
      // 🛡️ FIXED: Now correctly reading checkpoint instead of starting from 0
      const checkpoint = await db.syncPoints.where('type').equals('entries').and((item: any) => item.userId === this.userId).first();
      let lastSequence = checkpoint?.lastSequence ?? 0;
      let offset = 0;
      
      console.log('🚀 [BATCH PULL SERVICE] Starting entries pull from sequence:', lastSequence);
      
      let hasMore = true;
      
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      let batchIndex = 0;
      let consecutiveEmptyBatches = 0;
      let consecutiveInvalidBatches = 0;
      const maxLoopCount = 500;
      
      // 🎯 DYNAMIC TOTAL DETECTION: Get actual total from first batch
      let totalItems = 0;
      let isFirstBatch = true;
      
      while (hasMore && batchIndex < maxLoopCount) {
        batchIndex++;
        console.log(`🚀 [BATCH PULL SERVICE] Processing entry batch ${batchIndex} from offset ${offset}`);
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        try {
          // 🎯 BULK FETCH: Single large fetch to kill API storm
          const response = await SecureApiClient.signedFetch(
            `/api/entries/all?userId=${encodeURIComponent(this.userId)}&limit=1000&offset=0&sequenceAfter=${lastSequence}&since=0`,
            { method: 'GET' },
            'PullService'
          );
          
          // 🛡️ DNA ENFORCEMENT: Handle 404 as silent "End of Stream"
          if (response.status === 404) {
            console.warn('⚠️ [PULL SERVICE] End of data stream (404), stopping entries pull');
            hasMore = false;
            break;
          }

          if (!response.ok) {
            throw new Error(`Server response: ${response.status}`);
          }
          
          const batch = await response.json();
          const entries = batch.data || batch.entries || [];
          
          // DYNAMIC TOTAL UPDATE: Extract from server response if available
          if (isFirstBatch && batch.total) {
            totalItems = batch.total;
            this._progressTracker.start(totalItems);
            console.log(` [PULL SERVICE] Server reports ${totalItems} total entries`);
            isFirstBatch = false;
          } else if (isFirstBatch) {
            // Fallback: Estimate from first batch if no total provided
            totalItems = entries.length < 20 ? entries.length : 1000; // Safer estimate
            this._progressTracker.start(totalItems);
            console.log(` [PULL SERVICE] No total field, estimating ${totalItems} entries`);
            isFirstBatch = false;
          }
          
          if (entries.length === 0) {
            consecutiveEmptyBatches++;
            console.warn(`⚠️ [PULL SERVICE] Empty batch ${batchIndex} - consecutive empties: ${consecutiveEmptyBatches}`);
            
            // 🛡️ MAX-TRY GUARD: Stop after 3 consecutive empty batches
            if (consecutiveEmptyBatches >= 3) {
              console.error('🚨 [PULL SERVICE] Max consecutive empty batches reached, stopping pull to prevent infinite loop');
              // Log critical telemetry event
              await db.audits.add({
                userId: this.userId,
                type: 'SECURITY',
                event: 'INFINITE_LOOP_PREVENTED',
                details: `Stopped after ${batchIndex} batches with ${consecutiveEmptyBatches} consecutive empties`,
                timestamp: Date.now(),
                severity: 'CRITICAL'
              });
              hasMore = false;
              break;
            }
            
            // Continue to next batch - delta sync uses sequenceAfter
            continue;
          } else {
            consecutiveEmptyBatches = 0; // Reset counter on successful batch
          }
          
          // 🛡️ SEQUENCE NUMBER VERIFICATION
          const validEntries = entries.filter((entry: any) => 
            lastSequence === 0 ? true : entry.sequenceNumber > lastSequence
          );
          
          console.log(`🚀 [BATCH PULL SERVICE] Retrieved ${entries.length} entries, ${validEntries.length} valid after sequence check`);
          
          // INVALID BATCH GUARD: Stop if we get valid=0 but entries>0 for 3 consecutive batches
          if (validEntries.length === 0 && entries.length > 0) {
            consecutiveInvalidBatches++;
            console.warn(` [PULL SERVICE] Invalid batch ${batchIndex} - consecutive invalid: ${consecutiveInvalidBatches}`);
            
            if (consecutiveInvalidBatches >= 3) {
              console.error(' [PULL SERVICE] Max consecutive invalid batches reached, assuming caught up - stopping pull');
              await db.audits.add({
                userId: this.userId,
                type: 'SECURITY',
                event: 'CAUGHT_UP_DETECTED',
                details: `Stopped after ${batchIndex} batches with ${consecutiveInvalidBatches} consecutive invalid batches`,
                timestamp: Date.now(),
                severity: 'INFO'
              });
              hasMore = false;
              break;
            }
          } else {
            consecutiveInvalidBatches = 0; // Reset counter on valid batch
          }
          
          // 🔄 COMMIT BATCH - ATOMIC TRANSACTION WITH QUOTA SAFETY
          try {
            // 🛡️ [PATHOR LOGIC] Atomic Entry Batch Commit
            await db.transaction('rw', [db.entries, db.mediaStore, db.syncPoints], async () => {
              for (const entry of validEntries) {
                try {
                  // 🛡️ SOFT VALIDATION: Accept server data, fix missing fields locally
                  const validation = validateCompleteness(entry, 'entry');
                  if (!validation.isValid) {
                    console.warn(`⚠️ [SOFT VALIDATION] Entry ${entry.cid} incomplete, fixing missing fields: ${validation.missingFields.join(', ')}`);
                    // 🚨 RESCUE: Inject missing fields instead of rejecting
                    if (validation.missingFields.includes('isPinned')) entry.isPinned = 0;
                    if (validation.missingFields.includes('mediaCid')) entry.mediaCid = '';
                    if (validation.missingFields.includes('image')) entry.image = '';
                    // Continue processing - don't skip entire record
                  }
                  
                  const result = await this.commitSingleEntry(entry);
                  if (result.success) {
                    processed++;
                  } else {
                    errors.push(result.error || `Failed to commit entry ${entry.cid}`);
                    batchSuccess = false;
                  }
                } catch (error) {
                  errors.push(`Entry ${entry.cid} commit failed: ${error}`);
                  batchSuccess = false;
                }
              }
              
              // 🎯 BATCH PROCESSING: Simplified without checkpoint saving
              if (validEntries.length > 0) {
                const maxSequence = Math.max(...validEntries.map((e: any) => e.sequenceNumber || 0));
                console.log(`✅ [BATCH PULL SERVICE] Processed batch ${batchIndex} with ${validEntries.length} entries, max sequence: ${maxSequence}`);
                lastSequence = maxSequence;
              }
            });
          } catch (error: any) {
            // 💾 STORAGE QUOTA SAFETY: Handle quota exceeded gracefully
            if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
              console.error('💾 [PULL SERVICE] Storage quota exceeded, pausing sync gracefully');
              errors.push('Storage quota exceeded - please free up space');
              hasMore = false;
              break;
            } else {
              throw error; // Re-throw non-quota errors
            }
          }
          
          // 📊 RECORD RESPONSE TIME AND CALCULATE DELAY
          const responseTime = Date.now() - batchStartTime;
          previousResponseTime = responseTime;
          previousFailed = !batchSuccess;
          
          // ⏰ ADAPTIVE THROTTLING
          const delay = this.batchProcessor.calculateOptimalDelay(responseTime, !batchSuccess);
          if (hasMore) {
            console.log(`🚀 [BATCH PULL SERVICE] Waiting ${delay}ms before next batch (response: ${responseTime}ms, success: ${batchSuccess})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // 🔄 UPDATE OFFSET: Single bulk fetch - no pagination needed
          offset += entries.length;
          
          // 🔍 CHECK COMPLETION: Single bulk fetch completion
          if (entries.length < 1000 || offset >= totalItems) {
            hasMore = false;
            console.log(`🏁 [PULL] Entry bulk fetch complete. Retrieved: ${entries.length}, Total: ${totalItems}`);
          }
          
          // 🎯 UPDATE SEQUENCE: Update lastSequence with highest found in batch
          if (validEntries.length > 0) {
            const maxSeq = Math.max(...validEntries.map((e: any) => e.sequenceNumber || 0), 0);
            lastSequence = maxSeq;
            console.log(`✅ [PULL SERVICE] Updated lastSequence: ${maxSeq}`);
          }
          
          // 🎯 PERSIST CHECKPOINT: Save checkpoint from validEntries only
          if (validEntries.length > 0) {
            await db.syncPoints.put({
              userId: this.userId,
              type: 'entries',
              lastSequence: lastSequence,
              timestamp: Date.now()
            });
            console.log(`✅ [PULL SERVICE] Checkpoint saved - lastSequence: ${lastSequence}`);
          }
          
          this._progressTracker.updateBatch(batchIndex, validEntries.length);
          
        } catch (error) {
          console.error(`❌ [BATCH PULL SERVICE] Entry batch ${batchIndex} failed:`, error);
          errors.push(`Entry batch ${batchIndex} failed: ${error}`);
          batchSuccess = false;
          previousFailed = true;
          
          // Continue to next batch on failure - delta sync uses sequenceAfter
          hasMore = true;
        }
      }

      return { success: errors.length === 0, processed, errors };
    } catch (error) {
      console.error('❌ [BATCH PULL SERVICE] Entries pull failed:', error);
      errors.push(`Entries pull failed: ${error}`);
      return { success: false, processed, errors };
    }
  }

  /**
   * 📚 COMMIT SINGLE BOOK
   */
  private async commitSingleBook(book: any): Promise<{ success: boolean; localId?: number; error?: string }> {
    // 🔒 PULL LOCK: Prevent concurrent writes to same record
    if (!PullService.acquireLock(book.cid)) {
      console.log(`🔒 [PULL SERVICE] Book ${book.cid} is being processed by another thread, skipping...`);
      return { success: true }; // Assume another process is handling it
    }
    
    try {
      // 1. Normalize and Enrich FIRST
      const normalized = normalizeRecord({
        ...book,
        userId: String(this.userId),
        synced: 1, // Server data is synced
        isDeleted: book.isDeleted || 0,
        updatedAt: Number(book.updatedAt) || Date.now() // ️ DNA LAW V4.0: Force Number type
      }, this.userId);

      // 2. SOFT VALIDATION: Accept server data, log warnings only
      const validationResult = validateBook(normalized);
      if (!validationResult.success) {
        console.warn(`⚠️ [SOFT VALIDATION] Book ${book.cid} has validation issues, but accepting server data: ${validationResult.error}`);
        // Continue processing - don't reject entire record
      }

      // 🔍 CHECK-BEFORE-PUT: Check if local record exists
      const existing = await db.books.where('cid').equals(book.cid).first();
      
      // 🛡️ DIRTY BIT GUARD: Skip if local record has unsynced changes
      if (existing && existing.synced === 0) {
        console.warn(`🛡️ [PULL SERVICE] Skipping book ${book.cid} - local changes pending push`);
        return { success: true }; // Skip but don't fail
      }
      
      // 🛡️ TIMESTAMP CONFLICT GUARD: Only overwrite if server is strictly newer
      // 🚨 CRITICAL FIX: Force server truth during DATA_HYDRATION
      const store = getVaultStore();
      const isDataHydration = store.bootStatus === 'DATA_HYDRATION';
      
      // 🚨 NUCLEAR DATA RECOVERY: During initial hydration, server is absolute truth
      const forceOverwrite = isDataHydration;
      
      if (existing && existing.synced === 1 && !forceOverwrite) {
        const localTime = new Date(existing.updatedAt || 0).getTime();
        const serverTime = new Date(book.updatedAt || 0).getTime();
        
        // 🎯 PRECISION SYNC: Enhanced conflict detection with vKey guard
        const localVKey = existing.vKey || 0;
        const serverVKey = book.vKey || 0;
        
        // 1. EQUALITY CHECK: No action needed if timestamps match
        if (localTime === serverTime) {
          console.log(`⏰ [PULL SERVICE] Book ${book.cid} already in sync (timestamp match)`);
          return { success: true };
        }
        
        // 2. LOCAL NEWER CHECK: Push back to server
        if (localTime > serverTime) {
          //  vKey CONFLICT GUARD: Use vKey as secondary conflict detection
          if (localVKey > serverVKey) {
            console.log(`🔄 [PRECISION SYNC] Book ${book.cid} local is newer (time: ${localTime} > ${serverTime}, vKey: ${localVKey} > ${serverVKey}) - marking for push`);
          } else {
            console.log(`⚠️ [PRECISION SYNC] Book ${book.cid} local newer but lower vKey (time: ${localTime} > ${serverTime}, vKey: ${localVKey} <= ${serverVKey}) - marking for push anyway`);
          }
          
          // 🚨 DNA HARDENING: Race condition protection - only set synced: 0 if significantly newer
          const timeDifference = localTime - serverTime;
          if (timeDifference > 5000) {
            console.log(`🔄 [PRECISION SYNC] Book ${book.cid} local significantly newer (time: ${localTime} > ${serverTime}, diff: ${timeDifference}ms) - marking for push`);
            await db.books.update(existing.localId!, { synced: 0 });
            if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('sync-request'));
            }
            return { success: true };
          } else {
            console.log(`⚠️ [PRECISION SYNC] Book ${book.cid} local newer but within threshold (time: ${localTime} > ${serverTime}, diff: ${timeDifference}ms) - keeping synced status`);
          }
        }
        
        // 3. SERVER NEWER CHECK: Proceed with server update
        console.log(`📥 [PRECISION SYNC] Book ${book.cid} server is newer (time: ${serverTime} > ${localTime}) - proceeding with update`);
      }
      
      // 📝 [AUDIT] Log what we're storing in DB
      console.log('📝 [DB COMMIT]', { 
        cid: book.cid, 
        image: normalized.image, 
        mediaCid: normalized.mediaCid,
        hasLocalId: !!existing?.localId
      });
      
      // Preserve localId if it exists to ensure bulkPut updates correct record
      if (existing?.localId) {
        normalized.localId = existing.localId;
      }

      // 🗑️ HARD DELETE CHECK
      if (book.isDeleted === 1 && existing) {
        await db.books.delete(existing.localId!);
        console.log(`🗑️ [PULL SERVICE] Book ${book.cid} hard deleted after pull`);
        return { success: true, localId: existing.localId };
      } else if (book.isDeleted === 0) {
        // Store or update the book
        if (existing?.localId) {
          await db.books.update(existing.localId!, normalized);
          console.log(`✅ [PULL SERVICE] Updated book: ${book.cid}`);
          return { success: true, localId: existing.localId };
        } else {
          const newId = await db.books.add(normalized);
          console.log(`✅ [PULL SERVICE] Added book: ${book.cid}`);
          return { success: true, localId: newId };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ [PULL SERVICE] Single book commit failed:', book.cid, error);
      return { success: false, error: `Exception for book ${book.cid}: ${error}` };
    } finally {
      // 🔒 RELEASE LOCK: Always release lock when done
      PullService.releaseLock(book.cid);
    }
  }

  /**
   * 📝 COMMIT SINGLE ENTRY
   */
  private async commitSingleEntry(entry: any): Promise<{ success: boolean; localId?: number; error?: string }> {
    // 🔒 PULL LOCK: Prevent concurrent writes to same record
    if (!PullService.acquireLock(entry.cid)) {
      console.log(`🔒 [PULL SERVICE] Entry ${entry.cid} is being processed by another thread, skipping...`);
      return { success: true }; // Assume another process is handling it
    }
    
    try {
      // 1. Normalize and Enrich FIRST
      const normalized = normalizeRecord({
        ...entry,
        userId: String(this.userId),
        synced: 1, // Server data is synced
        isDeleted: entry.isDeleted || 0,
        updatedAt: Number(entry.updatedAt) || Date.now() // ️ DNA LAW V4.0: Force Number type
      }, this.userId);

      // 2. SOFT VALIDATION: Accept server data, log warnings only
      const validationResult = validateEntry(normalized);
      if (!validationResult.success) {
        console.warn(`⚠️ [SOFT VALIDATION] Entry ${entry.cid} has validation issues, but accepting server data: ${validationResult.error}`);
        // Continue processing - don't reject entire record
      }

      // 🔍 CHECK-BEFORE-PUT: Check if local record exists
      const existing = await db.entries.where('cid').equals(entry.cid).first();
      
      // 🛡️ DIRTY BIT GUARD: Skip if local record has unsynced changes
      if (existing && existing.synced === 0) {
        console.warn(`🛡️ [PULL SERVICE] Skipping entry ${entry.cid} - local changes pending push`);
        return { success: true }; // Skip but don't fail
      }
      
      // 🛡️ TIMESTAMP CONFLICT GUARD: Only overwrite if server is strictly newer
      // 🚨 CRITICAL FIX: Force server truth during DATA_HYDRATION
      const store = getVaultStore();
      const isDataHydration = store.bootStatus === 'DATA_HYDRATION';
      
      if (existing && existing.synced === 1 && !isDataHydration) {
        const localTime = new Date(existing.updatedAt || 0).getTime();
        const serverTime = new Date(entry.updatedAt || 0).getTime();
        
        // 🎯 PRECISION SYNC: Enhanced conflict detection with vKey guard
        const localVKey = existing.vKey || 0;
        const serverVKey = entry.vKey || 0;
        
        // 1. EQUALITY CHECK: No action needed if timestamps match
        if (localTime === serverTime) {
          console.log(`⏰ [PULL SERVICE] Entry ${entry.cid} already in sync (timestamp match)`);
          return { success: true };
        }
        
        // 2. LOCAL NEWER CHECK: Push back to server
        if (localTime > serverTime) {
          //  DNA HARDENING: Race condition protection - only set synced: 0 if significantly newer
          if (localVKey > serverVKey) {
            console.log(`🔄 [PRECISION SYNC] Entry ${entry.cid} local is newer (time: ${localTime} > ${serverTime}, vKey: ${localVKey} > ${serverVKey}) - marking for push`);
          } else {
            console.log(`⚠️ [PRECISION SYNC] Entry ${entry.cid} local newer but lower vKey (time: ${localTime} > ${serverTime}, vKey: ${localVKey} <= ${serverVKey}) - marking for push anyway`);
          }
          const timeDifference = localTime - serverTime;
          if (timeDifference > 5000) {
            console.log(`🔄 [PRECISION SYNC] Entry ${entry.cid} local significantly newer (time: ${localTime} > ${serverTime}, diff: ${timeDifference}ms) - marking for push`);
            await db.entries.update(existing.localId!, { synced: 0 });
            if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('sync-request'));
            }
            return { success: true };
          } else {
            console.log(`⚠️ [PRECISION SYNC] Entry ${entry.cid} local newer but within threshold (time: ${localTime} > ${serverTime}, diff: ${timeDifference}ms) - keeping synced status`);
          }
        }
        
        // 3. SERVER NEWER CHECK: Proceed with server update
        console.log(`📥 [PRECISION SYNC] Entry ${entry.cid} server is newer (time: ${serverTime} > ${localTime}) - proceeding with update`);
      }
      
      // Preserve localId if it exists to ensure bulkPut updates correct record
      if (existing?.localId) {
        normalized.localId = existing.localId;
      }

      // 🗑️ HARD DELETE CHECK
      if (entry.isDeleted === 1 && existing) {
        await db.entries.delete(existing.localId!);
        console.log(`🗑️ [PULL SERVICE] Entry ${entry.cid} hard deleted after pull`);
        return { success: true, localId: existing.localId };
      } else if (entry.isDeleted === 0) {
        // Store or update the entry
        if (existing?.localId) {
          await db.entries.update(existing.localId!, normalized);
          console.log(`✅ [PULL SERVICE] Updated entry: ${entry.cid}`);
          return { success: true, localId: existing.localId };
        } else {
          const newId = await db.entries.add(normalized);
          console.log(`✅ [PULL SERVICE] Added entry: ${entry.cid}`);
          return { success: true, localId: newId };
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ [PULL SERVICE] Single entry commit failed:', entry.cid, error);
      return { success: false, error: `Exception for entry ${entry.cid}: ${error}` };
    } finally {
      // 🔒 RELEASE LOCK: Always release lock when done
      PullService.releaseLock(entry.cid);
    }
  }

  /**
   * 🔄 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
  }

  /**
   * 🌐 BACKGROUND MEDIA DOWNLOADER - Hydrate missing media blobs for offline persistence
   */
  private async hydrateMissingMedia(imageUrl: string, bookId: string): Promise<void> {
    // 🚀 [AUDIT] Aggressive logging at function entry
    console.log('🚀 [DOWNLOADER TRY]', { url: imageUrl, book: bookId });
    
    try {
      // 🛡️ SKIP GUARDS: Process HTTP URLs OR existing mediaCid
      if (!imageUrl || !imageUrl.startsWith('http')) {
        // 🚨 CRITICAL FIX: Check if book has mediaCid for CID-based resolution
        const bookRecord = await db.books.where('localId').equals(bookId).first();
        if (bookRecord?.mediaCid) {
          console.log('🚀 [DOWNLOADER] Using mediaCid for resolution:', bookRecord.mediaCid);
          return; // Skip download - media already exists via CID
        }
        
        console.warn('🚫 [DOWNLOADER] Skipped - not HTTP URL:', imageUrl);
        return;
      }

      // 🛡️ DUPLICATE CHECK: Skip if media already exists locally
      const existingMedia = await db.mediaStore.where('parentId').equals(bookId).first();
      if (existingMedia) {
        console.log(`🌐 [MEDIA DOWNLOADER] Media already exists for book ${bookId}, skipping download`);
        return;
      }

      // 🌐 FETCH BLOB: Download image from Cloudinary
      console.log(`🌐 [MEDIA DOWNLOADER] Downloading media for book ${bookId} from ${imageUrl}`);
      const response = await SecureApiClient.signedFetch(imageUrl, {
        method: 'GET'
      }, 'PullService');
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Empty blob received from server');
      }

      // 🧪 GENERATE CID: Create unique identifier for media
      const { generateCID } = await import('@/lib/shared/utils');
      const mediaCid = generateCID();

      // 💾 STORE IN MEDIASTORE: Save blob with metadata
      await db.mediaStore.add({
        cid: mediaCid,
        parentType: 'book',
        parentId: bookId,
        localStatus: 'uploaded', // Mark as uploaded since we got it from server
        blobData: blob,
        mimeType: blob.type,
        originalSize: blob.size,
        compressedSize: blob.size,
        createdAt: Date.now(),
        userId: this.userId
      });

      // 🔄 UPDATE BOOK: Link book to media CID
      await db.books.where('localId').equals(bookId).modify({
        image: imageUrl, // Keep original URL
        mediaCid: mediaCid, // Add local CID reference
        // 🚨 DNA HARDENING: Media downloads must NOT trigger timestamp change
      });

      console.log(`✅ [MEDIA DOWNLOADER] Successfully downloaded and stored media for book ${bookId} (CID: ${mediaCid})`);

    } catch (error) {
      // 🛡️ SILENT FAILURE: Don't block main sync process
      console.warn(`⚠️ [MEDIA DOWNLOADER] Failed to download media for book ${bookId}:`, error);
      // Continue without failing the entire pull operation
    }
  }

  /**
   * 🔄 PULL FULL DATASET - For hydration consolidation
   */
  public async pullFullDataset(type: 'BOOKS' | 'ENTRIES'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log(`🔄 [PULL SERVICE] Full dataset pull for ${type}`);
      
      const endpoint = type === 'BOOKS' ? '/api/books' : '/api/entries';
      const response = await SecureApiClient.signedFetch(`${endpoint}?userId=${encodeURIComponent(this.userId)}&limit=10000`, { 
        method: 'GET' 
      }, 'PullService');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result[`${type.toLowerCase()}`] || [];
      
      console.log(`✅ [PULL SERVICE] Retrieved ${data.length} ${type}`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PULL SERVICE] Full dataset pull failed for ${type}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 🎯 PULL SINGLE ITEM - For sniper hydration
   */
  public async pullSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`🎯 [PULL SERVICE] Single item pull for ${type} ${id}`);
      
      const response = await SecureApiClient.signedFetch(`/api/${API_PATH_MAP[type]}/${id}`, { 
        method: 'GET' 
      }, 'PullService');
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: null }; // Item gone
        }
        throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result;
      
      if (!data) {
        console.warn(`⚠️ [PULL SERVICE] ${type} not found for ID: ${id}`);
        return { 
          success: false, 
          error: `${type} not found for ID: ${id}`
        };
      }
      
      console.log(`✅ [PULL SERVICE] Retrieved ${type} ${id}`);
      return { success: true, data };
      
    } catch (error) {
      console.error(`❌ [PULL SERVICE] Single item pull failed for ${type} ${id}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 🔄 GET PULL STATUS
   */
  getPullStatus(): { isPulling: boolean; userId: string } {
    return {
      isPulling: this.isPulling,
      userId: this.userId
    };
  }
}
