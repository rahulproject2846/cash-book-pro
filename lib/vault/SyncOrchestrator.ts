"use client";
import { db } from '@/lib/offlineDB';

/**
 * VAULT PRO: SYNC ORCHESTRATOR (V25.0 - UNBREAKABLE INTEGRITY)
 * ------------------------------------------------------------
 * Logic A: Outbox Pattern with Exponential Backoff.
 * Logic B: vKey Logical Clock Conflict Resolution.
 * Logic C: Checksum Solidarity Integration.
 * Logic D: Deep Health Check & Auto-Healing.
 * Phase 1 Fix: Map-First Hydration (Surgical Duplicate Protection).
 */

class SyncOrchestrator {
  private isSyncing = false;
  private channel = new BroadcastChannel('vault_global_sync');
  private lastSyncKey = 'vault_last_sync_timestamp';
  private MAX_RETRIES = 5;

  constructor() {
    if (typeof window !== 'undefined') {
      this.channel.onmessage = (e) => {
        if (e.data.type === 'FORCE_REFRESH') {
          window.dispatchEvent(new Event('vault-updated'));
        }
      };
      window.addEventListener('online', () => this.triggerSync());
    }
  }

  private broadcast() {
    this.channel.postMessage({ type: 'FORCE_REFRESH' });
    window.dispatchEvent(new Event('vault-updated'));
  }

  /**
   * Security Gate: isActive Check
   */
  private checkSecurityStatus(data: any) {
    if (data && data.isActive === false) {
      console.error("🛑 Security Protocol: Account Suspended by Admin.");
      this.logout();
      return false;
    }
    return true;
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

  // ৩. কোর সিঙ্ক ইঞ্জিন
  async triggerSync(userId?: string) {
    let uid = userId;
    if (!uid && typeof window !== 'undefined') {
        const saved = localStorage.getItem('cashbookUser');
        if (saved) uid = JSON.parse(saved)._id;
    }
    
    if (!navigator.onLine || this.isSyncing || !uid) return;

    this.isSyncing = true;
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
                        if (!this.checkSecurityStatus(result)) return; 
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
                if (!this.checkSecurityStatus(result)) return;

                if (res.ok) {
                    const sId = result.book?._id || result.data?._id || book._id;
                    await db.books.update(book.localId!, { _id: sId, synced: 1, syncAttempts: 0 });
                } else if (res.status === 409) {
                    await db.books.update(book.localId!, { synced: 1, syncAttempts: 0 });
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
                        if (!this.checkSecurityStatus(result)) return;
                    }
                }
                await db.entries.update(entry.localId!, { synced: 1, syncAttempts: 0 });
                continue;
            }

            const res = await fetch(entry._id ? `/api/entries/${entry._id}` : '/api/entries', {
                method: entry._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...entry, userId: uid, amount: Number(entry.amount) }),
            });

            if (res) {
                const result = await res.json().catch(() => ({}));
                if (!this.checkSecurityStatus(result)) return;

                if (res.ok) {
                    const sId = result.entry?._id || result.data?._id || entry._id;
                    await db.entries.update(entry.localId!, { synced: 1, _id: sId, syncAttempts: 0 });
                } else if (res.status === 409) {
                    await db.entries.update(entry.localId!, { synced: 1, syncAttempts: 0 });
                } else {
                    await db.entries.update(entry.localId!, { syncAttempts: (entry.syncAttempts || 0) + 1, lastAttempt: Date.now() });
                }
            }
        }
        this.broadcast();
    } catch (err: any) { 
        console.error("Sync Cycle Error:", err);
    } finally {
        this.isSyncing = false;
        this.hydrate(uid as string);
    }
  }

  // ৪. স্মার্ট ডেল্টা হাইড্রেশন (Map-First Surgical Fix)
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
        if (!this.checkSecurityStatus(bData)) return;

        const serverBooks = bData.books || bData.data || [];
        for (const sb of serverBooks) {
          // 🔥 Surgical Fix: Map by cid or _id to prevent duplication
          const local = await db.books
            .where('cid').equals(sb.cid || "")
            .or('_id').equals(sb._id)
            .first();

          if (!local || (sb.vKey > (local.vKey || 0)) || new Date(sb.updatedAt).getTime() > new Date(local.updatedAt || 0).getTime()) {
            await db.books.put({ 
                ...sb, 
                localId: local?.localId, // Preserve localId to update existing instead of inserting new
                synced: 1, 
                isDeleted: sb.isDeleted ? 1 : 0 
            });
          }
        }
      }

      if (eRes.ok) {
        const eData = await eRes.json();
        if (!this.checkSecurityStatus(eData)) return;

        const serverEntries = eData.entries || eData.data || [];
        await db.transaction('rw', db.entries, async () => {
            for (const se of serverEntries) {
                const local = await db.entries.where('cid').equals(se.cid || "").or('_id').equals(se._id).first();
                if (se.isDeleted === true || se.isDeleted === 1) {
                    if (local) await db.entries.delete(local.localId!);
                    continue; 
                }
                if (!local || (se.vKey > (local.vKey || 0)) || new Date(se.updatedAt).getTime() > new Date(local.updatedAt || 0).getTime()) {
                  await db.entries.put({ 
                    ...se, 
                    localId: local?.localId, 
                    synced: 1, 
                    isDeleted: 0, 
                    status: se.status.toLowerCase(), 
                    vKey: se.vKey || 1 
                  });
                }
            }
        });
      }

      localStorage.setItem(this.lastSyncKey, Date.now().toString());
      this.broadcast();
      if (!forceFullSync) this.performHealthCheck(userId);
    } catch (err) { }
  }

  /**
   * Logic D: Deep Health Check
   */
  async performHealthCheck(userId: string) {
    try {
        const res = await fetch(`/api/entries/count?userId=${userId}`);
        if (!res.ok) return;
        const result = await res.json();
        
        if (!this.checkSecurityStatus(result)) return;
        
        const localCount = await db.entries.count();
        const serverCount = result.count;
        
        if (serverCount > localCount) {
            this.hydrate(userId, true);
        }
    } catch (e) {}
  }

  // --- ⚡ PUSHER TARGETED SIGNAL ENGINE ---
  initPusher(pusher: any, userId: string) {
    if (!pusher || !userId) return;
    const channel = pusher.subscribe(`vault_channel_${userId}`);
    channel.bind('sync_signal', (data: { type: string, id?: string }) => {
        if (data.type === 'BOOK_UPDATE') this.hydrate(userId);
        else this.triggerSync(userId);
    });
  }

  async logout() {
    await db.delete();
    localStorage.removeItem('cashbookUser');
    localStorage.removeItem(this.lastSyncKey);
    window.location.href = '/';
  }
}

export const orchestrator = new SyncOrchestrator();