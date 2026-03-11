# FORENSIC AUDIT REPORT: RiskManager & IntegrityService

---

## STATION 1: RISK MANAGER (lib/vault/security/RiskManager.ts)

### File Statistics
- **Lines of Code**: 150 lines
- **File Size**: ~4.7 KB
- **Type**: Static Utility Class (Security Module)

### Primary Function
The RiskManager is a **security-focused** module that performs **risk assessment and tampering detection**. It does NOT perform any data mutations (writes) to Dexie - it only **reads** data and performs calculations.

### Core Methods & Logic

| Method | Lines | Purpose | Operations |
|--------|-------|---------|------------|
| `checkTimeTampering()` | 16-37 | Detects if user manipulated system clock | localStorage READ/WRITE |
| `calculateRiskScore()` | 42-64 | Computes risk score (0-100) based on plan + expiry | READ only |
| `isLockdown()` | 70-73 | Determines if user should be locked | READ only |
| `evaluateRiskAsync()` | 79-99 | Async evaluation for specific user | Dexie READ |
| `getHighRiskUserCount()` | 105-122 | **INDEXED QUERY** - counts high risk users | Dexie indexed READ |
| `getRiskDistribution()` | 128-149 | Returns risk distribution across ranges | Dexie parallel indexed READ |

### Key Finding: "Found 0 high-risk users" Log Source

The log message `⚡ [RISK] Found ${highRiskCount} high-risk users using indexed query` originates from:

```typescript
// Line 115: RiskManager.ts
static async getHighRiskUserCount(): Promise<number> {
  try {
    const { db } = await import('@/lib/offlineDB');
    
    // 🎯 INDEXED QUERY: Uses riskScore index efficiently
    const highRiskCount = await db.users
      .where('riskScore')
      .above(RiskManager.MAX_RISK_THRESHOLD)  // 80
      .count();
      
    console.log(`⚡ [RISK] Found ${highRiskCount} high-risk users using indexed query`);
    return highRiskCount;
  } catch (error) {
    console.error('📊 [RISK] Failed to get high-risk user count:', error);
    return 0;
  }
}
```

### Call Chain: Where is RiskManager Called?

| File | Method | Purpose |
|------|--------|---------|
| **SyncOrchestrator.ts** | Line 690-693 | `Promise.all([RiskManager.getHighRiskUserCount(), RiskManager.getRiskDistribution()])` - called during startup |
| **PushService.ts** | Line 198-200 | `RiskManager.isLockdown(user)` - called before push operations |
| **PullService.ts** | Line 198-200 | `RiskManager.isLockdown(user)` - called before pull operations |
| **SyncGuard.ts** | Line 228-230 | `RiskManager.isLockdown(user)` - called during sync guard check |

### Mutation Analysis: READ or WRITE?

**ANSWER: READ ONLY**

RiskManager does NOT write to Dexie. It:
- Reads from `db.users` using indexed queries
- Reads/writes to `localStorage` (for timestamp tracking)
- Performs mathematical calculations
- Returns computed values

---

## STATION 2: INTEGRITY SERVICE (lib/vault/services/IntegrityService.ts)

### File Statistics
- **Lines of Code**: 1276 lines
- **File Size**: ~44.5 KB
- **Type**: Singleton Service Class (Data Integrity)

### Primary Function
IntegrityService is a **comprehensive data integrity management system** that performs both **READ and WRITE operations** to Dexie. It maintains data consistency, detects tampering, and can repair corrupted data.

### The Three Pillars (Core Methods)

#### PILLAR A: Financial Checksum Validation (Lines 242-427)

**Purpose**: Validate that entry data hasn't been tampered with by recalculating checksums

**Core Logic**:
```typescript
// Line 293-316: Recalculate checksum
const recalculatedChecksum = await generateEntryChecksum({
  amount: entry.amount,
  date: entry.date,
  time: entry.time || "",
  title: entry.title,
  note: entry.note || "",
  category: entry.category || "",
  paymentMethod: entry.paymentMethod || "",
  type: entry.type || "",
  status: entry.status || ""
});

// Line 323: Compare
if (entry.checksum !== recalculatedChecksum) {
  // TAMpering detected - MUTATE DATABASE
  await db.entries.update(entry.localId!, {
    isTampered: 1,
    synced: 0,
    updatedAt: getTimestamp(),
    vKey: getTimestamp()
  });
}
```

**Operations**: 
- READ: Fetches unsynced entries from Dexie
- WRITE: Updates entries marked as tampered

---

#### PILLAR B: Mathematical Mismatch Detection (Lines 437-643)

**Purpose**: Compare server totals vs local totals to detect data drift

**Core Logic**:
```typescript
// Line 545-561: Fetch server manifest
const response = await fetch(`/api/stats/manifest?userId=${encodeURIComponent(userId)}`);
const serverManifest = await response.json();

// Line 567: Get local stats from Zustand
const { globalStats } = getVaultStore();

// Line 573-575: Compare
const incomeDiff = Math.abs(serverManifest.totalIncome - globalStats.totalIncome);
const expenseDiff = Math.abs(serverManifest.totalExpense - globalStats.totalExpense);

if (incomeDiff > 0 || expenseDiff > 0) {
  // Trigger full hydration to repair
  await this.hydrationService.fullHydration(true);
}
```

