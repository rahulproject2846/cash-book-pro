# UI ARCHITECTURE AUDIT - SEARCH LOGIC EXTRACTION
## Protocol: READ-ONLY Investigation

---

## 1. SEARCH COMPONENT DISCOVERY

### Location: `components/Layout/HubHeader.tsx`

The search functionality is **embedded inside HubHeader.tsx**, not a standalone component. It's a unified search that serves both mobile and desktop viewports.

### File Structure:
```
HubHeader.tsx (244 lines)
├── Desktop Search Input (lines 109-127)
└── Mobile Search Morphic Animation (lines 129-182)
```

---

## 2. MOBILE SEARCH ANIMATION (Full-Screen Morphic)

### Code Block (HubHeader.tsx:129-182):

```tsx
{/* MOBILE MORPHIC SEARCH - THE WOW MOMENT */}
<AnimatePresence>
  {!isSearchOpen ? (
    // SEARCH ICON STATE - Morphic Source
    <motion.button
      layoutId="hub-search-container"  
      onClick={() => toggleSearch(true)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ 
        rotate: [0, 5, -5, 0], // Subtle wiggle
        transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
      }}
      className="md:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-(--bg-card) border border-(--border) text-(--text-muted)"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Search size={20} strokeWidth={2.5} />
    </motion.button>
  ) : (
    // SEARCH INPUT STATE - Morphic Target
    <motion.div
      layoutId="hub-search-container"  
      className="md:hidden relative flex-1"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" 
        layoutId="hub-search-icon-wrapper"
      >
        <Search size={18} />
      </motion.div>
      <input
        autoFocus={isSearchOpen && !searchHasFocus}
        value={searchQuery}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        placeholder={t('search_placeholder')}
        className="w-full h-12 bg-(--bg-card) border border-orange-500/40 rounded-[22px] pl-12 pr-12 text-[11px] font-bold outline-none text-(--text-main)"
      />
      {/* Apple-style Clear Button */}
      <motion.button
        layoutId="hub-search-clear"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => { onSearchChange?.(''); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-(--bg-app) rounded-full text-red-500"
      >
        <X size={16} strokeWidth={3} />
      </motion.button>
    </motion.div>
  )}
</AnimatePresence>
```

### Framer Motion Props Used:

| Prop | Value | Purpose |
|------|-------|---------|
| `layoutId` | `"hub-search-container"` | Morphs between button and input |
| `layoutId` | `"hub-search-icon-wrapper"` | Animates search icon position |
| `layoutId` | `"hub-search-clear"` | Apple-style clear button |
| `whileHover` | `{ scale: 1.05 }` | Hover scale effect |
| `whileTap` | `{ scale: 0.95 }` | Tap/click feedback |
| `animate` | `{ rotate: [0, 5, -5, 0] }` | Subtle wiggle animation |
| `transition` | `{ type: "spring", stiffness: 400, damping: 30 }` | Smooth spring physics |
| `AnimatePresence` | - | Handles enter/exit animations |

### Mobile Behavior:
- **Hidden on Desktop**: Uses `md:hidden` class
- **Trigger**: Click on search icon opens full-width input
- **Animation**: Morphs from circular button to full-width input
- **Auto Focus**: `autoFocus={isSearchOpen && !searchHasFocus}` triggers keyboard
- **Clear Button**: Apple-style red X button with fade animation

---

## 3. DESKTOP SEARCH IMPLEMENTATION

### Code Block (HubHeader.tsx:106-127):

```tsx
{/* RIGHT: COMMANDS & MORPHIC SEARCH */}
<div className={cn("flex items-center gap-2", isSearchOpen ? "flex-1" : "flex-1 justify-end")}>
  {showSearch && onSearchChange && (
    <div className={cn("hidden md:block relative", fullWidthSearch ? "flex-1" : "flex-1 max-w-md")}>
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
      >
        <Search size={18} />
      </motion.div>
      <input 
        placeholder={t('search_placeholder')} 
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={handleSearchFocus}
        onBlur={handleSearchBlur}
        className={cn(
          "w-full bg-(--bg-card) border border-(--border) rounded-[22px] pl-12 pr-4 text-[10px] font-bold outline-none focus:border-orange-500/40 shadow-inner text-(--text-main) transition-all",
          isScrolled ? "h-10 text-[9px]" : "h-11"
        )}
      />
    </div>
  )}
</div>
```

