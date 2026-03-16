# TRANSACTION TABLE & FILTER INTEGRITY AUDIT

## 1. TransactionTable.tsx - Full Code Analysis

### Location
`components/Sections/Books/TransactionTable.tsx`

### Card View Switch Logic (Lines 141-151)
```tsx
{/* 📱 MOBILE VIEW (Visible on Small Screens) */}
<div className="xl:hidden grid grid-cols-1 gap-4 p-4">
    {visibleEntries.map((e: any, idx: number) => (
        <TransactionCard 
            key={e.cid || e.localId || idx}
            e={e} idx={idx} onEdit={onEdit} onDelete={onDelete} 
            onContextMenu={handleContextMenu} language={language}
            formatDate={formatDate} t={t} currencySymbol={currencySymbol}
        />
    ))}
</div>
```

### Desktop Table View (Lines 153-212)
```tsx
{/* 🖥️ DESKTOP VIEW (Visible on Large Screens Only) */}
<div className="hidden xl:block w-full overflow-hidden apple-glass rounded-[40px] border border-[var(--border)] shadow-2xl">
    <div className="grid-header px-8 py-5 bg-[var(--bg-app)]/30 border-b border-[var(--border)]">
        <div className="grid grid-cols-11 gap-4 text-[10px] font-black text-[var(--text-muted)] opacity-50">
            <div className="text-left">#</div>
            <div className="text-left">{t('label_date')}</div>
            <div className="text-left">{t('label_time')}</div>
            <div className="text-left">{t('label_ref_id')}</div>
            <div className="text-left">{t('label_protocol')}</div>
            <div className="text-left">{t('label_memo')}</div>
            <div className="text-left">{t('label_tag')}</div>
            <div className="text-left">{t('label_via')}</div>
            <div className="text-right">{t('label_amount')}</div>
            <div className="text-center">{t('label_status')}</div>
            <div className="text-right">{t('label_options')}</div>
        </div>
    </div>
    {/* Table rows continue... */}
</div>
```

### TransactionCard Component (Lines 18-75)
The card component for mobile view - **MARKED FOR DELETION** in the merger.

---

## 2. DetailsToolbar.tsx - Filter Bar Logic

### Location
`components/Sections/Books/DetailsToolbar.tsx`

### Source
This component uses **HubHeader** (NOT local to BookDetails).

### Filter States Used (Lines 14-18)
```tsx
const {
    entrySortConfig, entryCategoryFilter, entrySearchQuery,
    setEntrySortConfig, setEntryCategoryFilter, setEntrySearchQuery,
    processedEntries, allEntries, setMobileFilterOpen
} = useVaultState();
```

### HubHeader Usage (Lines 60-126)
```tsx
<HubHeader
    title={t('ledger_live_feed') || "RECORDS"}
    subtitle={subtitle}
    icon={Zap}
    searchQuery={entrySearchQuery}
    onSearchChange={setEntrySearchQuery}
    sortOption={getSortOption()}
    sortOptions={['Date', 'Amount', 'Title']}
    onSortChange={handleSortChange}
    hideIdentity={true}
    fullWidthSearch={true}
>
    {/* Mobile Filter Button */}
    <button
        onClick={() => setMobileFilterOpen(true)}
        className="md:hidden h-11 w-11..."
    >
        <Filter size={14} />
    </button>
    
    {/* Classification Menu */}
    <AppleMenu
        trigger={<button>...</button>}
        headerText="CLASSIFICATION"
    >
        {categories.map((opt: string) => (...))}
    </AppleMenu>
</HubHeader>
```

---

## 3. BookDetails.tsx - Component Placement

### Location
`components/Sections/Books/BookDetails.tsx`

### Filter Components (Lines 133-137)
```tsx
{/* --- ২. CONTROL HUB (Search & Filter) --- */}
<div className="space-y-4">
    <DetailsToolbar />
    <MobileFilterSheet />
</div>
```

### Table/Card Rendering (Lines 145-167)
```tsx
{/* Mobile View: Swipe Cards with Date Grouping */}
{isMobile && (
    <MobileLedgerCards
        groupedEntries={groupedEntries}
        isGrouped={true}
        onEdit={handleMobileEdit}
        onDelete={handleMobileDelete}
        onToggleStatus={handleMobileToggleStatus}
        currencySymbol={currencySymbol}
        deleteEntry={deleteEntry}
    />
)}

{/* Desktop View: Original Table */}
{!isMobile && (
    <MemoizedTransactionTable 
        items={processedEntries}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        currencySymbol={currencySymbol}
    />
)}
```

---

## 4. Filter States in Vault Store

### Store Location
`lib/vault/store/index.ts`

### States
| State | Setter | Purpose |
|-------|--------|---------|
| `entrySearchQuery` | `setEntrySearchQuery` | Search text |
| `entrySortConfig` | `setEntrySortConfig` | Sort key & direction |
| `entryCategoryFilter` | `setEntryCategoryFilter` | Category filter |
| `setMobileFilterOpen` | - | Mobile filter sheet toggle |

---

## 5. Card Components for Deletion

### TransactionCard (Lines 18-75 in TransactionTable.tsx)
- Renders individual transaction cards for mobile
- Uses `xl:hidden` to hide on large screens
- **TO BE REMOVED** when merging filter into table

### MobileLedgerCards (imported in BookDetails.tsx)
- Used when `isMobile === true`
- Renders grouped cards by date
- **TO BE REMOVED** when merging

---

## 6. Merger Mapping

### To Move Filter INTO Table Header:
1. **Extract from DetailsToolbar:**
   - Search input (entrySearchQuery)
   - Sort dropdown (entrySortConfig) 
   - Category filter (entryCategoryFilter)

2. **Add to TransactionTable.tsx:**
   - Add filter row at top of table
   - Use existing states from vault store
   - Remove HubHeader dependency

3. **Remove:**
   - DetailsToolbar component usage in BookDetails
   - HubHeader import in DetailsToolbar
   - TransactionCard component (mobile view)
   - MobileLedgerCards usage
   - MobileFilterSheet (if no longer needed)

### Visual Structure After Merger:
```
┌─────────────────────────────────────────────────────┐
│  HEADER: [Search] [Sort ▼] [Category ▼]           │
├─────────────────────────────────────────────────────┤
│  TABLE ROW 1                                        │
│  TABLE ROW 2                                        │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

---

## 7. Key CSS Breakpoints

| Breakpoint | View |
|------------|------|
| `xl:hidden` | Mobile cards (TransactionCard) |
| `hidden xl:block` | Desktop table |
| `md:hidden` | Mobile filter button |
| `isMobile` (JS) | MobileLedgerCards |

---

## Summary

- **Filter Source:** HubHeader inside DetailsToolbar
- **Card Switch:** CSS classes `xl:hidden` / `hidden xl:block`
- **States:** Managed in vault store (entrySearchQuery, entrySortConfig, entryCategoryFilter)
- **Card Components:** TransactionCard (inline) + MobileLedgerCards (imported)
- **Merge Action:** Extract filters from HubHeader → Add to TransactionTable header row
