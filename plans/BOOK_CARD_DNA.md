# BOOK CARD DNA - FORENSIC EXTRACTION REPORT
**Date:** 2026-03-15  
**Auditor:** Kilo Code  
**Standard:** PATHOR (Stone Solid)

---

## 1. BOOKCARD.TSX - COMPLETE CODE EXTRACTION

### Location
`components/Sovereign/Shared/BookCard.tsx` (278 lines)

### Component Signature
```typescript
interface BookCardProps {
    book: any;
    onOpen: (book: any) => void;
    onQuickAdd: (book: any) => void;
    onEdit?: (book: any) => void;
    onDelete?: (book: any) => void;
    balance: number;
    currencySymbol: string;
    isDimmed?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    currentUser?: any;
    variant?: BookCardVariant;
}
```

---

## 2. FRAMER MOTION ANIMATIONS

### Card Hover Animation
**Location:** [`BookCard.tsx:162`](components/Sovereign/Shared/BookCard.tsx:162)
```typescript
whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
```
- **Effect:** Card lifts 6px on hover
- **Physics:** Spring with stiffness 400, damping 25

### Card Tap Animation
**Location:** [`BookCard.tsx:163`](components/Sovereign/Shared/BookCard.tsx:163)
```typescript
whileTap={{ scale: 0.97 }}
```
- **Effect:** Scale down to 97% on tap

### Quick Add Button Rotate Animation
**Location:** [`BookCard.tsx:268`](components/Sovereign/Shared/BookCard.tsx:268)
```typescript
<Plus size={isCompact ? 16 : 20} strokeWidth={3.5} className="group-hover/btn:rotate-90 transition-transform" />
```
- **Effect:** Plus icon rotates 90° on button hover
- **Trigger:** `group-hover/btn` from parent button

---

## 3. HOVER-BLUR LOGIC

### Parent Component: BooksList.tsx

### State Management
**Location:** [`BooksList.tsx:57`](components/Sections/Books/BooksList.tsx:57)
```typescript
const [hoveredId, setHoveredId] = useState<string | null>(null);
```

### Dimming Logic
**Location:** [`BooksList.tsx:169`](components/Sections/Books/BooksList.tsx:169)
```typescript
isDimmed={hoveredId !== null && hoveredId !== bookKey}
```
- **Logic:** If ANY card is hovered, ALL cards EXCEPT the hovered one get dimmed

### Hover Handlers
**Location:** [`BooksList.tsx:171-173`](components/Sections/Books/BooksList.tsx:171-173)
```typescript
onMouseEnter={() => setHoveredId(bookKey)}
onMouseLeave={() => setHoveredId(null)}
```

### Visual Effect (in BookCard)
**Location:** [`BookCard.tsx:157-160`](components/Sovereign/Shared/BookCard.tsx:157-160)
```typescript
animate={{ 
    opacity: isDimmed ? 0.35 : 1, 
    y: 0,
    scale: isDimmed ? 0.94 : 1,
    filter: isDimmed ? "blur(2px) saturate(0.5) grayscale(0.5)" : "blur(0px) saturate(1)"
}}
```
- **When dimmed:** 
  - Opacity: 35%
  - Scale: 94%
  - Filter: blur(2px) saturate(0.5) grayscale(0.5)

---

## 4. BUTTON SPACING & POSITIONING

### Container Layout
**Location:** [`BookCard.tsx:220`](components/Sovereign/Shared/BookCard.tsx:220)
```typescript
<div className={cn("pt-3 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10", compactClasses.gap)}>
```

### Button Wrapper
**Location:** [`BookCard.tsx:233`](components/Sovereign/Shared/BookCard.tsx:233)
```typescript
<div className="flex items-center gap-2">
```

### Individual Button Classes (Full Variant)
**Location:** [`BookCard.tsx:140-141`](components/Sovereign/Shared/BookCard.tsx:140-141)
```typescript
actionBtn: "w-8 h-8 md:w-10 md:h-10",    // Edit/Delete buttons
quickAddBtn: "w-9 h-9 md:w-12 md:h-12",   // Quick Add button (larger)
```

### Positioning Strategy
- **NOT using absolute positioning** - Uses flexbox with `justify-between`
- **Order:** Edit → Delete → Quick Add (rightmost, largest)
- **Gap:** `gap-2` between buttons

---

## 5. QUICK ADD BUTTON IMPLEMENTATION

