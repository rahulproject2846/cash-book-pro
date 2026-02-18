"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { telemetry } from '../Telemetry';
import toast from 'react-hot-toast';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * 🔍 INTEGRITY SERVICE - Handles data integrity and conflict management
 * 
 * Responsibility: Maintain data consistency and detect issues
 * - Database integrity checks
 * - Conflict detection and resolution
 * - Data repair operations
 * - Shadow cache management
 */

export class IntegrityService {
  private isCheckingIntegrity = false;
  private userId: string = '';
  private integrityCheckInterval: any = null;
  private shadowCache = new Map<string, any>();
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  
  // Constants
  private readonly SHADOW_CACHE_TTL = 15000; // 15 seconds
  private readonly INTEGRITY_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

  constructor() {
    this.userId = identityManager.getUserId() || '';
  }

  /**
   * 🔍 PERFORM INTEGRITY CHECK
   */
  async performIntegrityCheck(): Promise<{ 
    success: boolean; 
    issuesFound: number; 
    issuesFixed: number; 
    conflicts: number;
    error?: string 
  }> {
    if (this.isCheckingIntegrity) {
      console.log('🔍 [INTEGRITY SERVICE] Already checking integrity, skipping...');
      return { success: false, issuesFound: 0, issuesFixed: 0, conflicts: 0, error: 'Already checking' };
    }

    this.isCheckingIntegrity = true;
    
    try {
      console.log('🔍 [INTEGRITY SERVICE] Starting integrity check...');
      
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('No user ID available for integrity check');
      }

      let issuesFound = 0;
      let issuesFixed = 0;
      let conflicts = 0;

      // 🔧 STEP 1: REPAIR CORRUPTED DATA
      const repairResult = await this.repairCorruptedData(userId);
      issuesFound += repairResult.issuesFound;
      issuesFixed += repairResult.issuesFixed;

      // 🔍 STEP 2: CHECK FOR CONFLICTS
      const conflictResult = await this.checkForConflicts();
      conflicts = conflictResult.conflicts;

      // 🔧 STEP 3: VALIDATE DATA CONSISTENCY
      const consistencyResult = await this.validateDataConsistency(userId);
      issuesFound += consistencyResult.issuesFound;
      issuesFixed += consistencyResult.issuesFixed;

      console.log('🔍 [INTEGRITY SERVICE] Integrity check complete:', { 
        issuesFound, 
        issuesFixed, 
        conflicts 
      });

      return { 
        success: true, 
        issuesFound, 
        issuesFixed, 
        conflicts 
      };

    } catch (error) {
      console.error('❌ [INTEGRITY SERVICE] Integrity check failed:', error);
      return { 
        success: false, 
        issuesFound: 0, 
        issuesFixed: 0, 
        conflicts: 0, 
        error: String(error) 
      };
    } finally {
      this.isCheckingIntegrity = false;
    }
  }

  /**
   * 🔧 REPAIR CORRUPTED DATA
   */
  private async repairCorruptedData(userId: string): Promise<{ issuesFound: number; issuesFixed: number }> {
    let issuesFound = 0;
    let issuesFixed = 0;

    try {
      console.log('🔧 [INTEGRITY SERVICE] Starting data repair...');
      
      // Fix entries table
      const allEntries = await db.entries.toArray();
      for (const entry of allEntries) {
        const needsRepair = 
          entry.userId !== userId || 
          entry.isDeleted === undefined ||
          entry.isDeleted === null ||
          typeof entry.userId !== 'string';
        
        if (needsRepair) {
          issuesFound++;
          const updates: any = {
            userId: String(userId),
            isDeleted: Number(entry.isDeleted || 0)
          };
          
          await db.entries.update(entry.localId!, updates);
          issuesFixed++;
        }
      }
      
      // Fix books table
      const allBooks = await db.books.toArray();
      for (const book of allBooks) {
        const needsRepair = 
          book.userId !== userId || 
          book.isDeleted === undefined ||
          book.isDeleted === null ||
          typeof book.userId !== 'string';
        
        if (needsRepair) {
          issuesFound++;
          const updates: any = {
            userId: String(userId),
            isDeleted: Number(book.isDeleted || 0)
          };
          
          await db.books.update(book.localId!, updates);
          issuesFixed++;
        }
      }
      
      console.log(`✅ [INTEGRITY SERVICE] Data repair complete: ${issuesFixed}/${issuesFound} issues fixed`);
      return { issuesFound, issuesFixed };
      
    } catch (error) {
      console.error('❌ [INTEGRITY SERVICE] Data repair failed:', error);
      return { issuesFound, issuesFixed };
    }
  }

  /**
   * 🔍 CHECK FOR CONFLICTS
   */
  private async checkForConflicts(): Promise<{ conflicts: number }> {
    try {
      // Query for all conflicted records
      const conflictedBooks = await db.books.where('conflicted').equals(1).toArray();
      const conflictedEntries = await db.entries.where('conflicted').equals(1).toArray();
      
      const totalConflicts = conflictedBooks.length + conflictedEntries.length;
      
      if (totalConflicts > 0) {
        // Update conflict store
        const { useConflictStore } = await import('../ConflictStore');
        
        const mappedConflicts = [
          ...conflictedBooks.map((book: any) => ({
            type: 'book' as const,
            cid: book.cid,
            localId: book.localId,
            record: book,
            conflictType: 'version'
          })),
          ...conflictedEntries.map((entry: any) => ({
            type: 'entry' as const,
            cid: entry.cid,
            localId: entry.localId,
            record: entry,
            conflictType: 'version'
          }))
        ];
        
        const { setConflicts } = useConflictStore.getState();
        setConflicts(mappedConflicts);
        
        // Notify user
        toast.error(`${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} detected!`, {
          duration: 8000,
        });
        
        console.log(`🚨 [INTEGRITY SERVICE] Found ${totalConflicts} conflicts`);
      }
      
      return { conflicts: totalConflicts };
      
    } catch (error) {
      console.error('🚨 [INTEGRITY SERVICE] Conflict check failed:', error);
      return { conflicts: 0 };
    }
  }

  /**
   * 🔍 VALIDATE DATA CONSISTENCY
   */
  private async validateDataConsistency(userId: string): Promise<{ issuesFound: number; issuesFixed: number }> {
    let issuesFound = 0;
    let issuesFixed = 0;

    try {
      console.log('🔍 [INTEGRITY SERVICE] Validating data consistency...');
      
      // Check for orphaned entries (entries pointing to deleted books)
      const allEntries: LocalEntry[] = await db.entries.where('userId').equals(userId).toArray();
      const activeBooks = (await db.books
        .where('userId')
        .equals(userId)
        .and((book: LocalBook) => book.isDeleted === 0)
        .toArray()) as LocalBook[];
      
      const activeBookIds = new Set(
        activeBooks.map(book => String(book._id || (book as any).localId))
      );
      
      for (const entry of allEntries) {
        const entryBookId = String((entry as LocalEntry).bookId || '');
        
        if (entry.isDeleted === 0 && !activeBookIds.has(entryBookId)) {
          issuesFound++;
          
          // Option 1: Mark entry as deleted (safer)
          await db.entries.update(entry.localId!, {
            isDeleted: 1,
            synced: 0,
            updatedAt: Date.now(),
            vKey: Date.now()
          });
          
          issuesFixed++;
          console.log(`🔧 [INTEGRITY SERVICE] Fixed orphaned entry ${entry.cid} (book ${entryBookId} not found)`);
        }
      }
      
      // Check for books with negative balances (if that's a business rule violation)
      for (const book of activeBooks) {
        const bookId = String(book._id || (book as any).localId);
        const bookEntries = allEntries.filter(entry => 
          String((entry as LocalEntry).bookId) === bookId && entry.isDeleted === 0
        );
        
        const income = bookEntries
          .filter(e => e.type === 'income')
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const expense = bookEntries
          .filter(e => e.type === 'expense')
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        
        const balance = income - expense;
        
        // If negative balance is not allowed, flag it
        if (balance < 0) {
          console.warn(`⚠️ [INTEGRITY SERVICE] Book ${book.name} has negative balance: ${balance}`);
          // This could be logged for business review
        }
      }
      
      console.log(`✅ [INTEGRITY SERVICE] Data consistency validation complete: ${issuesFixed}/${issuesFound} issues fixed`);
      return { issuesFound, issuesFixed };
      
    } catch (error) {
      console.error('❌ [INTEGRITY SERVICE] Data consistency validation failed:', error);
      return { issuesFound, issuesFixed };
    }
  }

  /**
   * 🕐 SCHEDULE DELETION BUFFER
   */
  async scheduleDeletion(localId: string, type: 'ENTRY' | 'BOOK'): Promise<void> {
    const existingTimeout = this.pendingDeletions.get(localId);
    if (existingTimeout) clearTimeout(existingTimeout);

    // Cache data before deletion
    try {
      const table = type === 'ENTRY' ? db.entries : db.books;
      const record = await table.get(Number(localId));
      if (record) {
        const clonedRecord = JSON.parse(JSON.stringify(record));
        clonedRecord._shadowCacheTimestamp = Date.now();
        clonedRecord._shadowCacheId = `${localId}_${Date.now()}`;
        this.shadowCache.set(localId, clonedRecord);
        
        setTimeout(() => this.clearShadowCacheEntry(localId), this.SHADOW_CACHE_TTL);
      }
    } catch (err) {
      console.warn(`Failed to cache ${type} ${localId}:`, err);
    }

    const timeoutId = setTimeout(async () => {
      try {
        const table = type === 'ENTRY' ? db.entries : db.books;
        const record = await table.get(Number(localId));
        if (record && record.isDeleted === 1) {
          console.log(`Deletion buffer expired for ${type} ${localId}`);
        }
      } catch (err) {
        console.error('Error in deletion buffer:', err);
      } finally {
        this.pendingDeletions.delete(localId);
        this.clearShadowCacheEntry(localId);
      }
    }, 10000);

    this.pendingDeletions.set(localId, timeoutId);
  }

  /**
   * 🌑 RESTORE FROM SHADOW CACHE
   */
  async restoreFromShadowCache(localId: string, type: 'ENTRY' | 'BOOK'): Promise<boolean> {
    try {
      const timeoutId = this.pendingDeletions.get(String(localId));
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.pendingDeletions.delete(String(localId));
      }
      
      const cachedRecord = this.shadowCache.get(localId);
      if (!cachedRecord) return false;
      
      const cacheAge = Date.now() - cachedRecord._shadowCacheTimestamp;
      if (cacheAge > this.SHADOW_CACHE_TTL) {
        this.clearShadowCacheEntry(localId);
        return false;
      }
      
      const { _shadowCacheTimestamp, _shadowCacheId, ...originalRecord } = cachedRecord;
      const restoredRecord = {
        ...originalRecord,
        isDeleted: 0,
        synced: 0,
        updatedAt: Date.now(),
        vKey: (originalRecord.vKey || 0) + 1,
        syncAttempts: 0,
        _restoredFromShadowCache: true,
        _restoredAt: Date.now()
      };
      
      const table = type === 'ENTRY' ? db.entries : db.books;
      await table.update(Number(localId), restoredRecord);
      this.clearShadowCacheEntry(localId);
      
      window.dispatchEvent(new CustomEvent(`${type.toLowerCase()}-restored-from-cache`, {
        detail: { localId, restoredRecord, cacheAge }
      }));
      
      return true;
    } catch (err) {
      console.error(`Failed to restore ${type} ${localId}:`, err);
      return false;
    }
  }

  /**
   * 🌑 CLEAR SHADOW CACHE ENTRY
   */
  private clearShadowCacheEntry(localId: string): void {
    this.shadowCache.delete(localId);
  }

  /**
   * 🔄 SCHEDULE INTEGRITY CHECKS
   */
  scheduleIntegrityChecks(): void {
    if (this.integrityCheckInterval) {
      clearInterval(this.integrityCheckInterval);
    }

    this.integrityCheckInterval = setInterval(async () => {
      if (!this.isCheckingIntegrity) {
        await this.performIntegrityCheck();
      }
    }, this.INTEGRITY_CHECK_INTERVAL);

    console.log('🔄 [INTEGRITY SERVICE] Integrity checks scheduled');
  }

  /**
   * 🛑 STOP INTEGRITY CHECKS
   */
  stopIntegrityChecks(): void {
    if (this.integrityCheckInterval) {
      clearInterval(this.integrityCheckInterval);
      this.integrityCheckInterval = null;
    }
  }

  /**
   * 🔐 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
  }

  /**
   * 🔄 GET INTEGRITY STATUS
   */
  getIntegrityStatus(): { 
    isCheckingIntegrity: boolean; 
    userId: string; 
    shadowCacheSize: number; 
    pendingDeletions: number;
    isScheduled: boolean;
  } {
    return {
      isCheckingIntegrity: this.isCheckingIntegrity,
      userId: this.userId,
      shadowCacheSize: this.shadowCache.size,
      pendingDeletions: this.pendingDeletions.size,
      isScheduled: !!this.integrityCheckInterval
    };
  }

  /**
   * 🧹 CLEANUP
   */
  cleanup(): void {
    this.stopIntegrityChecks();
    this.shadowCache.clear();
    this.pendingDeletions.forEach(timeout => clearTimeout(timeout));
    this.pendingDeletions.clear();
  }

  /**
   * 👤 GET USER ID
   */
  private getUserId(): string {
    const id = this.userId || identityManager.getUserId();
    return String(id || '');
  }
}
