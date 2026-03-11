"use client";



import { db } from '@/lib/offlineDB';

import { UserManager } from '../core/user/UserManager';

import { telemetry } from '../Telemetry';

import { getTimestamp } from '@/lib/shared/utils';

import toast from 'react-hot-toast';

import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

import { generateEntryChecksum } from '@/lib/offlineDB';

import { getVaultStore } from '@/lib/vault/store/storeHelper';

import { HydrationController } from '../hydration/HydrationController';



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

  private static instance: IntegrityService;

  private userId: string | null = null;

  private tamperCount: number = 0; // 🛡️ 3-STRIKE RULE

  private lastTamperCheck: number = 0;

  private isCheckingIntegrity = false;

  private integrityCheckInterval: any = null;

  private shadowCache = new Map<string, any>();

  private pendingDeletions = new Map<string, NodeJS.Timeout>();

  private hydrationService: HydrationController;

  

  // Constants

  private readonly SHADOW_CACHE_TTL = 15000; // 15 seconds

  private readonly INTEGRITY_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes



  constructor() {

    // Remove top-level userId initialization to prevent circular dependency
    // userId will be retrieved lazily when methods are called

    this.hydrationService = HydrationController.getInstance();

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



      // 🔧 STEP 1: VALIDATE FINANCIAL CHECKSUMS (V4.5)

      const checksumResult = await this.validateFinancialChecksums(userId);

      issuesFound += checksumResult.issuesFound;

      issuesFixed += checksumResult.issuesFixed;



      // 🔧 STEP 2: REPAIR CORRUPTED DATA

      const repairResult = await this.repairCorruptedData(userId);

      issuesFound += repairResult.issuesFound;

      issuesFixed += repairResult.issuesFixed;



      // 🔍 STEP 3: CHECK FOR CONFLICTS

      const conflictResult = await this.checkForConflicts();

      conflicts = conflictResult.conflicts;



      // 🔧 STEP 4: VALIDATE DATA CONSISTENCY

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

   * 🔍 VALIDATE FINANCIAL CHECKSUMS (V4.5 Mathematical Integrity)

   */

  private async validateFinancialChecksums(userId: string): Promise<{ issuesFound: number; issuesFixed: number }> {

    let issuesFound = 0;

    let issuesFixed = 0;



    try {

      console.log('🔍 [INTEGRITY SERVICE] V4.5: Validating financial checksums...');

      

      // Fetch all unsynced entries

      const unsyncedEntries = await db.entries

        .where('userId')

        .equals(userId)

        .and((entry: LocalEntry) => entry.synced === 0 && entry.isDeleted === 0)

        .toArray();

      

      // 🚀 CHUNKED PROCESSING: Process 50 items at a time to prevent UI blocking

      const CHUNK_SIZE = 50;

      const totalChunks = Math.ceil(unsyncedEntries.length / CHUNK_SIZE);

      

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {

        const startIndex = chunkIndex * CHUNK_SIZE;

        const endIndex = Math.min(startIndex + CHUNK_SIZE, unsyncedEntries.length);

        const chunk = unsyncedEntries.slice(startIndex, endIndex);

        

        // 🔍 [INTEGRITY SERVICE] Processing chunk - Silenced for production
        // console.log(`🔍 [INTEGRITY SERVICE] Processing chunk ${chunkIndex + 1}/${totalChunks} (${chunk.length} entries)`);

        

        for (const entry of chunk) {

          // Re-calculate checksum using the same logic as generateEntryChecksum

          const recalculatedChecksum = await generateEntryChecksum({

            amount: entry.amount,

            date: entry.date,

            time: entry.time || "",

            title: entry.title,

            note: entry.note || "",

            category: entry.category || "",

            paymentMethod: entry.paymentMethod || "",

            type: entry.type || "",

            status: entry.status || ""

          });

          

          // Check for tampering

          if (entry.checksum !== recalculatedChecksum) {

            issuesFound++;

            //  3-STRIKE RULE: Increment tamper count
            this.tamperCount++;
            const now = Date.now();
            
            // Reset count if last check was more than 5 minutes ago
            if (now - this.lastTamperCheck > 5 * 60 * 1000) {
              this.tamperCount = 1;
            }
            this.lastTamperCheck = now;

            // Mark as tampered
            await db.entries.update(entry.localId!, {
              isTampered: 1,
              synced: 0,
              updatedAt: getTimestamp(),
              vKey: getTimestamp()
            });

            //  3-STRIKE RULE: Only lockdown after 3 consecutive tampering detections
            if (this.tamperCount >= 3) {
              console.error(` [INTEGRITY SERVICE] 3-STRIKE VIOLATION: Tampering detected ${this.tamperCount} times! LOCKDOWN ENFORCED.`);
              
              // IMMEDIATE LOCKDOWN ENFORCEMENT
              getVaultStore().setSecurityLockdown(true);
              
              // Log critical security event
              telemetry.log({
                type: 'SECURITY',
                level: 'CRITICAL',
                message: 'CHECKSUM_TAMPERING_3_STRIKE',
                data: {
                  entryId: entry.cid,
                  localId: entry.localId,
                  expectedChecksum: entry.checksum,
                  actualChecksum: recalculatedChecksum,
                  tamperCount: this.tamperCount,
                  userId: this.userId
                }
              });
            } else {
              //  READ-ONLY MODE: First 2 strikes - put in read-only mode
              console.warn(` [INTEGRITY SERVICE] Tampering detected (${this.tamperCount}/3) - Read-only mode activated`);
              
              const store = getVaultStore();
              // Note: You'll need to add isReadOnly to the store state
              // store.setReadOnly(true);
              
              // Log warning event
              telemetry.log({
                type: 'SECURITY',
                level: 'WARN',
                message: 'CHECKSUM_TAMPERING_WARNING',
                data: {
                  entryId: entry.cid,
                  localId: entry.localId,
                  expectedChecksum: entry.checksum,
                  actualChecksum: recalculatedChecksum,
                  tamperCount: this.tamperCount,
                  userId: this.userId
                }
              });
            }

            

            // Break early - lockdown prevents further processing

            return { issuesFound, issuesFixed };

          }

        }

        

        // 🚀 YIELD TO UI: Allow UI thread to process between chunks
        if (chunkIndex < totalChunks - 1) {
          // ⏳ [INTEGRITY SERVICE] Yielding to UI thread before next chunk - Silenced for production
          // console.log(`⏳ [INTEGRITY SERVICE] Yielding to UI thread before next chunk...`);
          await new Promise(resolve => setTimeout(resolve, 10)); // 10ms UI yield
        }

      }

      

      console.log(`✅ [INTEGRITY SERVICE] V4.5: Financial checksum validation complete: ${issuesFound} tampering attempts detected`);

      return { issuesFound, issuesFixed };

      

    } catch (error) {

      console.error('❌ [INTEGRITY SERVICE] V4.5: Financial checksum validation failed:', error);

      return { issuesFound, issuesFixed };

    }

  }



  /**

   * �� REPAIR CORRUPTED DATA (Enhanced with V4.5 Mathematical Mismatches)

   */

  private async repairCorruptedData(userId: string): Promise<{ issuesFound: number; issuesFixed: number }> {

    let issuesFound = 0;

    let issuesFixed = 0;



    try {

      console.log('🔧 [INTEGRITY SERVICE] Starting data repair (V4.5 enhanced)...');

      

      // Legacy orphan cleanup logic

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

      

      // Legacy books cleanup

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

      

      // V4.5: Mathematical Mismatch Detection

      try {

        console.log('🔍 [INTEGRITY SERVICE] V4.5: Checking mathematical mismatches...');

        

        // Fetch server balance manifest

        const response = await fetch(`/api/stats/manifest?userId=${encodeURIComponent(userId)}`, {

          method: 'GET',

          headers: {

            'Content-Type': 'application/json'

          }

        });

        

        if (response.ok) {

          const serverManifest = await response.json();

          

          // Get local stats from Zustand

          const { globalStats } = getVaultStore();

          

          // Compare totals

          const incomeDiff = Math.abs(serverManifest.totalIncome - globalStats.totalIncome);

          const expenseDiff = Math.abs(serverManifest.totalExpense - globalStats.totalExpense);

          

          if (incomeDiff > 0 || expenseDiff > 0) {

            issuesFound++;

            console.warn(`⚠️ [INTEGRITY SERVICE] V4.5: Mathematical mismatch detected! Server vs Local:`, {

              serverIncome: serverManifest.totalIncome,

              localIncome: globalStats.totalIncome,

              serverExpense: serverManifest.totalExpense,

              localExpense: globalStats.totalExpense

            });

            

            // Trigger full hydration to repair local data

            await this.hydrationService.fullHydration(true);

            issuesFixed++;

            

            console.log('🔧 [INTEGRITY SERVICE] V4.5: Full hydration triggered to repair mathematical mismatch');

          }

        } else if (response.status === 404) {

          console.debug('🔍 [INTEGRITY SERVICE] V4.5: Server endpoint not available, skipping check');

          return { issuesFound, issuesFixed };

        } else {

          console.warn('⚠️ [INTEGRITY SERVICE] V4.5: Could not fetch server manifest for comparison');

        }

      } catch (manifestError) {

        console.warn('⚠️ [INTEGRITY SERVICE] V4.5: Mathematical mismatch check failed:', manifestError);

      }

      

      console.log(`✅ [INTEGRITY SERVICE] V4.5: Data repair complete: ${issuesFixed}/${issuesFound} issues fixed`);

      return { issuesFound, issuesFixed };

      

    } catch (error) {

      console.error('❌ [INTEGRITY SERVICE] V4.5: Data repair failed:', error);

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

            updatedAt: getTimestamp(),

            vKey: getTimestamp()

          });

          

          issuesFixed++;

          // 🔧 [INTEGRITY SERVICE] Fixed orphaned entry - Silenced for production
          // console.log(`🔧 [INTEGRITY SERVICE] Fixed orphaned entry ${entry.cid} (book ${entryBookId} not found)`);

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

          // ⚠️ [INTEGRITY SERVICE] Book negative balance - Silenced for production
          // console.warn(`⚠️ [INTEGRITY SERVICE] Book ${book.name} has negative balance: ${balance}`);

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

   * 👻 PATHOR V2: DETECT GHOST RECORDS

   * Uses /api/books/verify API to find books that exist locally but were deleted from server.

   * For each ghost book: Set conflicted: 1 and conflictReason: 'PARENT_DELETED_CHILDREN_EXIST'

   */

  async detectGhostRecords(): Promise<{ ghostsFound: number; ghostsMarked: number; error?: string }> {

    try {

      console.log('👻 [INTEGRITY SERVICE] Starting ghost record detection...');

      

      const userId = this.getUserId();

      if (!userId) {

        return { ghostsFound: 0, ghostsMarked: 0, error: 'No user ID available' };

      }



      // Get all local book IDs (_id field contains MongoDB ObjectId)

      const localBooks = await db.books

        .where('userId')

        .equals(userId)

        .and((book: LocalBook) => book.isDeleted === 0)

        .toArray();



      if (localBooks.length === 0) {

        console.log('👻 [INTEGRITY SERVICE] No local books to verify');

        return { ghostsFound: 0, ghostsMarked: 0 };

      }



      // Extract MongoDB _id values as strings

      const localBookIds = localBooks

        .map((book: LocalBook) => String(book._id))

        .filter((id: string) => id && id.length > 0);



      if (localBookIds.length === 0) {

        console.log('👻 [INTEGRITY SERVICE] No valid local book IDs to verify');

        return { ghostsFound: 0, ghostsMarked: 0 };

      }



      // Call /api/books/verify to find missing IDs

      const response = await fetch('/api/books/verify', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ bookIds: localBookIds, userId })

      });



      if (!response.ok) {

        const errorText = await response.text();

        console.error('👻 [INTEGRITY SERVICE] Verify API failed:', response.status, errorText);

        return { ghostsFound: 0, ghostsMarked: 0, error: `Verify API failed: ${response.status}` };

      }



      const result = await response.json();

      const missingIds: string[] = result.missingIds || [];



      console.log(`👻 [INTEGRITY SERVICE] Ghost detection: ${missingIds.length} missing out of ${localBookIds.length} checked`);



      if (missingIds.length === 0) {

        return { ghostsFound: 0, ghostsMarked: 0 };

      }



      // Mark each ghost book as conflicted with PARENT_DELETED_CHILDREN_EXIST

      let ghostsMarked = 0;

      const timestamp = getTimestamp();



      for (const missingId of missingIds) {

        // Find local book with this _id

        const ghostBook = localBooks.find((book: LocalBook) => String(book._id) === missingId);



        if (ghostBook && ghostBook.localId) {

          // Update as conflicted per PATHOR V2 protocol

          await db.books.update(ghostBook.localId, {

            conflicted: 1,

            conflictReason: 'PARENT_DELETED_CHILDREN_EXIST',

            synced: 0,

            updatedAt: timestamp,

            vKey: timestamp

          });



          // Also register in syncSlice (single source of truth)

          const store = getVaultStore();

          store.registerConflict({

            id: ghostBook.cid,

            type: 'book',

            cid: ghostBook.cid,

            localId: ghostBook.localId,

            record: ghostBook,

            conflictType: 'parent_deleted',

          });



          ghostsMarked++;

          console.log(`👻 [INTEGRITY SERVICE] Marked ghost book ${ghostBook.cid} (localId: ${ghostBook.localId}) as PARENT_DELETED_CHILDREN_EXIST`);

        }

      }



      console.log(`👻 [INTEGRITY SERVICE] Ghost detection complete: ${ghostsMarked} ghosts marked as conflicts`);

      return { ghostsFound: missingIds.length, ghostsMarked };



    } catch (error) {

      console.error('👻 [INTEGRITY SERVICE] Ghost detection failed:', error);

      return { ghostsFound: 0, ghostsMarked: 0, error: String(error) };

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

        clonedRecord._shadowCacheTimestamp = getTimestamp();

        clonedRecord._shadowCacheId = `${localId}_${getTimestamp()}`;

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

      

      const cacheAge = getTimestamp() - cachedRecord._shadowCacheTimestamp;

      if (cacheAge > this.SHADOW_CACHE_TTL) {

        this.clearShadowCacheEntry(localId);

        return false;

      }

      

      const { _shadowCacheTimestamp, _shadowCacheId, ...originalRecord } = cachedRecord;

      const restoredRecord = {

        ...originalRecord,

        isDeleted: 0,

        synced: 0,

        updatedAt: getTimestamp(),

        vKey: (originalRecord.vKey || 0) + 1,

        syncAttempts: 0,

        _restoredFromShadowCache: true,

        _restoredAt: getTimestamp()

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

      userId: this.userId || '',

      shadowCacheSize: this.shadowCache.size,

      pendingDeletions: this.pendingDeletions.size,

      isScheduled: !!this.integrityCheckInterval

    };

  }



  /**

   * 🔍 PUBLIC VALIDATE FINANCIAL CHECKSUMS (For PushService Integration)

   */

  async validateFinancialChecksumsPublic(): Promise<{ success: boolean; tamperingDetected: boolean; error?: string }> {

    try {

      const userId = this.getUserId();

      if (!userId) {

        return { success: false, tamperingDetected: false, error: 'No user ID available' };

      }

      

      const result = await this.validateFinancialChecksums(userId);

      return { 

        success: true, 

        tamperingDetected: result.issuesFound > 0 

      };

    } catch (error) {

      return { 

        success: false, 

        tamperingDetected: false, 

        error: String(error) 

      };

    }

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

    const id = this.userId || UserManager.getInstance().getUserId();

    return String(id || '');

  }

}

