# ANCIENT INTEGRITY LOGIC - ORIGINAL GHOST RESURRECTION SYSTEM

**Project**: Vault Pro - Enterprise Offline-First Cash-Book System  
**Purpose**: Document how the system PREVIOUSLY handled records that existed locally but were missing from server  
**Protocol**: PATHOR (Stone Solid) - NO DATA MODIFICATION  
**Date**: 2026-03-11

---

## EXECUTIVE SUMMARY

The Vault Pro system has multiple layers of "Ancient Integrity Logic" for handling records that exist locally but are missing from the server. This document traces the original mechanisms that protected data sovereignty WITHOUT deleting a single byte.

---

## 1. THE "SOVEREIGN LIST" - How the System Knew a Book Was Missing

### Method 1: Server Manifest Comparison (V4.5 Mathematical Mismatch)

**File**: `lib/vault/services/IntegrityService.ts`  
**Lines**: 535-625

```typescript
// Fetch server balance manifest
const response = await fetch(`/api/stats/manifest?userId=${encodeURIComponent(userId)}`, {
  method: 'GET'
});

if (response.ok) {
  const serverManifest = await response.json();
  
  // Get local stats from Zustand
  const { globalStats } = getVaultStore();
  
  // Compare totals
  const incomeDiff = Math.abs(serverManifest.totalIncome - globalStats.totalIncome);
  const expenseDiff = Math.abs(serverManifest.totalExpense - globalStats.totalExpense);
  
  if (incomeDiff > 0 || expenseDiff > 0) {
    // Mathematical mismatch detected!
    // Trigger full hydration to repair
    await this.hydrationService.fullHydration(true);
  }
}
```

**How it works**:
1. System fetches `/api/stats/manifest` which provides server-side totals
2. Compares server totals vs local globalStats
3. If mismatch → triggers `fullHydration(true)` to force-resync from server
4. This is the **"Sovereign List"** - the server's manifest of all data

### Method 2: Pull Service Delta Sync

**File**: `lib/vault/services/PullService.ts`  
**Lines**: 415-670 (pullBatchedBooks)

The system uses **sequence-based delta sync**:
- PullService fetches books with `sequenceAfter` parameter
- Server returns only records with `sequenceNumber > lastSequence`
- If local has records with higher sequence but server doesn't return them → they were deleted on server

**Key Logic**:
```typescript
// Sequence number verification
const validBooks = books.filter((book: any) => 
  lastSequence === 0 ? true : book.sequenceNumber > lastSequence
);

// INVALID BATCH GUARD: Stop if we get valid=0 but books>0 for 3 consecutive batches
if (validBooks.length === 0 && books.length > 0) {
  // Assume caught up - stop pulling
}
```

### Method 3: 404 Response Handling (Push Side)

**File**: `lib/vault/services/PushService.ts`

When pushing a book/entry fails with HTTP 404, the system previously:
1. Detected the parent no longer exists on server
2. Would trigger the `PARENT_DELETED_CHILDREN_EXIST` conflict reason
3. However, this trigger appears NOT actively implemented in current codebase

---

## 2. THE "DIFFERENCE MAPPING" - Local vs Server ID Comparison

### How It Was Done:

The system does NOT directly compare "all local IDs" vs "all server IDs" in a single operation. Instead, it uses **indirect detection**:

1. **Timestamp + vKey Guard** (PullService lines 958-993):
   ```typescript
   // 🎯 PRECISION SYNC: Enhanced conflict detection with vKey guard
   const localVKey = existing.vKey || 0;
   const serverVKey = book.vKey || 0;
   
   // If local vKey > server vKey but server has newer timestamp → CONFLICT
   if (localTime > serverTime) {
     if (localVKey > serverVKey) {
       // Local is genuinely newer - mark for re-push
     }
   }
   ```

2. **Dirty Bit Guard** (PullService lines 940-944):
   ```typescript
   // 🛡️ DIRTY BIT GUARD: Skip if local record has unsynced changes
   if (existing && existing.synced === 0) {
     // Local has changes - don't overwrite
     return { success: true }; // Skip but don't fail
   }
   ```

