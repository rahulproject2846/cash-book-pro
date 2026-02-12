"use client";
import { db } from '@/lib/offlineDB';

/**
 * VAULT PRO: SHADOW MANAGER (V25.0 - UNBREAKABLE INTEGRITY)
 * ----------------------------------------------------
 * Shadow cache, deletion buffer, and emergency storage management
 */

export class ShadowManager {
  private pendingDeletions = new Map<string, NodeJS.Timeout>(); // localId -> timeoutId
  private shadowCache = new Map<string, any>(); // localId -> full entry object
  private SHADOW_CACHE_TTL = 15000; // 15 seconds TTL for shadow cache
  private channel: BroadcastChannel;
  private isDestroyed = false;

  constructor(channel: BroadcastChannel) {
    this.channel = channel;
  }

  /**
   * MEMORY LEAK FIX: Cleanup method to prevent memory leaks
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // Clear all pending deletion timeouts
    this.pendingDeletions.forEach(timeoutId => clearTimeout(timeoutId));
    this.pendingDeletions.clear();
    
    // Clear shadow cache
    this.shadowCache.clear();
    
    this.isDestroyed = true;
  }

  /**
   * 🕐 DELETION BUFFER: Schedule deletion with 10-second buffer window
   */
  async scheduleDeletion(localId: string, userId: string) {
    // Clear any existing timeout for this entry
    const existingTimeout = this.pendingDeletions.get(localId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 🌑 SHADOW CACHE: Cache entry data before deletion for perfect restoration
    try {
      const entry = await db.entries.get(Number(localId));
      if (entry) {
        this.cacheEntryForDeletion(localId, entry);
      }
    } catch (err) {
      console.warn(`🌑 Failed to cache entry ${localId} before deletion:`, err);
    }

    // Schedule new deletion after 10 seconds
    const timeoutId = setTimeout(async () => {
      try {
        const entry = await db.entries.get(Number(localId));
        if (entry && entry.isDeleted === 1) {
          // Entry is still marked as deleted, proceed with server sync
          console.log(`🕐 Deletion buffer expired for ${localId}, syncing to server`);
          // Note: triggerSync will be called by main orchestrator
        } else {
          // Entry was restored, no sync needed
          console.log(`🔄 Entry ${localId} was restored, cancelling server deletion`);
        }
      } catch (err) {
        console.error('Error in deletion buffer timeout:', err);
      } finally {
        // Clean up timeout reference and shadow cache
        this.pendingDeletions.delete(localId);
        this.clearShadowCacheEntry(localId);
      }
    }, 10000); // 10-second buffer

    this.pendingDeletions.set(localId, timeoutId);
    console.log(`🕐 Scheduled deletion for ${localId} in 10 seconds`);
  }

  /**
   * 🔄 PUBLIC CANCEL DELETION: Cancel pending deletion and clear UI buffer
   */
  cancelDeletion(localId: number): boolean {
    const timeoutId = this.pendingDeletions.get(String(localId));
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pendingDeletions.delete(String(localId));
      this.broadcast(); // 🔄 UI FIX: Clear orange buffer bar
      return true;
    }
    return false;
  }

  /**
   * 🌑 RESTORE FROM SHADOW CACHE: Perfect restoration using cached data
   */
  async restoreEntryFromShadowCache(localId: string): Promise<boolean> {
    try {
      // Cancel pending deletion first
      const wasCancelled = this.cancelDeletion(Number(localId));
      
      // Get cached entry data
      const cachedEntry = this.getEntryFromCache(localId);
      if (!cachedEntry) {
        console.warn(`🌑 No cached data available for ${localId}, cannot restore perfectly`);
        return false;
      }
      
      // Remove cache metadata before restoration
      const { _shadowCacheTimestamp, _shadowCacheId, ...originalEntry } = cachedEntry;
      
      // Restore entry with original data plus restoration metadata
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
      
      // Update database with restored entry
      await db.entries.update(Number(localId), restoredEntry);
      
      // Clear shadow cache entry after successful restoration
      this.clearShadowCacheEntry(localId);
      
      console.log(`🌑 Entry ${localId} perfectly restored from shadow cache`);
      
      // Dispatch restoration event for UI updates
      window.dispatchEvent(new CustomEvent('entry-restored-from-cache', {
        detail: { 
          localId, 
          restoredEntry,
          cacheAge: Date.now() - _shadowCacheTimestamp
        }
      }));
      
      return true;
    } catch (err) {
      console.error(`🌑 Failed to restore entry ${localId} from shadow cache:`, err);
      return false;
    }
  }

  /**
   * 🌑 SHADOW CACHE: Store entry data before deletion for perfect restoration
   */
  private cacheEntryForDeletion(localId: string, entry: any) {
    // Deep clone entry to prevent reference issues
    const clonedEntry = JSON.parse(JSON.stringify(entry));
    
    // Add cache metadata
    clonedEntry._shadowCacheTimestamp = Date.now();
    clonedEntry._shadowCacheId = `${localId}_${Date.now()}`;
    
    this.shadowCache.set(localId, clonedEntry);
    console.log(`🌑 Entry ${localId} cached in shadow cache for restoration`);
    
    // Schedule automatic cleanup after TTL
    setTimeout(() => {
      this.clearShadowCacheEntry(localId);
    }, this.SHADOW_CACHE_TTL);
  }

