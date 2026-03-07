"use client";

import { db } from '@/lib/offlineDB';
import { UserManager } from '../core/user/UserManager';
import { validateCompleteness } from '../core/VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import { telemetry } from '../Telemetry';
import { mediaGarbageCollector } from './MediaStoreUtils';
import { PushService } from './PushService';
import { SyncGuard } from '../guards/SyncGuard';

/**
 * 🧹 MAINTENANCE SERVICE - Housekeeper for Dexie and MongoDB cleanup
 * 
 * Responsibility: Keep the database clean and optimized
 * - Audit log cleanup (60+ days)
 * - Metadata cleanup (syncAttempts, lastAttempt)
 * - Completeness validation and flagging
 * - Server signal for remote cleanup
 */

interface CleanupResult {
  success: boolean;
  auditLogsCleaned: number;
  metadataCleaned: number;
  incompleteRecordsFlagged: number;
  serverCleanupTriggered: boolean;
  errors: string[];
  duration: number;
}

interface CompletenessReport {
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  flaggedForDeletion: number;
  details: Array<{
    cid: string;
    type: 'book' | 'entry';
    completenessScore: number;
    missingFields: string[];
    age: number;
    flagged: boolean;
  }>;
}

export class MaintenanceService {
  private userId: string = '';
  private readonly AUDIT_LOG_RETENTION_DAYS = 60;
  private readonly INCOMPLETE_RECORD_RETENTION_DAYS = 7;
  private readonly METADATA_CLEANUP_BATCH_SIZE = 100;
  private readonly COMPLETENESS_CHUNK_SIZE = 50;
  private pushService: PushService;

  constructor() {
    // Remove top-level userId initialization to prevent circular dependency
    // userId will be retrieved lazily when methods are called
    this.pushService = PushService.getInstance();
  }

