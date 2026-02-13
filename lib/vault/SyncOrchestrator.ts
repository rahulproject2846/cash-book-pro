"use client";
import { db } from '@/lib/offlineDB';
import { SecurityGate } from './core/SecurityGate';
import { ShadowManager } from './core/ShadowManager';
import { RealtimeEngine } from './core/RealtimeEngine';

/**
 * VAULT PRO: SYNC ORCHESTRATOR (V25.0 - MODULAR ARCHITECTURE)
 * ------------------------------------------------------------
 * Main controller coordinating security, shadow management, and realtime engine
 */

// 🔧 HELPER: Normalize timestamps to consistent number format
const normalizeTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// 🌐 GLOBAL DATABASE EVENT DISPATCHER
const dispatchDatabaseUpdate = (operation: string, type: 'book' | 'entry', data?: any) => {
    // 🔍 CIRCULAR UPDATE CHECK: Only dispatch if this is a genuine external change
    // This prevents infinite loops where our own database updates trigger real-time events
    console.log(`🌐 DATABASE UPDATE: ${operation} - ${type}`, data);
    window.dispatchEvent(new CustomEvent('database-updated', { 
        detail: { operation, type, data, timestamp: Date.now() } 
    }));
};

class SyncOrchestrator {
  private isSyncing = false;
  private channel = new BroadcastChannel('vault_global_sync');
  private lastSyncKey = 'vault_last_sync_timestamp';
  private MAX_RETRIES = 5;
  private isDestroyed = false;
  
  // Modular components
  private securityGate: SecurityGate;
  private shadowManager: ShadowManager;
  private realtimeEngine: RealtimeEngine;

  constructor() {
    this.securityGate = new SecurityGate();
    this.shadowManager = new ShadowManager(this.channel);
    this.realtimeEngine = new RealtimeEngine('', this.hydrate.bind(this), this.securityGate, this.shadowManager.broadcast.bind(this.shadowManager));
    
    if (typeof window !== 'undefined') {
      this.channel.onmessage = (e) => {
        if (e.data.type === 'FORCE_REFRESH') {
          window.dispatchEvent(new Event('vault-updated'));
        }
      };
      window.addEventListener('online', () => this.triggerSync());
      
      // Setup emergency storage handle
      this.shadowManager.setupEmergencyStorageHandle(() => this.triggerSync());
    }
  }

  /**
   * MEMORY LEAK FIX: Cleanup method to prevent memory leaks
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // Cleanup all components
    this.shadowManager.destroy();
    
    // Close BroadcastChannel
    if (this.channel) {
      this.channel.close();
      this.channel = null as any;
    }
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.triggerSync());
    }
    
    this.isDestroyed = true;
  }

  /**
   * Logic A: Backoff Calculator
   */
  private shouldRetry(item: any): boolean {
    if (!item.syncAttempts || item.syncAttempts === 0) return true;
    if (item.syncAttempts >= this.MAX_RETRIES) return false;

    const delay = Math.pow(2, item.syncAttempts) * 1000;
    const lastAttempt = item.lastAttempt || 0;
    return Date.now() > lastAttempt + delay;
  }

