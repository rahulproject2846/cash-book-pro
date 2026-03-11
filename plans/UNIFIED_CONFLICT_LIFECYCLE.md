# UNIFIED CONFLICT LIFECYCLE - MASTER REPORT

**Project**: Vault Pro - Enterprise Offline-First Cash-Book System  
**Purpose**: Complete mapping of ALL conflict types, triggers, resolution paths, and unified lifecycle  
**Protocol**: PATHOR (Stone Solid) - NO DATA MODIFICATION  
**Date**: 2026-03-11

---

## EXECUTIVE SUMMARY

This document is the **Master Plan** for unifying the fragmented conflict resolution system in Vault Pro. It traces every conflict type from detection to resolution, identifies duplicate logic, and maps the Entry vs Book dependency chain.

---

## 1. ALL CONFLICT TYPES - MASTER TABLE

| Conflict Type | Server Error Code | Client conflictReason | Status | Detection Location |
|--------------|-------------------|---------------------|--------|-------------------|
| `VERSION_CONFLICT` | `VERSION_CONFLICT` (HTTP 409) | `VERSION_CONFLICT` | **ACTIVE** | PushService.ts:1713,1939 |
| `PARENT_DELETED_CHILDREN_EXIST` | N/A (HTTP 404) | `PARENT_DELETED_CHILDREN_EXIST` | **STUB** | ConflictMapper.ts:48 (Not actively triggered) |
| `FIELD_LEVEL_CONFLICT` | N/A | `FIELD_LEVEL_CONFLICT` | **MAPPED TO VERSION** | ConflictMapper.ts:51 → 'version' |
| `CHECKSUM_MISMATCH` | `CHECKSUM_MISMATCH` (HTTP 409) | N/A | **ACTIVE** | app/api/entries/route.ts:163 |
| `CHECKSUM_ERROR` | `CHECKSUM_ERROR` (HTTP 409) | N/A | **ACTIVE** | app/api/entries/[id]/route.ts:205 |

---

## 2. CONFLICT TYPE DETAILS

### 2.1 VERSION_CONFLICT

**Description**: Local and server versions differ - both have been modified

#### Detection (Where + How):

| Location | Mechanism | Lines |
|----------|-----------|-------|
| **PushService** | HTTP 409 response triggers conflict flag | 1710-1714, 1936-1940 |
| **PullService** | vKey + timestamp comparison during hydration | 958-993, 1081-1114 |
| **API Routes** | Server-side vKey validation returns 409 | app/api/books/route.ts:281, app/api/entries/[id]/route.ts:217,291 |

#### Detection Logic:
```typescript
// PushService.ts - Lines 1710-1714 (Books)
if (response.status === 409) {
  const conflictData = await response.json();
  await db.books.update(localId, {
    conflicted: 1,
    conflictReason: 'VERSION_CONFLICT',
    serverData: conflictData.existingData,
    synced: 0
  });
}

// PullService.ts - Lines 958-961 (Books - vKey Guard)
const localVKey = existing.vKey || 0;
const serverVKey = book.vKey || 0;
const localTime = existing.updatedAt || 0;
const serverTime = book.updatedAt || 0;

// If local is newer and has higher vKey, mark for re-push
if (localTime > serverTime && localVKey > serverVKey) {
  await db.books.update(existing.localId!, { synced: 0 });
}
```

#### Resolution Paths:

| User Action | Method Called | File | Lines |
|-------------|--------------|------|-------|
| **Keep Local** | `resolveConflict()` → PushService re-push | ConflictResolverModal.ts:380-386, syncSlice.ts | 92-93 |
| **Accept Server** | `HydrationController.ingestServerMutation()` | PullService.ts | 985-993 |

#### Flow Diagram:
```
┌─────────────────┐     HTTP 409      ┌─────────────────┐
│   PushService   │ ───────────────►  │   Dexie DB      │
│  (Book/Entry)  │                   │  conflicted=1   │
└─────────────────┘                   └────────┬────────┘
                                               │
                    ┌───────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│              ConflictStore / syncSlice                 │
│         (Queries where conflicted === 1)              │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│           ConflictResolverModal (UI)                   │
│    User chooses: "Keep Local" or "Accept Server"        │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   "Keep Local"            "Accept Server"
        │                       │
        ▼                       ▼
   Re-push to server      Overwrite with server data
   (synced=0)             (via HydrationController)
```

---

### 2.2 PARENT_DELETED_CHILDREN_EXIST

**Description**: Book deleted on server but still has local entries

#### Detection (Where + How):

| Location | Mechanism | Status |
|----------|-----------|--------|
| **ConflictMapper** | Maps to 'parent_deleted' type | EXISTS (ConflictMapper.ts:48) |
| **ConflictResolverModal** | Special UI for this type | EXISTS (ConflictResolverModal.ts:151-165, 264-278) |
| **ConflictService** | `resurrectBookChain()` implementation | EXISTS (ConflictService.ts:42-115) |
| **Trigger Point** | NOT actively triggered | **STUB** |

