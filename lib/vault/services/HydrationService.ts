"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord } from '../core/VaultUtils';

/**
 * 💧 HYDRATION SERVICE - Handles data fetching and initial load
 * 
 * Responsibility: Fetch data from server and hydrate local database
 * - Initial data load on login
 * - Focused item hydration
 * - Batch data processing
 * - Concurrency control
 */

export class HydrationService {
  private isHydrating = false;
  private userId: string = '';
  private activeFetches = new Map<string, Promise<any>>();
  
  // Constants
  private readonly BOOKS_BATCH_SIZE = 10;
  private readonly ENTRIES_BATCH_SIZE = 20;

  constructor() {
    this.userId = identityManager.getUserId() || '';
  }

  /**
   * 💧 FULL HYDRATION - Complete data refresh from server
   */
  async fullHydration(force: boolean = false): Promise<{ success: boolean; booksCount: number; entriesCount: number; error?: string }> {
    if (this.isHydrating && !force) {
      console.log('💧 [HYDRATION SERVICE] Already hydrating, skipping...');
      return { success: false, booksCount: 0, entriesCount: 0, error: 'Already hydrating' };
    }

    this.isHydrating = true;
    
    try {
      console.log('💧 [HYDRATION SERVICE] Starting full hydration...');
      
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('No user ID available for hydration');
      }

      // 🚀 PARALLEL HYDRATION
      const [booksResult, entriesResult] = await Promise.allSettled([
        this.hydrateBooks(userId),
        this.hydrateEntries(userId)
      ]);

      let booksCount = 0;
      let entriesCount = 0;
      const errors: string[] = [];

      // Process results
      if (booksResult.status === 'fulfilled') {
        booksCount = booksResult.value.count;
        console.log('✅ [HYDRATION SERVICE] Books hydrated:', booksCount);
      } else {
        errors.push(`Books hydration failed: ${booksResult.reason}`);
        console.error('❌ [HYDRATION SERVICE] Books hydration failed:', booksResult.reason);
      }

      if (entriesResult.status === 'fulfilled') {
        entriesCount = entriesResult.value.count;
        console.log('✅ [HYDRATION SERVICE] Entries hydrated:', entriesCount);
      } else {
        errors.push(`Entries hydration failed: ${entriesResult.reason}`);
        console.error('❌ [HYDRATION SERVICE] Entries hydration failed:', entriesResult.reason);
      }

      console.log('💧 [HYDRATION SERVICE] Full hydration complete:', { booksCount, entriesCount });
      return { 
        success: errors.length === 0, 
        booksCount, 
        entriesCount, 
        error: errors.length > 0 ? errors.join('; ') : undefined 
      };

    } catch (error) {
      console.error('❌ [HYDRATION SERVICE] Full hydration failed:', error);
      return { success: false, booksCount: 0, entriesCount: 0, error: String(error) };
    } finally {
      this.isHydrating = false;
    }
  }

  /**
   * 🎯 FOCUSED HYDRATION - Single item fetch
   */
  async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🎯 [HYDRATION SERVICE] Starting ${type} hydration for ID: ${id}`);
      
      // 🚀 CONCURRENCY CONTROL
      const fetchKey = `${type}_${id}`;
      if (this.activeFetches.has(fetchKey)) {
        console.log(`🚀 [HYDRATION SERVICE] Already fetching ${fetchKey}, waiting...`);
        await this.activeFetches.get(fetchKey);
        return { success: true };
      }
      
      // 🚀 CONCURRENT FETCH
      const fetchPromise = this.fetchSingleItem(type, id);
      this.activeFetches.set(fetchKey, fetchPromise);
      
      try {
        await fetchPromise;
      } finally {
        this.activeFetches.delete(fetchKey);
        console.log(`🎯 [HYDRATION SERVICE] Completed ${type} hydration for ID: ${id}`);
        // Dexie live queries and UI hooks will handle the update automatically
        return { success: true };
      }
      
    } catch (error) {
      console.error(`🚨 [HYDRATION SERVICE] Failed for ${type} ${id}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 📚 HYDRATE BOOKS
   */
  private async hydrateBooks(userId: string): Promise<{ count: number }> {
    try {
      console.log('📚 [HYDRATION SERVICE] Fetching books from server...');
      
      const response = await fetch(`/api/books?userId=${encodeURIComponent(userId)}&limit=1000`);
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      
      const result = await response.json();
      const books = result.data || result.books || [];
      
      // 🔄 BATCH PROCESSING
      let processedCount = 0;
      for (let i = 0; i < books.length; i += this.BOOKS_BATCH_SIZE) {
        const batch = books.slice(i, i + this.BOOKS_BATCH_SIZE);
        
        // 🚀 BULK UPDATE PATTERN: Prevent infinite refresh loops
        const recordsToUpdate = [];

        for (const book of batch) {
          try {
            // 🔍 CHECK-BEFORE-PUT: Check if local record exists to preserve data
            const existing = await db.books.where('cid').equals(book.cid).first();
            
            // 2. Determine image strategy
            // Preserve local image if server data is missing it (due to .select('-image'))
            const isServerImageEmpty = book.image === null || book.image === undefined || book.image === "";
            const imageToPreserve = (isServerImageEmpty && existing?.image) ? existing.image : book.image;

            // 3. Normalize with preserved image
            const normalized = normalizeRecord({
              ...book,
              image: imageToPreserve, // ✅ PRESERVE LOCAL IMAGE
              userId: String(userId),
              synced: 1,
              isDeleted: book.isDeleted || 0
            }, userId);
            
            // Preserve localId if it exists to ensure bulkPut updates the correct record
            if (existing?.localId) {
              normalized.localId = existing.localId;
            }

            recordsToUpdate.push(normalized);
            processedCount++;
          } catch (error) {
            console.error(`❌ [HYDRATION SERVICE] Failed to process book ${book.cid}:`, error);
          }
        }

        // Perform a single bulk operation to prevent infinite refresh loops
        if (recordsToUpdate.length > 0) {
          await db.books.bulkPut(recordsToUpdate);
          console.log(`🚀 [HYDRATION] Bulk updated ${recordsToUpdate.length} books silently.`);
        }
        
        // Small delay to prevent overwhelming
        if (i + this.BOOKS_BATCH_SIZE < books.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`📚 [HYDRATION SERVICE] Books hydration complete: ${processedCount}/${books.length}`);
      return { count: processedCount };
      
    } catch (error) {
      console.error('❌ [HYDRATION SERVICE] Books hydration failed:', error);
      throw error;
    }
  }

  /**
   * 📝 HYDRATE ENTRIES
   */
  private async hydrateEntries(userId: string): Promise<{ count: number }> {
    try {
      console.log('📝 [HYDRATION SERVICE] Fetching entries from server...');
      
      const response = await fetch(`/api/entries?userId=${encodeURIComponent(userId)}&limit=5000`);
      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      
      const result = await response.json();
      const entries = result.data || result.entries || [];
      
      // BATCH PROCESSING
      let processedCount = 0;
      for (let i = 0; i < entries.length; i += this.ENTRIES_BATCH_SIZE) {
        const batch = entries.slice(i, i + this.ENTRIES_BATCH_SIZE);
        
        // 🚀 BULK UPDATE PATTERN: Prevent infinite refresh loops
        const recordsToUpdate = [];

        for (const entry of batch) {
          try {
            // 🔍 CHECK-BEFORE-PUT: Check if local record exists to preserve data
            const existing = await db.entries.where('cid').equals(entry.cid).first();
            
            // Normalize and store
            const normalized = normalizeRecord({
              ...entry,
              userId: String(userId),
              synced: 1, // Server data is synced
              isDeleted: entry.isDeleted || 0
            }, userId);
            
            // Preserve localId if it exists to ensure bulkPut updates the correct record
            if (existing?.localId) {
              normalized.localId = existing.localId;
            }

            recordsToUpdate.push(normalized);
            processedCount++;
          } catch (error) {
            console.error(`Failed to process entry ${entry.cid}:`, error);
          }
        }

        // Perform a single bulk operation to prevent infinite refresh loops
        if (recordsToUpdate.length > 0) {
          await db.entries.bulkPut(recordsToUpdate);
          console.log(`🚀 [HYDRATION] Bulk updated ${recordsToUpdate.length} entries silently.`);
        }
        
        // Small delay to prevent overwhelming
        if (i + this.ENTRIES_BATCH_SIZE < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`📝 [HYDRATION SERVICE] Entries hydration complete: ${processedCount}/${entries.length}`);
      return { count: processedCount };
      
    } catch (error) {
      console.error('❌ [HYDRATION SERVICE] Entries hydration failed:', error);
      throw error;
    }
  }

  /**
   * 🎯 SINGLE ITEM FETCHER
   */
  private async fetchSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<void> {
    let record;
    if (type === 'BOOK') {
      const response = await fetch(`/api/books/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch book: ${response.statusText}`);
      }
      const result = await response.json();
      record = result.data;
    } else if (type === 'ENTRY') {
      const response = await fetch(`/api/entries/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch entry: ${response.statusText}`);
      }
      const result = await response.json();
      record = result.data;
    } else {
      throw new Error(`Unsupported type: ${type}`);
    }

    if (!record) {
      console.warn(`⚠️ [HYDRATION SERVICE] ${type} not found for ID: ${id}`);
      return;
    }

    console.log(`🎯 [HYDRATION SERVICE] Fetched ${type} with full data:`, {
      id: record._id,
      cid: record.cid,
      hasHeavyData: type === 'BOOK' ? !!record.image : !!record.note
    });

    // 🚀 STORE THE RECORD
    const normalized = normalizeRecord({
      ...record,
      userId: this.userId,
      synced: 1,
      isDeleted: record.isDeleted || 0
    }, this.userId);

    if (type === 'BOOK') {
      const existing = await db.books.where('cid').equals(record.cid).first();
      if (existing) {
        await db.books.update(existing.localId!, { 
          ...normalized, 
          lastSniperFetch: Date.now() 
        });
        console.log('✅ [SNIPER] Book image saved to Dexie:', record.cid);
      } else {
        await db.books.put(normalized);
        console.log('✅ [SNIPER] New book saved to Dexie:', record.cid);
      }
    } else {
      await db.entries.put(normalized);
    }
  }

  /**
   * 🔐 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
  }

  /**
   * 🔄 GET HYDRATION STATUS
   */
  getHydrationStatus(): { isHydrating: boolean; userId: string; activeFetches: number } {
    return {
      isHydrating: this.isHydrating,
      userId: this.userId,
      activeFetches: this.activeFetches.size
    };
  }

  /**
   * 🧹 CLEANUP
   */
  cleanup(): void {
    this.activeFetches.clear();
    this.isHydrating = false;
  }

  /**
   * 👤 GET USER ID
   */
  private getUserId(): string {
    const id = this.userId || identityManager.getUserId();
    return String(id || '');
  }
}
