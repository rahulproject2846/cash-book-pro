# RUNTIME CRASH MAP - FORENSIC AUDIT REPORT
**Date:** 2026-03-15  
**Auditor:** Kilo Code (Debug Mode)  
**Standard:** PATHOR (Stone Solid)

---

## EXECUTIVE SUMMARY

Two critical runtime crashes identified after mobile refactor (STRIKE 5.1):

| ID | Issue | Severity | Root Cause |
|----|-------|----------|------------|
| CRASH-01 | Theme Transition DOM Error | CRITICAL | Null event target in SuperMenu |
| CRASH-02 | Hook Integrity Violation | HIGH | Accidental Early Return blocking hooks |

---

## CRASH-01: Theme Transition DOM Error

### Location
[`components/Layout/DynamicHeader.tsx:575`](components/Layout/DynamicHeader.tsx:575)

### Faulty Code
```typescript
{ 
  label: 'tt_toggle_theme', 
  icon: Sun, 
  color: 'text-orange-500', 
  bg: 'hover:bg-orange-500/10', 
  action: () => { 
    const mockEvent = { currentTarget: null } as any;  // ❌ FAULTY LINE
    executeThemeTransition(mockEvent); 
  }, 
  hiddenLg: false, 
  isThemeToggle: true 
},
```

### Analysis

The `executeThemeTransition` function ([`hooks/useThemeTransition.ts:13-17`](hooks/useThemeTransition.ts:13-17)) expects a valid event object:

```typescript
const executeThemeTransition = useCallback((event: React.MouseEvent | MouseEvent) => {
    const target = event.currentTarget as HTMLElement;  // ❌ CRASH: currentTarget is null
    const rect = target.getBoundingClientRect();       // ❌ CRASH: Cannot read property of null
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    // ...
}, [theme, setTheme]);
```

### Root Cause
When the Theme Toggle is clicked in the SuperMenu:
1. The `handleAction` wrapper closes the overlay first (line 196-199)
2. This removes the button from DOM via AnimatePresence exit animation
3. By the time `executeThemeTransition` runs, `currentTarget` is already null/removed
4. Alternatively, my mock event `{ currentTarget: null }` directly causes the crash

### Evidence
- **Line 14** in `useThemeTransition.ts`: `const target = event.currentTarget as HTMLElement;`
- **Line 15** in `useThemeTransition.ts`: `const rect = target.getBoundingClientRect();`
- **Error**: `TypeError: Cannot read property 'getBoundingClientRect' of null`

### Recommended Fix
Add null guard with fallback to center screen:
```typescript
action: () => { 
  // Use screen center as fallback when DOM element unavailable
  executeThemeTransition({ 
    currentTarget: { 
      getBoundingClientRect: () => ({ 
        left: window.innerWidth / 2, 
        top: window.innerHeight / 2, 
        width: 0, 
        height: 0 
      }) 
    } 
  } as any); 
},
```

---

## CRASH-02: Accidental Early Return (Hook Integrity Violation)

### Location
[`components/Sections/Books/BookDetails.tsx:63-67`](components/Sections/Books/BookDetails.tsx:63-67)

### Faulty Code
```typescript
// Line 45: ✅ Hooks BEFORE early return
const { t, language } = useTranslation();          // Line 45

// Line 46: ✅ Outside hook (function call)
const { saveEntry, deleteEntry } = getVaultStore();  // Line 46

// Line 49-52: ✅ Hooks BEFORE early return  
const {
    processedEntries, entryPagination, setEntryPage,
    pendingDeletion, isInteractionLocked, activeBook
} = useVaultState();                               // Line 49-52

// ❌ EARLY RETURN - Lines 63-67
if (!activeBook) {
  console.log('🛡️ [IRON GATE] No active book, preventing render');
  return null;                                     // Line 67
}

// ⚠️ HOOKS AFTER EARLY RETURN - These may not execute properly!
const [isMobile, setIsMobile] = useState(false);   // Line 55 (technically before return)
const { groupedEntries } = useMemo(() => {         // Line 74
    // ...grouping logic depends on processedEntries
}, [processedEntries, language]);
```