#### ⚠️ CRITICAL GAP FOUND:
**The trigger for PARENT_DELETED is NOT actively implemented.** The infrastructure exists:
- ✅ `ConflictMapper.mapConflictType('PARENT_DELETED_CHILDREN_EXIST')` returns `'parent_deleted'`
- ✅ `ConflictResolverModal` has special UI for this
- ✅ `ConflictService.resurrectBookChain()` implements the resurrection
- ❌ **NO code path sets `conflictReason: 'PARENT_DELETED_CHILDREN_EXIST'`**

**Likely original implementation (now inactive):**
```typescript
// Original PushService logic (hypothetical - not found in current code)
if (response.status === 404) {
  const conflictData = await response.json();
  if (conflictData.hasChildren === true) {
    await db.books.update(localId, {
      conflicted: 1,
      conflictReason: 'PARENT_DELETED_CHILDREN_EXIST',
      serverData: null, // Server has no data (deleted)
      synced: 0
    });
  }
}
```

#### Resolution Paths:

| User Action | Method Called | File | Lines |
|-------------|--------------|------|-------|
| **Keep Local & Restore** | `resurrectBookChain()` | ConflictResolverModal.ts:69-77, ConflictService.ts:42-115 | 72-74 |
| **Confirm Remote Deletion** | Standard resolution (entries orphaned) | ConflictResolverModal.ts:367-374 | N/A - soft delete |

#### Flow Diagram:
```
┌──────────────────────────────────────────────────────────────────┐
│                    PARENT_DELETED FLOW                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    HTTP 404     ┌────────────────────────┐   │
│  │ PushService  │ ─────────────►  │  NOT ACTIVELY          │   │
│  │  (Entry)     │                 │  IMPLEMENTED           │   │
│  └──────────────┘                 └───────────┬────────────┘   │
│                                                │                │
│  (Manual Trigger)                               │                │
│  ┌──────────────┐                              │                │
│  │  Integrity   │                              │                │
│  │  Service     │ ─────────────────────────────┘                │
│  │ (Orphan      │                                                 │
│  │  Detection)  │                                                 │
│  └──────┬───────┘                                                 │
│         │                                                          │
│         ▼                                                          │
│  ┌─────────────────────────────────────────┐                      │
│  │     ConflictResolverModal              │                      │
│  │   "Ledger Deleted Remotely"            │                      │
│  │   [Keep Local & Restore]               │                      │
│  │   [Confirm Remote Deletion]            │                      │
│  └──────────────┬─────────────────────────┘                      │
│                 │                                                   │
│     ┌───────────┴───────────┐                                    │
│     ▼                       ▼                                    │
│  Keep Local              Confirm Delete                           │
│     │                       │                                    │
│     ▼                       ▼                                    │
│  resurrectBookChain()    Mark entries as orphaned                 │
│  - Clears _id           (isDeleted: 1)                           │
│  - Increments vKey                                                │
│  - Resets synced: 0                                              │
│  - Re-push entire chain                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2.3 CHECKSUM_MISMATCH / CHECKSUM_ERROR

**Description**: Data integrity check failed during sync

#### Detection (Where + How):

| Location | Mechanism | Lines |
|----------|-----------|-------|
| **API Route (entries)** | Server checksum validation | app/api/entries/route.ts:162-164 |
| **API Route (entry)** | Server checksum validation | app/api/entries/[id]/route.ts:204-206 |

#### Detection Logic:
```typescript
// app/api/entries/route.ts:162-164
return NextResponse.json({
  message: "Data integrity failure",
  errorCode: "CHECKSUM_MISMATCH",
  isActive: true
}, { status: 409 });

