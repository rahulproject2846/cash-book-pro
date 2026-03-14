# FINAL BACKEND SOVEREIGNTY AUDIT
## Protocol: Zero Guessing - Evidence-Based Diagnosis

---

## EXECUTIVE SUMMARY

**Finding:** The SyncOrchestrator is NOT firing because the event subscription condition in `SyncOrchestrator.ts:108` requires an `origin` field that is NEVER dispatched by `HydrationController.ts`.

---

## 1. EVENT CHAIN BREAKPOINT - PRIMARY CULPRIT

### Dispatch Location (HydrationController)
**File:** `lib/vault/hydration/HydrationController.ts`

**Line 733-738 (ingestLocalMutation):**
```typescript
getPlatform().events.dispatch('vault-updated', {
  source: 'HydrationController',
  entityType: 'settings',
  operation: 'update',
  timestamp: Date.now()
});
```

**Line 863-868 (ingestBatchMutation):**
```typescript
getPlatform().events.dispatch('vault-updated', {
  source: 'HydrationController',
  entityType: 'settings',
  operation: 'update',
  timestamp: Date.now()
});
```

**Observation:** The event is dispatched with only 4 fields: `source`, `entityType`, `operation`, `timestamp`. **The `origin` field is MISSING.**

---

### Subscription Location (SyncOrchestrator)
**File:** `lib/vault/core/SyncOrchestrator.ts`

**Line 102-108:**
```typescript
const cleanup = this.platform.events.listen('vault-updated', (detail: VaultUpdatedDetail) => {
  const source = detail.source || 'unknown';
  const origin = (detail as any).origin || 'unknown';
  const changedCid = (detail as any).changedCid || null;

  // 🛡️ IGNORE BACKGROUND SYNC: Only trigger for local user actions
  if ((origin === 'local-mutation' || origin === 'batch-mutation') && source === 'HydrationController') {
```

---

### THE BREAK

| Field | HydrationController Dispatches | SyncOrchestrator Expects |
|-------|-------------------------------|------------------------|
| `source` | ✅ 'HydrationController' | ✅ 'HydrationController' |
| `origin` | ❌ **NOT SET** | Must be `'local-mutation'` or `'batch-mutation'` |
| `changedCid` | ❌ **NOT SET** | Optional (defaults to null) |

**Evaluation:**
- `source === 'HydrationController'` → **TRUE**
- `origin === 'local-mutation'` → **FALSE** (origin is 'unknown')
- `origin === 'batch-mutation'` → **FALSE** (origin is 'unknown')

**Result:** The entire `if` block at line 108 is **SKIPPED**. The push is never triggered.

---

## 2. isSyncing LOCK VERIFICATION

**File:** `lib/vault/services/PushService.ts`

**Line 706-712:**
```typescript
if (this.isSyncing) {
  console.log('🚀 [BATCH PUSH SERVICE] Already syncing, skipping...');
  return { success: false, itemsProcessed: 0, errors: ['Already syncing'] };
}
```

**Line 716:**
```typescript
this.isSyncing = true;
```

**Line 873-877 (FINALLY BLOCK):**
```typescript
finally {
  this.isSyncing = false;
}
```

**Finding:** ✅ **No Deadlock Risk.** The `finally` block guarantees `isSyncing` is reset even if fetch fails.

---

## 3. THRESHOLD LOGIC - 5 MINUTE RULE

**File:** `lib/vault/services/PushService.ts`

**Line 769-777:**
```typescript
const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes ago

const allUnsyncedBooks = await db.books.where('synced').equals(0)
  .and((book: any) => book.userId === currentSovereignId)
  .toArray();
unsyncedBooks = allUnsyncedBooks.filter((book: any) => {
  const lastModified = book.lastModified || book.updatedAt || book.createdAt || 0;
  return lastModified > recentThreshold;
});
```

**Analysis for NEW Records:**
- New records have `createdAt` = `Date.now()` (current timestamp)
- `Date.now() > recentThreshold` → **TRUE** (brand new records pass)
- `updatedAt` defaults to `Date.now()` if not set

**Finding:** ✅ **No False Filter.** New records with valid timestamps are NOT filtered out.

---

## 4. MODECONTROLLER SYNC-RELAY

**File:** `lib/system/ModeController.ts`

**Line 488:**
```typescript
const syncResult = await getVaultStore().triggerManualSync();
```

**Finding:** ✅ ModeController DOES dispatch sync when coming online. However, this uses the Zustand store method which creates a NEW PushService instance (line 373-375 of syncSlice.ts), bypassing the Orchestrator entirely.

---

## 5. FINANCESERVICE → HYDRATIONCONTROLLER PATH

**File:** `lib/vault/services/FinanceService.ts`

**Lines 309, 629, 740, 912:**
```typescript
const batchResult = await controller.ingestBatchMutation(atomicOperations);
```

**Finding:** ✅ FinanceService correctly calls HydrationController which dispatches the event.

---

## ROOT CAUSE SUMMARY

### Primary Failure Point: LINE 108 of SyncOrchestrator.ts

```
SYMPTOM: Network Tab is silent - no push requests being made

CAUSE: The condition at SyncOrchestrator.ts:108 requires origin === 'local-mutation' OR origin === 'batch-mutation'

EFFECT: HydrationController dispatches WITHOUT origin field → origin defaults to 'unknown' → condition FAILS → push NEVER triggers

EVIDENCE: 
- HydrationController.ts:733 - No origin field
- HydrationController.ts:863 - No origin field  
- SyncOrchestrator.ts:108 - Requires origin field
- SyncOrchestrator.ts:104 - origin defaults to 'unknown'
```

---

## CODE PROOF CHAIN

```
User creates entry
    ↓
FinanceService.ingestEntry() [FinanceService.ts:912]
    ↓
HydrationController.ingestBatchMutation() [HydrationController.ts:801]
    ↓
getPlatform().events.dispatch('vault-updated', {...}) [HydrationController.ts:863]
    ↓ ⚠️ MISSING FIELD: origin
SyncOrchestrator receives event [SyncOrchestrator.ts:102]
    ↓
origin = (detail as any).origin || 'unknown' [SyncOrchestrator.ts:104]
    ↓ ⚠️ origin = 'unknown'
if ((origin === 'local-mutation' ...) [SyncOrchestrator.ts:108]
    ↓ ❌ FALSE - origin is 'unknown'
BLOCKED - Push never triggers
```

---

## RECOMMENDED FIX

**Option A:** Update HydrationController to include origin field:
```typescript
getPlatform().events.dispatch('vault-updated', {
  source: 'HydrationController',
  origin: 'batch-mutation',  // ADD THIS
  entityType: 'settings',
  operation: 'update',
  timestamp: Date.now()
});
```

**Option B:** Update SyncOrchestrator to not require origin:
```typescript
if (source === 'HydrationController') {  // REMOVE origin check
```

---

## CONCLUSION

The Network Tab is silent because **SyncOrchestrator.ts line 108** has a strict condition that requires an `origin` field that **HydrationController never dispatches**. This is a classic field-mismatch bug - the producer and consumer have incompatible interfaces.

**Certainty Level:** 100% - Code inspection proves the condition can never evaluate to true.

---

*Audit completed: March 15, 2026*
*Protocol: FINAL BACKEND SOVEREIGNTY AUDIT*