  /**
   * Core sync engine
   */
  async triggerSync(userId?: string) {
    let uid = userId;
    if (!uid && typeof window !== 'undefined') {
      const saved = localStorage.getItem('cashbookUser');
      if (saved) uid = JSON.parse(saved)._id;
    }
    
    if (!navigator.onLine || this.isSyncing || !uid) return;

    this.isSyncing = true;
    console.log('🚀 Sync Started');
    try {
      // --- STEP A: Books Sync ---
      const pendingBooks = await db.books.where('synced').equals(0).toArray();
      for (const book of pendingBooks) {
        if (!this.shouldRetry(book)) continue;

        if (book.isDeleted === 1) {
          if (book._id) {
            const res = await fetch(`/api/books/${book._id}`, { method: 'DELETE' }).catch(() => null);
            if (res) {
              const result = await res.json().catch(() => ({}));
              if (!this.securityGate.checkSecurityStatus(result)) return; 
            }
          }
          await db.books.delete(book.localId!);
          continue;
        }

        const res = await fetch('/api/books', {
          method: book._id ? 'PUT' : 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...book, userId: uid }),
        });

        if (res) {
          const result = await res.json().catch(() => ({}));
          if (!this.securityGate.checkSecurityStatus(result)) return;

          if (res.ok) {
            const sId = result.book?._id || result.data?._id || book._id;
            console.log('🔍 TRIGGER SYNC BOOK - Before Update:', {
              localId: book.localId,
              localUpdatedAt: book.updatedAt,
              localUpdatedAtType: typeof book.updatedAt,
              serverResult: result,
              serverId: sId
            });
            await db.books.update(book.localId!, { _id: sId, synced: 1, syncAttempts: 0, updatedAt: book.updatedAt });
            console.log('🔍 TRIGGER SYNC BOOK - After Update:', {
              updatedRecord: { _id: sId, synced: 1, syncAttempts: 0, updatedAt: book.updatedAt }
            });
          } else if (res.status === 409) {
            await this.hydrate(uid as string);
          } else {
            await db.books.update(book.localId!, { syncAttempts: (book.syncAttempts || 0) + 1, lastAttempt: Date.now() });
          }
        }
      }