// app/api/entries/[id]/route.ts:204-206
return NextResponse.json({
  message: "Data solidarity failure: Checksum mismatch",
  errorCode: "CHECKSUM_ERROR",
  isActive: true
}, { status: 409 });
```

#### Resolution Paths:
**Currently NOT handled** - The server returns 409 but there's no client-side handler for CHECKSUM errors in PushService. This is a **gap** that needs unification.

---

## 3. DUPLICATE LOGIC IDENTIFIED

### 3.1 Version Detection Duplication

| Service | What it | Method does | Lines |
|---------|--------|--------------|-------|
| **PullService** | `compareBookVersions()` | vKey + timestamp comparison during hydration | 958-993 |
| **IntegrityService** | `checkForConflicts()` | Queries Dexie for `conflicted === 1` records | 653-741 |

**Issue**: PullService actively detects version conflicts during pull, but IntegrityService also has a conflict check method that queries for already-marked conflicts. These serve different purposes but could be unified.

**Difference:**
- **PullService**: Detects NEW conflicts during sync (active)
- **IntegrityService**: Finds EXISTING conflicts for UI display (passive query)

### 3.2 Orphan Detection Duplication

| Service | Method | What it does | Lines |
|---------|--------|--------------|-------|
| **IntegrityService** | `checkForOrphanedEntries()` | Scans all entries, marks orphans | 769-828 |
| **PullService** | Hard delete check | Removes entries when book deleted | PullService.ts:1008-1012 |

**Issue**: Both check for orphaned entries but with different approaches:
- **IntegrityService**: Marks as `isDeleted: 1` (soft delete)
- **PullService**: Actually deletes from Dexie

### 3.3 State Management Duplication

| Location | What it stores | Lines |
|----------|---------------|-------|
| **ConflictStore.ts** | In-memory conflict queue | 17-157 |
| **syncSlice.ts** | Zustand store for conflicts | 43-45, 372-388 |
| **ConflictResolverModal** | Local state for modal | 36-99 |

**Issue**: Three different places store conflict state. Should be unified.

---

## 4. ENTRY VS BOOK DEPENDENCY CHAIN

### 4.1 When an Entry is in Conflict

**The Dependency Rule**: If an entry is conflicted, its parent book must also be re-synced.

**Implementation** in `ConflictService.resolveEntryConflict()`:

```typescript
// ConflictService.ts:145-170
// STEP 2: FIND THE PARENT BOOK
const book = await db.books.where('cid').equals(entry.bookId).first();

// STEP 3: UPDATE PARENT BOOK FOR RE-SYNC
if (book.synced === 1) {
  const updatedBook = {
    ...book,
    vKey: (book.vKey || 0) + 1,
    synced: 0,  // Mark for re-sync
    conflicted: 0,
    conflictReason: '',
    updatedAt: getTimestamp()
  };
  
  const controller = HydrationController.getInstance();
  await controller.ingestLocalMutation('BOOK', [updatedBook]);
}
```

### 4.2 When a Book is in Conflict (parent_deleted)

**The Chain Rule**: If a book is resurrected, ALL its entries must also be reset.

**Implementation** in `ConflictService.resurrectBookChain()`:

```typescript
// ConflictService.ts:83-102
// STEP 4: FIND ALL ENTRIES
const allEntries = await db.entries
  .where('bookId').equals(bookCid)
  .and((entry: any) => entry.isDeleted === 0)
  .toArray();

