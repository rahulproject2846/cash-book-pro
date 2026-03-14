# 🗺️ PROTOCOL: DUAL-VIEW SEPARATION STRATEGY REPORT

**Date**: March 14, 2026  
**Project**: Vault Pro - The Great Separation  
**Phase**: PLANNING (NO EXECUTION)  
**Target**: Desktop/Mobile UI Split

---

## EXECUTIVE SUMMARY

This report outlines the execution strategy for splitting the Vault Pro UI into two independent shell environments while maintaining a shared brain (data layer). The current DashboardLayout.tsx contains both desktop and mobile concerns, which causes CSS fighting and maintenance burden.

---

## 1. SCAFFOLDING STRUCTURE

### Proposed Directory Structure

```
components/
├── Sovereign/                    # 🆕 NEW: Dual-View Sovereign Architecture
│   ├── Shared/                   # Shared UI elements (same brain, different bodies)
│   │   ├── BookCard.tsx         # Can be wrapped differently per shell
│   │   ├── EntryCard.tsx        # Can be wrapped differently per shell  
│   │   ├── StatsGrid.tsx        # Can adapt to shell width
│   │   ├── Pagination.tsx       # Shared logic, different styling
│   │   ├── SyncProgressBar.tsx  # Status indicator
│   │   ├── Tooltip.tsx          # Atomic component
│   │   └── index.ts             # Barrel export
│   │
│   ├── Desktop/                 # Desktop-specific shell
│   │   ├── DesktopShell.tsx     # Main desktop container (L-Frame)
│   │   ├── DesktopHeader.tsx    # Extended header for desktop
│   │   ├── DesktopGrid.tsx      # Grid layout manager
│   │   └── index.ts             # Barrel export
│   │
│   └── Mobile/                  # Mobile-specific shell
│       ├── MobileShell.tsx      # Main mobile container (Stack)
│       ├── MobileHeader.tsx     # Compact header for mobile
│       ├── MobileStack.tsx      # Stack layout manager
│       └── index.ts             # Barrel export
│
├── Layout/                       # Keep for backwards compatibility
│   └── DashboardLayout.tsx      # Will become the Gateway/Controller
│
└── [existing folders unchanged]
```

### Why This Structure?

1. **Explicit Separation**: No more CSS fighting via `hidden md:block`
2. **Shared Brain**: Data hooks work identically in both shells
3. **Shell Isolation**: Each shell only imports what it needs
4. **Future-Proof**: Easy to add tablet/responsive variants later

---

## 2. LAYOUT DISSECTION

### Current DashboardLayout.tsx Breakdown

| Line(s) | Current Component | Destination |
|---------|------------------|-------------|
| 5 | `Fingerprint, ShieldCheck` icons | **MobileShell.tsx** (shield overlay) |
| 6 | `DynamicHeader` | **DesktopShell.tsx** + **MobileShell.tsx** (shared, different placement) |
| 7 | `DesktopSidebar` | **DesktopShell.tsx** (desktop only) |
| 8 | `MobileBottomNav` | **MobileShell.tsx** (mobile only) |
| 29 | `useHydrationGuard()` | **Gateway** (DashboardLayout) |
| 30 | `collapsed` state | **DesktopShell.tsx** (sidebar collapse) |
| 31 | `isShielded` state | **Shared** (both shells need session shield) |
| 32 | `theme` hook | **Gateway** (applies to both) |
| 36 | `activeSection` | **Shared** via props |
| 42-73 | Theme/Midnight effect | **Gateway** (global) |
| 76-82 | ConflictBackgroundService | **Gateway** (global) |
| 120-122 | Main grid container | **DesktopShell.tsx** (L-Frame grid) |
| 125-135 | Sidebar div | **DesktopShell.tsx** |
| 138-140 | Header div | Both shells (different placement) |
| 143-159 | Main content + BottomNav | **MobileShell.tsx** (stacked) |
| 162-179 | Shield overlay | **Shared** |

### What Moves Where

#### → DesktopShell.tsx (Lines 120-135)
```typescript
// Grid layout: sidebar + header + main
<div className="grid grid-cols-[280px_1fr] grid-rows-[auto_1fr]">
  <DesktopSidebar {...props} />
  <DynamicHeader />
  <main>{children}</main>
</div>
```

#### → MobileShell.tsx (Lines 143-159)
```typescript
// Stack layout: header top, content middle, nav bottom
<div className="flex flex-col h-screen">
  <DynamicHeader />
  <main className="flex-1 overflow-y-auto">{children}</main>
  <MobileBottomNav {...props} />
</div>
```

