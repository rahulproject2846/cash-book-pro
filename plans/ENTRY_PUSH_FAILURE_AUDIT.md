# ENTRY PUSH FAILURE - FORENSIC AUDIT REPORT

## Date: March 15, 2026

---

## EXECUTIVE SUMMARY

**Root Cause Identified:** The `changedCid` in the vault-updated event is being set to the **ENTRY's CID** instead of the **BOOK's CID**, causing the targeted sync to search for non-existent records.

---

## LOG EVIDENCE ANALYSIS

### Observed Behavior:
```
🎯 [TARGETED SYNC] Found 0 book and 0 entries for CID cid_1773522213200_uo301gn13_a9aeb2ff-a9f0-4c62-aa64-eb6cd2fdc850
📡 [PUSH] Found pending items: 0
```

### CID Analysis:
| Item | CID | Source |
|------|-----|--------|
| **Entry CID** | `cid_1773522213200_uo301gn13_a9aeb2ff-a9f0-4c62-aa64-eb6cd2fdc850` | Used as changedCid ❌ |
| **Book CID** | `cid_1773520877227_au4owxol8_69b0444f-e6a9-4d87-9db6-a5f3013a5595` | Should have been used ✅ |

### What Happened:
1. User saved an Entry linked to an existing Book
2. HydrationController dispatched `vault-updated` with `changedCid = entry's CID`
3. PushService queried for book with entry's CID → 0 results
4. PushService queried for entries with entry's CID → 0 results (wrong parent)
5. **Entry was saved locally but NEVER pushed to server**

---

## ROOT CAUSE CHAIN

### Step 1: FinanceService Constructs Operations
**File:** `lib/vault/services/FinanceService.ts` (Lines 299-306)

```typescript
const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [
  { type: 'ENTRY' as const, records: [normalized] }  // ← FIRST: ENTRY
];

// Add Book signal if available
if (bookSignalPayload) {
  atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });  // ← SECOND: BOOK
}
```

**Issue:** Operations array order is `[ENTRY, BOOK]`

---

### Step 2: HydrationController Extracts changedCid
**File:** `lib/vault/hydration/HydrationController.ts` (Line 866)

```typescript
const changedCid = operations[0]?.records[0]?.cid || null;
```

**Issue:** Takes FIRST record's CID, which is the **ENTRY's CID**, not the BOOK's CID

---

### Step 3: PushService Targeted Sync Fails
**File:** `lib/vault/services/PushService.ts` (Lines 760-786)

```typescript
const targetBook = await db.books.where('cid').equals(changedCid)  // ← Looking for book with entry's CID
```

**Result:** 0 books found → No targeted sync for books

```typescript
const targetEntries = allUnsyncedEntries.filter((entry: any) => {
  // Looking for entries linked to wrong CID
  if (String(entryBookId) === String(changedCid)) return true;
  // ... other conditions also fail
});
```

**Result:** 0 entries found → No targeted sync for entries

---

## ADDITIONAL ISSUES FOUND

### Issue 2: vKey Still Shows as undefined
**Log Evidence:**
```
🔒 [ATOMIC GUARD] vKey verified: undefined
```

**Location:** `PushService.ts:1561` still logs undefined because:
- Server response doesn't echo back `clientVKey`
- Line 1536 check: `if (clientVKey !== undefined && clientVKey !== book.vKey)`

**Impact:** Minor - vKey is still being sent (with fallback), but the verification log is confusing.

---

### Issue 3: Fallback Sync Also Fails for Entries
**Log Evidence:**
```
📡 [PUSH] Found pending items: 0
```

The fallback sync (`PushService.ts:779-784`) only filters by:
- `synced === 0`
- `userId === currentSovereignId`

But the entry might have been marked as `synced: 1` during the batch process OR the entry was created but the sync never ran properly.

---

## COMPLETE ISSUE MAP

| # | Issue | Location | Severity | Impact |
|---|-------|----------|----------|--------|
| 1 | **changedCid uses wrong CID** | `HydrationController.ts:866` | 🔴 CRITICAL | Entry never pushed |
| 2 | **Operations order is wrong** | `FinanceService.ts:299-306` | 🔴 CRITICAL | ENTRY comes before BOOK |
| 3 | **vKey verification shows undefined** | `PushService.ts:1561` | 🟡 LOW | Confusing logs, not blocking |
| 4 | **No retry mechanism for failed targeted sync** | `PushService.ts` | 🟡 MEDIUM | Silent failure |

---

## RECOMMENDED FIXES

### Fix 1: Prioritize BOOK in changedCid Extraction
**File:** `HydrationController.ts`

```typescript
// OLD (Line 866):
const changedCid = operations[0]?.records[0]?.cid || null;

// NEW:
const changedCid = operations
  .find(op => op.type === 'BOOK')
  ?.records[0]?.cid 
  || operations[0]?.records[0]?.cid 
  || null;
```

### Fix 2: Ensure BOOK is First in Operations
**File:** `FinanceService.ts`

```typescript
// OLD (Lines 299-306):
const atomicOperations = [
  { type: 'ENTRY', records: [normalized] }  // ENTRY first
];
if (bookSignalPayload) {
  atomicOperations.push({ type: 'BOOK', records: [bookSignalPayload] });
}

// NEW:
const atomicOperations: Array<{ type: 'ENTRY' | 'BOOK'; records: any[] }> = [];

// Add Book signal FIRST if available
if (bookSignalPayload) {
  atomicOperations.push({ type: 'BOOK' as const, records: [bookSignalPayload] });
}

// Add Entry second
atomicOperations.push({ type: 'ENTRY' as const, records: [normalized] });
```

---

## VERIFICATION CHECKLIST

After fixes, creating a new Entry should show:
- [ ] `🎯 [TARGETED SYNC] Found 1 book and 1 entries for CID <book_cid>`
- [ ] POST `/api/books` succeeds (200)
- [ ] POST `/api/entries` succeeds (200)
- [ ] `🔗 [CASCADE] Re-linked X entries` appears

---

*Audit completed: March 15, 2026*
