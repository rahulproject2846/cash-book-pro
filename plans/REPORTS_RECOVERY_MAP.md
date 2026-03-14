# REPORTS RECOVERY MAP
## Forensic Archaeology - Phase 1: Reports Island Recovery

---

## 1. ORIGINAL FILE TREE DISCOVERED

```
components/Sections/Reports/
├── ReportsSection.tsx      ← Main container (159 lines)
├── AnalyticsVisuals.tsx     ← Charts (Area, Pie, Liquidity) (243 lines)
└── AnalyticsHeader.tsx     ← Time range selector (121 lines)

components/Sections/Timeline/
├── TimelineSection.tsx      ← Main container (202 lines)
└── TimelineFeed.tsx        ← Timeline list component
```

---

## 2. THE STUB LOCATION (WHERE CONNECTION WAS CUT)

**File:** `app/page.tsx`  
**Lines:** 211-218 (Reports) & 221-228 (Timeline)

```tsx
// CURRENT STUB CODE:
<div className={effectiveSection === 'reports' ? 'block' : 'hidden'}>
  <div className="p-20 text-center text-[var(--text-muted)] font-black opacity-20">
    Analytics Node Offline
  </div>
</div>

<div className={effectiveSection === 'timeline' ? 'block' : 'hidden'}>
  <div className="p-20 text-center text-[var(--text-muted)] font-black opacity-20">
    Timeline Sequence Locked
  </div>
</div>
```

**Missing Imports in page.tsx:**
- Line 21: `BooksSection` imported ✅
- Line 25: `SettingsSection` imported ✅
- Line 27: `ProfileSection` imported ✅
- **MISSING:** `ReportsSection` - NOT imported
- **MISSING:** `TimelineSection` - NOT imported

---

## 3. DATA DEPENDENCY AUDIT

### ReportsSection.tsx Issues:

| Line | Issue | Severity |
|------|-------|----------|
| 48 | `window.addEventListener('vault-updated', fetchLocalAnalytics)` | 🔴 CRITICAL |
| 36-38 | Direct `db.entries` query (OK - Dexie) | ✅ OK |

**Hook Usage:**
- `useState`, `useEffect`, `useMemo` - ✅ OK
- `db.entries.where()` - ✅ OK (Dexie)
- **window.addEventListener** - 🔴 VIOLATES Platform Abstraction

### TimelineSection.tsx Issues:

| Line | Issue | Severity |
|------|-------|----------|
| 135 | `window.scrollTo({ top: 0, behavior: 'smooth' })` | 🔴 CRITICAL |

**Hook Usage:**
- `useLiveQuery` - ✅ OK
- `getVaultStore()` - ✅ OK
- `db.entries.where()` - ✅ OK
- **window.scrollTo** - 🔴 VIOLATES Platform Abstraction

### AnalyticsHeader.tsx Issues:

| Line | Issue | Severity |
|------|-------|----------|
| 24 | `document.addEventListener('mousedown', handler)` | 🟡 MEDIUM |

**Hook Usage:**
- `useState`, `useRef`, `useEffect` - ✅ OK
- **document.addEventListener** - 🟡 DOM violation

---

## 4. COLLISION MAP (What Would Break)

If we simply import and mount `ReportsSection` and `TimelineSection` right now:

| Component | Issue | Impact |
|-----------|-------|--------|
| ReportsSection | Uses `window.addEventListener` | SSR hydration errors, platform abstraction violation |
| TimelineSection | Uses `window.scrollTo` | Platform abstraction violation |
| AnalyticsHeader | Uses `document.addEventListener` | Platform abstraction violation |
| StatsGrid | Now uses `useDeviceType()` | ✅ Already platform-aware |

**Additional Collision Points:**
- None - the shells (DesktopShell/MobileShell) are agnostic
- CSS grid is managed by shell containers, not these components

---

## 5. 3-STEP RECOVERY PLAN

### STEP 1: Platform Abstraction Fix (Data Layer)
```
TASK: Replace direct window/document calls with platform abstraction

FILES TO MODIFY:
1. components/Sections/Reports/ReportsSection.tsx
   - Line 48-49: Replace window.addEventListener with platform.events

2. components/Sections/Timeline/TimelineSection.tsx  
   - Line 135: Replace window.scrollTo with platform.navigation.scrollTo

3. components/Sections/Reports/AnalyticsHeader.tsx
   - Line 24: Replace document.addEventListener with platform.events
```

### STEP 2: Import Reconnection (App Layer)
```
TASK: Add imports and mount real components in page.tsx

FILES TO MODIFY:
1. app/page.tsx
   - Add: import ReportsSection from '@/components/Sections/Reports/ReportsSection'
   - Add: import TimelineSection from '@/components/Sections/Timeline/TimelineSection'
   - Replace stub (lines 211-218) with <ReportsSection currentUser={currentUser} />
   - Replace stub (lines 221-228) with <TimelineSection currentUser={currentUser} />
```

### STEP 3: Verify & TypeScript (Quality Gate)
```
TASK: Run verification

COMMANDS:
1. npx tsc --noEmit
2. Test in Desktop viewport (1024px+)
3. Test in Mobile viewport (375px-767px)
```

---

## 6. VERIFICATION CHECKLIST

- [ ] ReportsSection renders with charts
- [ ] TimelineSection renders with feed
- [ ] Desktop Shell: Both sections accessible via sidebar
- [ ] Mobile Shell: Both sections accessible via bottom nav
- [ ] No console errors (especially SSR hydration)
- [ ] TypeScript compiles with ZERO errors

---

## 7. DEPENDENCY CHAIN

```
app/page.tsx
    ↓
    ├── ReportsSection.tsx (NEEDS FIX)
    │       ├── AnalyticsVisuals.tsx (OK)
    │       ├── AnalyticsHeader.tsx (NEEDS FIX)
    │       └── StatsGrid.tsx (OK - already shared)
    │
    └── TimelineSection.tsx (NEEDS FIX)
            ├── TimelineFeed.tsx (OK)
            └── StatsGrid.tsx (OK - already shared)
```

---

## SUMMARY

| Item | Count |
|------|-------|
| Files Recovered | 5 |
| Platform Violations | 4 |
| Import Connections | 2 missing |
| Estimated Fix Time | 15 minutes |

**STATUS:** ✅ RECOVERABLE - No rebuild needed, just reconnection + platform abstraction fix.
