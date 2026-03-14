# BACKEND INTEGRITY MAP
## Deep Forensic Audit of the Sync Pipeline Nervous System

---

## 1. TARGETED RETRIEVAL PATH

### Location: `lib/vault/services/PushService.ts`

### Code Block (Lines 749-766):
```typescript
if (changedCid) {
  // 🎯 TARGETED SYNC: Only push the specific CID that changed
  console.log(`🎯 [SYNC TSUNAMI GUARD] Targeted sync for CID: ${changedCid}`);
  
  const targetBook = await db.books.where('cid').equals(changedCid)
    .and((book: any) => book.synced === 0 && book.userId === currentSovereignId)
    .first();
  if (targetBook) {
    unsyncedBooks = [targetBook];
  }
  
  // Also check for entries with this bookId
  const targetEntries = await db.entries.where('bookId').equals(changedCid)
    .and((entry: any) => entry.synced === 0 && entry.userId === currentSovereignId)
    .toArray();
  unsyncedEntries = targetEntries;
  
  console.log(`🎯 [TARGETED SYNC] Found ${unsyncedBooks.length} book and ${unsyncedEntries.length} entries for CID ${changedCid}`);
}
```

### Audit Findings:

| Issue | Status | Evidence |
|-------|--------|----------|
| **bookId query uses changedCid directly** | ⚠️ POTENTIAL BUG | Line 761 queries `db.entries.where('bookId').equals(changedCid)` |
| **String normalization** | ❌ MISSING | No `String()` wrapping around `changedCid` |
| **ID Type Mismatch** | 🔴 RISK | If `entry.bookId` is `localId` (Number) and `changedCid` is CID (String), query will fail |

### The Bug:
When a book is created with CID `abc123`, the vault-updated event carries `changedCid: 'abc123'`. The targeted sync queries:
- Books: `db.books.where('cid').equals('abc123')` ✅ (correct)
- Entries: `db.entries.where('bookId').equals('abc123')` ❌ (may fail)

**If `entry.bookId` is stored as `localId` (e.g., `5`), but we're querying for `'abc123'`, it will NOT match.**

---

## 2. THE CASCADE NERVE

### Location: `lib/vault/services/PushService.ts`

### Code Block (Lines 1599-1613):
```typescript
// 🆕 CASCADE ID UPDATE: Update all entries to reference new server ID

const updatedEntries = await db.entries
  .where('bookId')
  .equals(String(book.localId))
  .modify({ bookId: String(serverId) });

console.log(`✅ [PUSH SERVICE] Book ${book.cid} marked as synced (ID: ${serverId})`);

console.log(`🔗 [CASCADE] Updated ${updatedEntries} entries to reference server ID: ${serverId}`);
```

### Audit Findings:

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Query Method** | ✅ Correct | Uses `.where('bookId').equals(String(book.localId))` |
| **String Normalization** | ✅ Present | Uses `String(book.localId)` and `String(serverId)` |
| **Target** | ✅ Updates all matching entries | `.modify({ bookId: String(serverId) })` |

### The Gap:
After the book is synced and gets a server `_id`, the cascade updates ALL entries from `localId` to the new `serverId`. However, this ONLY runs AFTER a successful book push. If the book push fails, entries are never updated.

---

## 3. vKey LIFECYCLE

### A. Schema Definition
**Location:** `lib/vault/core/schemas.ts` (Line 30)
```typescript
vKey: z.coerce.number(),
```

The schema uses Zod's `coerce.number()` which converts strings to numbers.

---

### B. Normalization (VaultUtils.ts)
**Location:** `lib/vault/core/VaultUtils.ts` (Lines 685-699)
```typescript
// 🎯 SMART vKey LOGIC: Handle server records vs local updates

if (!normalized.vKey) {
    // NEW record without vKey - start at 1
    normalized.vKey = 1;
} else if (data.vKey && data.vKey !== normalized.vKey) {
    // SERVER vKey different from normalized - respect server version
    normalized.vKey = data.vKey;
}
// If vKey exists, preserve it - no drift issues
```

**Rescue Logic** (Line 662):
```typescript
if (completeness.missingFields.includes('vKey')) normalized.vKey = 1;
```

---

### C. Assignment in FinanceService
**Location:** `lib/vault/services/FinanceService.ts` (Line 270)
```typescript
vKey: finalVKey,  // ✅ SAFE vKey IMPLEMENTED
```

**vKey Calculation** (Line 235):
```typescript
let currentVKey = entryData.vKey || editTarget?.vKey || 0;
```

---

### D. Push Payload Construction
**Location:** `lib/vault/services/PushService.ts` (Line 1477)
```typescript
vKey: Number(book.vKey) || 1,
```

---