### Button Code
**Location:** [`BookCard.tsx:263-270`](components/Sovereign/Shared/BookCard.tsx:263-270)
```typescript
<Tooltip text={t('tt_quick_add')}>
    <button 
        onClick={(e) => { e.stopPropagation(); onQuickAdd(reactiveBook); }} 
        className={cn(
            "bg-[var(--bg-app)] hover:bg-orange-500 border border-[var(--border)] hover:border-orange-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg group/btn", 
            compactClasses.quickAddBtn
        )}
    >
        <Plus size={isCompact ? 16 : 20} strokeWidth={3.5} className="group-hover/btn:rotate-90 transition-transform" />
    </button>
</Tooltip>
```

### Handler Flow

#### Step 1: BookCard passes to BooksList
**Location:** [`BooksList.tsx:159`](components/Sections/Books/BooksList.tsx:159)
```typescript
onQuickAdd={onQuickAdd}
```

#### Step 2: BooksList receives from BooksSection
**Location:** [`BooksSection.tsx:429-434`](components/Sections/Books/BooksSection.tsx:429-434)
```typescript
onQuickAdd={(b: any) => {
    setActiveBook(b);
    setTimeout(() => openModal('addEntry', { 
        currentUser: currentUser || { _id: userId }, 
        currentBook: b, 
        onSubmit: (data: any) => saveEntry(data) 
    }), 300);
}}
```

### Handler Verification ✅
The Quick Add button **correctly** triggers:
1. `e.stopPropagation()` - Prevents card click
2. `onQuickAdd(reactiveBook)` - Calls prop with book data
3. In parent: Sets active book, then opens `addEntry` modal after 300ms delay

---

## 6. EDIT BUTTON IMPLEMENTATION

**Location:** [`BookCard.tsx:234-242`](components/Sovereign/Shared/BookCard.tsx:234-242)
```typescript
{onEdit && (
    <Tooltip text={t('edit_book') || 'Edit Book'}>
        <button 
            onClick={(e) => { e.stopPropagation(); onEdit(reactiveBook); }} 
            className={cn(
                "bg-[var(--bg-app)] hover:bg-blue-500 border border-[var(--border)] hover:border-blue-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg", 
                compactClasses.actionBtn
            )}
        >
            <Edit3 size={isCompact ? 14 : 16} strokeWidth={2} />
        </button>
    </Tooltip>
)}
```

---

## 7. DELETE BUTTON IMPLEMENTATION

**Location:** [`BookCard.tsx:245-261`](components/Sovereign/Shared/BookCard.tsx:245-261)
```typescript
{onDelete && (
    <Tooltip text={t('delete_book') || 'Delete Book'}>
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (reactiveBook.conflicted === 1) {
                    toast.error("Please resolve conflict before deleting");
                    return;
                }
                onDelete(reactiveBook); 
            }} 
            className={cn(
                "bg-[var(--bg-app)] hover:bg-red-500 border border-[var(--border)] hover:border-red-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg", 
                compactClasses.actionBtn
            )}
        >
            <Trash2 size={isCompact ? 14 : 16} strokeWidth={2} />
        </button>
    </Tooltip>
)}
```

---

## 8. SUMMARY TABLE

| Aspect | Implementation |
|--------|----------------|
| **Animation Library** | Framer Motion |
| **Hover Physics** | Spring (stiffness: 400, damping: 25) |
| **Dimming Strategy** | `hoveredId` state in parent |
| **Blur Effect** | CSS filter: blur(2px) saturate(0.5) grayscale(0.5) |
| **Button Layout** | Flexbox with gap-2 |
| **Positioning** | NOT absolute - flex justify-between |
| **Quick Add Icon** | Plus with 90° rotation on hover |
| **Button Order** | Edit → Delete → Quick Add |

---

## 9. VERDICT

### ✅ Quick Add Handler: VERIFIED
- Correctly stops propagation
- Correctly passes book to parent
- Parent correctly opens `addEntry` modal

### ✅ Hover-Blur: VERIFIED  
- Uses `hoveredId` state in BooksList (NOT CSS-only)
- All non-hovered cards get dimmed simultaneously

### ✅ Button Spacing: VERIFIED
- Uses flexbox, NOT absolute positioning
- Gap-2 between buttons

**STAY PATHOR** - Report complete. Ready for any modifications if needed.
