// src/lib/vault/SyncOrchestrator.ts
import { db } from '@/lib/offlineDB';

class SyncOrchestrator {
  private isSyncing = false;
  private channel = new BroadcastChannel('vault_sync_broadcast');

  constructor() {
    if (typeof window !== 'undefined') {
      // ✅ রেড লাইন ফিক্স: এরো ফাংশন ব্যবহার করে 'this' কে বাইন্ড করা হয়েছে
      window.addEventListener('online', () => this.triggerSync());
      this.channel.onmessage = (e) => e.data.type === 'REFRESH' && window.dispatchEvent(new Event('vault-updated'));
    }
  }

  private notify() {
    this.channel.postMessage({ type: 'REFRESH' });
    window.dispatchEvent(new Event('vault-updated'));
  }

  // ৩. কোর সিঙ্ক ইঞ্জিন (The Master Logic)
  // src/lib/vault/SyncOrchestrator.ts

async triggerSync(userId?: string) {
    // ১. ইউজার আইডি রিকভারি লজিক
    let uid = userId;
    if (!uid && typeof window !== 'undefined') {
        const saved = localStorage.getItem('cashbookUser');
        if (saved) uid = JSON.parse(saved)._id;
    }
    
    // ২. গার্ড ক্লজ: যদি ইউজার আইডি না থাকে বা নেট না থাকে তবে কাজ করবে না
    if (!navigator.onLine || this.isSyncing || !uid) return;

    this.isSyncing = true;
    console.log("📡 Orchestrator: Professional Sync Initiated...");

    try {
        // --- STEP A: Books Sync (The ID Bridge) ---
        const pendingBooks = await db.books.where('synced').equals(0).toArray();
        for (const book of pendingBooks) {
            const res = await fetch('/api/books', {
                method: book._id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: book.name, _id: book._id, userId: uid }),
            });

            if (res.ok) {
                const result = await res.json();
                // 🔥 ফিক্স: আপনার API হয়তো 'book' অথবা 'data' পাঠায়, তাই দুটোই চেক করছি
                const serverId = result.book?._id || result.data?._id;
                
                if (serverId) {
                    // লোকাল এন্ট্রিগুলোর bookId আপডেট (localId -> serverId)
                    await db.entries.where('bookId').equals(String(book.localId)).modify({ bookId: serverId });
                    await db.books.update(book.localId!, { _id: serverId, synced: 1 });
                }
            }
        }

        // --- STEP B: Entries Sync (Dependency Handling) ---
        const pendingEntries = await db.entries.where('synced').equals(0).toArray();
        for (const entry of pendingEntries) {
            
            let finalBookId = entry.bookId;

            // যদি bookId এখনও নাম্বার থাকে, তবে চেক করো ওই বই সিঙ্ক হয়েছে কি না
            if (!isNaN(Number(finalBookId))) {
                const parentBook = await db.books.get(Number(finalBookId));
                if (parentBook?._id) {
                    finalBookId = parentBook._id;
                } else {
                    console.warn("⚠️ Skipping entry sync: Parent book is still offline.");
                    continue; 
                }
            }

            const apiStatus = entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
            
            let res;
           if (entry._id) {
    // 🔥 স্ট্যাটাস আপডেটের জন্য সঠিক পেলোড
    const safeStatus = entry.status || 'completed'; 
// আমরা এখন শুধু .toLowerCase() ব্যবহার করব, .toUpperCase() বাদ
const apiStatus = safeStatus.toLowerCase(); 

// 2. এখন যেখানেই স্ট্যাটাস পাঠান, এই 'apiStatus' ব্যবহার করুন।
// ... বডিতে এই apiStatus পাঠানো হচ্ছে
body: JSON.stringify({ status: apiStatus })
    
    res = await fetch(`/api/entries/status/${entry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatus }) // বডি শুধু { status: "Completed" } পাঠাবে
    });

    if (res?.ok) {
        // সার্ভার সফল হলে লোকাল ডাটা সিঙ্কড মার্ক করা
        await db.entries.update(entry.localId!, { synced: 1 });
    }

            } else {
                const { localId, synced, isDeleted, ...payload } = entry;
                res = await fetch('/api/entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        ...payload, 
                        bookId: finalBookId, 
                        status: apiStatus, 
                        userId: uid, 
                        amount: Number(entry.amount) 
                    })
                });
            }

            if (res?.ok || res?.status === 409) {
                const result = await res.json();
                // 🔥 ফিক্স: এখানেও API ফরম্যাট অনুযায়ী 'entry' অথবা 'data' চেক করা হচ্ছে
                const sId = result.entry?._id || result.data?._id || entry._id;
                await db.entries.update(entry.localId!, { synced: 1, _id: sId, bookId: finalBookId });
            }
        }

        this.notify();
        console.log("✅ Orchestrator: Vault Protocol Synchronized.");
    } catch (err) {
        console.error("❌ Orchestrator Critical Error:", err);
    } finally {
        this.isSyncing = false;
    }
}

  // হাইড্রেশন লজিক (Pull & Merge)
  async hydrate(userId: string) {
    if (!navigator.onLine || !userId) return;
    try {
      const [bRes, eRes] = await Promise.all([
        fetch(`/api/books?userId=${userId}`),
        fetch(`/api/entries/all?userId=${userId}`)
      ]);

      if (bRes.ok) {
        const { books } = await bRes.json();
        for (const sb of (books || [])) {
          const local = await db.books.where('_id').equals(sb._id).first();
          if (!local || sb.updatedAt > (local.updatedAt || 0)) {
            await db.books.put({ ...sb, synced: 1, isDeleted: 0 });
          }
        }
      }
      
      if (eRes.ok) {
        const { entries } = await eRes.json();
        for (const se of (entries || [])) {
          const local = await db.entries.where('cid').equals(se.cid || "").or('_id').equals(se._id).first();
          if (!local || se.updatedAt > (local.updatedAt || 0)) {
            await db.entries.put({ ...se, localId: local?.localId, synced: 1, isDeleted: 0, status: se.status.toLowerCase() });
          }
        }
      }
      this.notify();
      this.triggerSync(userId);
    } catch (err) { }
  }

  async logout() {
    const unsynced = await db.entries.where('synced').equals(0).count();
    if (unsynced > 0 && !confirm(`Purge ${unsynced} unsynced items?`)) return;
    await db.delete();
    localStorage.removeItem('cashbookUser');
    window.location.href = '/';
  }
}

export const orchestrator = new SyncOrchestrator();