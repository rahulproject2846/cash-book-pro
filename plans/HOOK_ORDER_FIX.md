# HOOK ORDER VIOLATION REPORT
## DashboardLayout.tsx - Rules of Hooks Fix

**Date**: March 14, 2026  
**Issue**: "Rendered more hooks than during the previous render" error

---

## ❌ CURRENT BROKEN STRUCTURE

```typescript
export const DashboardLayout = (props: any) => {
    const { children } = props;
    
    // HOOK #1
    const isMounted = useHydrationGuard();  // ← Line 29
    
    // ❌ RULE VIOLATION: Conditional return BEFORE remaining hooks
    if (!isMounted) {                        // ← Line 30
        return (                             // ← Line 31
            <div>Skeleton...</div>
        );
    }                                        // ← Line 36 - EARLY RETURN!
    
    // HOOK #2-13 ARE CALLED ONLY ON SUBSEQUENT RENDERS!
    const [collapsed, setCollapsed] = useState(false);     // ← Line 38
    const [isShielded, setIsShielded] = useState(false);  // ← Line 39
    const { theme, setTheme } = useTheme();                // ← Line 40
    const mainContainerRef = useRef<HTMLElement>(null);    // ← Line 41
    const router = useRouter();                             // ← Line 42
    const { openModal } = useModal();                      // ← Line 43
    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState();  // ← Line 45
    const { t } = useTranslation();                         // ← Line 46
    
    // ... more hooks and JSX
};
```

### Hook Call Order Breakdown:

| # | Hook | Line | Called Before Return? |
|---|------|------|---------------------|
| 1 | `useHydrationGuard()` | 29 | ✅ YES |
| 2 | `useState` | 38 | ❌ NO |
| 3 | `useState` | 39 | ❌ NO |
| 4 | `useTheme` | 40 | ❌ NO |
| 5 | `useRef` | 41 | ❌ NO |
| 6 | `useRouter` | 42 | ❌ NO |
| 7 | `useModal` | 43 | ❌ NO |
| 8 | `useVaultState` | 45 | ❌ NO |
| 9 | `useTranslation` | 46 | ❌ NO |
| 10 | `useEffect` | 76 | ❌ NO |
| 11 | `useEffect` | 110 | ❌ NO |

---

## ✅ CORRECT STRUCTURE (FIX PLAN)

```typescript
export const DashboardLayout = (props: any) => {
    const { children } = props;
    
    // 🔒 ALL HOOKS MUST BE AT TOP - NO CONDITIONAL RETURNS BEFORE HOOKS!
    
    // HOOK #1-11: ALL HOOKS CALLED UNCONDITIONALLY
    const isMounted = useHydrationGuard();                                    // ← #1
    const [collapsed, setCollapsed] = useState(false);                       // ← #2
    const [isShielded, setIsShielded] = useState(false);                     // ← #3
    const { theme, setTheme } = useTheme();                                  // ← #4
    const mainContainerRef = useRef<HTMLElement>(null);                       // ← #5
    const router = useRouter();                                               // ← #6
    const { openModal } = useModal();                                         // ← #7
    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState();  // ← #8
    const { t } = useTranslation();                                           // ← #9
    
    // Effect hooks can go anywhere, but conventionally after state hooks
    useEffect(() => { ... }, [...]);                                         // ← #10
    useEffect(() => { ... }, []);                                            // ← #11
    
    // ✅ CONDITIONAL RENDER CAN GO HERE (after ALL hooks)
    if (!isMounted) {
        return (
            <div className="h-screen w-full bg-[var(--bg-app)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    // All hooks already called - safe to conditionally render
    
    // ... rest of component
};
```

---

## FILES TO CHECK FOR SAME PATTERN

| File | Status | Issue |
|------|--------|-------|
| `DashboardLayout.tsx` | ❌ VIOLATION | Conditional return after hook #1 |
| `BooksSection.tsx` | ✅ LIKELY OK | Check for early returns |
| `SettingsSection.tsx` | ✅ LIKELY OK | Check for early returns |
| Any component with `useHydrationGuard` | ⚠️ CHECK | Must verify hook order |

---

## THE FIX

1. Move ALL hooks (useState, useEffect, useRef, useContext, etc.) to the TOP of the component
2. Call them UNCONDITIONALLY in the same order every render
3. Place the conditional return AFTER all hooks
4. Use the `isMounted` state variable to conditionally render content

---

## ALTERNATIVE PATTERN: Use Conditional in JSX

If you want to avoid the early return entirely, use conditional rendering in JSX:

```typescript
// DON'T need early return - just conditional in JSX
return (
    <div>
        {!isMounted ? (
            <Skeleton />
        ) : (
            <RealContent />
        )}
    </div>
);
```

This pattern is simpler and avoids hook order issues entirely.

---

**Report Generated**: March 14, 2026  
**Next Step**: Confirm this structure before code modification