### Desktop Behavior:
- **Visible on Desktop**: Uses `hidden md:block` class
- **Max Width**: Defaults to `max-w-md` (280px), can be `flex-1` with `fullWidthSearch` prop
- **Always Visible**: Unlike mobile, desktop search is always visible (not hidden)
- **No Animation**: No morphing - static input with icon
- **Scroll Reaction**: Height changes from `h-11` to `h-10` when scrolled

### Issue Identified:
> **"Why is it currently taking up so much space or behaving like the mobile version?"**

**Root Cause**: The desktop search uses `flex-1 max-w-md` which allows it to grow. Additionally, the parent container uses `isSearchOpen ? "flex-1" : "flex-1 justify-end"` which makes it expand when search is active. This could conflict with moving search to a unified header.

---

## 4. DEPENDENCY MAP

### States Consumed from VaultStore:

| State | Source File | Type | Purpose |
|-------|-------------|------|---------|
| `isSearchOpen` | `syncSlice.ts:91` | `boolean` | Global search open/closed state |
| `toggleSearch` | `syncSlice.ts:157` | `(val?: boolean) => void` | Toggle search visibility |
| `dynamicHeaderHeight` | Unknown | `number` | Header height for positioning |
| `searchQuery` | `bookSlice.ts:63` OR `syncSlice.ts:89` | `string` | Global search query |

### Additional Local States (HubHeader.tsx):

| State | Type | Purpose |
|-------|------|---------|
| `isScrolled` | `boolean` | Detect scroll position for styling |
| `searchHasFocus` | `boolean` | Track if search input has focus |
| `localSearch` | `string` | Local state for instant typing (PATHOR V3.0) |

### Props Passed to HubHeader:

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `title` | `string` | Yes | Header title |
| `subtitle` | `string` | Yes | Header subtitle |
| `icon` | `LucideIcon` | Yes | Icon component |
| `searchQuery` | `string` | No | Search query value |
| `onSearchChange` | `(val: string) => void` | No | Search change callback |
| `showSearch` | `boolean` | No (default: true) | Show/hide search |
| `sortOption` | `string` | No | Current sort option |
| `sortOptions` | `string[]` | No | Available sort options |
| `onSortChange` | `(val: string) => void` | No | Sort change callback |
| `hideIdentity` | `boolean` | No (default: false) | Hide identity section |
| `fullWidthSearch` | `boolean` | No (default: false) | Make search full width |

---

## 5. SEARCH HANDLERS

### Handle Search Focus (HubHeader.tsx:64-66):
```tsx
const handleSearchFocus = useCallback(() => {
    setSearchHasFocus(true);
}, []);
```

### Handle Search Blur (HubHeader.tsx:56-62):
```tsx
const handleSearchBlur = useCallback(() => {
    setSearchHasFocus(false);
    // Only close if user explicitly dismisses (iOS behavior)
    if (!searchQuery) {
        toggleSearch(false);
    }
}, [searchQuery, toggleSearch]);
```

---

## 6. TOGGLE SEARCH ACTION

### From syncSlice.ts (Lines 867-875):
```typescript
toggleSearch: (val) => {
  set((state) => {
    state.isSearchOpen = val !== undefined ? val : !state.isSearchOpen;
  });
},
```

---

## 7. SUMMARY FOR UNIFIED COMMAND BAR REDESIGN

### Key Findings:

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| **Visibility** | Hidden by default, opens on click | Always visible |
| **Animation** | Full morph (Framer Motion `layoutId`) | No animation |
| **Width** | `flex-1` (full width) | `max-w-md` (280px default) |
| **Trigger** | `toggleSearch(true)` | N/A (always visible) |
| **Focus** | `autoFocus` enabled | Manual focus |

### For Unified Command Bar:

1. **Mobile Logic**: The `layoutId="hub-search-container"` pattern should be preserved for smooth morphing
2. **Desktop Logic**: Currently always visible - may need to match mobile pattern for consistency
3. **State Management**: Uses global `isSearchOpen` from `syncSlice.ts` - can be shared
4. **Search Query**: Passed via props `searchQuery` and `onSearchChange` - can be centralized

---

*Audit completed: March 15, 2026*
