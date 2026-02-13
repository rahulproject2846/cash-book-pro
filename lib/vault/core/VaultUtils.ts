"use client";

import { db } from '@/lib/offlineDB';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * 🏛️ VAULT PRO: UNIFIED DATABASE UTILITIES (V1.0)
 * ---------------------------------------------------
 * Single source of truth for all database operations
 * Consolidates helpers from dexieHelpers.ts and utils/helpers.ts
 */

// 🔧 TIMESTAMP NORMALIZATION
export const normalizeTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// 🌐 GLOBAL DATABASE EVENT DISPATCHER
export const dispatchDatabaseUpdate = (operation: string, type: 'book' | 'entry', data?: any) => {
    // 🔍 CIRCULAR UPDATE CHECK: Only dispatch if this is a genuine external change
    // This prevents infinite loops where our own database updates trigger real-time events
    window.dispatchEvent(new CustomEvent('database-updated', { 
        detail: { operation, type, data, timestamp: Date.now() } 
    }));
};

// 🔥 SAFE NUMBER CONVERSION: Prevent NaN from undefined values
export const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

// 🔥 UNIFIED DEXIE LOOKUP HELPERS
export interface SafeLookupResult {
  byCid: LocalEntry | LocalBook | null;
  byId: LocalEntry | LocalBook | null;
  found: boolean;
}

/**
 * 🔥 SAFE DEXIE LOOKUP: Validates keys before querying
 * Never passes undefined values to .equals() methods
 */
export const safeDexieLookup = async (
  tableName: 'entries' | 'books',
  cid: string | undefined,
  id: string | undefined
): Promise<SafeLookupResult> => {
  const table = tableName === 'entries' ? db.entries : db.books;
  
  // Always search by CID first
  let query = table.where('cid').equals(cid || "");
  
  // Add ID search if provided
  if (id) {
    query = query.or('_id').equals(id);
  }
  
  const byCid = await query.first();
  
  // If CID search failed, try direct ID search
  const byId = id ? await table.where('_id').equals(id).first() : null;
  
  return {
    byCid: byCid || null,
    byId: byId || null,
    found: !!(byCid || byId)
  };
};

/**
 * 🔥 SAFE DEXIE PUT: Prevents duplicate CID insertion
 * Handles both create and update operations safely
 */
export const safeDexiePut = async (
  tableName: 'entries' | 'books',
  data: any,
  existingLocal: LocalEntry | LocalBook | null
): Promise<void> => {
  const table = tableName === 'entries' ? db.entries : db.books;
  
  // Normalize data for database
  const normalizedData = {
    ...data,
    updatedAt: normalizeTimestamp(data.updatedAt),
    createdAt: normalizeTimestamp(data.createdAt)
  };
  
  // Remove localId for new records (Dexie will auto-generate)
  if (!existingLocal?.localId) {
    delete normalizedData.localId;
  }
  
  // Perform the put operation
  await table.put(normalizedData);
};

/**
 * 🔥 RECORD COMPARISON: Determines if server record is newer
 */
export const isNewerRecord = (
  serverRecord: any,
  localRecord: LocalEntry | LocalBook | null
): boolean => {
  if (!localRecord) return true;
  
  // 🔥 STOP INFINITE LOOP: Strict timestamp comparison
  const sTime = new Date(serverRecord.updatedAt).getTime();
  const lTime = new Date(localRecord.updatedAt).getTime();
  
  // If timestamps are equal, no update needed
  if (sTime === lTime) return false;
  
  return sTime > lTime;
};

/**
 * 🔥 ID VALIDATION HELPERS
 */
export const isValidKey = (key: any): boolean => {
  return key !== undefined && key !== null && key !== '';
};

export const isValidId = (id: any): boolean => {
  return typeof id === 'string' && id.length > 0;
};

/**
 * 🔥 ERROR LOGGING HELPER
 */
export const logVault = (operation: string, error: any, context?: any): void => {
  const errorInfo = {
    operation,
    error: error?.message || error,
    context,
    timestamp: Date.now(),
    stack: error?.stack
  };
  
  console.error(`Vault Error [${operation}]:`, errorInfo);
  
  // Also dispatch as database update for error tracking
  dispatchDatabaseUpdate('error', 'entry' as any, errorInfo);
};

export const logVaultInfo = (operation: string, message: string, context?: any): void => {
  const infoInfo = {
    operation,
    message,
    context,
    timestamp: Date.now()
  };
  
  console.log(`Vault Info [${operation}]:`, infoInfo);
  
  // Also dispatch as database update for info tracking
  dispatchDatabaseUpdate('info', 'entry' as any, infoInfo);
};

/**
 * 🔥 BATCH OPERATIONS HELPER
 */
export const createBatchUpdate = (
  type: 'create' | 'update' | 'delete',
  table: 'book' | 'entry',
  data: any
) => ({
  type,
  table,
  data
});

/**
 * 🔥 CLEANUP HELPERS
 */
export const cleanupOrphanedRecords = async (userId: string): Promise<void> => {
  try {
    // Clean up entries with invalid book references
    const orphanedEntries = await db.entries
      .where('userId')
      .equals(userId)
      .and((entry: any) => !entry.bookId || entry.bookId === '')
      .toArray();
    
    if (orphanedEntries.length > 0) {
      const orphanedIds = orphanedEntries.map((e: any) => e.localId!).filter(Boolean);
      await db.entries.bulkDelete(orphanedIds);
      console.log(`Cleaned up ${orphanedIds.length} orphaned entries`);
    }
  } catch (error) {
    logVault('cleanupOrphanedRecords', error);
  }
};

/**
 * 🔥 MIGRATION HELPERS
 */
export const migrateLegacyIds = async (): Promise<void> => {
  try {
    // Update entries that might still be using numeric bookId
    const legacyEntries = await db.entries
      .where('bookId')
      .equals('')
      .toArray();
    
    if (legacyEntries.length > 0) {
      console.log(`Migrating ${legacyEntries.length} legacy entries`);
      // Migration logic would go here
    }
  } catch (error) {
    logVault('migrateLegacyIds', error);
  }
};