### E. Why vKey Might Appear as undefined

| Scenario | Location | Issue |
|----------|----------|-------|
| New record created | FinanceService.ts:270 | vKey set to `1` by default |
| Record pulled from server | PullService.ts | vKey set from server response |
| Schema coercion | schemas.ts:30 | `z.coerce.number()` should handle strings |

**Potential Loss Point:**
If a record exists in Dexie without a `vKey` field AND has NOT gone through `normalizeRecord()`, the field may be missing. The logs showing `undefined` likely indicate:
1. The record was created before vKey logic was added
2. The record came from a server response that didn't include vKey
3. The record was manually inserted without vKey

---

## 4. TRIPLE-LINK IMPLEMENTATION

### Example 1: PushService (Parent Book Lookup)
**Location:** `lib/vault/services/PushService.ts` (Lines 1181-1189)
```typescript
const isNumeric = !isNaN(Number(bookId));
let parentBook: any;

if (isNumeric) {
  parentBook = await db.books.where('localId').equals(Number(bookId)).first();
} else {
  parentBook = await db.books.where('_id').equals(bookId).first();
}
// Fallback to cid
if (!parentBook) {
  parentBook = await db.books.where('cid').equals(bookId).first();
}
```

---

### Example 2: HydrationEngine (Record Lookup)
**Location:** `lib/vault/hydration/engine/HydrationEngine.ts` (Lines 253-276)
```typescript
// For books:
existingRecord = await db.books.where('localId').equals(Number(bookId)).first();
existingRecord = await db.books.where('_id').equals(String(bookId)).first();
existingRecord = await db.books.where('cid').equals(record.cid).first();

// For entries:
existingRecord = await db.entries.where('localId').equals(Number(entryId)).first();
existingRecord = await db.entries.where('_id').equals(String(entryId)).first();
existingRecord = await db.entries.where('cid').equals(record.cid).first();
```

---

### Example 3: BookService (Target Book Lookup)
**Location:** `lib/vault/services/BookService.ts` (Lines 640-642)
```typescript
const query = (isLocalId || !bookId.includes('-'))
  ? db.books.where('localId').equals(Number(bookId))
  : db.books.where('_id').equals(bookId);
const dexieBook = await query.or('cid').equals(bookId).first();
```

---

### Triple-Link Pattern Summary:
| ID Type | Format | Lookup Method |
|---------|--------|---------------|
| `localId` | Number (e.g., `5`) | `.where('localId').equals(Number(id))` |
| `_id` | String/UUID (e.g., `'abc-123'`) | `.where('_id').equals(String(id))` |
| `cid` | String (e.g., `'cid_abc123'`) | `.where('cid').equals(id)` |

---

## 5. EVENT DATA INTEGRITY

### A. Dispatch (HydrationController)

**Location:** `lib/vault/hydration/HydrationController.ts`

**ingestLocalMutation** (Lines 733-740):
```typescript
getPlatform().events.dispatch('vault-updated', {
  source: 'HydrationController',
  origin: 'local-mutation',
  entityType: type === 'BOOK' ? 'book' : 'entry',
  changedCid: changedCid,
  operation: 'update',
  timestamp: Date.now()
});
```

**ingestBatchMutation** (Lines 868-875):
```typescript
getPlatform().events.dispatch('vault-updated', {
  source: 'HydrationController',
  origin: 'batch-mutation',
  entityType: batchTypes as any,
  changedCid: changedCid,
  operation: 'update',
  timestamp: Date.now()
});
```

---

### B. Subscription (SyncOrchestrator)

**Location:** `lib/vault/core/SyncOrchestrator.ts` (Lines 102-109)
```typescript
const cleanup = this.platform.events.listen('vault-updated', (detail: VaultUpdatedDetail) => {
  const source = detail.source || 'unknown';
  const origin = (detail as any).origin || 'unknown';
  const changedCid = (detail as any).changedCid || null;

  // 🛡️ IGNORE BACKGROUND SYNC: Only trigger for local user actions
  if ((origin === 'local-mutation' || origin === 'batch-mutation' || !origin || origin === 'unknown') && source === 'HydrationController') {
    console.log('🔄 [ORCHESTRATOR] Condition Met → Awakening Sync Engine...');
```

---

### C. Interface Definition

**Location:** `lib/platform/SovereignPlatform.ts` (Lines 51-55)
```typescript
export interface VaultUpdatedDetail extends PlatformEventDetail {
  entityType: 'book' | 'entry' | 'user' | 'settings';
  entityId?: string;
  operation: 'create' | 'update' | 'delete';
  origin?: 'local-mutation' | 'batch-mutation';
  changedCid?: string | null;
}
```

---

### Audit Findings - Field Consistency:

