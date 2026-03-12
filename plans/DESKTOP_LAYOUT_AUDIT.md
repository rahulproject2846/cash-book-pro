# SKELETON HIERARCHY AUDIT - DESKTOP L-FRAME

## Root Cause: Black Void Between Sidebar and Content

### Hierarchy Trace (Root to Book Cards)

---

### 1. Root Layout Wrapper
**File:** `components/Layout/DashboardLayout.tsx:263-265`
```tsx
<div className="h-screen bg-[var(--bg-app)] flex flex-col md:grid md:grid-cols-[280px_1fr] md:grid-rows-[auto_1fr] md:grid-areas-layout">
```
**Purpose:** CSS Grid with Sidebar (280px) + Main (1fr). This is the L-Frame foundation.
**Classes:**
- `md:grid` - Switches to grid on desktop
- `md:grid-cols-[280px_1fr]` - Sidebar 280px, main fills remaining
- `md:grid-rows-[auto_1fr]` - Header auto height, main fills

---

### 2. Sidebar Container
**File:** `DashboardLayout.tsx:267-277`
```tsx
<div className="hidden md:block" style={{ gridArea: 'sidebar' }}>
  <Sidebar collapsed={collapsed} ... />
</div>
```
**Purpose:** Hidden on mobile, uses gridArea for desktop. Fixed left position.

---

### 3. Main Content Wrapper (Header + Sections)
**File:** `DashboardLayout.tsx:285-301`
```tsx
<main 
  className="w-full overflow-y-auto custom-scrollbar h-full relative bg-[var(--bg-app)]"
  style={{ gridArea: 'main' }}
>
```
**Purpose:** Fills remaining 1fr space. `w-full` should expand to fill grid column.
**⚠️ ISSUE:** May not be properly assigned to grid column 2.

---

### 4. Header Container
**File:** `components/Layout/DynamicHeader.tsx:102-107`
```tsx
<motion.header 
  className={cn(
    "sticky top-0 z-[500] w-full bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border)]",
    "h-24 md:h-20 px-6 md:px-10" 
  )}
>
```
**Purpose:** Sticky header, full width. Uses `w-full`.

---

### 5. Section Slot (Plug-and-Play)
**File:** `components/Sections/Books/BooksSection.tsx:299`
```tsx
<div className="w-full relative min-h-screen">
```
**Purpose:** Container for BooksSection content. `w-full` should inherit.

---

### 6. BooksSection Container (HubHeader)
**File:** `components/Layout/HubHeader.tsx:69-78`
```tsx
<div 
  className={cn(
    "sticky px-5 z-[400] bg-(--bg-app)/80 backdrop-blur-xl transition-all duration-300 w-auto mb-4",
    "mx-[-1.25rem] md:mx-[-2.5rem]"
  )}
>
```
**Purpose:** Negative margins pull content outward for full-bleed effect.
**Classes:**
- `w-auto` - ⚠️ Uses intrinsic width, NOT 1fr
- `mx-[-1.25rem]` - ⚠️ Negative margins override width

---

### 7. BooksList Container
**File:** `components/Sections/Books/BooksList.tsx` (not yet read)

---

### 8. BookCards Grid
**File:** `components/Sections/Books/BookCard.tsx` (not yet read)

---

## 🔴 ROOT CAUSE IDENTIFIED

| Component | File:Line | Problem |
|-----------|-----------|---------|
| Main Grid | DashboardLayout.tsx:263 | Grid uses `grid-areas-layout` but areas may not be properly defined |
| Main Content | DashboardLayout.tsx:287 | Uses `gridArea: 'main'` but column assignment unclear |
| HubHeader | HubHeader.tsx:71 | `w-auto` with negative margins - intrinsic width |

### Likely Fix Required:
1. Add explicit `grid-template-areas` definition in CSS or inline styles
2. OR change to explicit column placement: `col-start-2 col-end-3`
3. Check if `w-auto` on HubHeader is restricting width

---

## Next Step
Switch to Code mode to apply the fix once approved.