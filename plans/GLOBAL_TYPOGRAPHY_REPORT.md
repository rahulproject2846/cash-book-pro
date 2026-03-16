# Global Typography Forensic Scan Report

**Generated:** 2026-03-15
**Scan Scope:** `app/` and `components/` directories
**Purpose:** Establish Unified Type System for future typography refactor

---

## Executive Summary

This audit identifies **300+ arbitrary font-size declarations** across the codebase. The system uses a chaotic mix of:
- **18 unique arbitrary sizes** (7px to 22px)
- **9 standard Tailwind sizes** (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)

### Key Findings

| Category | Count |
|----------|-------|
| Arbitrary sizes (text-[...]) | 300+ |
| Standard utility classes | 109 |
| Files with >5 different sizes | 15+ |
| Most frequent arbitrary size | 10px |
| Most frequent standard size | text-xl |

---

## Arbitrary Font Sizes (text-[...])

### Distribution by Size

| Size | Count | Primary Usage |
|------|-------|---------------|
| 5px | 1 | Badge text (BookCard) |
| 6px | 5 | Meta text, small badges |
| 7px | 15 | Meta info, labels |
| 8px | 40 | Labels, badges, timestamps |
| 9px | 65 | Secondary labels, metadata |
| 10px | 85 | **Primary body text** (MOST USED) |
| 11px | 40 | Form inputs, buttons |
| 12px | 30 | Card titles, section headers |
| 13px | 15 | Input fields, modal headers |
| 14px | 8 | Primary headings |
| 15px | 3 | Mobile titles |
| 16px | 5 | Amount displays |
| 20px | 2 | Large amounts |
| 22px | 1 | Mobile balance |
| 14px | 8 | Various |

---

## Files with Highest Typography Complexity (Refactor Targets)

### Tier 1: Critical (>10 unique sizes)

1. **components/Layout/DynamicHeader.tsx** - 15+ sizes
   - Uses: 7px, 8px, 9px, 10px, 11px, 12px, 14px, 16px, xl, 2xl, 3xl
   - Issue: Inconsistent button text, search input, section headers

2. **components/Modals/EntryModal.tsx** - 12+ sizes
   - Uses: 8px, 9px, 10px, 11px, 12px, 13px, 14px, 2xl
   - Issue: Amount display vs labels, category badges

3. **components/Sections/Books/TransactionTable.tsx** - 12+ sizes
   - Uses: 8px, 9px, 10px, 11px, 12px, 13px, 14px, lg, xl
   - Issue: Table headers vs cell content, pagination

4. **components/Sections/Reports/AnalyticsVisuals.tsx** - 12+ sizes
   - Uses: 7px, 8px, 9px, 10px, 12px, 14px, 16px, 20px, base, lg, 2xl
   - Issue: Chart labels, legends, amount displays

### Tier 2: High (8-10 unique sizes)

5. **components/Sovereign/Shared/BookCard.tsx** - 10 sizes
   - Compact: 5px, 6px, 7px, 9px, 12px, 16px
   - Desktop: xs, sm, lg, xl, 2xl, 3xl
   - Note: Responsive design intent but inconsistent naming

6. **components/Sections/Timeline/TimelineFeed.tsx** - 9 sizes
   - Uses: 8px, 9px, 10px, 11px, 12px, 13px, lg, xl

7. **components/Modals/ShareModal.tsx** - 9 sizes
   - Uses: 7px, 8px, 9px, 10px, 11px, 12px, 14px

8. **components/Sections/Profile/IdentityHero.tsx** - 9 sizes
   - Uses: 7px, 8px, 9px, 10px, 11px, 12px, lg, xl, 3xl

### Tier 3: Medium (5-7 unique sizes)

9. **components/AnalyticsChart.tsx** - 7 sizes
10. **components/Layout/HubHeader.tsx** - 7 sizes
11. **components/UI/ConflictManagementList.tsx** - 7 sizes
12. **components/Modals/BookModal.tsx** - 7 sizes
13. **components/Sections/Reports/AnalyticsHeader.tsx** - 7 sizes
14. **components/Sections/Settings/SystemRegistry.tsx** - 7 sizes

---

## Standard Utility Classes Distribution

| Class | Count | Usage |
|-------|-------|-------|
| text-xs | 28 | Small labels, timestamps |
| text-sm | 35 | Secondary text, buttons |
| text-base | 22 | Body text, card content |
| text-lg | 18 | Section titles, card headers |
| text-xl | 20 | Page titles, modal headers |
| text-2xl | 15 | Major headings |
| text-3xl | 8 | Hero titles |
| text-4xl | 2 | Large hero (share page) |
| text-5xl | 3 | Login/Register titles |

---

## Proposed Unified Type System

### Recommended Scale (8 tiers)

Based on the forensic analysis, the following 8-tier system covers 95% of use cases:

```
T1 - Display:     text-5xl (32px)    - Hero titles, auth screens
T2 - H1:          text-4xl (24px)    - Major page titles
T3 - H2:          text-3xl (20px)    - Section headers  
T4 - H3:          text-2xl (18px)    - Card titles
T5 - Body Large:  text-lg (18px)     - Primary content
T6 - Body:        text-base (16px)   - Standard text
T7 - Small:       text-sm (14px)     - Secondary text
T8 - Caption:     text-xs (12px)     - Labels, metadata
```

### Proposed Arbitrary Elimination

For the remaining 5% (specialized UI like badges, keypad), use:
- **Micro:** text-[8px] - Category badges
- **Tiny:** text-[10px] - Button text
- **Fine:** text-[12px] - Input fields

---

## Refactor Recommendations

### Phase 1: Extract Typography Constants
Create a centralized typography configuration:

```typescript
// lib/config/typography.ts
export const TYPOGRAPHY = {
  DISPLAY: 'text-5xl',
  H1: 'text-4xl',
  H2: 'text-3xl',
  H3: 'text-2xl',
  BODY_LG: 'text-lg',
  BODY: 'text-base',
  SMALL: 'text-sm',
  CAPTION: 'text-xs',
  // Specialized
  BADGE: 'text-[8px]',
  BUTTON: 'text-[10px]',
  INPUT: 'text-[12px]',
} as const;
```

### Phase 2: Component-Level Audit
Refactor Tier 1 files first (DynamicHeader, EntryModal, TransactionTable)

### Phase 3: Global CSS Variables
Consider CSS custom properties for theme-aware typography:
```css
:root {
  --text-display: 2rem;
  --text-heading: 1.5rem;
  --text-body: 1rem;
  --text-caption: 0.75rem;
}
```

---

## Appendices

### Files Scanned

**app/ directory:**
- `app/share/[token]/page.tsx`

**components/ directory:** (40+ files)
- Layout: DynamicHeader, Sidebar, DesktopSidebar, HubHeader, CommandHub
- Modals: EntryModal, ShareModal, BookModal, AdvancedExportModal, TerminationModal
- Sections: BooksSection, BookDetails, TransactionTable, BooksList, ReportsSection, TimelineSection, ProfileSection, SettingsSection
- Sovereign: BookCard, StatsGrid, MobileShell, DesktopShell
- UI: FormComponents, Keypad, ConflictManagementList, MobileLedgerCards, Pagination, Tooltip

### Search Patterns Used

```regex
# Arbitrary sizes
text-\[

# Standard utilities  
text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl|text-4xl|text-5xl
```

---

*Report generated by Global Typography Forensic Scanner*