| Field | Dispatched | Listened | Consistent |
|-------|------------|----------|------------|
| `source` | ✅ 'HydrationController' | ✅ `detail.source` | ✅ YES |
| `origin` | ✅ 'local-mutation' / 'batch-mutation' | ✅ `(detail as any).origin` | ✅ YES |
| `entityType` | ✅ 'book' / 'entry' / 'batchTypes' | ⚠️ Not used in filter | N/A |
| `changedCid` | ✅ Set from records[0].cid | ✅ `(detail as any).changedCid` | ✅ YES |
| `operation` | ✅ 'update' | ⚠️ Not used in filter | N/A |
| `timestamp` | ✅ Date.now() | ⚠️ Not used | N/A |

---

## 6. IDENTIFIED GAPS

### Gap 1: Targeted Entry Query Uses Wrong ID Type
**File:** `PushService.ts:761`
```typescript
const targetEntries = await db.entries.where('bookId').equals(changedCid)
```
**Issue:** Should query by `cid` not `bookId` since `changedCid` is the book's CID.

**Fix Suggestion:**
```typescript
// Query entries by their book's cid (need to look up entries whose book has this cid)
const targetEntries = await db.entries
  .filter((entry: any) => {
    // Find parent book's cid
    return entry.bookId === changedCid || entry.bookId === 'cid:' + changedCid;
  })
  .toArray();
```

---

### Gap 2: entityType Not Validated
The dispatch sends `entityType: 'batchTypes'` (e.g., `'book+entry'`) but the interface only allows `'book' | 'entry' | 'user' | 'settings'`. The code uses `as any` to bypass this.

---

### Gap 3: vKey Default Value Chain
If records exist without vKey and haven't been normalized, pushing them may result in `undefined` being sent. The `Number(book.vKey) || 1` fallback in PushService handles this, but logs may still show `undefined` before the fallback.

---

## 7. NERVOUS SYSTEM MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER ACTION                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FINANCESERVICE                                         │
│  • Creates/Updates Entry/Book                                              │
│  • Calculates vKey (FinanceService.ts:235)                                │
│  • Calls ingestBatchMutation()                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HYDRATIONCONTROLLER                                     │
│  • ingestLocalMutation() / ingestBatchMutation()                           │
│  • Dispatches vault-updated with:                                          │
│    - source: 'HydrationController'                                         │
│    - origin: 'local-mutation' / 'batch-mutation'                           │
│    - entityType: 'book' / 'entry'                                          │
│    - changedCid: <cid>                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SYNCORCHESTRATOR                                       │
│  • Listens to 'vault-updated'                                              │
│  • Validates: origin check + source check                                   │
│  • Triggers pushPendingData(changedCid)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PUSHSERVICE                                          │
│                                                                             │
│  ┌─ Targeted Sync (if changedCid provided) ─────────────────────────────┐ │
│  │  • Query: db.books.where('cid').equals(changedCid)                  │ │
│  │  • Query: db.entries.where('bookId').equals(changedCid) ⚠️ BUG     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─ General Sync (no changedCid) ──────────────────────────────────────┐ │
│  │  • Query: db.books.where('synced').equals(0)                        │ │
│  │  • Filter: lastModified > 5 minutes ago                            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─ Parent Book Check (for entries) ───────────────────────────────────┐ │
│  │  • Lookup parent by localId / _id / cid (Triple-Link)              │ │
│  │  • NEW: Allow push if parent exists in Dexie                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─ Push to Server ────────────────────────────────────────────────────┐ │
│  │  • POST /api/books or /api/entries                                 │ │
│  │  • Payload includes: cid, userId, vKey, updatedAt                 │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                    │                                       │
│  ┌─ Cascade Update (after successful book push) ──────────────────────┐ │
│  │  • Update entry.bookId from localId to server _id                  │ │
│  │  • db.entries.where('bookId').equals(String(localId))            │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVER                                              │
│  • Receives POST request                                                   │
│  • Validates vKey (version conflict detection)                             │
│  • Creates/Updates record                                                  │
│  • Returns server _id                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SUMMARY OF FINDINGS

| # | Component | Issue | Severity | Line |
|---|-----------|-------|----------|------|
| 1 | PushService | Entry query uses `bookId` instead of `cid` for targeted sync | 🔴 HIGH | 761 |
| 2 | PushService | No String() normalization on changedCid in entry query | 🔴 HIGH | 761 |
| 3 | SovereignPlatform | entityType allows `'batchTypes'` but interface doesn't | 🟡 MEDIUM | 52 |
| 4 | FinanceService | vKey may be undefined before fallback | 🟡 MEDIUM | 235 |

---

*Audit completed: March 15, 2026*
*Protocol: DEEP BACKEND INTEGRITY MAPPING*