### Hook Execution Order Analysis

| Line | Code | Status |
|------|------|--------|
| 45 | `useTranslation()` | ✅ Executes |
| 46 | `getVaultStore()` | ✅ Executes (not a hook) |
| 49-52 | `useVaultState()` | ✅ Executes |
| 55-61 | `useState` + `useEffect` | ⚠️ Executes but state may be stale |
| 63-67 | **Early Return** | ❌ Returns null |
| 74-91 | `useMemo` | ❌ Never evaluates |

### Root Cause

The early return pattern breaks the expected React component lifecycle:

1. **Initial Render (activeBook = null):**
   - `useTranslation()` → returns `language`
   - `useVaultState()` → returns `processedEntries = []`
   - `useMemo` → groups empty entries (should work)
   - Early return → renders nothing

2. **Re-render (activeBook = populated):**
   - All hooks re-run
   - But there's a race condition: `activeBook` becomes available AFTER `useVaultState()` completes
   - The `processedEntries` from initial render may be stale

### The Real Problem

The issue is NOT a React Rules of Hooks violation. The issue is **data dependency ordering**:

- `useMemo` at line 74 depends on `processedEntries` and `language`
- `language` comes from `useTranslation()` (line 45) - executes fine
- `processedEntries` comes from `useVaultState()` (line 49-52) - executes fine
- BUT: When `activeBook` changes, `useVaultState()` may take time to propagate `processedEntries`

### Evidence
- **Line 74-91**: `useMemo` relies on `processedEntries`
- **Line 82-85**: Accesses `entry.date` - could be undefined if entries not loaded
- **Console Warning**: May see "Cannot read property 'date' of undefined" in mobile view

### Recommended Fix
Move hooks BEFORE the early return OR use optional chaining with fallbacks:
```typescript
// Option 1: Move all hooks before early return (recommended)
const { t, language } = useTranslation();
const { processedEntries, ... } = useVaultState();
const [isMobile, setIsMobile] = useState(false);
// ... then early return

// Option 2: Add defensive coding in useMemo
const dateStr = entry?.date ? new Date(entry.date).toLocaleDateString(...) : 'Unknown';
```

---

## CRASH-03 (BONUS): Identity Verification - Back Action

### Location
[`components/Layout/DynamicHeader.tsx:230-233`](components/Layout/DynamicHeader.tsx:230-233)

### Current Code
```typescript
onAction={() => {
    setActiveBook(null);
    router.push('?tab=books');
}}
```

### Analysis

The Back action simply:
1. Clears `activeBook` from Zustand store
2. Navigates to books tab

**Potential Issue:** The `SovereignPlatform` bridge may not re-initialize when returning to dashboard.

### Evidence
- No explicit call to re-initialize platform on navigation
- The platform initialization likely happens at app mount only

### Recommended Fix
Add platform re-initialization if needed:
```typescript
onAction={() => {
    setActiveBook(null);
    // Optionally re-initialize platform bridge
    // await SovereignPlatform.initialize();
    router.push('?tab=books');
}}
```

---

## DIAGNOSIS CONFIRMATION

**Most Likely Source (CRASH-01):**
> The SuperMenu Theme Toggle passes a mock event with `currentTarget: null` to `executeThemeTransition`, which crashes when trying to call `getBoundingClientRect()` on null.

**Second Most Likely (CRASH-02):**
> The early return at line 63-67 prevents proper hook execution when `activeBook` transitions from null to populated, causing stale data in `useMemo`.

---

## REQUEST FOR CONFIRMATION

Before proceeding with fixes, please confirm:

1. **CRASH-01 Diagnosis:** Is the null event target the correct root cause? Should I implement the screen-center fallback?

2. **CRASH-02 Diagnosis:** Is the early return pattern the issue? Should I move hooks before the guard clause?

3. **Scope:** Should I fix both crashes or prioritize one?

**STAY PATHOR** - Awaiting your confirmation before code modifications.
