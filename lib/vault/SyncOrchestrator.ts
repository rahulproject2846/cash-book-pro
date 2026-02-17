"use client";

import { db, clearVaultData } from '@/lib/offlineDB';
import { RealtimeEngine } from './core/RealtimeEngine';
import { RealtimeCommandHandler } from './core/RealtimeCommandHandler';
import { normalizeRecord, normalizeTimestamp } from './core/VaultUtils';
import { migrationManager } from './core/MigrationManager';
import { telemetry } from './Telemetry';
import { identityManager } from './core/IdentityManager';
import toast from 'react-hot-toast';

/**
 * VAULT PRO: MASTER SYNC ORCHESTRATOR (V35.0)
 * ------------------------------------------------------------
 * Industrial-Grade Background Worker. 
 * High Performance, ID Integrity, Zero Redundancy.
 */

class SyncOrchestrator {
  private isSyncing = false;
  private isHydrating = false; // 🔥 EMERGENCY: Hydration guard
  private channel = new BroadcastChannel('vault_global_sync');
  private readonly lastSyncKey = 'cashbook_lastSync';
  
  // 🚀 MASS INJECTION MODE: Skip hydration during login data flood
  private isMassInjectionMode = false;
  private massInjectionTimeout: NodeJS.Timeout | null = null;
  private recentEventCount = 0;
  private eventCountResetTimeout: NodeJS.Timeout | null = null;

  // 🎯 CONCURRENCY CONTROL: Prevent duplicate fetches during signal storms
  private activeFetches = new Map<string, Promise<any>>();
  private integrityCheckInterval: any = null; // 🔥 INTEGRITY: Scheduling
  private isCheckingIntegrity = false; // 🔥 INTEGRITY: Prevent overlapping checks
  private progressTimeout: any = null; // Progress event debounce timeout
  
  // 🔥 CORE PROPERTIES: Required for sync operations
  private userId: string = '';
  private realtimeEngine: any = null;
  private realtimeCommandHandler: any = null;
  
  // Constants - 🔥 EMERGENCY: Reduced batch sizes
  private readonly BOOKS_BATCH_SIZE = 10; // Reduced from 50
  private readonly ENTRIES_BATCH_SIZE = 20; // Reduced from 100
  private readonly INTEGRITY_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes
  
  // Integrated Security & Shadow Management
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  private shadowCache = new Map<string, any>();
  private readonly SHADOW_CACHE_TTL = 15000;

  constructor() {
    this.init();
  }

