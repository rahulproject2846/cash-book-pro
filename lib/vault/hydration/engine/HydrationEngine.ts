"use client";

import { db } from '@/lib/offlineDB';
import { getVaultStore } from '../../store/storeHelper';
import { validateBook, validateEntry } from '../../core/schemas';
import { normalizeUser } from '../../core/VaultUtils';
import type { HydrationResult, SecurityState, CommitOperation } from './types';

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
  private validate(data: any, type: 'BOOK' | 'ENTRY' | 'USER'): { success: boolean; data?: any; error?: string } {
    if (type === 'USER') {
      const normalizedUser = normalizeUser(data, this.currentUserId);
      if (normalizedUser) {
        return { success: true, data: normalizedUser };
      } else {
        return { success: false, error: 'User normalization failed' };
      }
    }
    
    if (type === 'BOOK') {
      return validateBook(data);
    } else if (type === 'ENTRY') {
      return validateEntry(data);
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

      // 🛡️ VALIDATION: Validate all records
      const validRecords: any[] = [];
      for (const record of uniqueRecords) {
        const validation = this.validate(record, type as 'BOOK' | 'ENTRY' | 'USER');
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
      const result = await db.transaction('rw', db.books, db.entries, db.users, async () => {
        let processedCount = 0;

        if (type === 'BOOK') {
          if (validRecords.length === 1) {
            // Single record operation
            const record = validRecords[0];
            const existing = await db.books.where('cid').equals(record.cid).first();
            
            if (existing) {
              await db.books.update(existing.localId!, record);
              console.log(`✅ [IRON GATE] Updated book: ${record.cid}`);
            } else {
              await db.books.add(record);
              console.log(`✅ [IRON GATE] Added book: ${record.cid}`);
            }
            processedCount = 1;
          } else {
            // Bulk operation
            await db.books.bulkPut(validRecords);
            processedCount = validRecords.length;
            console.log(`✅ [IRON GATE] Bulk put ${processedCount} books`);
          }
        } else if (type === 'ENTRY') {
          if (validRecords.length === 1) {
            // Single record operation
            const record = validRecords[0];
            const existing = await db.entries.where('cid').equals(record.cid).first();
            
            if (existing) {
              await db.entries.update(existing.localId!, record);
              console.log(`✅ [IRON GATE] Updated entry: ${record.cid}`);
            } else {
              await db.entries.add(record);
              console.log(`✅ [IRON GATE] Added entry: ${record.cid}`);
            }
            processedCount = 1;
          } else {
            // Bulk operation
            await db.entries.bulkPut(validRecords);
            processedCount = validRecords.length;
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
      return { 
        success: true, 
        count: result, 
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
}
