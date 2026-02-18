"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord } from '../core/VaultUtils';
import toast from 'react-hot-toast';

/**
 * 🚀 PUSH SERVICE - Handles outbound sync operations
 * 
 * Responsibility: Push local changes to server
 * - Handle pending books and entries
 * - Manage conflict detection
 * - Coordinate with sync orchestrator
 */

export class PushService {
  private isSyncing = false;
  private userId: string = '';
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  private shadowCache = new Map<string, any>();
  private readonly SHADOW_CACHE_TTL = 15000; // 15 seconds

  constructor() {
    this.userId = identityManager.getUserId() || '';
  }

  /**
   * 🚀 PUSH PENDING DATA TO SERVER
   */
  async pushPendingData(): Promise<{ success: boolean; itemsProcessed: number; errors: string[] }> {
    if (this.isSyncing) {
      console.log('🚀 [PUSH SERVICE] Already syncing, skipping...');
      return { success: false, itemsProcessed: 0, errors: ['Already syncing'] };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let itemsProcessed = 0;

    try {
      console.log('🚀 [PUSH SERVICE] Starting push sync...');
      
      // 🔄 PARALLEL PUSH OPERATIONS
      const [booksResult, entriesResult] = await Promise.allSettled([
        this.pushPendingBooks(),
        this.pushPendingEntries()
      ]);

      // Handle results
      if (booksResult.status === 'rejected') {
        errors.push(`Books sync failed: ${booksResult.reason}`);
      } else {
        itemsProcessed += booksResult.value.processed;
        errors.push(...booksResult.value.errors);
      }

      if (entriesResult.status === 'rejected') {
        errors.push(`Entries sync failed: ${entriesResult.reason}`);
      } else {
        itemsProcessed += entriesResult.value.processed;
        errors.push(...entriesResult.value.errors);
      }

      console.log('✅ [PUSH SERVICE] Push sync complete:', { itemsProcessed, errors });
      return { success: errors.length === 0, itemsProcessed, errors };

    } catch (error) {
      console.error('❌ [PUSH SERVICE] Push sync failed:', error);
      errors.push(`Push sync failed: ${error}`);
      return { success: false, itemsProcessed, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * � DEFERRED DELETION: Schedule deletion with buffer window (PORTED FROM LEGACY)
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
            clonedEntry._shadowCacheTimestamp = Date.now();
            clonedEntry._shadowCacheId = `${localId}_${Date.now()}`;
            this.shadowCache.set(localId, clonedEntry);
            
            setTimeout(() => this.clearShadowCacheEntry(localId), this.SHADOW_CACHE_TTL);
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
      } finally {
        this.pendingDeletions.delete(localId);
        this.clearShadowCacheEntry(localId);
      }
    }, 8000); // 8-second buffer

    this.pendingDeletions.set(localId, timeoutId);
    
    // Pre-cache data for potential undo
    cacheData();
  }

  /**
   * 🌑 RESTORE FROM SHADOW CACHE (PORTED FROM LEGACY)
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
      
      const cacheAge = Date.now() - cachedEntry._shadowCacheTimestamp;
      if (cacheAge > this.SHADOW_CACHE_TTL) {
        this.clearShadowCacheEntry(localId);
        return false;
      }
      
      const { _shadowCacheTimestamp, _shadowCacheId, ...originalEntry } = cachedEntry;
      const restoredEntry = {
        ...originalEntry,
        isDeleted: 0,
        synced: 0,
        updatedAt: Date.now(),
        vKey: (originalEntry.vKey || 0) + 1,
        syncAttempts: 0,
        _restoredFromShadowCache: true,
        _restoredAt: Date.now()
      };
      
      if (type === 'ENTRY') {
        await db.entries.update(Number(localId), restoredEntry);
        window.dispatchEvent(new CustomEvent('entry-restored-from-cache', {
          detail: { localId, restoredEntry, cacheAge }
        }));
      }
      
      this.clearShadowCacheEntry(localId);
      
      return true;
    } catch (err) {
      console.error(`Failed to restore ${type} ${localId}:`, err);
      return false;
    }
  }

  /**
   * 🌑 CLEAR SHADOW CACHE ENTRY (PORTED FROM LEGACY)
   */
  private clearShadowCacheEntry(localId: string): void {
    this.shadowCache.delete(localId);
  }

  /**
   * �📚 PUSH PENDING BOOKS
   */
  private async pushPendingBooks(): Promise<{ processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      const pendingBooks = await db.books.where('synced').equals(0).toArray();
      console.log('🚀 [PUSH SERVICE] Pending books found:', pendingBooks.length);

      for (const book of pendingBooks) {
        try {
          const result = await this.pushSingleBook(book);
          if (result.success) {
            processed++;
          } else {
            errors.push(result.error || `Failed to push book ${book.cid}`);
          }
        } catch (error) {
          errors.push(`Book ${book.cid} failed: ${error}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('❌ [PUSH SERVICE] Books push failed:', error);
      errors.push(`Books push failed: ${error}`);
      return { processed, errors };
    }
  }

  /**
   * 📝 PUSH PENDING ENTRIES
   */
  private async pushPendingEntries(): Promise<{ processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      const pendingEntries = await db.entries.where('synced').equals(0).toArray();
      console.log('🚀 [PUSH SERVICE] Pending entries found:', pendingEntries.length);

      for (const entry of pendingEntries) {
        try {
          const result = await this.pushSingleEntry(entry);
          if (result.success) {
            processed++;
          } else {
            errors.push(result.error || `Failed to push entry ${entry.cid}`);
          }
        } catch (error) {
          errors.push(`Entry ${entry.cid} failed: ${error}`);
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('❌ [PUSH SERVICE] Entries push failed:', error);
      errors.push(`Entries push failed: ${error}`);
      return { processed, errors };
    }
  }

  /**
   * 📚 PUSH SINGLE BOOK
   */
  private async pushSingleBook(book: any): Promise<{ success: boolean; error?: string }> {
    try {
      const url = book._id ? `/api/books/${book._id}` : '/api/books';
      
      // 🧹 CLEAN PAYLOAD
      const { serverData, conflictReason, localId, synced, ...cleanBook } = book;
      
      // 🚨 CLEANUP: Remove empty _id for new records
      if (!cleanBook._id || cleanBook._id === "") {
        delete (cleanBook as any)._id;
      }
      
      // 🔥 SYNC GUARD: Handle CID fields during sync
      if (cleanBook.image && cleanBook.image.startsWith('cid_')) {
        cleanBook.image = '';
        console.log(`🔒 [PUSH SERVICE] Preserving CID locally, sending empty to server for book ${book.cid}`);
      }
      
      const payload = {
        ...cleanBook,
        userId: this.userId,
        vKey: book.vKey,
      };
      
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
          // 🔍 COMPLETE SYNC UPDATE
          await db.books.update(book.localId!, {
            _id: sData.data?._id || sData.book?._id || book._id,
            synced: 1,
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
      
      const res = await fetch(url, {
        method: entry._id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log('✅ [PUSH SERVICE] Entry success:', entry.cid);
        const sData = await res.json();
        
        // 🔍 COMPLETE SYNC UPDATE
        await db.entries.update(entry.localId!, {
          _id: sData.data?._id || sData.entry?._id || entry._id,
          synced: 1,
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
