"use client";



import { db } from '@/lib/offlineDB';

import { getPlatform } from '@/lib/platform';

import { normalizeRecord, normalizeTimestamp } from '../../core/VaultUtils';

import { getVaultStore } from '../../store/storeHelper';

import { validateBook, validateEntry } from '../../core/schemas';

import { normalizeUser } from '../../core/VaultUtils';

import type { HydrationResult, SecurityState, CommitOperation, BatchCommitOperation } from './types';



/**

 * 🛡️ HYDRATION ENGINE (V6.0) - The Iron Gate Core

 * 

 * This is the ONLY place where database writes happen.

 * All hydration flows must pass through this engine.

 * 

 * Features:

 * - Global Security Guards (Lockdown check)

 * - Deduplication (CID mapping)

 * - Normalization & Zod Validation

 * - Atomic Dexie Transactions

 */

export class HydrationEngine {

  private currentUserId: string = '';



  constructor(userId?: string) {

    this.currentUserId = userId || '';

  }



  /**

   * 🔐 SET USER ID

   */

  setUserId(userId: string): void {

    this.currentUserId = userId;

  }



  /**

   * 🛡️ SECURITY GUARD: Check lockdown state before any operation

   */

  private checkSecurityGuard(): { allowed: boolean; reason?: string } {

    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();

    

    if (isSecurityLockdown) {

      return { allowed: false, reason: 'SECURITY_LOCKDOWN' };

    }

    

    if (emergencyHydrationStatus === 'failed') {

      return { allowed: false, reason: 'EMERGENCY_HYDRATION_FAILED' };

    }

    

    return { allowed: true };

  }



  /**

   * 🛡️ VALIDATE: Uses Zod to enforce schema

   */

  private validate(data: any, type: 'BOOK' | 'ENTRY' | 'USER', existingRecord?: any): { success: boolean; data?: any; error?: string } {

    // 🎯 SEAL VALIDATION HOLE: Check for cid existence (skip for USER)
    if (type !== 'USER' && !data.cid) {
      console.error(`🛡️ [IRON GATE] Validation SKIPPED: Missing cid for ${type} record`);
      return { success: false, error: 'Missing cid - cannot validate record without identity' };
    }

    // 🎯 MERGE-THEN-VALIDATE: For lean payloads, merge with existing record first
    let recordToValidate = data;
    
    if (existingRecord && type !== 'USER') {
      recordToValidate = { ...existingRecord, ...data };
    }

    if (type === 'USER') {

      const normalizedUser = normalizeUser(data, this.currentUserId);

      if (normalizedUser) {

        return { success: true, data: normalizedUser };

      } else {

        return { success: false, error: 'User normalization failed' };

      }

    }

    

    if (type === 'BOOK') {

      return validateBook(recordToValidate);

    } else if (type === 'ENTRY') {

      return validateEntry(recordToValidate);

    }

    

    return { success: false, error: `Unknown validation type: ${type}` };

  }



  /**

   * 🔄 DEDUPLICATE: Uses CID mapping to filter duplicates

   */

  private deduplicate(records: any[]): any[] {

    if (!Array.isArray(records)) return [];

    

    return Array.from(

      new Map(records.map(item => [item.cid, item])).values()

    );

  }



  /**

   * ⚛️ COMMIT: The ONLY public method that performs db.transaction

   * 

   * This is the Iron Gate - all database writes must pass through here.

   */