// STEP 5: RESET ALL ENTRIES ATOMICALLY
if (allEntries.length > 0) {
  const entryUpdates = allEntries.map((entry: LocalEntry) => ({
    ...entry,
    synced: 0,
    vKey: (entry.vKey || 0) + 1,
    updatedAt: getTimestamp()
  }));
  
  await controller.ingestLocalMutation('ENTRY', entryUpdates);
}
```

### 4.3 Dependency Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRY-BOOK DEPENDENCY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │   Entry     │                                               │
│   │  Conflict   │                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────┐                    │
│   │  resolveEntryConflict(entryCid, get)    │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  Find parent book (entry.bookId)        │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  Update book: synced=0, vKey+1          │                    │
│   │  (only if book.synced === 1)           │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  triggerManualSync()                    │                    │
│   └─────────────────────────────────────────┘                    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐                                               │
│   │   Book     │                                               │
│   │  Conflict  │                                               │
│   │(parent_del)│                                               │
│   └──────┬──────┘                                               │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────┐                    │
│   │  resurrectBookChain(bookCid, get)       │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  Clear book: _id=undefined, vKey+1     │                    │
│   │  synced=0, conflicted=0                 │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  Find ALL entries (bookId === cid)     │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  Update ALL entries: synced=0, vKey+1   │                    │
│   └──────────────────┬────────────────────┘                    │
│                      │                                            │
│                      ▼                                            │
│   ┌─────────────────────────────────────────┐                    │
│   │  triggerManualSync()                    │                    │
│   └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CROSS-FILE DEPENDENCY MAP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONFLICT RESOLUTION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DETECTION LAYER                                                         │
│  ├── PushService.ts ───────────────► Sets conflicted=1 on 409         │
│  ├── PullService.ts ───────────────► Compares vKey during hydration   │
│  └── API Routes ───────────────────► Returns 409 with errorCode      │
│                                                                          │
│  STATE LAYER                                                             │
│  ├── ConflictStore.ts ───────────────── In-memory queue (legacy)       │
│  ├── syncSlice.ts ──────────────────── Zustand store (current)        │
│  └── ConflictMapper.ts ─────────────── Maps reason ↔ type             │
│                                                                          │
│  UI LAYER                                                                │
│  ├── ConflictResolverModal.tsx ───────── User resolution interface     │
│  └── ConflictManagementList.tsx ─────── Batch conflict list            │
│                                                                          │
│  SERVICE LAYER                                                           │
│  ├── ConflictService.ts ──────────────── Resolution execution           │
│  │   ├── resurrectBookChain() ────────── Book + entries restoration   │
│  │   ├── resolveEntryConflict() ──────── Entry + parent book sync    │
│  │   └── batchResolveConflicts() ─────── Multiple entry resolution  │
│  ├── IntegrityService.ts ─────────────── Integrity checks             │
│  │   ├── checkForConflicts() ──────────── Query conflicted records   │
│  │   └── checkForOrphanedEntries() ────── Orphan detection           │
│  └── HydrationController.ts ────────────── Atomic mutation execution   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. RESOLUTION MATRIX

| Conflict Type | Detection | UI Type | Resolution (Local) | Resolution (Server) |
|--------------|-----------|---------|-------------------|-------------------|
| VERSION_CONFLICT | PushService 409 / PullService vKey | Side-by-side compare | Re-push to server | Overwrite with server data |
| PARENT_DELETED | STUB (not triggered) | Special "Restore" UI | resurrectBookChain() | Soft delete entries |
| CHECKSUM_MISMATCH | API Route 409 | NOT HANDLED | NOT IMPLEMENTED | NOT IMPLEMENTED |
| CHECKSUM_ERROR | API Route 409 | NOT HANDLED | NOT IMPLEMENTED | NOT IMPLEMENTED |

---

## 7. GAPS IDENTIFIED

### 7.1 PARENT_DELETED Not Actively Triggered
- Infrastructure exists (ConflictMapper, ConflictService, Modal UI)
- No code path sets `conflictReason: 'PARENT_DELETED_CHILDREN_EXIST'`
- **Impact**: Users cannot automatically detect when a book is deleted on server

### 7.2 CHECKSUM Errors Not Handled
- Server returns 409 with `CHECKSUM_MISMATCH` or `CHECKSUM_ERROR`
- PushService does not catch these error codes
- **Impact**: Checksum failures lead to silent failures or unhandled errors

### 7.3 Duplicate Conflict State Storage
- ConflictStore (in-memory), syncSlice (Zustand), Modal (local state)
- Should be unified to single source of truth

### 7.4 Duplicate Version Detection
- PullService actively compares vKey
- IntegrityService queries for already-marked conflicts
- These serve different purposes but could be more tightly integrated

---

## 8. UNIFIED LIFECYCLE RECOMMENDATION

### Phase 1: Activate PARENT_DELETED Trigger
```typescript
// In PushService, after HTTP 404 response:
if (response.status === 404) {
  const data = await response.json();
  // Check for children
  if (data.code === 'PARENT_NOT_FOUND' && localEntriesExist) {
    await db.books.update(localId, {
      conflicted: 1,
      conflictReason: 'PARENT_DELETED_CHILDREN_EXIST',
      synced: 0
    });
  }
}
```

### Phase 2: Handle CHECKSUM Errors
```typescript
// In PushService, extend 409 handling:
if (response.status === 409) {
  const data = await response.json();
  if (data.errorCode === 'CHECKSUM_MISMATCH') {
    // Mark for integrity repair
    await db.entries.update(localId, { synced: 0 });
  }
}
```

### Phase 3: Unify State Management
- Consolidate ConflictStore, syncSlice conflict handling
- Use syncSlice as single source of truth
- Remove ConflictStore legacy in-memory queue

---

## 9. FILE REFERENCE INDEX

| Purpose | File | Key Lines |
|---------|------|-----------|
| Conflict Type Mapping | `lib/vault/ConflictMapper.ts` | 43-57 |
| Conflict Detection (Push) | `lib/vault/services/PushService.ts` | 1710-1714, 1936-1940 |
| Conflict Detection (Pull) | `lib/vault/services/PullService.ts` | 958-993, 1081-1114 |
| Conflict Detection (Integrity) | `lib/vault/services/IntegrityService.ts` | 653-741 |
| Resolution Service | `lib/vault/services/ConflictService.ts` | 42-115, 126-183 |
| Resolution UI | `components/Modals/ConflictResolverModal.tsx` | 65-99 |
| State Management | `lib/vault/store/slices/syncSlice.ts` | 43-45 |
| Server API (Books) | `app/api/books/route.ts` | 280-282 |
| Server API (Entries) | `app/api/entries/route.ts` | 162-164 |
| Server API (Entry) | `app/api/entries/[id]/route.ts` | 204-206, 217, 291 |

---

*Document Generated: 2026-03-11*  
*Protocol: GRAND UNIFICATION AUDIT (Read-Only)*  
*Standard: PATHOR (Stone Solid)*
