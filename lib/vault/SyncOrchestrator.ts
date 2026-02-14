"use client";

import { db, clearVaultData } from '@/lib/offlineDB';
import { RealtimeEngine } from './core/RealtimeEngine';
import { normalizeRecord, normalizeTimestamp } from './core/VaultUtils';
import { migrationManager } from './core/MigrationManager';
import { telemetry } from './Telemetry';

/**
 * VAULT PRO: MASTER SYNC ORCHESTRATOR (V35.0)
 * ------------------------------------------------------------
 * Industrial-Grade Background Worker. 
 * High Performance, ID Integrity, Zero Redundancy.
 */

class SyncOrchestrator {
  private isSyncing = false;
  private channel = new BroadcastChannel('vault_global_sync');
  private readonly lastSyncKey = 'cashbook_lastSync';
  private realtimeEngine: RealtimeEngine | null = null;
  private userId: string | null = null;
  
  // Integrated Security & Shadow Management
  private pendingDeletions = new Map<string, NodeJS.Timeout>();
  private shadowCache = new Map<string, any>();
  private readonly SHADOW_CACHE_TTL = 15000;

  constructor() {
    this.init();
  }

  /**
   * 🚀 INIT: Async initialization with migrations
   */
  private async init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync());
      this.channel.onmessage = (e) => {
        if (e.data.type === 'FORCE_REFRESH') this.notifyUI();
      };
      
      // Auto-load userId from storage on init
      const saved = localStorage.getItem('cashbookUser');
      if (saved) this.userId = JSON.parse(saved)._id;
      
      // 🔧 ONE-TIME DATA REPAIR: Fix corrupted userId/isDeleted fields
      this.repairCorruptedData();
      
      // 🔥 GLOBAL DATABASE REPAIR: Force server data to synced: 1
      this.globalDatabaseRepair();
      
      // 🏗️ DATABASE MIGRATION: Run schema migrations before any operations
      await migrationManager.runMigrations(this.userId!);
    }
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
   * � SET USER ID: Prime orchestrator with correct ID before operations
   */
  setUserId(userId: string) {
    this.userId = String(userId);
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
        if (entry.userId !== this.userId || entry.isDeleted !== 0) {
          await db.entries.update(entry.localId!, { 
            userId: String(this.userId!), 
            isDeleted: 0 
          });
          entriesRepaired++;
        }
      }
      
      // Fix books table
      const allBooks = await db.books.toArray();
      let booksRepaired = 0;
      
      for (const book of allBooks) {
        if (book.userId !== this.userId || book.isDeleted !== 0) {
          await db.books.update(book.localId!, { 
            userId: String(this.userId!), 
            isDeleted: 0 
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

  private notifyUI() {
    window.dispatchEvent(new Event('vault-updated'));
  }

  private getEffectiveUserId(providedId?: string): string | null {
    const finalId = providedId || this.userId;
    return finalId ? String(finalId) : null;
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
   * � OPTIMISTIC INJECTION: Instant UI Update from Pusher Payload
   */
  async injectRealtimeData(payload: any, eventType: string) {
    const uid = this.getEffectiveUserId();
    if (!uid || !payload) return;

    try {
      const data = normalizeRecord({ ...payload, userId: uid, synced: 1 }, uid);
      const ts = normalizeTimestamp(data.updatedAt || Date.now());

      if (eventType.startsWith('ENTRY')) {
        // 🔍 FIND-BEFORE-MERGE: Check if entry exists by CID
        const existing = await db.entries.where('cid').equals(data.cid).first();
        
        // 📡 [REALTIME GUARD] Smart Hydration Logic
        if (!existing) {
          // Case 1: New Record - Insert as synced
          await db.entries.put({ ...data, updatedAt: ts });
          console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: New`);
        } else if (existing.synced === 0) {
          // Case 2: Protect Unsynced Work - Mark as conflicted
          await db.entries.update(existing.localId!, {
            conflicted: 1,
            conflictReason: 'REALTIME_CONFLICT',
            serverData: data,
            updatedAt: ts
          });
          console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: YES | Status: Protected`);
        } else {
          // Case 3: Update Synced Record - Check vKey
          if (data.vKey > existing.vKey) {
            await db.entries.update(existing.localId!, { ...data, updatedAt: ts });
            console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: Updated`);
          } else {
            console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: Skipped (vKey not newer)`);
          }
        }
      } else if (eventType.startsWith('BOOK')) {
        // 🔍 FIND-BEFORE-MERGE: Check if book exists by CID
        const existing = await db.books.where('cid').equals(data.cid).first();
        
        // 📡 [REALTIME GUARD] Smart Hydration Logic
        if (!existing) {
          // Case 1: New Record - Insert as synced
          await db.books.put({ ...data, updatedAt: ts });
          console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: New`);
        } else if (existing.synced === 0) {
          // Case 2: Protect Unsynced Work - Mark as conflicted
          await db.books.update(existing.localId!, {
            conflicted: 1,
            conflictReason: 'REALTIME_CONFLICT',
            serverData: data,
            updatedAt: ts
          });
          console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: YES | Status: Protected`);
        } else {
          // Case 3: Update Synced Record - Check vKey
          if (data.vKey > existing.vKey) {
            await db.books.update(existing.localId!, { ...data, updatedAt: ts });
            console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: Updated`);
          } else {
            console.log(`📡 [REALTIME GUARD] Smart merge CID: ${data.cid} | Conflict: NO | Status: Skipped (vKey not newer)`);
          }
        }
      }

      console.log(`💉 [REALTIME] Injected ${eventType} for user ${uid}`);
      this.notifyUI();
    } catch (err) {
      // 🤫 SILENT CATCH: Log merge conflict but don't crash
      if (err instanceof Error && err.name === 'ConstraintError') {
        console.warn("Realtime merge conflict for CID:", payload.cid);
      } else {
        console.error("Injection error:", err);
      }
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
      // Removed: this.hydrate(uid); // Prevent blinking - let Pusher handle updates
    }
  }

  /**
   * 🌊 HYDRATE: Pull fresh data from server
   */
  async hydrate(userId: string, forceFullSync = false) {
    if (!navigator.onLine || !userId) return;
    const uid = String(userId);
    this.userId = uid; // Update internal state

    if (forceFullSync) localStorage.removeItem(this.lastSyncKey);
    const lastSync = localStorage.getItem(this.lastSyncKey) || '0';

    try {
      const [bRes, eRes] = await Promise.all([
        fetch(`/api/books?userId=${uid}&since=${lastSync}`),
        fetch(`/api/entries/all?userId=${uid}&since=${lastSync}`)
      ]);

      // --- ১. বই (Books) প্রসেসিং ---
      if (bRes.ok) {
        const bData = await bRes.json();
        const serverBooks = bData.books || bData.data || [];
        for (const sb of serverBooks) {
          try {
            // 🚨 CRITICAL FIX: Explicitly mark server data as synced: 1
            const serverBookWithSyncFlag = { ...sb, synced: 1 };
            const normalizedBook = normalizeRecord(serverBookWithSyncFlag, uid);
            if (!normalizedBook) continue;

            const cid = normalizedBook.cid;
            const existing = await db.books.where('cid').equals(cid).first();
            
            // 🌊 [SMART HYDRATION] Giant Company Standard Logic
            if (!existing) {
              // Case 1: New Record - Save as synced
              await db.books.put(normalizedBook);
              console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: New`);
            } else if (existing.isDeleted === 1 && normalizedBook.isDeleted === 0) {
              // 🚨 TOMBSTONE PROTECTION: Never allow server to overwrite local deletion
              console.log(`🪦 [HYDRATE] Tombstone Protection: CID ${cid} - Local book deletion preserved, server update ignored`);
              return; // Silent Ignore - Trust local delete
            } else if (existing.synced === 0) {
              // Case 2: Protect Unsynced Work - Mark as conflicted
              await db.books.update(existing.localId!, {
                conflicted: 1,
                conflictReason: 'DOWNLOAD_CONFLICT',
                serverData: normalizedBook
              });
              console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Conflicted`);
            } else {
              // Case 3: Update Synced Record - Check vKey
              if (normalizedBook.vKey > existing.vKey) {
                await db.books.update(existing.localId!, normalizedBook);
                console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Updated`);
              } else {
                console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Skipped (vKey not newer)`);
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'ConstraintError') {
              console.warn("Merge conflict for book CID:", sb.cid);
            } else {
              console.error("Book merge error:", err);
            }
          }
        }
      }

      // --- ২. এন্ট্রি (Entries) প্রসেসিং ---
      if (eRes.ok) {
        const eData = await eRes.json();
        const serverEntries = eData.entries || eData.data || [];
        
        if (serverEntries.length > 0) {
          const sampleEntry = serverEntries[0];
          console.log('🔍 [SYNC SAMPLE]', {
            cid: sampleEntry.cid,
            serverUserId: sampleEntry.userId,
            localUid: uid
          });
        }
        
        for (const se of serverEntries) {
          try {
            // 🚨 CRITICAL FIX: Explicitly mark server data as synced: 1
            const serverEntryWithSyncFlag = { ...se, synced: 1 };
            const normalizedEntry = normalizeRecord(serverEntryWithSyncFlag, uid);
            if (!normalizedEntry) continue;

            const cid = normalizedEntry.cid;
            const existing = await db.entries.where('cid').equals(cid).first();
            
            // 🌊 [SMART HYDRATION] Giant Company Standard Logic
            if (!existing) {
              // Case 1: New Record - Save as synced
              await db.entries.put(normalizedEntry);
              console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: New`);
            } else if (existing.isDeleted === 1 && normalizedEntry.isDeleted === 0) {
              // 🚨 TOMBSTONE PROTECTION: Never allow server to overwrite local deletion
              console.log(`🪦 [HYDRATE] Tombstone Protection: CID ${cid} - Local deletion preserved, server update ignored`);
              return; // Silent Ignore - Trust local delete
            } else if (existing.synced === 0) {
              // Case 2: Protect Unsynced Work - Mark as conflicted
              await db.entries.update(existing.localId!, {
                conflicted: 1,
                conflictReason: 'DOWNLOAD_CONFLICT',
                serverData: normalizedEntry
              });
              console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Conflicted`);
            } else {
              // Case 3: Update Synced Record - Check vKey
              if (normalizedEntry.vKey > existing.vKey) {
                await db.entries.update(existing.localId!, normalizedEntry);
                console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Updated`);
              } else {
                console.log(`🌊 [HYDRATE] Smart merging CID: ${cid} | Status: Skipped (vKey not newer)`);
              }
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'ConstraintError') {
              console.warn("Merge conflict for entry CID:", se.cid);
            } else {
              console.error("Entry merge error:", err);
            }
          }
        }
        
        if (serverEntries.length > 0) {
          const maxTs = Math.max(...serverEntries.map((e: any) => normalizeTimestamp(e.updatedAt)));
          localStorage.setItem(this.lastSyncKey, maxTs.toString());
        }
        
        console.log('🌊 [HYDRATE] Data Received:', serverEntries.length);
      }
      this.notifyUI();
    } catch (err) {
      if (err instanceof Error && (err.name === 'TypeError' || err.message.includes('ERR_CONNECTION_REFUSED'))) {
        console.warn("Server unreachable, staying offline.");
        return;
      }
      console.error("Hydration Failed:", err);
    }
  }

  /**
   * 🚨 NUCLEAR RESET: Purge local data
   */
  async nuclearReset() {
    await db.books.clear();
    await db.entries.clear();
    localStorage.removeItem(this.lastSyncKey);
    this.notifyUI();
  }

  /**
   * 🚨 LOGOUT: Complete cleanup
   */
  async logout() {
    await this.nuclearReset();
    localStorage.removeItem('cashbookUser');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  // পুশার এবং ইভেন্ট হ্যান্ডলিং
  initPusher(pusher: any, userId: string) {
    this.userId = userId;
    this.realtimeEngine = new RealtimeEngine(
      userId, 
      this.hydrate.bind(this), 
      this.injectRealtimeData.bind(this), 
      this, 
      () => this.notifyUI() 
    );
    this.realtimeEngine.initPusher(pusher);
  }
}

export const orchestrator = new SyncOrchestrator();

// 🌐 GLOBAL ACCESS: Enable manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).syncOrchestrator = orchestrator;
}