  public async commit(type: string, records: any[], source: string): Promise<HydrationResult> {

    try {

      console.log(`🛡️ [IRON GATE] Commit request: ${type} | Records: ${records.length} | Source: ${source}`);



      // 🛡️ SECURITY GUARD: Check lockdown state

      const securityCheck = this.checkSecurityGuard();

      if (!securityCheck.allowed) {

        console.error(`🛡️ [IRON GATE] BLOCKED: ${securityCheck.reason}`);

        return { 

          success: false, 

          error: `Security guard blocked operation: ${securityCheck.reason}`,

          source 

        };

      }



      // 🔄 DEDUPLICATION: Filter duplicates

      const uniqueRecords = this.deduplicate(records);

      console.log(`🔄 [IRON GATE] Deduplication: ${records.length} → ${uniqueRecords.length} records`);



      // 🛡️ VALIDATION: Validate all records (with Merge-then-Validate for lean payloads)

      const validRecords: any[] = [];

      for (const record of uniqueRecords) {

        // 🎯 FETCH EXISTING: Get existing record for merge-then-validate

        let existingRecord: any;

        try {

          if (type === 'BOOK') {

            // 🎯 TRIPLE-LINK: Use cid, _id, or localId to find existing record
            const bookId = record.cid || record._id || record.localId;
            if (bookId) {
              const isNumeric = !isNaN(Number(bookId));
              if (isNumeric) {
                existingRecord = await db.books.where('localId').equals(Number(bookId)).first();
              }
              if (!existingRecord) {
                existingRecord = await db.books.where('_id').equals(String(bookId)).first();
              }
              if (!existingRecord && record.cid) {
                existingRecord = await db.books.where('cid').equals(record.cid).first();
              }
            }

          } else if (type === 'ENTRY') {

            // 🎯 TRIPLE-LINK: Use cid, _id, or localId to find existing record
            const entryId = record.cid || record._id || record.localId;
            if (entryId) {
              const isNumeric = !isNaN(Number(entryId));
              if (isNumeric) {
                existingRecord = await db.entries.where('localId').equals(Number(entryId)).first();
              }
              if (!existingRecord) {
                existingRecord = await db.entries.where('_id').equals(String(entryId)).first();
              }
              if (!existingRecord && record.cid) {
                existingRecord = await db.entries.where('cid').equals(record.cid).first();
              }
            }

          }

        } catch (e) {

          // Ignore lookup errors, proceed with validation without existing record

        }



        const validation = this.validate(record, type as 'BOOK' | 'ENTRY' | 'USER', existingRecord);

        if (validation.success && validation.data) {

          validRecords.push(validation.data);

        } else {

          console.error(`🛡️ [IRON GATE] Validation failed: ${validation.error}`);

          // Continue with other records, don't fail entire batch

        }

      }



      if (validRecords.length === 0) {

        console.warn(`⚠️ [IRON GATE] No valid records to commit`);

        return { success: true, count: 0, source };

      }



      // ⚛️ ATOMIC TRANSACTION: Perform database operation

      let finalId: any;

      const result = await db.transaction('rw', db.books, db.entries, db.users, async () => {

        let processedCount = 0;



        if (type === 'BOOK') {

          if (validRecords.length === 1) {

            // Single record operation

            const record = validRecords[0];

            const existing = await db.books.where('cid').equals(record.cid).first();

            // 🛡️ DNA HARDENING: Use normalizeRecord to ensure Unix timestamps
            const normalized = normalizeRecord(record, this.currentUserId);
            if (!normalized) {
              throw new Error('Failed to normalize record during hydration');
            }

            

            if (existing) {

              await db.books.update(existing.localId!, normalized);

              console.log(`✅ [IRON GATE] Updated book: ${normalized.cid}`);

              finalId = existing.localId;

            } else {

              const newId = await db.books.add(normalized);

              console.log(`✅ [IRON GATE] Added book: ${normalized.cid}`);

              finalId = newId;

            }

            processedCount = 1;

          } else {

            // Bulk operation

            // 🛡️ NORMALIZATION: Clean corrupted null data before DB operations
            const normalizedRecords = validRecords.map(record => ({
              ...record,
              mediaCid: record.mediaCid || '',
              image: record.image || '',
              description: record.description || '',
              mediaId: record.mediaId || '',
              // 🚨 CRITICAL: Preserve existing updatedAt - don't overwrite with new Date()
              updatedAt: record.updatedAt ?? undefined // Keep original record's updatedAt
            }));

            await db.books.bulkPut(normalizedRecords);

            processedCount = normalizedRecords.length;

            console.log(`✅ [IRON GATE] Bulk put ${processedCount} books`);

          }

        } else if (type === 'ENTRY') {

          if (validRecords.length === 1) {

            // Single record operation

            const record = validRecords[0];

            const existing = await db.entries.where('cid').equals(record.cid).first();

            // 🛡️ DNA HARDENING: Use normalizeRecord to ensure Unix timestamps
            const normalized = normalizeRecord(record, this.currentUserId);
            if (!normalized) {
              throw new Error('Failed to normalize record during hydration');
            }

            

            if (existing) {

              await db.entries.update(existing.localId!, normalized);

              console.log(`✅ [IRON GATE] Updated entry: ${normalized.cid}`);

            } else {

              const newId = await db.entries.add(normalized);

              console.log(`✅ [IRON GATE] Added entry: ${normalized.cid}`);

              finalId = newId;

            }

            processedCount = 1;

          } else {

            // Bulk operation

            // 🛡️ NORMALIZATION: Clean corrupted null data before DB operations
            const normalizedRecords = validRecords.map(record => ({
              ...record,
              mediaCid: record.mediaCid || '',
              image: record.image || '',
              description: record.description || '',
              mediaId: record.mediaId || '',
              // 🚨 CRITICAL: Preserve existing updatedAt - don't overwrite with new Date()
              updatedAt: record.updatedAt ?? undefined // Keep original record's updatedAt
            }));

            await db.entries.bulkPut(normalizedRecords);

            processedCount = normalizedRecords.length;

            console.log(`✅ [IRON GATE] Bulk put ${processedCount} entries`);

          }

        } else if (type === 'USER') {

          if (validRecords.length === 1) {

            // Single record operation

            const record = validRecords[0];

            const existing = await db.users.get(record._id);

            

            if (existing) {

              await db.users.update(record._id, record);

              console.log(`✅ [IRON GATE] Updated user: ${record._id}`);

            } else {

              await db.users.add(record);

              console.log(`✅ [IRON GATE] Added user: ${record._id}`);

            }

            processedCount = 1;

          } else {

            // Bulk operation

            await db.users.bulkPut(validRecords);

            processedCount = validRecords.length;

            console.log(`✅ [IRON GATE] Bulk put ${processedCount} users`);

          }

        } else {

          throw new Error(`Unsupported commit type: ${type}`);

        }



        return processedCount;

      });



      console.log(`🎯 [IRON GATE] Commit successful: ${result} records processed`);

      // 🆕 DISPATCH GLOBAL UPDATE EVENT via platform
      const platform = getPlatform();
      if ((source === 'identity_hydration' || source === 'books_hydration' || source === 'entries_hydration')) {
        platform.events.dispatch('vault-updated', { 
          timestamp: Date.now(),
          source: 'HydrationEngine',
          entityType: 'book',
          operation: 'update'
        });
      }

      return { 

        success: true, 

        count: result, 

        id: finalId,

        source,

        error: undefined 

      };



    } catch (error) {

      console.error(`❌ [IRON GATE] Commit failed:`, error);

      return { 

        success: false, 

        error: String(error),

        source 

      };

    }

  }