**Operations**:
- READ: API call to `/api/stats/manifest`
- READ: Zustand store (globalStats)
- WRITE: Triggers fullHydration (data reconstruction)

---

#### PILLAR C: Data Consistency Validation (Lines 755-893)

**Purpose**: Detect orphaned entries and mathematical errors

**Core Logic**:
```typescript
// Line 771-790: Get all entries and active books
const allEntries: LocalEntry[] = await db.entries.where('userId').equals(userId).toArray();
const activeBooks = await db.books.where('userId').equals(userId).and((book) => book.isDeleted === 0).toArray();

// Line 799-816: Check for orphaned entries
if (entry.isDeleted === 0 && !activeBookIds.has(entryBookId)) {
  // Orphan found - MUTATE DATABASE
  await db.entries.update(entry.localId!, {
    isDeleted: 1,
    synced: 0,
    updatedAt: getTimestamp(),
    vKey: getTimestamp()
  });
}

// Line 834-875: Check negative balances
const income = bookEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount || 0), 0);
const expense = bookEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount || 0), 0);
const balance = income - expense;
```

**Operations**:
- READ: Entries and books from Dexie
- WRITE: Marks orphaned entries as deleted

---

## STATION 3: THE GHOST DATA BLINDSPOT

### Critical Question
> "Is there logic to detect - 'local synced: 1 but server has no data'?"

### Answer: **NO - BLINDSPOT EXISTS**

The current IntegrityService does **NOT** have logic to detect this specific ghost data scenario:

**What IS checked:**
- ✅ Checksum tampering (local data modified)
- ✅ Mathematical mismatches (server vs local totals)
- ✅ Orphaned entries (entries pointing to deleted books)
- ✅ Conflict detection (conflicted: 1 records)

**What is NOT checked:**
- ❌ Local records with `synced: 1` that don't exist on server
- ❌ "Phantom sync" - records marked as synced but server rejected them
- ❌ Stale server records that were deleted externally

### Why This Blindspot Exists

The repair logic only compares **totals** (via `/api/stats/manifest`), not individual record existence:

```typescript
// Line 573-575: Only compares TOTALS, not individual records
const incomeDiff = Math.abs(serverManifest.totalIncome - globalStats.totalIncome);
const expenseDiff = Math.abs(serverManifest.totalExpense - globalStats.totalExpense);
```

This means:
- If 10 records are "synced: 1" locally but deleted from server
- And 10 NEW records were added on server
- The **totals might match** but the **data is corrupted**

---

## EXECUTION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYNC ORCHESTRATOR STARTUP                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  RiskManager.getHighRiskUserCount()     │  RiskManager.getRiskDistribution()  │
│  - Indexed query: riskScore > 80        │  - Parallel indexed queries        │
│  - READS only                           │  - READS only                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌───────────────────────────────────┐
                    │   RiskManager.isLockdown(user)    │
                    │   - Returns true/false            │
                    │   - If true: BLOCK sync           │
                    └───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     INTEGRITY SERVICE.performIntegrityCheck()                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 1: validateFinancialChecksums()                                     │  │
│  │ - READ: unsynced entries from Dexie                                     │  │
│  │ - WRITE: Mark tampered entries (if found)                               │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 2: repairCorruptedData()                                          │  │
│  │ - READ: All entries and books                                           │  │
│  │ - READ: API /api/stats/manifest                                         │  │
│  │ - WRITE: Repair orphaned data                                           │  │
│  │ - WRITE: Trigger fullHydration if mismatch                              │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 3: checkForConflicts()                                             │  │
│  │ - READ: Records with conflicted: 1                                      │  │
│  │ - WRITE: Update conflict store                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ STEP 4: validateDataConsistency()                                      │  │
│  │ - READ: All entries and books                                           │  │
│  │ - WRITE: Mark orphaned entries as deleted                               │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY TABLE

| Aspect | RiskManager | IntegrityService |
|--------|-------------|------------------|
| **Lines** | 150 | 1276 |
| **Primary Role** | Security & Tampering Detection | Data Integrity & Repair |
| **Dexie Operations** | READ only | READ + WRITE |
| **API Calls** | None | Yes (`/api/stats/manifest`) |
| **Indexed Queries** | Yes (riskScore index) | No |
| **Triggered By** | SyncOrchestrator, PushService, PullService | Scheduled (every 2 min) + Manual |
| **Ghost Data Detection** | N/A | ❌ NOT IMPLEMENTED |

---

## RECOMMENDATION FOR GHOST DATA RECOVERY

To implement ghost data detection, a new method would need to be added:

```typescript
/**
 * 🔍 DETECT GHOST DATA
 * Checks for records marked as synced: 1 but missing from server
 */
async detectGhostData(userId: string): Promise<{ ghostBooks: number; ghostEntries: number }> {
  // 1. Fetch all synced: 1 records from Dexie
  // 2. Call server to verify existence of each CID
  // 3. Mark missing records as synced: 0 for re-sync
}
```

This would require server-side endpoint support and additional API calls.

---

**Audit Date**: March 11, 2026  
**Auditor**: Kilo Code - Senior Forensic System Architect  
**Files Analyzed**: RiskManager.ts (150 lines), IntegrityService.ts (1276 lines)