3. **Hard Delete Check** (PullService lines 1008-1012):
   ```typescript
   // 🗑️ HARD DELETE CHECK
   if (book.isDeleted === 1 && existing) {
     await db.books.delete(existing.localId!);
     console.log(`🗑️ [PULL SERVICE] Book ${book.cid} hard deleted after pull`);
   }
   ```

---

## 3. ORPHAN PROTECTION - Entries Without Parents

### The Original Logic

**File**: `lib/vault/services/IntegrityService.ts`  
**Lines**: 769-828

```typescript
// Check for orphaned entries (entries pointing to deleted books)
const allEntries = LocalEntry[] = await db.entries.where('userId').equals(userId).toArray();

const activeBooks = (await db.books
  .where('userId')
  .equals(userId)
  .and((book: LocalBook) => book.isDeleted === 0)
  .toArray()) as LocalBook[];

const activeBookIds = new Set(
  activeBooks.map(book => String(book._id || (book as any).localId))
);

for (const entry of allEntries) {
  const entryBookId = String((entry as LocalEntry).bookId || '');
  
  if (entry.isDeleted === 0 && !activeBookIds.has(entryBookId)) {
    // FOUND ORPHAN!
    // Mark entry as deleted (SOFT DELETE - NO DATA LOSS)
    await db.entries.update(entry.localId!, {
      isDeleted: 1,      // Soft delete
      synced: 0,        // Mark for re-sync
      updatedAt: getTimestamp(),
      vKey: getTimestamp()
    });
    issuesFound++;
    issuesFixed++;
  }
}
```

**Key Principle**: 
- **SOFT DELETE only** (`isDeleted: 1`)
- **Never hard delete** orphan entries automatically
- Marks `synced: 0` to trigger re-evaluation on next sync

### Orphan Normalization

**File**: `lib/vault/core/VaultUtils.ts`  
**Line**: 648

```typescript
// During normalization, if bookId is missing
normalized.bookId = data.bookId || 'orphaned-data';
```

If an entry has no bookId, it's assigned `'orphaned-data'` as a placeholder rather than being deleted.

---

## 4. RESURRECTBOOKCHAIN - The Original Resurrection Logic

### Function Definition

**File**: `lib/vault/services/ConflictService.ts`  
**Lines**: 42-115

```typescript
async resurrectBookChain(get: any, bookCid: string): Promise<{ success: boolean; error?: Error }> {
  // 1. Find the book
  const book = await db.books.where('cid').equals(bookCid).first();
  
  // 2. Clear server identity (it's been deleted on server)
  const resurrectedBook = {
    ...book,
    _id: undefined,  // Remove server ID - it's now a new local record
    vKey: (book.vKey || 0) + 1,
    synced: 0,       // Mark as unsynced
    conflicted: 0,  // Clear conflict
    conflictReason: '',
    serverData: null,
    updatedAt: getTimestamp()
  };
  
  // 3. Update book via HydrationController
  await controller.ingestLocalMutation('BOOK', [resurrectedBook]);
  
  // 4. Find ALL entries under this book
  const allEntries = await db.entries
    .where('bookId').equals(bookCid)
    .and((entry: LocalEntry) => entry.isDeleted === 0)
    .toArray();
  
  // 5. Reset ALL entries ATOMICALLY
  const entryUpdates = allEntries.map((entry: LocalEntry) => ({
    ...entry,
    synced: 0,           // Mark as unsynced
    vKey: (entry.vKey || 0) + 1,
    updatedAt: getTimestamp()
  }));
  
  await controller.ingestLocalMutation('ENTRY', entryUpdates);
  
  // 6. Trigger batched sync
  const { triggerManualSync } = get();
  await triggerManualSync();
}
```

### Call Chain

**File References**:
1. `bookSlice.ts` line 344: `resurrectBookChain: async (bookCid) => { ... }`
2. `BookService.ts` line 617: `return await conflictService.resurrectBookChain(get, bookCid);`
3. `ConflictService.ts` line 42: The actual implementation

**Trigger Points**:
- **Manual**: User selects "Keep Local & Restore" in ConflictResolverModal
- **Conflict Resolution**: When `conflictType === 'parent_deleted'` and user chooses local version