  /**

   * 📊 GET ENGINE STATUS

   */

  getEngineStatus(): { userId: string; securityState: SecurityState } {

    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();

    

    return {

      userId: this.currentUserId,

      securityState: {

        isSecurityLockdown,

        emergencyHydrationStatus

      }

    };

  }



  /**

   * ⚛️ COMMIT BATCH: Atomic batch operations in SINGLE transaction

   * 

   * Processes multiple operations (BOOK + ENTRY) in one atomic transaction

   * Uses merge strategy to preserve existing fields

   */

  public async commitBatch(operations: BatchCommitOperation[], source: string): Promise<HydrationResult> {

    try {

      console.log(`🛡️ [IRON GATE] Batch commit request: ${operations.length} operations | Source: ${source}`);



      // 🛡️ SECURITY GUARD: Check lockdown state

      const securityCheck = this.checkSecurityGuard();

      if (!securityCheck.allowed) {

        console.error(`🛡️ [IRON GATE] BATCH BLOCKED: ${securityCheck.reason}`);

        return { 

          success: false, 

          error: `Security guard blocked batch operation: ${securityCheck.reason}`,

          source 

        };

      }



      // 🔄 VALIDATION & DEDUPLICATION: Process all operations

      const processedOperations: BatchCommitOperation[] = [];

      let totalRecords = 0;



      for (const operation of operations) {

        const { type, records } = operation;

        

        // 🔄 DEDUPLICATION: Filter duplicates within each operation

        const uniqueRecords = this.deduplicate(records);

        console.log(`🔄 [IRON GATE] Batch deduplication: ${type} ${records.length} → ${uniqueRecords.length} records`);



        // 🛡️ VALIDATION: Validate all records in this operation (with Merge-then-Validate)

        const validRecords: any[] = [];

        for (const record of uniqueRecords) {

          // 🎯 FETCH EXISTING: Get existing record for merge-then-validate

          let existingRecord: any;

          try {

            if (type === 'BOOK') {

              // 🎯 TRIPLE-LINK: Use cid, _id, or localId to find existing record
              const bookId = record.cid || record._id || record.localId;
              if (bookId) {
                const isNumeric = !isNaN(Number(bookId));
                if (isNumeric) {
                  existingRecord = await db.books.where('localId').equals(Number(bookId)).first();
                }
                if (!existingRecord) {
                  existingRecord = await db.books.where('_id').equals(String(bookId)).first();
                }
                if (!existingRecord && record.cid) {
                  existingRecord = await db.books.where('cid').equals(record.cid).first();
                }
              }

            } else if (type === 'ENTRY') {

              // 🎯 TRIPLE-LINK: Use cid, _id, or localId to find existing record
              const entryId = record.cid || record._id || record.localId;
              if (entryId) {
                const isNumeric = !isNaN(Number(entryId));
                if (isNumeric) {
                  existingRecord = await db.entries.where('localId').equals(Number(entryId)).first();
                }
                if (!existingRecord) {
                  existingRecord = await db.entries.where('_id').equals(String(entryId)).first();
                }
                if (!existingRecord && record.cid) {
                  existingRecord = await db.entries.where('cid').equals(record.cid).first();
                }
              }

            }

          } catch (e) {

            // Ignore lookup errors

          }



          const validation = this.validate(record, type, existingRecord);

          if (validation.success && validation.data) {

            validRecords.push(validation.data);

          } else {

            console.error(`🛡️ [IRON GATE] Batch validation failed: ${validation.error}`);

            // Continue with other records, don't fail entire operation

          }

        }



        if (validRecords.length > 0) {

          processedOperations.push({ type, records: validRecords });

          totalRecords += validRecords.length;

        }

      }



      if (processedOperations.length === 0) {

        console.warn(`⚠️ [IRON GATE] No valid operations to commit`);

        return { success: true, count: 0, source };

      }



      // ⚛️ ATOMIC TRANSACTION: ALL operations in SINGLE db.transaction

      const result = await db.transaction('rw', db.books, db.entries, db.users, async () => {

        let processedCount = 0;



        for (const operation of processedOperations) {

          const { type, records } = operation;



          if (type === 'BOOK') {

            for (const record of records) {

              const existing = await db.books.where('cid').equals(record.cid).first();

              

              if (existing) {

                // 🚨 DNA HARDENING: Use normalizeRecord for merge strategy to ensure Unix timestamps
                const normalizedRecord = normalizeRecord({
                  ...existing, 
                  ...record
                });
                if (!normalizedRecord) {
                  throw new Error('Failed to normalize record during merge');
                }
                const updated = { 
                  ...existing, 
                  ...record,
                  updatedAt: normalizedRecord.updatedAt
                };
                await db.books.update(existing.localId!, updated);

                console.log(`✅ [IRON GATE] Batch updated book: ${record.cid}`);

              } else {

                await db.books.add(record);

                console.log(`✅ [IRON GATE] Batch added book: ${record.cid}`);

              }

              processedCount++;

            }

          } else if (type === 'ENTRY') {

            for (const record of records) {

              const existing = await db.entries.where('cid').equals(record.cid).first();

              

              if (existing) {

                // 🚨 DNA HARDENING: Use normalizeRecord for merge strategy to ensure Unix timestamps
                const normalizedRecord = normalizeRecord({
                  ...existing, 
                  ...record
                });
                if (!normalizedRecord) {
                  throw new Error('Failed to normalize record during merge');
                }
                const updated = { 
                  ...existing, 
                  ...record,
                  updatedAt: normalizedRecord.updatedAt
                };
                await db.entries.update(existing.localId!, updated);

                console.log(`✅ [IRON GATE] Batch updated entry: ${record.cid}`);

              } else {

                await db.entries.add(record);

                console.log(`✅ [IRON GATE] Batch added entry: ${record.cid}`);

              }

              processedCount++;

            }

          } else if (type === 'USER') {

            for (const record of records) {

              const existing = await db.users.get(record._id);

              

              if (existing) {

                // 🚨 DNA HARDENING: Use normalizeRecord for merge strategy to ensure Unix timestamps
                const normalizedRecord = normalizeUser(record, this.currentUserId);
                if (!normalizedRecord) {
                  throw new Error('Failed to normalize user record during merge');
                }
                const updated = { 
                  ...existing, 
                  ...record,
                  updatedAt: normalizedRecord.updatedAt
                };
                await db.users.update(record._id, updated);

                console.log(`✅ [IRON GATE] Batch updated user: ${record._id}`);

              } else {

                await db.users.add(record);

                console.log(`✅ [IRON GATE] Batch added user: ${record._id}`);

              }

              processedCount++;

            }

          } else {

            throw new Error(`Unsupported batch operation type: ${type}`);

          }

        }



        return processedCount;

      });



      console.log(`🎯 [IRON GATE] Batch commit successful: ${result} records processed across ${processedOperations.length} operations`);

      // 🆕 DISPATCH GLOBAL UPDATE EVENT via platform
      const platform = getPlatform();
      platform.events.dispatch('vault-updated', { 
        timestamp: Date.now(),
        source: 'HydrationEngine',
        entityType: 'book',
        operation: 'update'
      });

      return { 

        success: true, 

        count: result, 

        source,

        error: undefined 

      };



    } catch (error) {

      console.error(`❌ [IRON GATE] Batch commit failed:`, error);

      return { 

        success: false, 

        error: String(error),

        source 

      };

    }

  }

}