---

## 3. THE SWITCHER LOGIC

### Gateway Pattern (DashboardLayout.tsx)

The DashboardLayout becomes a pure **Gateway/Controller** with zero layout CSS:

```typescript
// components/Layout/DashboardLayout.tsx (CONCEPT)

export const DashboardLayout = ({ children }) => {
    // ✅ All hooks first (Rules of Hooks compliant)
    const isMounted = useHydrationGuard();
    const deviceType = useDeviceType();
    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState();
    
    // Derived state
    const prefs = preferences || {};
    const isShielded = /* session logic */;
    
    // ✅ Conditional return AFTER all hooks
    if (!isMounted) {
        return <PathorSkeleton />;
    }
    
    // ✅ Device-based shell selection (NO CSS fighting!)
    return (
        <>
            {deviceType === 'mobile' ? (
                <MobileShell>
                    {children}
                </MobileShell>
            ) : (
                <DesktopShell>
                    {children}
                </DesktopShell>
            )}
            
            {/* Shared overlays */}
            <SessionShield isShielded={isShielded} />
        </>
    );
};
```

### Why This Prevents Flicker

1. **Hydration First**: `useHydrationGuard` blocks until React hydrates
2. **Mobile-First Default**: `useDeviceType` defaults to 'mobile' until platform ready
3. **Platform Stable**: SovereignPlatform provides reliable viewport data
4. **No CSS evaluation**: No responsive classes (`md:grid`) are evaluated in JSX

### The Skeleton (PathorSkeleton.tsx)

```typescript
// components/Sovereign/PathorSkeleton.tsx
// This skeleton MUST match BOTH shells' background
export const PathorSkeleton = () => (
    <div className="h-screen w-full bg-[var(--bg-app)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
);
```

---

## 4. SHARED COMPONENTS

### Components That Can Be Shared

| Component | Reason | Notes |
|-----------|--------|-------|
| `BookCard.tsx` | Same data, different grid/list view | Wrap in container with different styles |
| `EntryCard.tsx` | Same transaction display | Adapt width via props |
| `StatsGrid.tsx` | Same metrics, different columns | Responsive columns |
| `Pagination.tsx` | Same logic | Different button sizes |
| `SyncProgressBar.tsx` | Global status | Same in both shells |
| `DynamicHeader.tsx` | Same header content | Different placement (top vs compact) |
| `Tooltip.tsx` | Atomic | Pure component |
| `SafeButton.tsx` | Atomic | Pure component |

### Shared Brain (Hooks)

These hooks work identically in both shells - **NO CHANGES NEEDED**:

```typescript
// In both DesktopShell and MobileShell:
const { books, isLoading } = useBooks();      // ✅ Works
const { entries } = useEntries();              // ✅ Works  
const { activeBook, setActiveBook } = useVaultState();  // ✅ Works
const { t } = useTranslation();                // ✅ Works
```

---

## 5. SAFETY CHECK: Platform Viewport Data

### How SovereignPlatform Provides Viewport

The `BrowserDriver` already collects viewport data:

```typescript
// lib/platform/BrowserDriver.ts (existing)
viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
}
```

### useDeviceType Hook (Existing)

Already implemented and working:

```typescript
// hooks/useDeviceType.ts (existing)
export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('mobile');
    
    useEffect(() => {
        const platform = getPlatform();
        if (platform.info?.viewport?.width) {
            setDeviceType(getDeviceTypeFromWidth(platform.info.viewport.width));
        }
    }, []);
    
    return deviceType;
}
```

### What We Need to Add

1. **Resize Listener** in BrowserDriver to update viewport on window resize
2. **Platform Event** for viewport changes (optional enhancement)

---

## 6. FILE-BY-FILE EXECUTION PLAN

### Phase 1: Create Scaffolding (Day 1)

| Action | File | Description |
|--------|------|-------------|
| CREATE | `components/Sovereign/Shared/index.ts` | Barrel export |
| CREATE | `components/Sovereign/Desktop/index.ts` | Barrel export |
| CREATE | `components/Sovereign/Mobile/index.ts` | Barrel export |
| CREATE | `components/Sovereign/Desktop/DesktopShell.tsx` | Desktop container |
| CREATE | `components/Sovereign/Mobile/MobileShell.tsx` | Mobile container |
| CREATE | `components/Sovereign/PathorSkeleton.tsx` | Universal skeleton |

### Phase 2: Extract Desktop Shell (Day 2)

