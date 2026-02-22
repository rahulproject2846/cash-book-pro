"use client";

import { db, LocalBook, LocalEntry, LocalUser } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { normalizeRecord } from '../core/VaultUtils';
import { generateCID } from '@/lib/offlineDB';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
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

  // 🧠 MIGRATE BASE64 TO MEDIASTORE
  // MOVED TO: lib/vault/hydration/middleware/Base64Migration.ts
  // Converts Base64 image to MediaStore CID reference
  /*
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
  */

  /**
   * 🧑 HYDRATE USER PROFILE
   * Fetches user profile from server and updates local user record
   * 
   * MOVED TO: lib/vault/hydration/slices/IdentitySlice.ts
   * This method is now handled by the IdentitySlice in the new modular architecture
   */
  /*
  async hydrateUser(userId: string): Promise<void> {
    try {
      console.log('🧑 [HYDRATION] Fetching user profile from server...');
      
      const response = await fetch(`/api/auth/session?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        // 🛡️ Handle 404/401 gracefully - profile truly gone
        if (response.status === 404 || response.status === 401) {
          throw new Error(`PROFILE_NOT_FOUND: Server returned ${response.status} - User profile does not exist or is inaccessible`);
        }
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }
      
      const serverUser = await response.json();
      
      // Map server fields to LocalUser interface
      const localUser: LocalUser = {
        _id: serverUser._id || userId,
        username: serverUser.username || '',
        email: serverUser.email || '',
        image: serverUser.image || undefined,
        preferences: serverUser.preferences || {
          language: 'en',
          compactMode: false,
          currency: 'USD',
          turboMode: false
        },
        updatedAt: serverUser.updatedAt || Date.now(),
        
        // 🔐 LICENSE & SECURITY FIELDS
        plan: serverUser.plan || 'free',
        offlineExpiry: serverUser.offlineExpiry || 0,
        riskScore: serverUser.riskScore || 0,
        receiptId: serverUser.receiptId || null
      };
      
      // Update local user record
      // MOVED TO: lib/vault/hydration/slices/IdentitySlice.ts
      // This method is now handled by IdentitySlice in the new modular architecture
      throw new Error('MOVED_TO_V6: hydrateUser() moved to IdentitySlice - use HydrationController.getInstance().hydrateUser()');
      
    } catch (error) {
      console.error('❌ [HYDRATION] Failed to hydrate user profile:', error);
    }
  }
  */

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

    // 🛡️ INTERNAL SHIELD: Block data fetch during security lockdown or profile failure
    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
    if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
      console.error('🛡️ [HYDRATION] Critical: Data fetch blocked due to Security Lockdown/Profile Failure.');
      return { success: false, booksCount: 0, entriesCount: 0, error: 'SECURITY_LOCKDOWN' };
    }

    this.isHydrating = true;
    
    try {
      console.log('💧 [HYDRATION SERVICE] Starting full hydration...');
      
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('No user ID available for hydration');
      }

      // 🔄 SEQUENTIAL HYDRATION: Strict chain of command
      // GATE 1: Profile First
      console.log('🔄 [HYDRATION] Gate 1: Hydrating user profile...');
      // await this.hydrateUser(userId); // MOVED TO IdentitySlice
      console.log('✅ [HYDRATION] Gate 1: User profile hydrated successfully');

      // GATE 2: Books Only After Profile
      console.log('🔄 [HYDRATION] Gate 2: Hydrating books...');
      // const booksResult = await this.hydrateBooks(userId); // MOVED TO BulkSlice
      const booksResult = { count: 0 }; // Placeholder
      if (!booksResult || booksResult.count === 0) {
        throw new Error('Books hydration failed or was blocked');
      }
      console.log('✅ [HYDRATION] Gate 2: Books hydrated successfully');

      // GATE 3: Entries Only After Books
      console.log('🔄 [HYDRATION] Gate 3: Hydrating entries...');
      // const entriesResult = await this.hydrateEntries(userId); // MOVED TO BulkSlice
      const entriesResult = { count: 0 }; // Placeholder
      if (!entriesResult || entriesResult.count === 0) {
        throw new Error('Entries hydration failed or was blocked');
      }
      console.log('✅ [HYDRATION] Gate 3: Entries hydrated successfully');

      // GATE 4: Ghost Reconciliation Only After All Success
      console.log('🔄 [HYDRATION] Gate 4: Performing ghost reconciliation...');
      const serverBooks = await this.getServerBooks(userId);
      const serverEntries = await this.getServerEntries(userId);
      await this.reconcileGhosts(serverBooks, serverEntries, userId);
      console.log('✅ [HYDRATION] Gate 4: Ghost reconciliation completed');

      console.log('💧 [HYDRATION SERVICE] Full hydration complete:', { 
        booksCount: booksResult.count, 
        entriesCount: entriesResult.count 
      });
      
      return { 
        success: true, 
        booksCount: booksResult.count, 
        entriesCount: entriesResult.count 
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
    // 🛡️ INTERNAL SHIELD: Block data fetch during security lockdown or profile failure
    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
    if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
      console.error('🛡️ [HYDRATION] Single item hydration blocked due to Security Lockdown/Profile Failure.');
      return { success: false, error: 'SECURITY_LOCKDOWN' };
    }

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
   * 
   * MOVED TO: lib/vault/hydration/slices/BulkSlice.ts
   * This method is now handled by BulkSlice in the new modular architecture
   */
  /*
  private async hydrateBooks(userId: string): Promise<{ count: number }> {
    // 🛡️ INTERNAL SHIELD: Block data fetch during security lockdown or profile failure
    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
    if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
      console.error('🛡️ [HYDRATION] Books hydration blocked due to Security Lockdown/Profile Failure.');
      throw new Error('SECURITY_LOCKDOWN: Books hydration blocked for safety.');
    }

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
          // 🛡️ DEDUPLICATION: Prevent BulkError from duplicate CIDs
          const uniqueRecords = Array.from(
            new Map(recordsToUpdate.map(item => [item.cid, item])).values()
          );
          await db.books.bulkPut(uniqueRecords);
          console.log(`🚀 [HYDRATION] Bulk updated ${uniqueRecords.length} books (deduplication applied).`);
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
  */

  /**
   * 📝 HYDRATE ENTRIES
   * 
   * MOVED TO: lib/vault/hydration/slices/BulkSlice.ts
   * This method is now handled by BulkSlice in the new modular architecture
   */
  /*
  private async hydrateEntries(userId: string): Promise<{ count: number }> {
    // 🛡️ INTERNAL SHIELD: Block data fetch during security lockdown or profile failure
    const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
    if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
      console.error('🛡️ [HYDRATION] Entries hydration blocked due to Security Lockdown/Profile Failure.');
      throw new Error('SECURITY_LOCKDOWN: Entries hydration blocked for safety.');
    }

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
          // 🛡️ DEDUPLICATION: Prevent BulkError from duplicate CIDs
          const uniqueRecords = Array.from(
            new Map(recordsToUpdate.map(item => [item.cid, item])).values()
          );
          await db.entries.bulkPut(uniqueRecords);
          console.log(`🚀 [HYDRATION] Bulk updated ${uniqueRecords.length} entries (deduplication applied).`);
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
  */

  /**
   * 🎯 SINGLE ITEM FETCHER
   * 
   * MOVED TO: lib/vault/hydration/slices/SniperSlice.ts (TODO)
   * This method is now handled by SniperSlice in the new modular architecture
   */
  private async fetchSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<void> {
    throw new Error('MOVED_TO_V6: fetchSingleItem() moved to SniperSlice - use HydrationController.getInstance().hydrateSingleItem()');
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
      // V5.5 SECURITY GUARD: Check lockdown state before reconciliation
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
        console.error('[HYDRATION] Ghost reconciliation blocked due to Security Lockdown/Profile Failure.');
        throw new Error('SECURITY_LOCKDOWN: Ghost reconciliation blocked');
      }
      
      console.log('[HYDRATION] Starting ghost reconciliation...');
      
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
            const { getVaultStore } = await import('../store/storeHelper');
            getVaultStore().registerConflict({
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
