"use client";

import { db } from '@/lib/offlineDB';
import { LocalBook, LocalEntry } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord } from '../core/VaultUtils';
import { generateCID } from '@/lib/offlineDB';
import { useVaultStore } from '../store';
import { validateBook, validateEntry } from '../core/schemas';

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

  /**
   * 🔍 DETECT BASE64 STRING
   * Checks if a string is likely a Base64 image (not CID or URL)
   */
  private isBase64Image(image: string | undefined | null): boolean {
    if (!image || typeof image !== 'string') return false;
    
    // Skip CID references and URLs
    if (image.startsWith('cid_') || image.startsWith('http')) return false;
    
    // Check for Base64 patterns (data:image/ or long strings)
    return image.startsWith('data:image/') || image.length > 1000;
  }

  /**
   * 🧠 MIGRATE BASE64 TO MEDIASTORE
   * Converts Base64 image to MediaStore CID reference
   */
  private async migrateBase64ToMediaStore(image: string, bookId: string): Promise<string> {
    try {
      console.log(`🧠 [HYDRATION] Migrating Base64 to MediaStore for book ${bookId}`);
      
      // 1. Generate CID
      const mediaCid = generateCID();
      
      // 2. Convert Base64 to Blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // 3. Save to MediaStore
      await db.mediaStore.add({
        cid: mediaCid,
        parentType: 'book',
        parentId: bookId,
        localStatus: 'pending_upload',
        blobData: blob,
        mimeType: blob.type,
        originalSize: blob.size,
        compressedSize: blob.size,
        createdAt: Date.now(),
        userId: this.userId
      });
      
      console.log(`✅ [HYDRATION] Migrated Base64 to MediaStore: ${bookId} -> ${mediaCid}`);
      return mediaCid;
      
    } catch (error) {
      console.error(`❌ [HYDRATION] Failed to migrate Base64 for book ${bookId}:`, error);
      throw error;
    }
  }

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
        
        // 🆕 SILENT WATCHMAN: Trigger ghost reconciliation after successful hydration
        if (booksResult.status === 'fulfilled') {
          const serverBooks = await this.getServerBooks(userId);
          const serverEntries = await this.getServerEntries(userId);
          await this.reconcileGhosts(serverBooks, serverEntries, userId);
        }
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
            
            // 2. Determine image strategy with MediaStore migration
            // Preserve local image if server data is missing it (due to .select('-image'))
            const isServerImageEmpty = book.image === null || book.image === undefined || book.image === "";
            let imageToPreserve = (isServerImageEmpty && existing?.image) ? existing.image : book.image;
            
            // 🛡️ HYDRATION SHIELD: Never overwrite valid local data with empty server data
            if (isServerImageEmpty && existing?.image && existing.image !== "") {
              console.log(`🛡️ [HYDRATION SHIELD] Preserving local image for book ${book.cid}: ${existing.image}`);
              imageToPreserve = existing.image;
            }
            
            // 🧠 NEW LOGIC: Migrate Base64 to MediaStore
            if (imageToPreserve && this.isBase64Image(imageToPreserve)) {
              console.log(`🧠 [HYDRATION] Detected Base64 image for book ${book.cid}, migrating to MediaStore`);
              const bookId = existing?.localId || book.localId || 'temp';
              imageToPreserve = await this.migrateBase64ToMediaStore(imageToPreserve, String(bookId));
            }

            // 3. Normalize with processed image (now CID or null)
            const normalized = normalizeRecord({
              ...book,
              image: imageToPreserve, // ✅ NOW STORES CID, NOT BASE64
              userId: String(userId),
              synced: 1,
              isDeleted: book.isDeleted || 0
            }, userId);
            
            // 🛡️ SCHEMA GUARD: Validate normalized data before storing
            const validationResult = validateBook(normalized);
            if (!validationResult.success) {
              console.error(`❌ [HYDRATION] Skipping corrupted book data after normalization: ${validationResult.error}`);
              continue; // Skip this record but continue with batch
            }
            
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
            //  CHECK-BEFORE-PUT: Check if local record exists to preserve data
            const existing = await db.entries.where('cid').equals(entry.cid).first();
            
            // Normalize and store
            const normalized = normalizeRecord({
              ...entry,
              userId: String(userId),
              synced: 1, // Server data is synced
              isDeleted: entry.isDeleted || 0
            }, userId);
            
            // 🛡️ SCHEMA GUARD: Validate normalized data before storing
            const validationResult = validateEntry(normalized);
            if (!validationResult.success) {
              console.error(`❌ [HYDRATION] Skipping corrupted entry data after normalization: ${validationResult.error}`);
              continue; // Skip this record but continue with batch
            }
            
            // Preserve localId if it exists to ensure bulkPut updates correct record
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
      // 🆕 SMART IDENTITY MAPPING: Check local database for server _id
      const localBook = await db.books.where('cid').equals(id).first();
      let resolvedId = id;
      
      if (localBook?._id && localBook._id !== id) {
        console.log(`🧠 [SMART MAP] Mapping CID ${id} → Server _id ${localBook._id}`);
        resolvedId = localBook._id; // Use server _id instead of CID
      }
      
      // 🆕 API PREFIX FIX: Strip cid_ prefix for server compatibility
      const apiId = resolvedId.startsWith('cid_') ? resolvedId.replace('cid_', '') : resolvedId;
      const response = await fetch(`/api/books/${apiId}`);
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

    // 🛡️ SCHEMA GUARD: Validate normalized data before storing
    const validationResult = type === 'BOOK' ? validateBook(normalized) : validateEntry(normalized);
    if (!validationResult.success) {
      console.error(` [HYDRATION] Skipping corrupted ${type.toLowerCase()} data after normalization: ${validationResult.error}`);
      return; // Skip this record entirely
    }

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
      
      // 🆕 CRITICAL: Notify UI that blob is available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vault-updated'));
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
   * � GET SERVER BOOKS
   */
  private async getServerBooks(userId: string): Promise<any[]> {
    const response = await fetch(`/api/books?userId=${encodeURIComponent(userId)}&limit=1000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch server books: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result.books || [];
  }

  /**
   * 📝 GET SERVER ENTRIES
   */
  private async getServerEntries(userId: string): Promise<any[]> {
    const response = await fetch(`/api/entries?userId=${encodeURIComponent(userId)}&limit=5000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch server entries: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data || result.entries || [];
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

  /**
   * 👻 RECONCILE GHOSTS - Clean up orphaned records
   */
  private async reconcileGhosts(serverBooks: any[], serverEntries: any[], userId: string): Promise<void> {
    try {
      console.log('👻 [HYDRATION] Starting ghost reconciliation...');
      
      // Get all local books and entries
      const localBooks = await db.books.where('userId').equals(userId).toArray();
      const localEntries = await db.entries.where('userId').equals(userId).toArray();
      
      // Create sets of server CIDs
      const serverBookCids = new Set(serverBooks.map((book: any) => book.cid));
      const serverEntryCids = new Set(serverEntries.map((entry: any) => entry.cid));
      
      // Find ghost books (exist locally but not on server)
      const ghostBooks = localBooks.filter((book: any) => 
        !serverBookCids.has(book.cid) && book.synced === 1 && book.isDeleted === 0
      );
      
      // Find ghost entries (exist locally but not on server)
      const ghostEntries = localEntries.filter((entry: any) => 
        !serverEntryCids.has(entry.cid) && entry.synced === 1 && entry.isDeleted === 0
      );
      
      // Mark ghosts as unsynced so they get re-synced
      if (ghostBooks.length > 0) {
        const bookUpdates = ghostBooks.map((book: LocalBook) => ({
          key: book.localId!,
          changes: { synced: 0, updatedAt: Date.now() }
        }));
        await db.books.bulkUpdate(bookUpdates);
        console.log(`👻 [HYDRATION] Marked ${ghostBooks.length} ghost books for re-sync`);
        
        // 🛡️ MERCY REGISTRY: Check for unsynced children and register conflicts
        for (const ghostBook of ghostBooks) {
          const unsyncedChildren = await db.entries
            .where('bookId').equals(ghostBook.cid)
            .and((entry: any) => entry.synced === 0 && entry.isDeleted === 0)
            .toArray();
          
          if (unsyncedChildren.length > 0) {
            console.log(`🛡️ [HYDRATION] Registering mercy conflict for book ${ghostBook.cid} with ${unsyncedChildren.length} unsynced children`);
            
            // Import vault store to register conflict
            const { useVaultStore } = await import('../store');
            useVaultStore.getState().registerConflict({
              id: ghostBook.cid,
              type: 'book',
              cid: ghostBook.cid,
              localId: ghostBook.localId,
              record: {
                ...ghostBook,
                conflictReason: 'parent_deleted',
                conflicted: 1
              },
              conflictType: 'parent_deleted'
            });
            
            // 📡 TRIGGER UI REFRESH: Ensure modal pops up immediately
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('vault-updated'));
              console.log(`📡 [HYDRATION] UI refresh triggered for mercy conflict: ${ghostBook.cid}`);
            }
          }
        }
      }
      
      if (ghostEntries.length > 0) {
        const entryUpdates = ghostEntries.map((entry: LocalEntry) => ({
          key: entry.localId!,
          changes: { synced: 0, updatedAt: Date.now() }
        }));
        await db.entries.bulkUpdate(entryUpdates);
        console.log(`👻 [HYDRATION] Marked ${ghostEntries.length} ghost entries for re-sync`);
      }
      
      console.log('👻 [HYDRATION] Ghost reconciliation complete');
    } catch (error) {
      console.error('❌ [HYDRATION] Ghost reconciliation failed:', error);
    }
  }
}