| Action | File | Description |
|--------|------|-------------|
| COPY | `DesktopSidebar.tsx` | From Layout to Sovereign/Desktop |
| COPY | `DynamicHeader.tsx` | Can be shared, copy for now |
| CREATE | `DesktopShell.tsx` | Grid layout with sidebar |
| MODIFY | `DesktopSidebar` imports | Update paths |

### Phase 3: Extract Mobile Shell (Day 3)

| Action | File | Description |
|--------|------|-------------|
| COPY | `MobileBottomNav.tsx` | From Layout to Sovereign/Mobile |
| CREATE | `MobileShell.tsx` | Stack layout with bottom nav |
| MODIFY | `MobileBottomNav` imports | Update paths |

### Phase 4: Create Gateway (Day 4)

| Action | File | Description |
|--------|------|-------------|
| MODIFY | `DashboardLayout.tsx` | Becomes pure Gateway |
| ADD | Import `useDeviceType` | Device detection |
| ADD | Import shells | DesktopShell, MobileShell |
| REPLACE | JSX with shell selection | No more md:grid |
| KEEP | Hooks, effects | Session shield, theme |

### Phase 5: Shared Components (Day 5)

| Action | File | Description |
|--------|------|-------------|
| MOVE | `BookCard.tsx` | To Shared (if needed) |
| MOVE | `EntryCard.tsx` | To Shared (if needed) |
| MOVE | `StatsGrid.tsx` | To Shared (if needed) |
| UPDATE | Import paths | Throughout app |

### Phase 6: Testing & Polish (Day 6-7)

| Action | Description |
|--------|-------------|
| Verify | Desktop layout works at 1024px+ |
| Verify | Mobile layout works below 768px |
| Test | Resize behavior |
| Test | Hydration no flicker |
| Fix | Any import path issues |

---

## 7. RISK MITIGATION

### Risk 1: Viewport Detection Delay
**Problem**: `useDeviceType` might return wrong value on first render  
**Solution**: Mobile-first default + PathorSkeleton covers the gap

### Risk 2: Import Path Breakage
**Problem**: Moving files breaks existing imports  
**Solution**: Use `@/components/Sovereign/Desktop` aliases, update systematically

### Risk 3: CSS Fighting in Shared Components
**Problem**: Shared components might need different styles per shell  
**Solution**: Use container queries or pass `shellType` prop

### Risk 4: State Desync
**Problem**: Both shells access same hooks, might cause race conditions  
**Solution**: Hooks are already centralized in Zustand - no change needed

---

## 8. SUCCESS CRITERIA

| Criteria | Verification |
|----------|--------------|
| ✅ No `md:` classes in main JSX | Manual code review |
| ✅ DesktopShell uses CSS Grid | Visual test |
| ✅ MobileShell uses Flex Stack | Visual test |
| ✅ No flicker on hydration | Browser test |
| ✅ Viewport resize works | Resize browser test |
| ✅ All hooks work in both shells | Functional test |

---

## 9. ESTIMATED TIMELINE

| Day | Task | Deliverable |
|-----|------|--------------|
| 1 | Scaffolding | Directories created |
| 2 | Desktop Shell | DesktopShell.tsx working |
| 3 | Mobile Shell | MobileShell.tsx working |
| 4 | Gateway | DashboardLayout as controller |
| 5 | Shared | Common components moved |
| 6-7 | Testing | Bug fixes, polish |

**Total: ~7 days for complete implementation**

---

## 10. DEPENDENCIES

### Already Implemented (No Work Needed)
- ✅ `useHydrationGuard` - hooks/useHydrationGuard.ts
- ✅ `useDeviceType` - hooks/useDeviceType.ts  
- ✅ `SovereignPlatform` - lib/platform/
- ✅ DesktopSidebar - components/Layout/
- ✅ MobileBottomNav - components/Layout/

### Need to Create
- ⏳ DesktopShell.tsx
- ⏳ MobileShell.tsx
- ⏳ PathorSkeleton.tsx
- ⏳ Shared folder structure

---

## CONCLUSION

The Dual-View Separation is achievable with minimal risk because:

1. **Platform abstraction already done** - viewport data is reliable
2. **Hooks are centralized** - brain is already shared
3. **Components already extracted** - DesktopSidebar/MobileBottomNav exist
4. **Hydration guard in place** - no flicker risk

The main work is:
1. Create two shell containers
2. Move DashboardLayout logic to Gateway pattern
3. Remove all `md:` responsive classes from main JSX

**Recommendation**: PROCEED WITH IMPLEMENTATION

---

**Report Prepared**: March 14, 2026  
**Status**: ✅ READY FOR EXECUTION  
**Next Step**: User approval → Begin Phase 1