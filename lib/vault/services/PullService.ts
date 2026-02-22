"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord, validateCompleteness } from '../core/VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import { validateBook, validateEntry } from '../core/schemas';
import { getVaultStore } from '../store/storeHelper';
import { LicenseVault, RiskManager } from '../security';
import { generateVaultSignature, prepareSignedHeaders, preparePayload } from '../utils/security';

/**
 * 🚀 SMART BATCH PROCESSOR - Intelligent batching with payload size detection
 * Reused from PushService for consistency
 */
class SmartBatchProcessor<T> {
  private readonly DEFAULT_BATCH_SIZE = 20; // Pull batches of 20 items
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
      
      console.log(`📊 [PULL PROGRESS] Batch ${batchNumber} - ${this.processedItems}/${this.totalItems} (${progress.toFixed(1)}%) - Est. remaining: ${(estimatedRemaining/1000).toFixed(1)}s`);
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
  private isPulling = false;
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

      const signatureValid = await LicenseVault.verifySignature(user);
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
        const user = await db.users.where('userId').equals(this.userId).first();
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
    // 🛡️ SECURITY INTERLOCK: Verify telemetry first
    const telemetryResult = await this.verifyTelemetryIntegrity();
    if (!telemetryResult.valid) {
      console.error('🔒 [PULL SERVICE] Security verification failed - blocking data pull');
      return { success: false, itemsProcessed: 0, errors: [telemetryResult.error || 'Security verification failed'] };
    }
    
    // LOCKDOWN GUARD: Check security state
    const { networkMode, isSecurityLockdown } = getVaultStore();
    if (networkMode === 'RESTRICTED' || isSecurityLockdown) {
      console.log('🔒 [PULL SERVICE] Business data pull blocked - RESTRICTED mode');
      return { success: false, itemsProcessed: 0, errors: ['App in restricted mode'] };
    }
    
    // TRAFFIC POLICE: Check network state before proceeding
    if (networkMode === 'OFFLINE' || networkMode === 'DEGRADED') {
      console.warn('🛑 [PULL SERVICE] Pull blocked. Network is:', networkMode);
      return { success: false, itemsProcessed: 0, errors: [] };
    }
    
    // FINAL SECURITY GUARD: Last line of defense
    const user = await db.users.where('userId').equals(this.userId).first();
    if (!user) {
      console.error('🔒 [PULL SERVICE] User profile missing - Pull blocked');
      return { success: false, itemsProcessed: 0, errors: ['User profile missing'] };
    }

    const licenseAccess = LicenseVault.validateAccess(user);
    if (!licenseAccess.access) {
      console.error('🔒 [PULL SERVICE] License invalid - Pull blocked');
      return { success: false, itemsProcessed: 0, errors: ['License access denied'] };
    }

    const lockdownStatus = RiskManager.isLockdown(user);
    if (lockdownStatus) {
      console.error('🔒 [PULL SERVICE] User in lockdown - Pull blocked');
      return { success: false, itemsProcessed: 0, errors: ['User in lockdown'] };
    }

