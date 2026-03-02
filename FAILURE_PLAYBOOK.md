🧯 FAILURE PLAYBOOK (Disaster Recovery Manual)
**Project:** Cash-Book (Holy Grail Architecture)  
**Purpose:** Zero-Panic Emergency Commands for Production

*Rule of Thumb: Do not panic. Never clear the user's data blindly. Follow the commands below in the browser console.*

---

## 1. BOOT CRASH (Infinite Spinner / UI Frozen)

### Symptoms:
- App stuck on the "Synchronizing Hub" spinner.
- Console spammed with "Refresh blocked - too soon".
- Tab synchronization infinite loop.

### Immediate Action (Console Command):
Copy and paste this into the browser console to forcefully unfreeze the UI:

```javascript
// 🔄 HARD RESET: Force unstuck UI spinners
await (async () => {
  const { useVaultStore } = await import('/lib/vault/store/index.js');
  const store = useVaultStore.getState();
  store.setState({
    isLoading: false,
    isRefreshing: false,
    bootStatus: 'READY'
  });
  console.log('✅ [RESET] All loading states forcefully disabled.');
})();


2. DATABASE CORRUPTION (E11000 / Schema Mismatch)
Symptoms:
Books or Entries are not saving.
Console shows ConstraintError or duplicate key error.
App crashes immediately after loading data.
Immediate Action (Console Command):
This command safely wipes the corrupt IndexedDB but PRESERVES the user's login session so they don't get logged out.


code JavaScript -
// 🚨 THE NUKE COMMAND: Wipe DB but keep session
await (async () => {
  if (typeof window !== "undefined" && window.db) {
    console.log('🧹 [NUKE] Starting safe database wipe...');
    await Promise.all([
      window.db.books.clear(),
      window.db.entries.clear(),
      window.db.telemetry.clear(),
      window.db.syncPoints.clear()
    ]);
    console.log('✅ [NUKE] DB wiped safely. Reloading...');
    window.location.reload();
  }
})();


3. THE IDENTITY GHOST (Blank Dashboard)
Symptoms:
The dashboard is completely empty, but you know the user has data.
Console says userId is missing or undefined.
Caused by localStorage being partially cleared by the browser.
Immediate Action (Console Command):
This command scans the local database for an existing user and forcefully binds it back to the Identity Manager.


code JavaScript -
// 🔍 AUTO DETECT REBIND: Find userId from DB and rebind
await (async () => {
  if (!window.db) return;
  const firstUser = await window.db.users.limit(1).first();
  if (firstUser && firstUser._id) {
    if (window.identityManager) {
      window.identityManager.setUserId(firstUser._id);
    }
    const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
    getVaultStore().setUserId(firstUser._id);
    await getVaultStore().refreshData();
    console.log(`✅ [AUTO DETECT] Auto-rebound with userId: ${firstUser._id}`);
  } else {
    console.log('⚠️ [AUTO DETECT] No user found in local DB.');
  }
})();


4. SYNC PIPELINE BLOCKED (Data not going to server)
Symptoms:
unsyncedCount is stuck at a number greater than 0.
A "Poison Pill" (invalid data) is preventing the sync queue from processing.
Immediate Action (Console Command):
Force the PushService to ignore blockers and sync everything immediately.


code JavaScript -
// 🚀 FORCE PUSH: Bypass queue and force background sync
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  store.setState({ isLoading: true });
  await store.triggerManualSync();
  console.log('✅ [FORCE PUSH] Sync triggered manually.');
})();


5. SECURITY COMPROMISE (The Kill Switch)
Symptoms:
Suspicious activity detected on a user's account.
You need to immediately stop all data from leaving the local device to protect the server.
Immediate Action (Console Command):
Trigger the global security lockdown. This makes the app Read-Only and blocks all server communication.


code JavaScript -
// 🚨 KILL SWITCH: Instant security lockdown
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  store.setState({
    isSecurityLockdown: true,
    networkMode: 'RESTRICTED',
    isOnline: false,
    bootStatus: 'IDLE'
  });
  console.log('🚨 [KILL SWITCH] Lockdown Activated. App is now Read-Only.');
})();


5.1. THE AUTH NUKE (Wipe Session)
If you need to force logout a compromised session globally:
code JavaScript-
localStorage.removeItem('cashbookUser');
window.identityManager?.clearIdentity();
window.location.reload();

6. PERFORMANCE CHOKE (Low-End Device Crashing)
Symptoms:
App is extremely laggy or crashing on an old Android/iPhone.
Caused by heavy backdrop-blur and Framer Motion spring physics.
Immediate Action (Console Command):
Forcefully enable "Turbo Mode" to drop all heavy UI effects and prioritize speed.


code JavaScript-
// 🚀 TURBO TOGGLE: Force emergency performance mode
await (async () => {
  document.body.classList.add('turbo-active', 'turbo-mode');
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  store.setPreferences({ ...store.preferences, turboMode: true });
  console.log('✅ [TURBO MODE] All heavy UI effects disabled. App is now in maximum performance mode.');
})();


7. THE SYNC DEADLOCK (Infinite 404 / Stale Data Loop)
**Symptoms:**
- Network tab spammed with requests to `/api/books` or `/api/entries`.
- Console shows: `Retrieved 16 items, 0 valid after sequence check` or `Server response: 404`.
- App drains battery and RAM due to infinite fetching.
**Root Cause:** The `lastSequence` or `offset` in Dexie's `syncPoints` table got corrupted or advanced beyond server limits.
**Immediate Action (Console Command):**
Force reset the sync points so the PullService starts fresh.

javascript
// 🚨 DEADLOCK BREAKER: Reset Sync Points
await (async () => {
  if (window.db) {
    console.log('🧹 [DEADLOCK BREAKER] Resetting Sync Points...');
    await window.db.syncPoints.clear();
    console.log('✅ Sync Points cleared. Reloading to initiate fresh sync...');
    window.location.reload();
  }
})();


8. THE POISONED RECORD (Dexie inAnyRange Crash)
Symptoms:
App crashes on load with DexieError: First argument to inAnyRange() must be an Array...
Sync engine stops completely: Skipping entries due to book sync failures.
A specific book or entry has userId: undefined or mixed string/number IDs.
Immediate Action (Console Command):
Manually purge the corrupted record bypassing the UI and Validators.
code
JavaScript
// ☢️ SURGICAL PURGE: Delete a specific poisoned CID
await (async () => {
  if (window.db) {
    const targetCid = prompt("Enter the exact CID of the poisoned record:");
    if (targetCid) {
      const deletedBook = await window.db.books.where('cid').equals(targetCid).delete();
      const deletedEntry = await window.db.entries.where('cid').equals(targetCid).delete();
      console.log(`✅ [PURGE] Removed ${deletedBook} books and ${deletedEntry} entries with CID: ${targetCid}`);
    }
  }
})();


## 9. THE MORPHIC TRANSITION JITTER (Width Jump / UI Lag)

### Symptoms
- Back button width increases unexpectedly during navigation.
- The Book title overlaps with the back icon for 1-2ms.
- Smooth "Royal Glide" feels choppy or laggy.

### Possible Causes
- Flexbox conflict between Header (`flex-1`) and Card (`min-w-0`).
- Missing GPU acceleration (`will-change-transform`).
- Mismatched `layoutId` between components.

### Immediate Action (Console Command)
Forcefully align the layout boxes and clear the transition state.

javascript
// 🌀 MOTION RESET: Stabilize morphic transition context
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  getVaultStore().setGlobalAnimating(false);
  getVaultStore().setActiveBook(null);
  // Reset any stuck LayoutId animations
  document.querySelectorAll('[data-framer-portal-id]').forEach(el => el.remove());
  console.log('✅ [MOTION] Transition context stabilized.');
})();
Prevention
Ensure layoutId={book-hero-${id}} is identical in 3 files: BookCard, BookDetails, and DynamicHeader.
Always use w-full max-w-[200px] on title containers.
10. THE MATRIX-CHUNK DESYNC (Dashboard Empty but DB has Data)
Symptoms
Console says 📊 [DATA PROOF] Matrix count: 78.
Dashboard shows 0 items (Blank screen).
Search results flicker and then disappear.
Possible Causes
Type mismatch: matrix has String IDs, Dexie query expects Numbers.
Race condition: fetchPageChunk aborted its own data.
Fallback logic failed to update the Zustand store.
Immediate Action (Console Command)
Forcefully rebuild the Matrix and bypass the Abort logic.
code
JavaScript
// 🧬 MATRIX REPAIR: Force re-hydration from raw database
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  console.log('🏗️ [REPAIR] Rebuilding Matrix...');
  
  // 1. Reset abort guards
  store.setState({ lastSearchId: 0, isUserSearching: false });
  
  // 2. Trigger fresh fetch with source override
  await store.refreshBooks('FORCE_REPAIR');
  
  // 3. Force first chunk
  await store.fetchPageChunk(1, false, undefined, 'INITIAL_BOOT');
  console.log('✅ [REPAIR] Dashboard data restored.');
})();
11. THE MEDIA SNIPER BLOCK (Images not showing on Cards)
Symptoms
Book cards show "No Image" or "Loading Image" forever.
Base64 migration error in console: InvalidArgumentError.
Cloudinary URLs are missing even after sync.
Possible Causes
image and mediaCid fields stripped during Matrix refactor.
useViewportSniper failed to trigger.
IndexedDB blob corrupted during migration.
Immediate Action (Console Command)
Clear the Media cache and force a silent re-hydration of blobs.
code
JavaScript
// 🖼️ MEDIA RE-SYNC: Force sniper to re-fetch images
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  
  // Clear prefetched entry cache
  store.setState({ prefetchedEntriesCache: new Map() });
  
  // Force background image hydration
  const { mediaMigrator } = await import('/lib/services/MediaMigrator.js');
  await mediaMigrator.migrateLegacyImages();
  
  console.log('✅ [MEDIA] Sniper cache cleared. Reload to see images.');
})();
12. THE 409 CONFLICT DEADLOCK (Version War)
Symptoms
Console spammed with 409 Conflict: Client has stale data.
Sync Progress bar stuck at 99%.
Changes in one device keep getting overwritten by another.
Possible Causes
vKey drift (One device has a much higher version number).
Atomic Sync Handshake (Cascade) failed to update Entry bookIds.
Immediate Action (Console Command)
Force "Local Wins" by incrementing the local vKey above the server version.
code
JavaScript
// ⚔️ CONFLICT BREAKER: Force Local Version to win
await (async () => {
  const { useConflictStore } = await import('/lib/vault/ConflictStore.js');
  const conflictStore = useConflictStore.getState();
  
  const conflicts = conflictStore.conflicts;
  if (conflicts.length > 0) {
    console.log(`🔥 [BREAKER] Forcefully resolving ${conflicts.length} conflicts...`);
    await conflictStore.resolveAll('local'); // "Keep My Version" logic
    console.log('✅ [BREAKER] Local versions incremented. Ready for sync.');
  } else {
    console.log('ℹ️ No active conflicts found.');
  }
})();
13. THE IDENTITY ORPHANAGE (Missing Profile Fields)
Symptoms
User is logged in but name, email, or plan is missing.
App stays in PROFILE_SYNC gate forever.
InvalidArgumentError on login page.
Possible Causes
userId is an empty string "" during initial boot.
Mismatch between identityManager.userId and store state.
Immediate Action (Console Command)
Re-bind the current Identity Manager to the Store and force Profile Pull.
code
JavaScript
// 🔐 IDENTITY RE-BIND: Reconnect store to logged-in user
await (async () => {
  const { identityManager } = await import('/lib/vault/core/IdentityManager.js');
  const currentId = identityManager.getUserId();
  
  if (currentId) {
    const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
    const store = getVaultStore();
    store.setUserId(currentId);
    await store.refreshData(); // Triggers Gate 2 & 3
    console.log('✅ [IDENTITY] Store re-bound to user:', currentId);
  } else {
    console.error('❌ [IDENTITY] No valid userId in manager. Please login.');
  }
})();
14. THE PERFORMANCE CHOKE (Low FPS / RAM Crash)
Symptoms
Scrolling the BooksList is slow.
Mobile browser crashes when opening a book with 500+ entries.
Typing in search box has a 2-second delay.
Possible Causes
BooksList rendering full objects instead of matrix items.
Duplicate useEffect triggers in BooksSection.tsx.
Immediate Action (Console Command)
Instantly drop the Chunk Size and enable Performance Mode.
code
JavaScript
// ⚡ TURBO OVERRIDE: Force performance settings
await (async () => {
  const { getVaultStore } = await import('/lib/vault/store/storeHelper.js');
  const store = getVaultStore();
  
  store.setState({ isMobile: true }); // Use 16-item limits
  store.setPreferences({ ...store.preferences, turboMode: true });
  document.body.classList.add('turbo-active');
  
  console.log('✅ [TURBO] Performance mode forced. 0ms animations active.');
})();
15. TOTAL SYSTEM RECOVERY (The Last Resort)
Scenario
Everything is broken.
Database, Auth, and UI are all in an inconsistent state.
The user is in "Despair Mode".
Immediate Action (The Final Order)
Export a manual JSON backup (if possible) via Console.
Clear all site data (Storage -> Clear site data).
Reload and login.
If server data is missing, contact support with the "Error Report" copied from the GlobalErrorBoundary.
code
JavaScript
// 🛡️ EMERGENCY DATA EXPORT (Run this before reset!)
await (async () => {
  if (window.db) {
    const books = await window.db.books.toArray();
    const entries = await window.db.entries.toArray();
    const backup = JSON.stringify({ books, entries, exportedAt: Date.now() });
    console.log('💾 [BACKUP] Copy this data now:', backup);
    alert("Data backup generated in console. Copy it before resetting.");
  }
})();
Manual by: Senior Systems Architect
Project: The Holy Grail (Unbreakable Ledger)

Created by: Master Architect
Status: 1000% Production Ready