---

## 5. SHADOW CACHE - The Safety Net

**File**: `lib/vault/services/IntegrityService.ts`  
**Lines**: 903-1068

Before ANY deletion, the system caches the data:

```typescript
async scheduleDeletion(localId: string, type: 'ENTRY' | 'BOOK'): Promise<void> {
  // Cache data before deletion
  const record = await table.get(Number(localId));
  if (record) {
    const clonedRecord = JSON.parse(JSON.stringify(record));
    clonedRecord._shadowCacheTimestamp = getTimestamp();
    clonedRecord._shadowCacheId = `${localId}_${getTimestamp()}`;
    this.shadowCache.set(localId, clonedRecord);
  }
  
  // 10-second buffer before hard delete
  const timeoutId = setTimeout(async () => {
    // Actual deletion logic
  }, 10000);
  
  this.pendingDeletions.set(localId, timeoutId);
}
```

**Safety Features**:
- 10-second buffer window to undo deletion
- Shadow cache stores full record with timestamp
- Can restore via `restoreFromShadowCache()` method

---

## 6. SUMMARY: DATA PROTECTION PRINCIPLES

| Principle | Implementation |
|-----------|----------------|
| **No Hard Deletes** | Orphan entries marked `isDeleted: 1`, never hard deleted |
| **Sovereign Manifest** | `/api/stats/manifest` comparison for server truth |
| **vKey Protection** | Version keys prevent accidental overwrites |
| **Shadow Cache** | 10-second deletion buffer with restore capability |
| **Soft Delete First** | All deletions are soft-delete, trigger re-sync |
| **Chain Resurrection** | `resurrectBookChain()` restores entire book+entries |
| **Timestamp + vKey** | Dual-guard conflict detection mechanism |

---

## 7. CURRENT GAP DISCOVERED

### The Missing Trigger

The system has the **infrastructure** for `parent_deleted` conflicts:
- ✅ `ConflictMapper.mapConflictType('PARENT_DELETED_CHILDREN_EXIST')` 
- ✅ `ConflictService.resurrectBookChain()` implementation
- ✅ `ConflictResolverModal` special UI for parent_deleted
- ❌ **NO active trigger** in PushService for 404 → parent_deleted conversion

### Hypothesis

The original system may have worked as follows:
1. User pushes entry → Server returns 404 (book not found)
2. Server response explicitly indicated "parent deleted with children exist"
3. PushService would set `conflictReason: 'PARENT_DELETED_CHILDREN_EXIST'`
4. ConflictResolverModal shows special UI
5. User chooses "Keep Local & Restore" → `resurrectBookChain()` is called

**But currently**, this trigger path appears inactive.

---

## 8. FILE REFERENCE INDEX

| Purpose | File | Key Lines |
|---------|------|-----------|
| Orphan Detection | `lib/vault/services/IntegrityService.ts` | 769-828 |
| Manifest Comparison | `lib/vault/services/IntegrityService.ts` | 535-625 |
| Chain Resurrection | `lib/vault/services/ConflictService.ts` | 42-115 |
| Orphan Normalization | `lib/vault/core/VaultUtils.ts` | 647-648 |
| Shadow Cache | `lib/vault/services/IntegrityService.ts` | 903-1068 |
| Pull Delta Sync | `lib/vault/services/PullService.ts` | 415-670 |
| vKey Conflict Guard | `lib/vault/services/PullService.ts` | 958-993 |

---

## CONCLUSION

The "Ancient Integrity Logic" of Vault Pro is built on **layered protection**:

1. **Server Manifest** provides the "Sovereign List" of what exists on server
2. **Orphan Detection** protects entries when parents disappear (soft delete)
3. **Shadow Cache** provides 10-second undo buffer
4. **Chain Resurrection** allows full book+entries restoration
5. **vKey + Timestamp** guards prevent accidental overwrites

**No data was ever deleted without a safety net.**

---

*Document Generated: 2026-03-11*  
*Protocol: FORENSIC AUDIT (Read-Only)*  
*Standard: PATHOR (Stone Solid)*