  /**
   * 🧹 PERFORM GLOBAL CLEANUP - Main maintenance entry point
   */
  async performGlobalCleanup(userId: string): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      success: false,
      auditLogsCleaned: 0,
      metadataCleaned: 0,
      incompleteRecordsFlagged: 0,
      serverCleanupTriggered: false,
      errors: [],
      duration: 0
    };

    try {
      // 🧹 [MAINTENANCE SERVICE] Starting global cleanup - Silenced for production
      // console.log('🧹 [MAINTENANCE SERVICE] Starting global cleanup for user:', userId);
      this.userId = userId;

      // STEP 1: Clean old audit logs - Silenced for production
      result.auditLogsCleaned = await this.cleanupAuditLogs(userId);

      // STEP 2: Clean metadata for synced records - Silenced for production
      result.metadataCleaned = await this.cleanupMetadata(userId);

      // STEP 3: Validate completeness and flag incomplete records - Silenced for production
      const completenessReport = await this.validateRecordCompleteness(userId);
      result.incompleteRecordsFlagged = completenessReport.flaggedForDeletion;

      // STEP 4: Signal server for remote cleanup - Silenced for production
      result.serverCleanupTriggered = await this.signalServerCleanup(userId);

      // STEP 5: Media garbage collection - Silenced for production
      const mediaCleanupResult = await mediaGarbageCollector.runFullCleanup();
      // [MAINTENANCE SERVICE] Media cleanup - Silenced for production
      // console.log(`[MAINTENANCE SERVICE] Media cleanup: ${mediaCleanupResult.totalCleaned} blobs freed, ${(mediaCleanupResult.totalFreedSpace / 1024 / 1024).toFixed(2)}MB recovered`);
      
      result.success = true;
      result.duration = Date.now() - startTime;
      
      // [MAINTENANCE SERVICE] Global cleanup complete - Silenced for production
      // console.log('[MAINTENANCE SERVICE] Global cleanup complete:', result);

      // LOG CLEANUP STATISTICS
      telemetry.log({
        type: 'OPERATION',
        level: 'INFO',
        message: 'Global cleanup completed',
        data: {
          userId,
          ...result,
          completenessReport
        }
      });

      return result;

    } catch (error: any) {
      console.error('[MAINTENANCE SERVICE] Global cleanup failed:', error);
      result.errors.push(String(error));
      result.duration = Date.now() - startTime;

      telemetry.log({
        type: 'OPERATION',
        level: 'ERROR',
        message: 'Global cleanup failed',
        data: {
          userId,
          error: String(error),
          result
        }
      });

      return result;
    }
  }

  /**
   * CLEANUP AUDIT LOGS - Remove audit logs older than 60 days
   */
  private async cleanupAuditLogs(userId: string): Promise<number> {
    try {
      const sixtyDaysAgo = Date.now() - (this.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      
      // Check if auditLogs table exists
      if (!db.auditLogs) {
        return 0;
      }

      // Count logs to be deleted
      const logsToDelete = await db.auditLogs
        .where('userId')
        .equals(userId)
        .and((log: any) => log.timestamp < sixtyDaysAgo)
        .count();

      if (logsToDelete === 0) {
        return 0;
      }

      // Get old logs before deletion
      const oldLogs = await db.auditLogs
        .where('userId')
        .equals(userId)
        .and((log: any) => log.timestamp < sixtyDaysAgo)
        .toArray();
      
      // 🧹 STORAGE LEAK FIX: Find and delete orphaned mediaStore blobs
      const logIds = oldLogs.map((log: any) => log.localId!);
      let orphanedMediaDeleted = 0;
      
      if (db.mediaStore && logIds.length > 0) {
        try {
          // 🚨 FIX: Separate numeric and string IDs to prevent anyOf type mismatch
          const numericIds = logIds.filter((id: any) => typeof id === 'number');
          const stringIds = logIds.filter((id: any) => typeof id === 'string');
          
          let orphanedMedia: any[] = [];
          
          // Execute separate queries and merge, DO NOT pass mixed array to anyOf
          if (numericIds.length > 0) {
            const numericMedia = await db.mediaStore
              .where('parentId')
              .anyOf(numericIds)
              .and((media: any) => media.parentType === 'audit')
              .toArray();
            orphanedMedia.push(...numericMedia);
          }
          
          if (stringIds.length > 0) {
            const stringMedia = await db.mediaStore
              .where('parentId')
              .anyOf(stringIds)
              .and((media: any) => media.parentType === 'audit')
              .toArray();
            orphanedMedia.push(...stringMedia);
          }
          
          if (orphanedMedia.length > 0) {
            // Delete orphaned media blobs first
            await db.mediaStore.bulkDelete(orphanedMedia.map((media: any) => media.localId!));
            orphanedMediaDeleted = orphanedMedia.length;
          }
        } catch (mediaError) {
          console.warn('⚠️ [MAINTENANCE SERVICE] Media cleanup failed:', mediaError);
        }
      }

      // Delete old logs in batches - ATOMIC TRANSACTION
      let deletedCount = 0;
      for (let i = 0; i < oldLogs.length; i += this.METADATA_CLEANUP_BATCH_SIZE) {
        const batch = oldLogs.slice(i, i + this.METADATA_CLEANUP_BATCH_SIZE);
        await db.transaction('rw', db.auditLogs, async () => {
          await db.auditLogs.bulkDelete(batch.map((log: any) => log.localId!));
        });
        deletedCount += batch.length;
      }

      return deletedCount;

    } catch (error) {
      console.error('[MAINTENANCE SERVICE] Audit log cleanup failed:', error);
      throw error;
    }
  }

  /**
   * CLEANUP METADATA - Clean sync metadata for successfully synced records
   */
  private async cleanupMetadata(userId: string): Promise<number> {
    try {
      let cleanedCount = 0;

      // Update books metadata - ATOMIC TRANSACTION
      const syncedBooks = await db.books
        .where('userId')
        .equals(userId)
        .and((book: any) => book.synced === 1 && (book.syncAttempts > 0 || book.lastAttempt))
        .toArray();
      
      if (syncedBooks.length > 0) {
        await db.transaction('rw', db.books, async () => {
          await db.books.bulkUpdate(syncedBooks.map((book: any) => ({
            key: book.localId!,
            changes: { syncAttempts: 0, lastAttempt: null }
          })));
        });
        cleanedCount += syncedBooks.length;
      }

      // Clean entries metadata - ATOMIC TRANSACTION
      const syncedEntries = await db.entries
        .where('userId')
        .equals(userId)
        .and((entry: any) => entry.synced === 1 && (entry.syncAttempts > 0 || entry.lastAttempt))
        .toArray();
      
      if (syncedEntries.length > 0) {
        await db.transaction('rw', db.entries, async () => {
          await db.entries.bulkUpdate(syncedEntries.map((entry: any) => ({
            key: entry.localId!,
            changes: { syncAttempts: 0, lastAttempt: null }
          })));
        });
        cleanedCount += syncedEntries.length;
      }

      return cleanedCount;

    } catch (error) {
      console.error('❌ [MAINTENANCE SERVICE] Metadata cleanup failed:', error);
      throw error;
    }
  }

  /**
   * VALIDATE RECORD COMPLETENESS - Check and flag incomplete records
   */
  private async validateRecordCompleteness(userId: string): Promise<CompletenessReport> {
    try {
      const report: CompletenessReport = {
        totalRecords: 0,
        completeRecords: 0,
        incompleteRecords: 0,
        flaggedForDeletion: 0,
        details: []
      };

      const sevenDaysAgo = Date.now() - (this.INCOMPLETE_RECORD_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      // Validate books with chunked processing
      const books = await db.books.where('userId').equals(userId).toArray();
      report.totalRecords += books.length;

      // 🚀 CHUNKED PROCESSING: Process 50 books at a time to prevent UI blocking
      for (let i = 0; i < books.length; i += this.COMPLETENESS_CHUNK_SIZE) {
        const bookChunk = books.slice(i, i + this.COMPLETENESS_CHUNK_SIZE);
        
        for (const book of bookChunk) {
          const validation = validateCompleteness(book, 'book');
          const completenessScore = validation.isValid ? 100 : (50 - validation.missingFields.length * 10);
          const age = Date.now() - (book.createdAt || book.updatedAt || Date.now());
          const shouldFlag = !validation.isValid && age > (sevenDaysAgo);

          if (shouldFlag) {
            report.flaggedForDeletion++;
          }

          if (!validation.isValid) {
            report.incompleteRecords++;
          } else {
            report.completeRecords++;
          }

          report.details.push({
            cid: book.cid,
            type: 'book',
            completenessScore,
            missingFields: validation.missingFields,
            age,
            flagged: shouldFlag
          });
        }
        
        // 🚀 YIELD TO UI: Allow UI thread to process between chunks
        if (i + this.COMPLETENESS_CHUNK_SIZE < books.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Validate entries with chunked processing
      const entries = await db.entries.where('userId').equals(userId).toArray();
      report.totalRecords += entries.length;

      // 🚀 CHUNKED PROCESSING: Process 50 entries at a time to prevent UI blocking
      for (let i = 0; i < entries.length; i += this.COMPLETENESS_CHUNK_SIZE) {
        const entryChunk = entries.slice(i, i + this.COMPLETENESS_CHUNK_SIZE);
        
        for (const entry of entryChunk) {
          const validation = validateCompleteness(entry, 'entry');
          const completenessScore = validation.isValid ? 100 : (50 - validation.missingFields.length * 10);
          const age = Date.now() - (entry.createdAt || entry.updatedAt || Date.now());
          const shouldFlag = !validation.isValid && age > (sevenDaysAgo);

          if (shouldFlag) {
            report.flaggedForDeletion++;
          }

          if (!validation.isValid) {
            report.incompleteRecords++;
          } else {
            report.completeRecords++;
          }

          report.details.push({
            cid: entry.cid,
            type: 'entry',
            completenessScore,
            missingFields: validation.missingFields,
            age,
            flagged: shouldFlag
          });
        }
        
        // 🚀 YIELD TO UI: Allow UI thread to process between chunks
        if (i + this.COMPLETENESS_CHUNK_SIZE < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Flag incomplete records for deletion or review
      const flaggedRecords = report.details.filter((detail: any) => detail.flagged);
      if (flaggedRecords.length > 0) {
        await this.flagIncompleteRecords(flaggedRecords);
        console.log(` [MAINTENANCE SERVICE] Flagged ${flaggedRecords.length} incomplete records for deletion`);
      }

      console.log(` [MAINTENANCE SERVICE] Completeness validation:`, {
        total: report.totalRecords,
        complete: report.completeRecords,
        incomplete: report.incompleteRecords,
        flagged: report.flaggedForDeletion
      });

      return report;

    } catch (error) {
      console.error('❌ [MAINTENANCE SERVICE] Completeness validation failed:', error);
      throw error;
    }
  }

  /**
   *  SIGNAL SERVER CLEANUP - Trigger server-side maintenance
   */
  private async signalServerCleanup(userId: string): Promise<boolean> {
    try {
      console.log('📡 [MAINTENANCE SERVICE] Signaling server for cleanup...');

      // 🔐 SECURITY GUARD: Validate sync access before server call
      const guardResult = await SyncGuard.validateSyncAccess({
        serviceName: 'SyncOrchestrator', // Use allowed service name
        onError: (msg) => console.warn(`🔒 [MAINTENANCE] ${msg}`),
        returnError: (msg) => ({ success: false, errors: [msg] })
      });
      if (!guardResult.valid) {
        console.warn('🔒 [MAINTENANCE] Server cleanup blocked by security guard');
        return false;
      }

      // 🔐 SECURE FETCH: Use PushService signed fetch instead of raw fetch
      const response = await this.pushService.secureFetch('/api/vault/maintenance', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          cleanupTasks: [
            'purgeAuditLogs',
            'purgeTelemetry',
            'purgeOrphanedMedia'
          ],
          retentionDays: this.AUDIT_LOG_RETENTION_DAYS
        })
      });

      if (response.ok) {
        console.log('✅ [MAINTENANCE SERVICE] Server cleanup triggered successfully');
        return true;
      } else if (response.status === 404) {
        console.debug('🔍 [MAINTENANCE SERVICE] Server cleanup endpoint not available, skipping...');
        return false;
      } else {
        console.warn('⚠️ [MAINTENANCE SERVICE] Server cleanup failed:', response.statusText);
        return false;
      }

    } catch (error) {
      console.warn('⚠️ [MAINTENANCE SERVICE] Server cleanup signal failed (endpoint may not exist):', error);
      return false;
    }
  }

  /**
   * 🔐 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
  }

  /**
   * 📊 GET CLEANUP STATISTICS
   */
  async getCleanupStatistics(userId: string): Promise<{
    auditLogCount: number;
    oldAuditLogCount: number;
    syncedBooksWithMetadata: number;
    syncedEntriesWithMetadata: number;
    incompleteRecordCount: number;
  }> {
    try {
      const sixtyDaysAgo = Date.now() - (this.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

      const [auditLogCount, oldAuditLogCount, syncedBooksWithMetadata, syncedEntriesWithMetadata] = await Promise.all([
        db.auditLogs?.where('userId').equals(userId).count() || Promise.resolve(0),
        db.auditLogs?.where('userId').equals(userId).and((log: any) => log.timestamp < sixtyDaysAgo).count() || Promise.resolve(0),
        db.books.where('userId').equals(userId).and((book: any) => book.synced === 1 && (book.syncAttempts > 0 || book.lastAttempt)).count(),
        db.entries.where('userId').equals(userId).and((entry: any) => entry.synced === 1 && (entry.syncAttempts > 0 || entry.lastAttempt)).count()
      ]);

      // Count incomplete records
      const books: any[] = await db.books.where('userId').equals(userId).toArray();
      const entries: any[] = await db.entries.where('userId').equals(userId).toArray();
      
      let incompleteRecordCount = 0;
      [...books, ...entries].forEach((record: any) => {
        const type = 'book' in record ? 'book' : 'entry';
        const validation = validateCompleteness(record, type);
        if (!validation.isValid) incompleteRecordCount++;
      });

      return {
        auditLogCount,
        oldAuditLogCount,
        syncedBooksWithMetadata,
        syncedEntriesWithMetadata,
        incompleteRecordCount
      };

    } catch (error) {
      console.error('❌ [MAINTENANCE SERVICE] Failed to get cleanup statistics:', error);
      throw error;
    }
  }

  /**
   * 🚩 FLAG INCOMPLETE RECORDS - Mark records for user review or deletion
   */
  private async flagIncompleteRecords(flaggedRecords: any[]): Promise<void> {
    try {
      const updates: any[] = flaggedRecords.map((record: any) => {
        const isBook = record.type === 'book';
        const table = isBook ? db.books : db.entries;
        
        return {
          key: record.cid,
          changes: {
            completenessScore: record.completenessScore,
            flaggedForReview: true,
            flaggedAt: Date.now(),
            flagReason: `Incomplete: ${record.missingFields.join(', ')}`
          }
        };
      });

      // Update books - ATOMIC TRANSACTION
      const bookUpdates: any[] = updates.filter((u: any) => flaggedRecords.some((r: any) => r.cid === u.key && r.type === 'book'));
      if (bookUpdates.length > 0) {
        await db.transaction('rw', db.books, async () => {
          await db.books.bulkUpdate(bookUpdates);
        });
      }
      
      // Update entries - ATOMIC TRANSACTION
      const entryUpdates: any[] = updates.filter((u: any) => flaggedRecords.some((r: any) => r.cid === u.key && r.type === 'entry'));
      if (entryUpdates.length > 0) {
        await db.transaction('rw', db.entries, async () => {
          await db.entries.bulkUpdate(entryUpdates);
        });
      }

    } catch (error) {
      console.error('❌ [MAINTENANCE SERVICE] Failed to flag incomplete records:', error);
      throw error;
    }
  }
}