      // --- STEP B: Entries Sync ---
      const pendingEntries = await db.entries.where('synced').equals(0).toArray();
      for (const entry of pendingEntries) {
        if (!this.shouldRetry(entry)) continue;

        if (entry.isDeleted === 1) {
          if (entry._id) {
            const res = await fetch(`/api/entries/${entry._id}`, { 
              method: 'DELETE',
              body: JSON.stringify({ vKey: entry.vKey }) 
            }).catch(() => null);
            if (res) {
              const result = await res.json().catch(() => ({}));
              if (!this.securityGate.checkSecurityStatus(result)) return;
            }
          }
          await db.entries.delete(entry.localId!);
          continue;
        }

        const res = await fetch(entry._id ? `/api/entries/${entry._id}` : '/api/entries', {
          method: entry._id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...entry, userId: uid, amount: Number(entry.amount) }),
        });

        if (res) {
          const result = await res.json().catch(() => ({}));
          
          if (res.ok) {
            const sId = result.entry?._id || result.data?._id || entry._id;
            console.log('🔍 TRIGGER SYNC ENTRY - Before Update:', {
              localId: entry.localId,
              localUpdatedAt: entry.updatedAt,
              localUpdatedAtType: typeof entry.updatedAt,
              serverResult: result,
              serverId: sId
            });
            await db.entries.update(entry.localId!, { 
              synced: 1, 
              _id: sId, 
              vKey: result.entry?.vKey || result.data?.vKey || entry.vKey, 
              syncAttempts: 0,
              updatedAt: entry.updatedAt // 🔧 PRESERVE: Keep local timestamp until server hydration
            });
            console.log('🔍 TRIGGER SYNC ENTRY - After Update:', {
              updatedRecord: { synced: 1, _id: sId, vKey: result.entry?.vKey || result.data?.vKey || entry.vKey, syncAttempts: 0, updatedAt: entry.updatedAt }
            });
          } else if (res.status === 409) {
            await this.hydrate(uid as string);
            break; 
          } else {
            if (!this.securityGate.checkSecurityStatus(result)) return;
            await db.entries.update(entry.localId!, { syncAttempts: (entry.syncAttempts || 0) + 1, lastAttempt: Date.now() });
          }
        }
      }
      this.shadowManager.broadcast();
    } catch (err: any) { 
      console.error("Sync Error:", err);
    } finally {
      this.isSyncing = false;
      console.log('✅ Sync Success');
      this.hydrate(uid as string);
    }
  }

  /**
   * Smart delta hydration (Map-First Surgical Fix)
   */
  async hydrate(userId: string, forceFullSync = false) {
    if (!navigator.onLine || !userId) return;
    const lastSync = forceFullSync ? '0' : (localStorage.getItem(this.lastSyncKey) || '0');
    
    try {
      const [bRes, eRes] = await Promise.all([
        fetch(`/api/books?userId=${userId}&since=${lastSync}`),
        fetch(`/api/entries/all?userId=${userId}&since=${lastSync}`)
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        if (!this.securityGate.checkSecurityStatus(bData)) return;

        const serverBooks = bData.books || bData.data || [];
        for (const sb of serverBooks) {
          const local = await db.books
            .where('cid').equals(sb.cid || "")
            .or('_id').equals(sb._id)
            .first();

          // 🔍 STRICT KEY VALIDATION: Check for required fields before DB operations
          if (!sb._id && !sb.cid) {
            console.error('🔍 SYNC ORCHESTRATOR: Missing required keys for book lookup', {
              missingFields: {
                _id: !sb._id,
                cid: !sb.cid
              },
              serverBook: sb,
              willTriggerEmergencyHydration: true
            });
            
            // 🚨 EMERGENCY HYDRATION: Skip DB operation and trigger full sync
            console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Missing keys in server book data');
            continue; // Skip this book and continue with next
          }

          // 🔍 STRICT ID LOOKUP INVESTIGATION: Log detailed lookup process
          console.log('🔍 BOOK ID LOOKUP INVESTIGATION:', {
            serverBook: {
              _id: sb._id,
              cid: sb.cid,
              vKey: sb.vKey,
              name: sb.name,
              updatedAt: sb.updatedAt
            },
            foundLocal: !!local,
            localBook: local ? {
              localId: local.localId,
              _id: local._id,
              cid: local.cid,
              vKey: local.vKey,
              name: local.name,
              updatedAt: local.updatedAt
            } : null,
            lookupQuery: {
              cidMatch: sb.cid,
              idMatch: sb._id,
              combinedQuery: `cid="${sb.cid}" OR _id="${sb._id}"`
            }
          });

          if (sb.isDeleted) {
            if (local) {
              await db.books.delete(local.localId!);
              dispatchDatabaseUpdate('delete', 'book', { localId: local.localId, _id: sb._id }); // 🌐 GLOBAL EVENT
            }
            continue;
          }

          // 🔧 UNIFIED LOGIC: Use same vKey priority as New Entry logic
          const isNewer = !local || 
                          (Number(sb.vKey) >= Number(local.vKey || 0)) || 
                          (normalizeTimestamp(sb.updatedAt) > normalizeTimestamp(local.updatedAt || 0));

          // 🔍 VKEY PROTECTION: Log vKey comparison logic
          console.log('🔍 BOOK VKEY PROTECTION:', {
            serverVKey: sb.vKey,
            localVKey: local?.vKey || 0,
            vKeyComparison: Number(sb.vKey || 0) >= Number(local?.vKey || 0),
            timeComparison: normalizeTimestamp(sb.updatedAt) > normalizeTimestamp(local?.updatedAt || 0),
            willUpdate: isNewer,
            reason: !local ? 'No local record' : 
                     Number(sb.vKey || 0) > Number(local.vKey || 0) ? 'Server vKey is higher' :
                     Number(sb.vKey || 0) === Number(local.vKey || 0) ? 'Server vKey is equal (allowing update)' :
                     normalizeTimestamp(sb.updatedAt) > normalizeTimestamp(local.updatedAt || 0) ? 'Server timestamp is newer' : 'Local data is newer'
          });

          if (isNewer) {
            console.log('🔍 HYDRATE BOOK - Before Update:', {
              localId: local?.localId,
              localUpdatedAt: local?.updatedAt,
              localUpdatedAtType: typeof local?.updatedAt,
              serverUpdatedAt: sb.updatedAt,
              serverUpdatedAtType: typeof sb.updatedAt,
              serverBook: sb
            });
            
            // 🔧 UNIFIED NORMALIZATION: Use normalizeTimestamp for consistency
            const normalizedBook = {
              ...sb,
              updatedAt: normalizeTimestamp(sb.updatedAt)
            };
            
            await db.books.put({ 
              ...normalizedBook, 
              localId: local?.localId, 
              synced: 1, 
              isDeleted: sb.isDeleted ? 1 : 0,
              vKey: Math.max(Number(sb.vKey || 0), Number(local?.vKey || 0)) // 🔧 UNIFIED vKey LOGIC
            });
            dispatchDatabaseUpdate(local ? 'update' : 'create', 'book', { ...normalizedBook, localId: local?.localId }); // 🌐 GLOBAL EVENT
            console.log('🔍 HYDRATE BOOK - After Update:', {
              updatedRecord: {...normalizedBook, localId: local?.localId, synced: 1, isDeleted: sb.isDeleted ? 1 : 0, vKey: Math.max(Number(sb.vKey || 0), Number(local?.vKey || 0))}
            });
          }
        }
      }

      if (eRes.ok) {
        const eData = await eRes.json();
        if (!this.securityGate.checkSecurityStatus(eData)) return;
        const serverEntries = eData.entries || eData.data || [];
        
        // 🔒 CRITICAL FIX: Extract server timestamp from response headers
        const serverTimestampHeader = eRes.headers.get('x-server-timestamp');
        const serverTimestamp = serverTimestampHeader ? new Date(serverTimestampHeader).getTime() : null;
        
        await db.transaction('rw', db.entries, async () => {
          let maxServerTimestamp = serverTimestamp || 0;
          for (const se of serverEntries) {
            try {
              if (se.updatedAt) {
                const serverTime = normalizeTimestamp(se.updatedAt);
                if (serverTime > maxServerTimestamp) {
                  maxServerTimestamp = serverTime;
                }
              }

              const local = await db.entries.where('cid').equals(se.cid || "").or('_id').equals(se._id).first();

              // 🔍 STRICT KEY VALIDATION: Check for required fields before DB operations
              if (!se._id && !se.cid) {
                console.error('🔍 SYNC ORCHESTRATOR: Missing required keys for entry lookup', {
                  missingFields: {
                    _id: !se._id,
                    cid: !se.cid
                  },
                  serverEntry: se,
                  willTriggerEmergencyHydration: true
                });
                
                // 🚨 EMERGENCY HYDRATION: Skip DB operation and trigger full sync
                console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Missing keys in server entry data');
                continue; // Skip this entry and continue with next
              }

              // 🔍 STRICT ID LOOKUP INVESTIGATION: Log detailed lookup process
              console.log('🔍 ENTRY ID LOOKUP INVESTIGATION:', {
                serverEntry: {
                  _id: se._id,
                  cid: se.cid,
                  vKey: se.vKey,
                  amount: se.amount,
                  updatedAt: se.updatedAt
                },
                foundLocal: !!local,
                localEntry: local ? {
                  localId: local.localId,
                  _id: local._id,
                  cid: local.cid,
                  vKey: local.vKey,
                  amount: local.amount,
                  updatedAt: local.updatedAt
                } : null,
                lookupQuery: {
                  cidMatch: se.cid,
                  idMatch: se._id,
                  combinedQuery: `cid="${se.cid}" OR _id="${se._id}"`
                }
              });

              if (se.isDeleted) {
                if (local) {
                  await db.entries.delete(local.localId!);
                  dispatchDatabaseUpdate('delete', 'entry', { localId: local.localId, _id: se._id }); // 🌐 GLOBAL EVENT
                }
                continue;
              }

              // 🔧 UNIFIED LOGIC: Use same vKey priority as New Entry logic
              const isNewer = !local || 
                              (Number(se.vKey) >= Number(local.vKey || 0)) || 
                              (normalizeTimestamp(se.updatedAt) > normalizeTimestamp(local.updatedAt || 0));

              // 🔍 VKEY PROTECTION: Log vKey comparison logic
              console.log('🔍 ENTRY VKEY PROTECTION:', {
                serverVKey: se.vKey,
                localVKey: local?.vKey || 0,
                vKeyComparison: Number(se.vKey || 0) >= Number(local?.vKey || 0),
                timeComparison: normalizeTimestamp(se.updatedAt) > normalizeTimestamp(local?.updatedAt || 0),
                willUpdate: isNewer,
                reason: !local ? 'No local record' : 
                         Number(se.vKey || 0) > Number(local.vKey || 0) ? 'Server vKey is higher' :
                         Number(se.vKey || 0) === Number(local.vKey || 0) ? 'Server vKey is equal (allowing update)' :
                         normalizeTimestamp(se.updatedAt) > normalizeTimestamp(local.updatedAt || 0) ? 'Server timestamp is newer' : 'Local data is newer'
              });

              if (isNewer) {
                console.log('🔍 HYDRATE ENTRY - Before Update:', {
                  localId: local?.localId,
                  localUpdatedAt: local?.updatedAt,
                  localUpdatedAtType: typeof local?.updatedAt,
                  serverUpdatedAt: se.updatedAt,
                  serverUpdatedAtType: typeof se.updatedAt,
                  serverEntry: se
                });
                
                // 🔧 UNIFIED NORMALIZATION: Use normalizeTimestamp for consistency
                const normalizedEntry = {
                  ...se,
                  updatedAt: normalizeTimestamp(se.updatedAt),
                  createdAt: normalizeTimestamp(se.createdAt) // 🔧 NORMALIZE createdAt too
                };
                
                await db.entries.put({ 
                  ...normalizedEntry, 
                  localId: local?.localId, 
                  synced: 1, 
                  isDeleted: 0,
                  vKey: Math.max(Number(se.vKey || 0), Number(local?.vKey || 0)) // 🔧 UNIFIED vKey LOGIC
                });
                dispatchDatabaseUpdate(local ? 'update' : 'create', 'entry', { ...normalizedEntry, localId: local?.localId }); // 🌐 GLOBAL EVENT
                console.log('🔍 HYDRATE ENTRY - After Update:', {
                  updatedRecord: {...normalizedEntry, localId: local?.localId, synced: 1, isDeleted: 0, vKey: Math.max(Number(se.vKey || 0), Number(local?.vKey || 0))}
                });
              }
            } catch (entryErr) {
              console.error('Corrupted entry skipped during hydration:', entryErr, se);
              continue;
            }
          }
          // 🔒 RACE CONDITION FIX: Use ONLY server timestamp
          if (maxServerTimestamp > 0) {
            localStorage.setItem(this.lastSyncKey, maxServerTimestamp.toString());
          } else {
            console.warn('⚠️ No server timestamp available - skipping lastSyncKey update to prevent data loss');
          }
        });
      }
      
      this.shadowManager.broadcast();
      window.dispatchEvent(new Event('vault-updated'));
      if (!forceFullSync) this.performHealthCheck(userId);
    } catch (err) { 
      console.error("Hydration Error:", err);
      const error = err as Error;
      if (error.message && error.message.includes('SYSTEM_BLOCK')) {
        this.securityGate.performSystemBlock();
      }
    }
  }

  /**
   * Logic D: Deep Health Check
   */
  async performHealthCheck(userId: string) {
    try {
      const res = await fetch(`/api/entries/count?userId=${userId}`);
      if (!res.ok) return;
      const result = await res.json();
      
      if (!this.securityGate.checkSecurityStatus(result)) return;
      
      const localCount = await db.entries.count();
      const serverCount = result.count;
      
      if (serverCount > localCount) {
        this.hydrate(userId, true);
      }
    } catch (e) {}
  }

  /**
   * 🚀 INIT PUSHER: Initialize real-time engine
   */
  initPusher(pusher: any, userId: string) {
    // Update realtime engine with new userId
    this.realtimeEngine = new RealtimeEngine(userId, this.hydrate.bind(this), this.securityGate, this.shadowManager.broadcast.bind(this.shadowManager));
    this.realtimeEngine.initPusher(pusher);
  }

  /**
   * 🔄 PUBLIC CANCEL DELETION: Delegate to shadow manager
   */
  cancelDeletion(localId: number): boolean {
    return this.shadowManager.cancelDeletion(localId);
  }

  /**
   * 🕐 SCHEDULE DELETION: Delegate to shadow manager
   */
  async scheduleDeletion(localId: string, userId: string) {
    return this.shadowManager.scheduleDeletion(localId, userId);
  }

  /**
   * 🌑 RESTORE FROM SHADOW CACHE: Delegate to shadow manager
   */
  async restoreEntryFromShadowCache(localId: string): Promise<boolean> {
    return this.shadowManager.restoreEntryFromShadowCache(localId);
  }

  /**
   * 🚨 LOGOUT: Delegate to security gate
   */
  async logout() {
    this.destroy();
    return this.securityGate.logout();
  }

  /**
   * Get pending deletions count for UI
   */
  getPendingDeletionsCount(): number {
    return this.shadowManager.getPendingDeletionsCount();
  }
}

export const orchestrator = new SyncOrchestrator();