  /**
   * 🌑 SHADOW CACHE: Retrieve cached entry data for restoration
   */
  private getEntryFromCache(localId: string): any | null {
    const cachedEntry = this.shadowCache.get(localId);
    if (!cachedEntry) {
      console.warn(`🌑 No cached entry found for ${localId}`);
      return null;
    }
    
    // Check if cache entry is still valid (within TTL)
    const cacheAge = Date.now() - cachedEntry._shadowCacheTimestamp;
    if (cacheAge > this.SHADOW_CACHE_TTL) {
      console.warn(`🌑 Cached entry ${localId} expired (${cacheAge}ms old)`);
      this.clearShadowCacheEntry(localId);
      return null;
    }
    
    console.log(`🌑 Retrieved entry ${localId} from shadow cache`);
    return cachedEntry;
  }

  /**
   * 🌑 SHADOW CACHE: Clear specific cache entry
   */
  private clearShadowCacheEntry(localId: string) {
    const wasDeleted = this.shadowCache.delete(localId);
    if (wasDeleted) {
      console.log(`🌑 Cleared shadow cache entry for ${localId}`);
    }
  }

  /**
   * 🌑 SHADOW CACHE: Clear all expired cache entries
   */
  private cleanupExpiredShadowCache() {
    const now = Date.now();
    const expiredEntries: string[] = [];
    
    this.shadowCache.forEach((entry, localId) => {
      const cacheAge = now - entry._shadowCacheTimestamp;
      if (cacheAge > this.SHADOW_CACHE_TTL) {
        expiredEntries.push(localId);
      }
    });
    
    expiredEntries.forEach(localId => {
      this.clearShadowCacheEntry(localId);
    });
    
    if (expiredEntries.length > 0) {
      console.log(`🌑 Cleaned up ${expiredEntries.length} expired shadow cache entries`);
    }
  }

  /**
   * 🚨 EMERGENCY STORAGE HANDLE: Setup event listeners for tab closure protection
   */
  setupEmergencyStorageHandle(triggerSyncCallback: () => void) {
    if (typeof window === 'undefined') return;
    
    // Add beforeunload event listener
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (this.pendingDeletions.size > 0) {
        console.warn('🚨 Tab closing with pending deletions - showing confirmation dialog');
        
        // Show browser's native confirmation dialog
        const message = `You have ${this.pendingDeletions.size} pending deletion(s) that may not be saved. Are you sure you want to leave?`;
        event.preventDefault();
        event.returnValue = message;
        
        // Try emergency flush as best effort
        this.flushPendingDeletions(triggerSyncCallback);
      }
    };
    
    // Add unload event listener (additional safety net)
    const handleUnload = () => {
      if (this.pendingDeletions.size > 0) {
        console.warn('🚨 Page unloading with pending deletions - attempting emergency flush');
        this.flushPendingDeletions(triggerSyncCallback);
      }
    };
    
    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    
    // Store references for cleanup
    (window as any)._emergencyHandleCleanup = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }

  /**
   * 🚨 EMERGENCY FLUSH: Immediately sync all pending deletions without waiting
   */
  private async flushPendingDeletions(triggerSyncCallback: () => void) {
    if (this.pendingDeletions.size === 0) return;
    
    console.log(`🚨 Emergency flush: Processing ${this.pendingDeletions.size} pending deletions`);
    
    const pendingIds = Array.from(this.pendingDeletions.keys());
    
    // Clear all pending timeouts
    this.pendingDeletions.forEach((timeoutId, localId) => {
      clearTimeout(timeoutId);
      console.log(`🚨 Emergency flush: Cleared timeout for ${localId}`);
    });
    
    // Process each pending deletion immediately
    for (const localId of pendingIds) {
      try {
        const entry = await db.entries.get(Number(localId));
        if (entry && entry.isDeleted === 1) {
          console.log(`🚨 Emergency flush: Syncing ${localId} to server immediately`);
          // Mark as ready for immediate sync
          await db.entries.update(Number(localId), { 
            synced: 0, 
            updatedAt: Date.now(), 
            vKey: (entry.vKey || 0) + 1, 
            syncAttempts: 0,
            _emergencyFlushed: true,
            _emergencyFlushAt: Date.now()
          });
        }
        
        // Clear shadow cache entry
        this.clearShadowCacheEntry(localId);
        
      } catch (err) {
        console.error(`🚨 Emergency flush failed for ${localId}:`, err);
      }
    }
    
    // Trigger immediate sync
    triggerSyncCallback();
  }

  /**
   * 📡 BROADCAST: Send update to all tabs
   */
  broadcast() {
    if (this.channel && !this.isDestroyed) {
      this.channel.postMessage({ type: 'FORCE_REFRESH' });
    }
  }

  /**
   * Get pending deletions count for UI
   */
  getPendingDeletionsCount(): number {
    return this.pendingDeletions.size;
  }
}