    const signatureValid = await LicenseVault.verifySignature(user);
    if (!signatureValid) {
      console.error('🔒 [PULL SERVICE] License signature invalid - Pull blocked');
      return { success: false, itemsProcessed: 0, errors: ['License signature invalid'] };
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
  private async pullUserSettings(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧑 [PULL SERVICE] Fetching user settings from server...');
      
      const response = await fetch(`/api/user/profile?userId=${encodeURIComponent(this.userId)}`);
      
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
      const store = getVaultStore();
      
      // Extract user settings
      const { categories, currency, preferences } = user;
      
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
      // 🔄 START FROM BEGINNING: Simplified pull without checkpoints
      let offset = 0;
      let lastSequence = 0;
      
      console.log('🚀 [BATCH PULL SERVICE] Starting books pull from offset:', offset);
      
      let hasMore = true;
      const totalBatches = Math.ceil(5000 / 20); // Estimate total batches
      this._progressTracker.start(totalBatches * 20); // Estimate total items
      
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      let batchIndex = 0;
      let consecutiveEmptyBatches = 0;
      const maxLoopCount = 500;
      
      while (hasMore && batchIndex < maxLoopCount) {
        batchIndex++;
        console.log(`🚀 [BATCH PULL SERVICE] Processing book batch ${batchIndex} from offset ${offset}`);
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        try {
          // 🎯 BATCHED NETWORK REQUEST (not local batching)
          const response = await fetch(
            `/api/books?userId=${encodeURIComponent(this.userId)}&limit=20&offset=${offset}&sequenceAfter=${lastSequence}`
          );
          
          if (!response.ok) {
            throw new Error(`Server response: ${response.status}`);
          }
          
          const batch = await response.json();
          const books = batch.data || batch.books || [];
          
          if (books.length === 0) {
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
            
            // Continue to next batch
            offset += 20;
            continue;
          } else {
            consecutiveEmptyBatches = 0; // Reset counter on successful batch
          }
          
          // 🛡️ SEQUENCE NUMBER VERIFICATION
          const validBooks = books.filter((book: any) => 
            book.sequenceNumber > lastSequence
          );
          
          console.log(`🚀 [BATCH PULL SERVICE] Retrieved ${books.length} books, ${validBooks.length} valid after sequence check`);
          
          // 🔄 COMMIT BATCH - ATOMIC TRANSACTION WITH QUOTA SAFETY
          try {
            await db.transaction('rw', db.books, db.syncPoints, async () => {
              for (const book of validBooks) {
                try {
                  // � [AUDIT] Log server payload to see what we're getting
                  console.log('📡 [PULL PAYLOAD]', { id: book._id, image: book.image, mediaCid: book.mediaCid, localId: book.localId });
                  
                  // �🛡️ SAFETY GUARD: Validate completeness before storing
                  const validation = validateCompleteness(book, 'book');
                  if (!validation.isValid) {
                    errors.push(`Book ${book.cid} validation failed: ${validation.missingFields.join(', ')}`);
                    batchSuccess = false;
                    continue;
                  }
                  
                  const result = await this.commitSingleBook(book);
                  if (result.success) {
                    processed++;
                    
                    // 🌐 BACKGROUND MEDIA DOWNLOAD: Use saved record with localId
                    const savedBook = await db.books.where('cid').equals(book.cid).first();
                    if (savedBook?.image && savedBook.image.startsWith('http') && savedBook.localId) {
                      this.hydrateMissingMedia(savedBook.image, savedBook.localId).catch(error => {
                        console.warn(`⚠️ [PULL SERVICE] Background media download failed for book ${savedBook.localId}:`, error);
                      });
                    } else {
                      console.warn('🚫 [PULL SERVICE] Media download blocked - missing data:', {
                        hasImage: !!savedBook?.image,
                        isHttp: savedBook?.image?.startsWith('http'),
                        hasLocalId: !!savedBook?.localId,
                        bookId: savedBook?.localId
                      });
                    }
                  } else {
                    errors.push(result.error || `Failed to commit book ${book.cid}`);
                    batchSuccess = false;
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
          
          // 🔄 UPDATE OFFSET
          offset += books.length;
          
          // 🔍 CHECK COMPLETION
          hasMore = books.length === 20 && !batch.isComplete;
          
          this._progressTracker.updateBatch(batchIndex, validBooks.length);
          
        } catch (error) {
          console.error(`❌ [BATCH PULL SERVICE] Book batch ${batchIndex} failed:`, error);
          errors.push(`Book batch ${batchIndex} failed: ${error}`);
          batchSuccess = false;
          previousFailed = true;
          
          // Continue to next batch on failure
          offset += 20;
          hasMore = true;
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
      // 🔄 START FROM BEGINNING: Simplified pull without checkpoints
      let offset = 0;
      let lastSequence = 0;
      
      console.log('🚀 [BATCH PULL SERVICE] Starting entries pull from offset:', offset);
      
      let hasMore = true;
      
      // 🔄 BATCH PROCESSING WITH ADAPTIVE THROTTLING
      let batchIndex = 0;
      let consecutiveEmptyBatches = 0;
      const maxLoopCount = 500;
      
      while (hasMore && batchIndex < maxLoopCount) {
        batchIndex++;
        console.log(`🚀 [BATCH PULL SERVICE] Processing entry batch ${batchIndex} from offset ${offset}`);
        
        const batchStartTime = Date.now();
        let batchSuccess = true;
        
        try {
          // 🎯 BATCHED NETWORK REQUEST (not local batching)
          const response = await fetch(
            `/api/entries?userId=${encodeURIComponent(this.userId)}&limit=20&offset=${offset}&sequenceAfter=${lastSequence}`
          );
          
          if (!response.ok) {
            throw new Error(`Server response: ${response.status}`);
          }
          
          const batch = await response.json();
          const entries = batch.data || batch.entries || [];
          
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
            
            // Continue to next batch
            offset += 20;
            continue;
          } else {
            consecutiveEmptyBatches = 0; // Reset counter on successful batch
          }
          
          // 🛡️ SEQUENCE NUMBER VERIFICATION
          const validEntries = entries.filter((entry: any) => 
            entry.sequenceNumber > lastSequence
          );
          
          console.log(`🚀 [BATCH PULL SERVICE] Retrieved ${entries.length} entries, ${validEntries.length} valid after sequence check`);
          
          // 🔄 COMMIT BATCH - ATOMIC TRANSACTION WITH QUOTA SAFETY
          try {
            await db.transaction('rw', db.entries, db.syncPoints, async () => {
              for (const entry of validEntries) {
                try {
                  // 🛡️ SAFETY GUARD: Validate completeness before storing
                  const validation = validateCompleteness(entry, 'entry');
                  if (!validation.isValid) {
                    errors.push(`Entry ${entry.cid} validation failed: ${validation.missingFields.join(', ')}`);
                    batchSuccess = false;
                    continue;
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
          
          // 🔄 UPDATE OFFSET
          offset += entries.length;
          
          // 🔍 CHECK COMPLETION
          hasMore = entries.length === 20 && !batch.isComplete;
          
          this._progressTracker.updateBatch(batchIndex, validEntries.length);
          
        } catch (error) {
          console.error(`❌ [BATCH PULL SERVICE] Entry batch ${batchIndex} failed:`, error);
          errors.push(`Entry batch ${batchIndex} failed: ${error}`);
          batchSuccess = false;
          previousFailed = true;
          
          // Continue to next batch on failure
          offset += 20;
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
  private async commitSingleBook(book: any): Promise<{ success: boolean; error?: string }> {
    try {
      // 🛡️ SCHEMA GUARD: Validate server data before storing
      const validationResult = validateBook(book);
      if (!validationResult.success) {
        const errorMsg = `🚨 [PULL VALIDATOR] Server book data corruption blocked for ID: ${book.cid}. ${validationResult.error}`;
        console.error(errorMsg, { book });
        return { success: false, error: errorMsg };
      }

      // 🔍 CHECK-BEFORE-PUT: Check if local record exists
      const existing = await db.books.where('cid').equals(book.cid).first();
      
      // 🛡️ DIRTY BIT GUARD: Skip if local record has unsynced changes
      if (existing && existing.synced === 0) {
        console.warn(`🛡️ [PULL SERVICE] Skipping book ${book.cid} - local changes pending push`);
        return { success: true }; // Skip but don't fail
      }
      
      // 🛡️ TIMESTAMP CONFLICT GUARD: Only overwrite if server is strictly newer
      if (existing && existing.synced === 1) {
        const localTime = new Date(existing.updatedAt || 0).getTime();
        const serverTime = new Date(book.updatedAt || 0).getTime();
        
        if (localTime >= serverTime) {
          console.warn(`🛡️ [PULL SERVICE] Skipping Book ${book.cid} - local version is already up-to-date or newer`);
          return { success: true }; 
        }
      }
      
      // Normalize and store
      const normalized = normalizeRecord({
        ...book,
        userId: String(this.userId),
        synced: 1, // Server data is synced
        isDeleted: book.isDeleted || 0
      }, this.userId);
      
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
      } else if (book.isDeleted === 0) {
        // Store or update the book
        if (existing?.localId) {
          await db.books.update(existing.localId!, normalized);
          console.log(`✅ [PULL SERVICE] Updated book: ${book.cid}`);
        } else {
          await db.books.add(normalized);
          console.log(`✅ [PULL SERVICE] Added book: ${book.cid}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ [PULL SERVICE] Single book commit failed:', book.cid, error);
      return { success: false, error: `Exception for book ${book.cid}: ${error}` };
    }
  }

  /**
   * 📝 COMMIT SINGLE ENTRY
   */
  private async commitSingleEntry(entry: any): Promise<{ success: boolean; error?: string }> {
    try {
      // 🛡️ SCHEMA GUARD: Validate server data before storing
      const validationResult = validateEntry(entry);
      if (!validationResult.success) {
        const errorMsg = `🚨 [PULL VALIDATOR] Server entry data corruption blocked for ID: ${entry.cid}. ${validationResult.error}`;
        console.error(errorMsg, { entry });
        return { success: false, error: errorMsg };
      }

      // 🔍 CHECK-BEFORE-PUT: Check if local record exists
      const existing = await db.entries.where('cid').equals(entry.cid).first();
      
      // 🛡️ DIRTY BIT GUARD: Skip if local record has unsynced changes
      if (existing && existing.synced === 0) {
        console.warn(`🛡️ [PULL SERVICE] Skipping entry ${entry.cid} - local changes pending push`);
        return { success: true }; // Skip but don't fail
      }
      
      // 🛡️ TIMESTAMP CONFLICT GUARD: Only overwrite if server is strictly newer
      if (existing && existing.synced === 1) {
        const localTime = new Date(existing.updatedAt || 0).getTime();
        const serverTime = new Date(entry.updatedAt || 0).getTime();
        
        if (localTime >= serverTime) {
          console.warn(`🛡️ [PULL SERVICE] Skipping Entry ${entry.cid} - local version is already up-to-date or newer`);
          return { success: true };
        }
      }
      
      // Normalize and store
      const normalized = normalizeRecord({
        ...entry,
        userId: String(this.userId),
        synced: 1, // Server data is synced
        isDeleted: entry.isDeleted || 0
      }, this.userId);
      
      // Preserve localId if it exists to ensure bulkPut updates correct record
      if (existing?.localId) {
        normalized.localId = existing.localId;
      }

      // 🗑️ HARD DELETE CHECK
      if (entry.isDeleted === 1 && existing) {
        await db.entries.delete(existing.localId!);
        console.log(`🗑️ [PULL SERVICE] Entry ${entry.cid} hard deleted after pull`);
      } else if (entry.isDeleted === 0) {
        // Store or update the entry
        if (existing?.localId) {
          await db.entries.update(existing.localId!, normalized);
          console.log(`✅ [PULL SERVICE] Updated entry: ${entry.cid}`);
        } else {
          await db.entries.add(normalized);
          console.log(`✅ [PULL SERVICE] Added entry: ${entry.cid}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ [PULL SERVICE] Single entry commit failed:', entry.cid, error);
      return { success: false, error: `Exception for entry ${entry.cid}: ${error}` };
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
      // 🛡️ SKIP GUARDS: Only process HTTP URLs (Cloudinary)
      if (!imageUrl || !imageUrl.startsWith('http')) {
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
      const response = await fetch(imageUrl);
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
        updatedAt: Date.now()
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
      const response = await fetch(`${endpoint}?userId=${encodeURIComponent(this.userId)}&limit=10000`, { method: 'GET' });
      
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
      
      const response = await fetch(`/api/${type.toLowerCase()}s/${id}`, { method: 'GET' });
      
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