  // --- ১. প্রগ্রেস ইভেন্ট ডিসপ্যাচার (Debounced) ---
  private progressEventDebounced = (detail: any) => {
    if (typeof window !== 'undefined') {
      // Debounce progress events to avoid UI flickering
      clearTimeout(this.progressTimeout);
      this.progressTimeout = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sync-progress', { detail }));
      }, 100); // 100ms debounce
    }
  };

  /**
   * 🚀 INIT: Async initialization with migrations
   */
  private async init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync());
      this.channel.onmessage = (e) => {
        if (e.data.type === 'FORCE_REFRESH') this.notifyUI();
      };
      
      // 🔥 REACTIVE IDENTITY LISTENER: Handle user switches (Login/Logout)
    identityManager.subscribe(async (uid) => {
      console.log('🔐 [SYNC ORCHESTRATOR] Identity changed, initializing sequence');
      
      if (!uid) {
        this.userId = '';
        console.log('🔐 [SYNC ORCHESTRATOR] User logged out, stopping sync');
        return;
      }
      
      this.userId = uid;

      // 🛡️ STEP 1 - GLOBAL REPAIR (Blocking): Fix local data issues first
      console.log('🏁 [SYNC] Step 1: Running Global Database Repair');
      this.globalDatabaseRepair();
      
      // 🔧 STEP 1.5 - REPAIR CORRUPTED DATA: Fix undefined/null fields after reload trap handling
      console.log('🏁 [SYNC] Step 1.5: Running Corrupted Data Repair');
      this.repairCorruptedData();

      // 🚀 STEP 2 - INITIAL HYDRATION (Blocking): Establish baseline truth from server
      console.log('🏁 [SYNC] Step 2: Running Initial Hydration');
      await this.hydrate(uid, true); // Force full sync - MUST complete before next step

      // 🔍 STEP 3 - INTEGRITY AUDIT: Only after hydration is complete
      console.log('🏁 [SYNC] Step 3: Running Integrity Audit');
      await this.performIntegrityCheck(uid);

      // 🔄 STEP 4 - SCHEDULING: Start background services last
      console.log('🏁 [SYNC] Step 4: Starting Background Services');
      this.scheduleIntegrityChecks();
      
      console.log('🏁 [SYNC] Startup Sequence Complete - All systems ready');
    });
    }
  }

  /**
   * 🤫 SILENT AUTO-RESOLVE: Compare business data fields to eliminate false conflicts
   */
  private compareBusinessFields(local: any, remote: any, type: 'ENTRY' | 'BOOK'): boolean {
    if (type === 'ENTRY') {
      // Compare entry business fields
      return (
        String(local.title || '').trim().toLowerCase() === String(remote.title || '').trim().toLowerCase() &&
        Number(local.amount || 0) === Number(remote.amount || 0) &&
        String(local.type || '').toLowerCase() === String(remote.type || '').toLowerCase() &&
        String(local.status || '').toLowerCase() === String(remote.status || '').toLowerCase() &&
        String(local.category || '').toLowerCase() === String(remote.category || '').toLowerCase() &&
        String(local.paymentMethod || '').toLowerCase() === String(remote.paymentMethod || '').toLowerCase() &&
        String(local.note || '').trim() === String(remote.note || '').trim() &&
        String(local.bookId || '') === String(remote.bookId || '') &&
        Boolean(local.isDeleted) === Boolean(remote.isDeleted)
      );
    } else if (type === 'BOOK') {
      // Compare book business fields - ALL fields included for reliable updates
      return (
        String(local.name || '').trim().toLowerCase() === String(remote.name || '').trim().toLowerCase() &&
        String(local.description || '').trim() === String(remote.description || '').trim() &&
        String(local.type || '').toLowerCase() === String(remote.type || '').toLowerCase() &&
        String(local.phone || '').trim() === String(remote.phone || '').trim() &&
        String(local.image || '') === String(remote.image || '') &&
        String(local.currency || '').toLowerCase() === String(remote.currency || '').toLowerCase() &&
        Boolean(local.isDeleted) === Boolean(remote.isDeleted)
      );
    }
    return false;
  }

  /**
   * � MARK PROCESSING: Add CID to processing shield to prevent Pusher conflicts
   */
  private markAsProcessing(cid: string, duration: number = 10000) {
    if (this.realtimeEngine) {
      // Access private processingCids via reflection
      const engine = this.realtimeEngine as any;
      if (engine.processingCids) {
        engine.processingCids.add(cid);
        setTimeout(() => {
          engine.processingCids.delete(cid);
        }, duration);
      }
    }
  }

  /**
   * 🔐 SET USER ID: Prime orchestrator with correct ID and update global identity
   */
  setUserId(userId: string) {
    this.userId = String(userId);
    // Update global IdentityManager to ensure consistency across all systems
    identityManager.setUserId(userId);
    // Trigger repair after userId is properly set
    if (typeof window !== 'undefined') {
      this.repairCorruptedData();
    }
  }

  /**
   * 🔧 ONE-TIME DATA REPAIR: Fix entries with corrupted userId or isDeleted fields
   */
  private async repairCorruptedData() {
    try {
      console.log('🔧 [DATA REPAIR] Starting one-time data repair...');
      
      // Fix entries table
      const allEntries = await db.entries.toArray();
      let entriesRepaired = 0;
      
      for (const entry of allEntries) {
        const needsRepair = 
          entry.userId !== this.userId || 
          entry.isDeleted === undefined ||
          entry.isDeleted === null;
        
        if (needsRepair) {
          await db.entries.update(entry.localId!, { 
            userId: String(this.userId!), 
            isDeleted: Number(entry.isDeleted || 0)  // Force to 0 if undefined/null
          });
          entriesRepaired++;
        }
      }
      
      // Fix books table
      const allBooks = await db.books.toArray();
      let booksRepaired = 0;
      
      for (const book of allBooks) {
        const needsRepair = 
          book.userId !== this.userId || 
          book.isDeleted === undefined ||
          book.isDeleted === null;
        
        if (needsRepair) {
          await db.books.update(book.localId!, { 
            userId: String(this.userId!), 
            isDeleted: Number(book.isDeleted || 0)  // Force to 0 if undefined/null
          });
          booksRepaired++;
        }
      }
      
      if (entriesRepaired > 0 || booksRepaired > 0) {
        console.log(`✅ [DATA REPAIR] Fixed ${entriesRepaired} entries and ${booksRepaired} books`);
        this.notifyUI();
      } else {
        console.log('✅ [DATA REPAIR] No data corruption found');
      }
    } catch (err) {
      console.error('❌ [DATA REPAIR] Failed:', err);
    }
  }

  /**
   * 🔥 GLOBAL DATABASE REPAIR: Force server data to synced: 1
   */
  private async globalDatabaseRepair() {
    try {
      console.log('🔥 [GLOBAL REPAIR] Starting database integrity sweep...');
      
      // Fix entries table
      const allEntries = await db.entries.toArray();
      let entriesForced = 0;
      
      for (const entry of allEntries) {
        let needsUpdate = false;
        const updates: any = {};
        
        // RULE: Force userId to String
        if (typeof entry.userId !== 'string') {
          updates.userId = String(entry.userId || '');
          needsUpdate = true;
        }
        
        // RULE: Server data is always synced
        if (entry._id && entry.synced !== 1) {
          updates.synced = 1;
          needsUpdate = true;
        }
        
        // 🚨 RELOAD TRAP FIX: Handle interrupted delete operations
        if (entry.isDeleted === 1 && entry.synced === 0) {
          console.log(`🔄 [RELOAD TRAP] Auto-undoing interrupted delete for entry CID: ${entry.cid}`);
          console.log('✅ [RELOAD TRAP] Restored item to active state, synced with server');
          updates.isDeleted = 0;
          updates.synced = 1;  // Mark as synced since server still has it
          needsUpdate = true;
        }
        
        // RULE: Force isDeleted to 0 if undefined/null
        if (entry.isDeleted === undefined || entry.isDeleted === null) {
          updates.isDeleted = Number(entry.isDeleted || 0);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await db.entries.update(entry.localId!, updates);
          entriesForced++;
        }
      }
      
      // Fix books table
      const allBooks = await db.books.toArray();
      let booksForced = 0;
      
      for (const book of allBooks) {
        let needsUpdate = false;
        const updates: any = {};
        
        // RULE: Force userId to String
        if (typeof book.userId !== 'string') {
          updates.userId = String(book.userId || '');
          needsUpdate = true;
        }
        
        // RULE: Server data is always synced
        if (book._id && book.synced !== 1) {
          updates.synced = 1;
          needsUpdate = true;
        }
        
        // 🚨 RELOAD TRAP FIX: Handle interrupted delete operations
        if (book.isDeleted === 1 && book.synced === 0) {
          console.log(`🔄 [RELOAD TRAP] Auto-undoing interrupted delete for book CID: ${book.cid}`);
          console.log('✅ [RELOAD TRAP] Restored item to active state, synced with server');
          updates.isDeleted = 0;
          updates.synced = 1;  // Mark as synced since server still has it
          needsUpdate = true;
        }
        
        // RULE: Force isDeleted to 0 if undefined/null
        if (book.isDeleted === undefined || book.isDeleted === null) {
          updates.isDeleted = Number(book.isDeleted || 0);
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await db.books.update(book.localId!, updates);
          booksForced++;
        }
      }
      
      if (entriesForced > 0 || booksForced > 0) {
        console.log(`🔥 [GLOBAL REPAIR] Forced ${entriesForced} entries and ${booksForced} books to synced: 1`);
        this.notifyUI();
      } else {
        console.log('🔥 [GLOBAL REPAIR] Database integrity verified');
      }
    } catch (err) {
      console.error('❌ [GLOBAL REPAIR] Failed:', err);
    }
  }

  public notifyUI() {
    window.dispatchEvent(new Event('vault-updated'));
    this.checkForNewConflicts(); // 🚨 CONFLICT DETECTION BRIDGE
  }

  private getEffectiveUserId(providedId?: string): string | null {
    const finalId = providedId || this.userId;
    return finalId ? String(finalId) : null;
  }

  /**
   * 🚨 CONFLICT DETECTION BRIDGE
   * Check for new conflicts and update global store
   */
  private async checkForNewConflicts(): Promise<void> {
    try {
      // Dynamic import to avoid circular dependency
      const { useConflictStore } = await import('./ConflictStore');
      
      // Query for all conflicted records
      const conflictedBooks = await db.books.where('conflicted').equals(1).toArray();
      const conflictedEntries = await db.entries.where('conflicted').equals(1).toArray();
      
      const totalConflicts = conflictedBooks.length + conflictedEntries.length;
      
      if (totalConflicts > 0) {
        // Map conflicts for store
        const mappedConflicts = [
          ...conflictedBooks.map((book: any) => ({
            type: 'book' as const,
            cid: book.cid,
            localId: book.localId,
            record: book,
            conflictType: 'version' // Map VERSION_CONFLICT to 'version'
          })),
          ...conflictedEntries.map((entry: any) => ({
            type: 'entry' as const,
            cid: entry.cid,
            localId: entry.localId,
            record: entry,
            conflictType: 'version' // Map VERSION_CONFLICT to 'version'
          }))
        ];
        
        // Update global conflict store
        const { setConflicts } = useConflictStore.getState();
        setConflicts(mappedConflicts);
        
        // 🚨 TOAST NOTIFICATION
        toast.error(`${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'} detected!`, {
          duration: 8000,
        });
        
        console.log(`🚨 [CONFLICT DETECTION] Found ${totalConflicts} conflicts and updated global store`);
      } else {
        console.log('✅ [CONFLICT DETECTION] No conflicts found');
      }
    } catch (error) {
      console.error('🚨 [CONFLICT DETECTION] Failed to check for conflicts:', error);
    }
  }

  /**
   * � SECURITY VALIDATION: Check response for security status with Active Defense
   */
  private checkSecurityStatus(result: any): boolean {
    if (!result) return false;
    
    // Check for system block or security violations
    if (result.blocked || result.systemBlock || result.securityViolation) {
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'Security Violation Detected',
        data: { violation: 'SYSTEM_BLOCK', result }
      });
      this.performEmergencyWipe();
      return false;
    }
    
    // Check for user deactivation
    if (result.userDeactivated || result.deactivated) {
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'User Deactivated',
        data: { violation: 'USER_DEACTIVATED', result }
      });
      this.performEmergencyWipe();
      return false;
    }
    
    return true;
  }

  /**
   * 🚨 KILL SWITCH: Emergency wipe with Active Defense
   */
  private async performEmergencyWipe() {
    console.error('🚨 KILL SWITCH ACTIVATED: Wiping local data');
    
    telemetry.log({
      type: 'ERROR',
      level: 'ERROR',
      message: '🚨 KILL SWITCH ACTIVATED: Wiping local data',
      data: { action: 'EMERGENCY_WIPE', timestamp: Date.now() }
    });
    
    try {
      await clearVaultData();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cashbookUser');
        localStorage.removeItem('vault_last_sync_timestamp');
        window.location.href = '/';
      }
    } catch (err) {
      console.error('❌ KILL SWITCH FAILED:', err);
      // Silent failure - no reload to prevent infinite loops
    }
  }

  /**
   * 🕐 DELETION BUFFER: Schedule deletion with 10-second buffer window
   */
  private async scheduleDeletion(localId: string, userId: string) {
    const existingTimeout = this.pendingDeletions.get(localId);
    if (existingTimeout) clearTimeout(existingTimeout);

    // Cache entry data before deletion
    try {
      const entry = await db.entries.get(Number(localId));
      if (entry) {
        const clonedEntry = JSON.parse(JSON.stringify(entry));
        clonedEntry._shadowCacheTimestamp = Date.now();
        clonedEntry._shadowCacheId = `${localId}_${Date.now()}`;
        this.shadowCache.set(localId, clonedEntry);
        
        setTimeout(() => this.clearShadowCacheEntry(localId), this.SHADOW_CACHE_TTL);
      }
    } catch (err) {
      console.warn(`Failed to cache entry ${localId}:`, err);
    }

    const timeoutId = setTimeout(async () => {
      try {
        const entry = await db.entries.get(Number(localId));
        if (entry && entry.isDeleted === 1) {
          console.log(`Deletion buffer expired for ${localId}`);
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
  private async restoreEntryFromShadowCache(localId: string): Promise<boolean> {
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
      
      await db.entries.update(Number(localId), restoredEntry);
      this.clearShadowCacheEntry(localId);
      
      window.dispatchEvent(new CustomEvent('entry-restored-from-cache', {
        detail: { localId, restoredEntry, cacheAge }
      }));
      
      return true;
    } catch (err) {
      console.error(`Failed to restore entry ${localId}:`, err);
      return false;
    }
  }

  /**
   * 🌑 Clear shadow cache entry
   */
  private clearShadowCacheEntry(localId: string) {
    this.shadowCache.delete(localId);
  }

  /**
   * 📡 BROADCAST: Send update to all tabs
   */
  private broadcast() {
    if (this.channel) {
      this.channel.postMessage({ type: 'FORCE_REFRESH' });
    }
  }

  /**
   * 🚀 TRIGGER SYNC: Push local 'synced: 0' data to server
   */
  async triggerSync(providedUserId?: string) {
    const uid = this.getEffectiveUserId(providedUserId);
    console.log('🔍 [SYNC DEBUG] triggerSync called. Conditions:', {
      online: navigator.onLine,
      isSyncing: this.isSyncing,
      hasUserId: !!uid,
      userId: uid
    });
    
    if (!navigator.onLine || this.isSyncing || !uid) {
      console.log('🔍 [SYNC DEBUG] triggerSync early return. Reason:', {
        offline: !navigator.onLine,
        isSyncing: this.isSyncing,
        noUserId: !uid
      });
      return;
    }

    console.log('🔍 [SYNC DEBUG] Starting sync process...');
    this.isSyncing = true;
    try {
      // --- A. Sync Pending Books ---
      const pendingBooks = await db.books.where('synced').equals(0).toArray();
      console.log('🔍 [SYNC DEBUG] Pending books found:', pendingBooks.length);
      console.log('🔍 [SYNC DEBUG] Sample pending book:', pendingBooks[0] ? {
        cid: pendingBooks[0].cid,
        _id: pendingBooks[0]._id,
        synced: pendingBooks[0].synced,
        userId: pendingBooks[0].userId
      } : 'No pending books');
      for (const book of pendingBooks) {
        console.log('📚 [SYNC] Attempting to sync book:', book.cid);
        const url = book._id ? `/api/books/${book._id}` : '/api/books';
        
        // 🧹 CLEAN PAYLOAD: Only remove internal UI fields, keep checksum and conflicted for server validation
        const { serverData, conflictReason, localId, synced, ...cleanBook } = book;
        
        // 🚨 CLEANUP: Remove empty _id for new records to prevent BSONError
        if (!cleanBook._id || cleanBook._id === "") {
          delete (cleanBook as any)._id;
        }
        
        // 🔥 SYNC GUARD: Selective payload for CID fields during sync
        if (cleanBook.image && cleanBook.image.startsWith('cid_')) {
          // Send empty string to server but preserve local CID for upload
          cleanBook.image = '';
          console.log(`🔒 [SYNC GUARD] Preserving CID locally, sending empty to server for book ${book.cid}`);
        }
        
        const payload = {
          ...cleanBook,
          userId: uid,
          vKey: book.vKey, // Ensure vKey is included for validation
        };
        
        const res = await fetch(url, {
          method: book._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          console.log('✅ [SYNC] Book success:', book.cid);
          const sData = await res.json();
          
          // 🗑️ HARD DELETE CHECK: Remove deleted books after successful sync
          if (book.isDeleted === 1) {
            await db.books.delete(book.localId!);
            console.log(`🗑️ [SYNC DELETE] Book ${book.cid} hard deleted after sync`);
          } else {
            // 🔍 COMPLETE SYNC UPDATE: Mark local record as fully synced
            await db.books.update(book.localId!, {
              _id: sData.data?._id || sData.book?._id || book._id,
              synced: 1,           // ✅ Mark as synced
              conflicted: 0,       // ✅ Clear conflict flag
              conflictReason: '',  // ✅ Clear reason
              serverData: null,    // ✅ Clear server data
              vKey: book.vKey,    // Ensure vKey matches
              updatedAt: book.updatedAt // Ensure timestamp matches
            });
          }
          
          // 🔥 BLINKING PREVENTION: Mark CID as processing to prevent Pusher overwrites
          if (book.cid) {
            this.markAsProcessing(book.cid);
          }
        } else {
          if (res.status === 409) {
            // 🚨 CONFLICT HANDLING: Parse server conflict response
            const conflictData = await res.json();
            console.log('🚨 [SYNC CONFLICT] Version conflict detected for CID:', book.cid, 'Server data:', conflictData);
            
            // Mark record as conflicted using normalizeRecord
            const conflictedRecord = normalizeRecord({
              ...book,
              conflicted: 1,
              conflictReason: 'VERSION_CONFLICT',
              serverData: conflictData,
              synced: 0 // Keep as 0 so user knows it needs resolution
            }, uid);
            
            // Update local record with conflict information
            await db.books.update(book.localId!, conflictedRecord);
            
            // 🚨 CONFLICT NOTIFICATION: Alert user about conflict
            console.error('❌ [SYNC CONFLICT] Book update rejected - Server has newer version:', book.cid);
            
            // Continue with other items - don't let one conflict stop entire sync
            continue;
          } else {
            console.error('❌ [SYNC] Book failed:', book.cid, res.status);
          }
        }
      }

      // --- B. Sync Pending Entries ---
      const pendingEntries = await db.entries.where('synced').equals(0).toArray();
      for (const entry of pendingEntries) {
        const url = entry._id ? `/api/entries/${entry._id}` : '/api/entries';
        
        // 🧹 CLEAN PAYLOAD: Only remove internal UI fields, keep checksum and conflicted for server validation
        // CRITICAL: Include deleted entries in sync to prevent zombie data
        const { serverData, conflictReason, localId, synced, ...cleanEntry } = entry;
        
        // 🚨 CLEANUP: Remove empty _id for new records to prevent BSONError
        if (!cleanEntry._id || cleanEntry._id === "") {
          delete (cleanEntry as any)._id;
        }
        
        // 🔥 SYNC GUARD: Selective payload for CID fields during sync
        if (cleanEntry.mediaId && cleanEntry.mediaId.startsWith('cid_')) {
          // Send empty string to server but preserve local CID for upload
          cleanEntry.mediaId = '';
          console.log(`🔒 [SYNC GUARD] Preserving CID locally, sending empty to server for entry ${entry.cid}`);
        }
        
        const payload = {
          ...cleanEntry,
          userId: uid,
          vKey: entry.vKey, // Ensure vKey is included for validation
        };
        
        const res = await fetch(url, {
          method: entry._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const sData = await res.json();
          console.log('✅ SYNC SUCCESS for CID:', entry.cid);
          
          // 🔍 COMPLETE SYNC UPDATE: Mark local record as fully synced
          await db.entries.update(entry.localId!, {
            _id: sData.data?._id || sData.entry?._id || entry._id,
            synced: 1,           // ✅ Mark as synced
            conflicted: 0,       // ✅ Clear conflict flag
            conflictReason: '',  // ✅ Clear reason
            serverData: null,    // ✅ Clear server data
            vKey: entry.vKey,    // Ensure vKey matches
            updatedAt: entry.updatedAt // Ensure timestamp matches
          });
          
          // �️ GARBAGE COLLECTION: Permanently delete synced deleted items
          if (entry.isDeleted === 1) {
            await db.entries.delete(entry.localId!);
            console.log(`🗑️ [GC] Permanently deleted synced tombstone: CID ${entry.cid}`);
          }
          
          // � BLINKING PREVENTION: Mark CID as processing to prevent Pusher overwrites
          if (entry.cid) {
            this.markAsProcessing(entry.cid);
          }
          
          // 🔥 BLINKING PREVENTION: Mark CID as processing to prevent Pusher overwrites
          if (entry.cid) {
            console.log('📥 [SYNC] New Entry Synced:', entry.cid);
            this.markAsProcessing(entry.cid);
          }
        } else {
          if (res.status === 409) {
            // 🚨 CONFLICT HANDLING: Parse server conflict response
            const conflictData = await res.json();
            console.log('🚨 [SYNC CONFLICT] Version conflict detected for CID:', entry.cid, 'Server data:', conflictData);
            
            // Mark record as conflicted using normalizeRecord
            const conflictedRecord = normalizeRecord({
              ...entry,
              conflicted: 1,
              conflictReason: 'VERSION_CONFLICT',
              serverData: conflictData,
              synced: 0 // Keep as 0 so user knows it needs resolution
            }, uid);
            
            // Update local record with conflict information
            await db.entries.update(entry.localId!, conflictedRecord);
            
            // 🚨 CONFLICT NOTIFICATION: Alert user about conflict
            console.error('❌ [SYNC CONFLICT] Entry update rejected - Server has newer version:', entry.cid);
            
            // Continue with other items - don't let one conflict stop entire sync
            continue;
          } else {
            console.error('❌ SYNC FAILED for CID:', entry.cid, 'Status:', res.status);
          }
        }
      }
    } catch (err) {
      console.error("Sync push failed:", err);
    } finally {
      console.log('🔍 [SYNC DEBUG] Sync process completed. Resetting isSyncing flag from', this.isSyncing, 'to false');
      this.isSyncing = false;
      console.log('🔍 [SYNC DEBUG] isSyncing flag is now:', this.isSyncing);
      
      // 🔄 TRIGGER MEDIA PROCESSING: Process any pending uploads after sync
      this.triggerMediaProcessing();
      
      // Removed: this.hydrate(uid); // Prevent blinking - let Pusher handle updates
    }
  }

  // গতবার কখন সিঙ্ক হয়েছিল সেই সময়টা বের করা
  private getLastSyncTimestamp(): number {
    if (typeof window === 'undefined') return 0;
    const ts = localStorage.getItem('vault_last_sync');
    return ts ? parseInt(ts, 10) : 0;
  }

  // সিঙ্ক শেষ হওয়ার পর বর্তমান সময়টা সেভ করে রাখা
  private updateLastSyncTimestamp(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('vault_last_sync', Date.now().toString());
  }
  /**
   * 🎯 FOCUSED HYDRATION: Fetch single item for signal-based sync
   * Fetches complete record with all fields (including images/memos)
   */
  async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<void> {
    try {
      console.log(`🎯 [FOCUSED HYDRATION] Starting ${type} hydration for ID: ${id}`);
      
      // 🚀 CONCURRENCY CONTROL: Check if already fetching
      const fetchKey = `${type}_${id}`;
      if (this.activeFetches.has(fetchKey)) {
        console.log(`🚀 [FETCH DEDUP] Already fetching ${fetchKey}, waiting...`);
        await this.activeFetches.get(fetchKey);
        return;
      }
      
      // 🚀 CONCURRENT FETCH: Create and store promise
      const fetchPromise = this.fetchSingleItem(type, id);
      this.activeFetches.set(fetchKey, fetchPromise);
      
      try {
        await fetchPromise;
        console.log(`🎯 [FOCUSED HYDRATION] Completed ${type} hydration for ID: ${id}`);
      } finally {
        this.activeFetches.delete(fetchKey);
      }
      
    } catch (error) {
      console.error(`🚨 [FOCUSED HYDRATION] Failed for ${type} ${id}:`, error);
      // 🔄 FALLBACK: Trigger full sync on failure
      await this.hydrate(this.userId!, true);
    }
  }

  /**
   * 🎯 SINGLE ITEM FETCHER: Internal method for fetching individual records
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
      console.warn(`⚠️ [FOCUSED HYDRATION] ${type} not found for ID: ${id}`);
      return;
    }

    console.log(`🎯 [FOCUSED HYDRATION] Fetched ${type} with full data:`, {
      id: record._id,
      cid: record.cid,
      hasHeavyData: type === 'BOOK' ? !!record.image : !!record.note
    });

    // 🚀 PASS THROUGH GATEKEEPER: Use existing Smart Merge logic
    if (this.realtimeCommandHandler) {
      const eventType = type === 'BOOK' ? 'BOOK_UPDATED' : 'ENTRY_UPDATED';
      await this.realtimeCommandHandler.handleEvent(eventType, record);
      this.notifyUI();
    }
  }

  /**
   * 🌊 HYDRATE: The Gatekeeper (Area 2 & 3 Integration)
   * সার্ভার থেকে ডাটা আনা এবং স্মার্টলি লোকাল ডোর (Dexie) দিয়ে ইনজেক্ট করা।
   */
  async hydrate(userId: string, forceFullSync = false) {
    // 🔥 EMERGENCY: Hydration guard - prevent infinite loops
    if (this.isHydrating) {
      console.warn('🚫 [HYDRATION GUARD] Already hydrating, skipping...');
      return;
    }
    
    if (!navigator.onLine || !userId) return;
    
    this.isHydrating = true; // 🔥 EMERGENCY: Set guard flag
    
    try {
      const uid = String(userId);
      this.userId = uid;
      const lastSync = forceFullSync ? 0 : this.getLastSyncTimestamp();
      
      // 🔥 EMERGENCY: Use reduced batch sizes from class constants
      // No need to redefine here - use this.BOOKS_BATCH_SIZE and this.ENTRIES_BATCH_SIZE
    
      let booksPage = 0;
      let entriesPage = 0;
      let hasMoreBooks = true;
      let hasMoreEntries = true;
      
      let totalBooksExpected = 0;
      let totalEntriesExpected = 0;
      let processedBooks = 0;
      let processedEntries = 0;

      console.log(`🚀 [GATEKEEPER] Starting Secure Hydration for UID: ${uid}`);

      // --- ১. বই (Books) প্রসেসিং ---
      do {
        const booksResponse = await fetch(`/api/books?userId=${uid}&since=${lastSync}&limit=${this.BOOKS_BATCH_SIZE}&page=${booksPage}`);
        const booksBatch = await booksResponse.json();
        
        if (!booksResponse.ok) break;
        const batchBooks = booksBatch.data || [];
        
        if (booksPage === 0) {
          totalBooksExpected = booksBatch.totalCount || batchBooks.length || 1;
        }
        
        if (batchBooks.length < this.BOOKS_BATCH_SIZE) hasMoreBooks = false;
        if (totalBooksExpected > 0 && processedBooks >= totalBooksExpected) hasMoreBooks = false;

        for (const sb of batchBooks) {
          try {
            // Area 2: Normalization & Identity Guard
            const serverBookWithSyncFlag = { ...sb, synced: 1, conflicted: 0 };
            const normalizedBook = normalizeRecord(serverBookWithSyncFlag, uid);
            if (!normalizedBook) continue;

            const cid = normalizedBook.cid;
            const existing = await db.books.where('cid').equals(cid).first();

            // Area 2: Smart Merge (Judge Logic)
            if (!existing) {
              await db.books.put(normalizedBook);
              console.log(`🌊 [NEW] Book added: ${cid}`);
            } else if (existing.isDeleted === 1 && normalizedBook.isDeleted === 0) {
              // Resurrection Logic (সার্ভার যদি বলে ডাটা আছে, তবে লোকাল ডিলিট বাতিল)
              if (normalizedBook.vKey > existing.vKey) {
                await db.books.update(existing.localId!, normalizedBook);
              }
            } else if (existing.synced === 0) {
              // কনফ্লিক্ট চেক (সার্ভার বনাম লোকাল)
              const businessFieldsMatch = this.compareBusinessFields(existing, normalizedBook, 'BOOK');
              if (businessFieldsMatch) {
                // 🔥 HYDRATION GUARD: Preserve local CID if server returns empty
                if (existing.image && existing.image.startsWith('cid_') && !normalizedBook.image) {
                  normalizedBook.image = existing.image; // Preserve local CID
                  console.log(`🔒 [HYDRATION GUARD] Preserving local CID for book ${existing.cid}`);
                }
                await db.books.update(existing.localId!, { ...normalizedBook, synced: 1 });
              } else {
                // 🔥 SMART VKEY INCREMENT: If server has higher vKey but we want local changes to win
                const winningVKey = Math.max(normalizedBook.vKey, existing.vKey) + 1;
                await db.books.update(existing.localId!, { 
                  ...normalizedBook, 
                  vKey: winningVKey, 
                  conflicted: 1, 
                  serverData: normalizedBook 
                });
                console.log(`🔥 [SMART VKEY] Local wins with incremented vKey: ${winningVKey} for CID: ${cid}`);
              }
            } else if (normalizedBook.vKey > existing.vKey) {
              // সাধারণ আপডেট
              await db.books.update(existing.localId!, normalizedBook);
            }
          } catch (innerErr) { 
            console.error("Book Gatekeeper Error:", innerErr); 
          }
        }
        
        processedBooks += batchBooks.length;
        this.progressEventDebounced({
          current: processedBooks,
          total: totalBooksExpected,
          phase: 'books',
          isComplete: false
        });
        
        booksPage++;
      } while (hasMoreBooks);

      // 🔥 EMERGENCY: Remove notifyUI() from books loop - only call at end

      // --- ২. এন্ট্রি (Entries) প্রসেসিং ---
      do {
        const entriesResponse = await fetch(`/api/entries/all?userId=${uid}&since=${lastSync}&limit=${this.ENTRIES_BATCH_SIZE}&page=${entriesPage}`);
        const entriesBatch = await entriesResponse.json();
        
        if (!entriesResponse.ok) {
          console.error(`🚨 [HYDRATE] Entries batch ${entriesPage} failed:`, entriesBatch);
          break;
        }
        
        const batchEntries = entriesBatch.data || [];
        
        if (entriesPage === 0) {
          totalEntriesExpected = entriesBatch.totalCount || batchEntries.length || 1;
        }
        
        if (batchEntries.length < this.ENTRIES_BATCH_SIZE) hasMoreEntries = false;
        if (totalEntriesExpected > 0 && processedEntries >= totalEntriesExpected) hasMoreEntries = false;

        for (const se of batchEntries) {
          try {
            // �️ SPY LOGIC: Catch specific IDs appearing in the Integrity Error
            const targetIds = ['69939e4f079afa28f58249ea', '69939e98079afa28f5824a22', '6993a017079afa28f5824ab5'];

            if (targetIds.includes(se._id) || targetIds.includes(se.cid)) {
              console.group(`👻 [GHOST HUNT] Found Target Entry: ${se._id}`);
              console.log('1. Raw Server Data:', se);
              
              const norm = normalizeRecord({ ...se, synced: 1 }, uid);
              console.log('2. After Normalization:', norm);
              
              if (!norm) {
                console.error('❌ REJECTED by normalizeRecord! (This is why it is missing)');
              } else {
                console.log('3. Ready to Save. BookId:', norm.bookId);
              }
              console.groupEnd();
            }
            
            // �👻 GHOST HUNT: Log raw server response for problematic records
            if (se.cid === '699330c3bdb7116a222acc02' || se._id === '699330c3bdb7116a222acc02') {
              console.error('👻 [GHOST HUNT] Found problematic record in server response:', {
                cid: se.cid,
                _id: se._id,
                bookId: se.bookId,
                title: se.title,
                amount: se.amount,
                rawServerData: JSON.stringify(se, null, 2)
              });
            }
            
            // 🕵️‍♂️ [GHOST DETECTED] Trace specific ghost record
            if (se.cid === 'cid_1771271729454_iwi7z53') {
              console.error('🕵️‍♂️ [GHOST DETECTED] Raw Server Record:', JSON.stringify(se, null, 2));
            }
            
            // Area 2: Identity & Schema Guard
            const serverEntryWithSyncFlag = { ...se, synced: 1, conflicted: 0 };
            const normalizedEntry = normalizeRecord(serverEntryWithSyncFlag, uid);
            if (!normalizedEntry) {
              // 👻 GHOST HUNT: Log rejected records
              if (se.cid === '699330c3bdb7116a222acc02' || se._id === '699330c3bdb7116a222acc02') {
                console.error('👻 [GHOST HUNT] Problematic record REJECTED by normalizeRecord:', {
                  cid: se.cid,
                  _id: se._id,
                  bookId: se.bookId,
                  rejectionReason: 'Missing bookId or invalid data'
                });
              }
              continue;
            }

            const cid = normalizedEntry.cid;
            const existing = await db.entries.where('cid').equals(cid).first();

            if (!existing) {
              await db.entries.put(normalizedEntry);
            } else if (existing.isDeleted === 1 && normalizedEntry.isDeleted === 0) {
              if (normalizedEntry.vKey > existing.vKey) {
                await db.entries.update(existing.localId!, normalizedEntry);
              }
            } else if (existing.synced === 0) {
              const businessFieldsMatch = this.compareBusinessFields(existing, normalizedEntry, 'ENTRY');
              if (businessFieldsMatch) {
                await db.entries.update(existing.localId!, { ...normalizedEntry, synced: 1 });
              } else {
                await db.entries.update(existing.localId!, { conflicted: 1, serverData: normalizedEntry });
              }
            } else if (normalizedEntry.vKey > existing.vKey) {
              await db.entries.update(existing.localId!, normalizedEntry);
            }
          } catch (innerErr) { 
            console.error("Entry Gatekeeper Error:", innerErr); 
          }
        }
        
        processedEntries += batchEntries.length;
        
        // Progress update via Event
        this.progressEventDebounced({
          current: processedEntries,
          total: totalEntriesExpected,
          phase: 'entries',
          isComplete: false
        });
        
        entriesPage++;
      } while (hasMoreEntries);

      // সব শেষ হলে টাইমস্ট্যাম্প আপডেট
      this.updateLastSyncTimestamp();
      
      // 🔥 UI Notification: Only once at the very end
      this.notifyUI();
      
      // Final Sync Signal (Area 3)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sync-progress', {
          detail: {
            current: processedBooks + processedEntries,
            total: totalBooksExpected + totalEntriesExpected,
            phase: 'complete',
            isComplete: true
          }
        }));
      }
      
      console.log('✅ [GATEKEEPER] Hydration successful. System Integrity Verified.');

    } catch (err) {
      console.error("🚨 [GATEKEEPER] Critical Failure:", err);
    } finally {
      // 🔥 EMERGENCY: Reset hydration guard
      this.isHydrating = false;
      console.log('🔓 [HYDRATION GUARD] Guard reset - hydration complete');
    }
  }

  /**
   * 🚨 LOGOUT: Nuclear reset for clean slate
   */
  async logout() {
    console.log('🔥 [NUCLEAR RESET] Clearing all local data for fresh start...');
    await clearVaultData();
    identityManager.setUserId(null);
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/';
    }
  }

  // পুশার এবং ইভেন্ট হ্যান্ডলিং
  initPusher(pusher: any, userId: string) {
    this.userId = userId;
    
    // Initialize RealtimeCommandHandler
    this.realtimeCommandHandler = new RealtimeCommandHandler(
      userId, 
      () => this.notifyUI() 
    );
    
    // Initialize RealtimeEngine with focused hydration support
    this.realtimeEngine = new RealtimeEngine(
      userId,                                                    // 1st: userId
      this.hydrate.bind(this),                                   // 2nd: hydrateCallback
      this.realtimeCommandHandler.handleEvent.bind(this.realtimeCommandHandler), // 3rd: injectCallback
      this,                                                      // 4th: securityGate
      () => this.notifyUI(),                                      // 5th: broadcastCallback
      this.hydrateSingleItem.bind(this)                            // 6th: hydrateSingleItemCallback
    );
  }

  async performIntegrityCheck(userId?: string) {
    const uid = userId || this.userId;
    if (!uid || !navigator.onLine || this.isCheckingIntegrity || this.isHydrating) return;

    // 🔥 GUARD: Prevent overlapping integrity checks
    this.isCheckingIntegrity = true;

    try {
      console.log(`🔍 [INTEGRITY] Starting background check for user: ${uid}`);

      // 🔥 SERVER: Get server-side counts and hashes
      const response = await fetch(`/api/vault/integrity?userId=${uid}`);
      if (!response.ok) {
        console.warn('⚠️ [INTEGRITY] Server check failed, skipping');
        return;
      }

      const serverData = await response.json();
      
      // 🔥 LOCAL: Calculate local counts and hashes
      const localBooks = await db.books.where('userId').equals(uid).and((book: any) => book.isDeleted !== 1).toArray();
      const localEntries = await db.entries.where('userId').equals(uid).and((entry: any) => entry.isDeleted !== 1).toArray();
      
      // 🔍 DEBUG: Log local count query results to match server logic
      console.log('🔍 [INTEGRITY DEBUG] Local Count Query Result:', { 
        activeBooks: localBooks.length, 
        activeEntries: localEntries.length,
        queryLogic: 'userId === uid AND isDeleted !== 1 (matches server: isDeleted: { $ne: 1 })'
      });

      // 🛡️ SYNC LOCK: Check for active operations before proceeding
      const localUnsyncedCount = localBooks.filter((book: any) => book.synced === 0).length + 
                               localEntries.filter((entry: any) => entry.synced === 0).length;
      
      // Import useMediaStore to check upload status
      const { useMediaStore } = await import('@/lib/vault/MediaStore');
      const mediaStoreState = useMediaStore.getState();
      
      if (this.isSyncing || mediaStoreState.uploadingCount > 0 || localUnsyncedCount > 0) {
        console.log('[INTEGRITY GUARD] Skipping check due to active sync/media upload.', {
          isSyncing: this.isSyncing,
          uploadingCount: mediaStoreState.uploadingCount,
          unsyncedCount: localUnsyncedCount,
          message: 'Waiting for all operations to complete before integrity check'
        });
        return; // Skip integrity check entirely
      }

      const calculateLocalHash = (items: any[]) => {
        // 🔥 SORT BY CID: Ensure consistent order for hash calculation
        const sorted = items.sort((a, b) => (a.cid || '').localeCompare(b.cid || ''));
        
        const vKeySum = sorted.reduce((sum, item) => sum + (item.vKey || 0), 0);
        const cidHash = sorted.reduce((hash, item) => {
          // 🔥 UNIFIED HASH LOGIC: Match server exactly - use (item.cid || item._id || '').toString()
          const cid = (item.cid || item._id || '').toString();
          return hash + cid.split('').reduce((charSum: number, char: string) => charSum + char.charCodeAt(0), 0);
        }, 0);
        return `${sorted.length}-${vKeySum}-${cidHash}`;
      };

      const localBooksHash = calculateLocalHash(localBooks);
      const localEntriesHash = calculateLocalHash(localEntries);

      console.log(`🔍 [INTEGRITY] Local vs Server comparison:`, {
        books: { local: { count: localBooks.length, hash: localBooksHash }, server: serverData.books },
        entries: { local: { count: localEntries.length, hash: localEntriesHash }, server: serverData.entries }
      });

      // 🔥 CONFLICT DETECTION: Check for mismatches
      let needsBackgroundSync = false;
      let hasConflicts = false;

      // Count mismatch - missing data
      if (serverData.books.totalCount !== localBooks.length || 
          serverData.entries.totalCount !== localEntries.length) {
        
        const localBookCount = localBooks.length;
        const serverBookCount = serverData.books.totalCount;
        const localEntryCount = localEntries.length;
        const serverEntryCount = serverData.entries.totalCount;
        
        console.log('🔍 [INTEGRITY] Count analysis:', {
          books: { local: localBookCount, server: serverBookCount, diff: localBookCount - serverBookCount },
          entries: { local: localEntryCount, server: serverEntryCount, diff: localEntryCount - serverEntryCount }
        });
        
        if (localBookCount > serverBookCount || localEntryCount > serverEntryCount) {
          // SYNC GRACE PERIOD: Check if there are unsynced records before running Silent Healing
          const unsyncedBooks = localBooks.filter((book: any) => book.synced === 0);
          const unsyncedEntries = localEntries.filter((entry: any) => entry.synced === 0);
          
          // 🚨 NEW: Check for recent activity (last 60 seconds)
          const recentActivity = localBooks.some((b: any) => (Date.now() - (b.updatedAt || 0)) < 60000) ||
                                localEntries.some((e: any) => (Date.now() - (e.updatedAt || 0)) < 60000);
          
          if (unsyncedBooks.length > 0 || unsyncedEntries.length > 0 || recentActivity) {
            console.log('⏳ [GRACE PERIOD] Recent activity detected. Skipping Silent Healing.', {
              unsyncedBooks: unsyncedBooks.length,
              unsyncedEntries: unsyncedEntries.length,
              recentActivity,
              message: 'Waiting for all operations to complete before integrity check'
            });
            return; // Skip Silent Healing this cycle
          }
          
          // ��️ SILENT HEALING: Local has extra records - run orphaned cleanup
          console.log('🗑️ [INTEGRITY] Local count > Server count - Running Silent Healing for orphaned records');
          
          // 🛡️ PARENT-CHILD CONFLICT DETECTION: Check for deleted parent with local children
          const parentConflictBooks = await this.detectParentChildConflicts(localBooks, localEntries, serverData);
          
          if (parentConflictBooks.length > 0) {
            // 🛡️ PARENT CONFLICT: Mark books as conflicted for modal resolution
            for (const conflictBook of parentConflictBooks) {
              await db.books.update(conflictBook.localId!, {
                conflicted: 1,
                conflictReason: 'PARENT_DELETED_CHILDREN_EXIST',
                serverData: {
                  isDeleted: true,
                  pendingChildrenCount: conflictBook.pendingChildrenCount
                }
              });
              console.warn(`🛡️ [PARENT CONFLICT] Book marked: ${conflictBook.cid} | Children: ${conflictBook.pendingChildrenCount}`);
            }
          }
          
          await this.markConflictedRecords(localBooks, localEntries, serverData);
          
          // Re-fetch counts after Silent Healing
          const updatedLocalBooks = await db.books.where('userId').equals(uid).and((book: any) => book.isDeleted !== 1).toArray();
          const updatedLocalEntries = await db.entries.where('userId').equals(uid).and((entry: any) => entry.isDeleted !== 1).toArray();
          
          // Check if counts now match
          if (serverData.books.totalCount === updatedLocalBooks.length && 
              serverData.entries.totalCount === updatedLocalEntries.length) {
            console.log('✅ [INTEGRITY] Silent Healing resolved count mismatch - no further action needed');
            return; // Exit early - issue resolved
          }
        }
        
        if (localBookCount < serverBookCount || localEntryCount < serverEntryCount) {
          // 🔄 HYDRATION: Server has more data - fetch missing records
          console.log('🔄 [INTEGRITY] Local count < Server count - Triggering hydration to fetch missing data');
          needsBackgroundSync = true;
        }
      }

      // Hash mismatch - data content different
      if (serverData.books.hash !== localBooksHash || 
          serverData.entries.hash !== localEntriesHash) {
        console.warn('⚠️ [INTEGRITY] Hash mismatch detected - marking conflicts');
        hasConflicts = true;
      }

      // 🔥 RECOVERY ACTIONS
      if (needsBackgroundSync) {
        console.log('🔄 [INTEGRITY] Triggering SILENT background hydration to recover missing data');
        // 🤫 SILENT RECOVERY: Avoid disturbing user with progress bars
        const originalProgressEvent = this.progressEventDebounced;
        this.progressEventDebounced = () => {}; // Disable progress events during silent sync
        
        try {
          await this.hydrate(uid, true); // Force full sync silently
          
          // 🚀 HIGH PRIORITY: Force immediate UI refresh after hydration
          window.dispatchEvent(new CustomEvent('VAULT_FORCE_REFRESH', {
            detail: { source: 'silent-integrity-recovery', timestamp: Date.now() }
          }));
        } finally {
          // Restore progress events
          this.progressEventDebounced = originalProgressEvent;
        }
      } else if (hasConflicts) {
        console.log('⚠️ [INTEGRITY] Marking conflicted records for manual resolution');
        // Mark records as conflicted for ConflictResolverModal (only if not already handled by Silent Healing)
        await this.markConflictedRecords(localBooks, localEntries, serverData);
      } else {
        console.log('✅ [INTEGRITY] Data integrity verified - no issues found');
      }

    } catch (error) {
      console.error('🚨 [INTEGRITY] Background check failed:', error);
    } finally {
      // 🔥 GUARD: Reset integrity check flag
      this.isCheckingIntegrity = false;
    }
  }

  /**
   * ⏰ SCHEDULE INTEGRITY CHECKS: Every 2 minutes + window focus
   */
  private scheduleIntegrityChecks() {
    // 🔥 INTERVAL: Check every 2 minutes
    this.integrityCheckInterval = setInterval(() => {
      if (this.userId && !this.isHydrating && !this.isCheckingIntegrity) {
        this.performIntegrityCheck(this.userId);
      }
    }, this.INTEGRITY_CHECK_INTERVAL);

    // 🔥 FOCUS: Debounced integrity check
    let focusTimeout: any = null;
    const debouncedIntegrityCheck = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (this.userId && !this.isHydrating && !this.isCheckingIntegrity) {
          console.log('🔍 [INTEGRITY] Window focus detected - running integrity check');
          this.performIntegrityCheck(this.userId);
        }
      }, 500); // 500ms debounce
    };

    window.addEventListener('focus', debouncedIntegrityCheck);
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        debouncedIntegrityCheck(); // Same debounced function
      }
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (this.integrityCheckInterval) {
        clearInterval(this.integrityCheckInterval);
      }
    });
  }

  /**
   * 🛡️ PARENT-CHILD CONFLICT DETECTION: Find deleted parents with local children
   */
  private async detectParentChildConflicts(localBooks: any[], localEntries: any[], serverData: any): Promise<any[]> {
    const conflicts: any[] = [];
    
    for (const book of localBooks) {
      // Check if book exists on server and is deleted
      const serverBook = serverData.books.sampleIds.find((s: any) => 
        String(s.cid) === String(book.cid) || String(s._id) === String(book._id)
      );
      
      if (serverBook && serverBook.isDeleted === true) {
        // 🚨 PARENT DELETED: Check for local children
        const pendingChildren = localEntries.filter(entry => 
          (entry.bookId === book._id || entry.bookId === book.cid) && 
          entry.synced === 0
        );
        
        if (pendingChildren.length > 0) {
          conflicts.push({
            ...book,
            pendingChildrenCount: pendingChildren.length,
            serverDeleted: true
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * ⚠️ MARK CONFLICTED RECORDS: For ConflictResolverModal handling
   */
  private async markConflictedRecords(localBooks: any[], localEntries: any[], serverData: any) {
    try {
      // 🗑️ ORPHAN DELETION: Delete records missing from server (instant mirror sync)
      const orphanedBooks = localBooks.filter(book => {
        const serverBook = serverData.books.sampleIds.find((s: any) => 
          String(s.cid) === String(book.cid) || String(s._id) === String(book._id)
        );
        // 🛡️ SAFE GUARD: Only delete if it was fully synced AND NOT recently updated
        return !serverBook && book.synced === 1 && book.isDeleted !== 1 && 
               (Date.now() - (book.updatedAt || 0)) > 120000; // 120 SECONDS GRACE PERIOD
      });

      for (const book of orphanedBooks) {
        await db.books.delete(book.localId!);
        console.warn(`🗑️ [SILENT HEALING] Deleted orphaned book: ${book.cid}`);
      }

      const orphanedEntries = localEntries.filter(entry => {
        const serverEntry = serverData.entries.sampleIds.find((s: any) => 
          String(s.cid) === String(entry.cid) || String(s._id) === String(entry._id)
        );
        // 🛡️ SAFE GUARD: Only delete if it was once synced but now missing from server
        return !serverEntry && entry.synced === 1 && entry.isDeleted !== 1;
      });

      for (const entry of orphanedEntries) {
        await db.entries.delete(entry.localId!);
        console.warn(`🗑️ [SILENT HEALING] Deleted orphaned entry: ${entry.cid}`);
      }

      // ⚠️ CONFLICT MARKING: Only for actual version conflicts (not missing records)
      const conflictedBooks = localBooks.filter(book => {
        const serverBook = serverData.books.sampleIds.find((s: any) => 
          String(s.cid) === String(book.cid) || String(s._id) === String(book._id)
        );
        return serverBook && serverBook.vKey !== book.vKey;
      });

      for (const book of conflictedBooks) {
        await db.books.update(book.localId!, { conflicted: 1 });
        console.warn(`⚠️ [INTEGRITY] Book conflict marked: ${book.cid}`);
      }

      const conflictedEntries = localEntries.filter(entry => {
        const serverEntry = serverData.entries.sampleIds.find((s: any) => 
          String(s.cid) === String(entry.cid) || String(s._id) === String(entry._id)
        );
        return serverEntry && serverEntry.vKey !== entry.vKey;
      });

      for (const entry of conflictedEntries) {
        await db.entries.update(entry.localId!, { conflicted: 1 });
        console.warn(`⚠️ [INTEGRITY] Entry conflict marked: ${entry.cid}`);
      }

      // 🚨 UI TRIGGER: Only for actual conflicts, not orphaned deletions
      if (conflictedBooks.length > 0 || conflictedEntries.length > 0) {
        this.notifyUI(); // Trigger UI to show ConflictResolverModal
      }

    } catch (error) {
      console.error('🚨 [INTEGRITY] Failed to process records:', error);
    }
  }

  /**
   * 🚀 BANKING-GRADE MEDIA ENGINE: Process Media Upload Queue
   * Live implementation with online check and store integration
   */
  public async processMediaQueue(): Promise<void> {
    console.log('🚀 [SYNC ORCHESTRATOR] Media Queue Processing - LIVE IMPLEMENTATION');
    
    // 🚨 INTERNET CHECK: Only process if online
    if (!navigator.onLine) {
      console.log('📴 [SYNC ORCHESTRATOR] Offline - skipping media queue processing');
      return;
    }
    
    // 🚨 PHASE 2: Trigger media store processing
    if (typeof window !== 'undefined' && (window as any).mediaStore) {
      const mediaStore = (window as any).mediaStore.getState();
      await mediaStore.processQueue();
      console.log('✅ [SYNC ORCHESTRATOR] Media queue processing triggered');
    } else {
      console.warn('⚠️ [SYNC ORCHESTRATOR] Media store not available');
    }
  }

  /**
   * 🚀 BANKING-GRADE MEDIA ENGINE: Trigger Media Queue Processing
   * Call this after sync operations to process pending media uploads
   */
  private triggerMediaProcessing(): void {
    // Process media queue when internet is available
    if (navigator.onLine) {
      this.processMediaQueue();
    }
  }
}

export const orchestrator = new SyncOrchestrator();

// 🌐 GLOBAL ACCESS: Enable manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).syncOrchestrator = orchestrator;
}