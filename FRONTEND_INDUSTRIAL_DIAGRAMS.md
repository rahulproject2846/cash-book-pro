# FRONTEND INDUSTRIAL-GRADE DIAGRAMS
## Vault Pro - Enterprise Cash-Book System

---

# 1. LAYOUT GRID DIAGRAM: The L-Frame Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DASHBOARD LAYOUT (L-FRAME)                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  BREAKPOINT: >= 768px (md)                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              GRID CONTAINER                                      │  │
│  │  md:grid-cols-[280px_1fr]  md:grid-rows-[auto_1fr]                              │  │
│  │                                                                                  │  │
│  │  ┌─────────────┬─────────────────────────────────────┬────────────────────────┐ │  │
│  │  │             │            HEADER (ROW 1)           │                        │ │  │
│  │  │   SIDEBAR   │  col-span-2                        │   DYNAMIC HEADER      │ │  │
│  │  │   (COL 1)   │  - Search Bar                      │   - Breadcrumb        │ │  │
│  │  │             │  - Sync Status                     │   - Action FAB        │ │  │
│  │  │  280px     │  - FAB Trigger                     │   - Context Actions   │ │  │
│  │  │  FIXED     │                                     │                        │ │  │
│  │  │             ├─────────────────────────────────────┤                        │ │  │
│  │  │             │         MAIN SLOT (ROW 2)           │                        │ │  │
│  │  │             │  col-span-1, row-span-1             │                        │ │  │
│  │  │             │                                     │                        │ │  │
│  │  │             │  ┌─────────────────────────────┐    │                        │ │  │
│  │  │             │  │   PLUG-AND-PLAY SLOT      │    │                        │ │  │
│  │  │             │  │                             │    │                        │ │  │
│  │  │             │  │   [BooksSection]           │    │                        │ │  │
│  │  │             │  │   [SettingsSection]         │    │                        │ │  │
│  │  │             │  │   [ProfileSection]         │    │                        │ │  │
│  │  │             │  │   [ReportsSection] *STUB*  │    │                        │ │  │
│  │  │             │  │   [TimelineSection]*STUB*  │    │                        │ │  │
│  │  │             │  │                             │    │                        │ │  │
│  │  │             │  └─────────────────────────────┘    │                        │ │  │
│  │  │             │  overflow-y-auto                   │                        │ │  │
│  │  └─────────────┴─────────────────────────────────────┴────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  BREAKPOINT: < 768px (Mobile)                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                        HEADER (Full Width)                               │    │  │
│  │  │  - Hamburger Menu (opens modal sidebar)                                 │    │  │
│  │  │  - Search Bar                                                           │    │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                  │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                     MAIN SLOT (Full Width)                               │    │  │
│  │  │  - Same sections as desktop                                             │    │  │
│  │  │  - CSS display toggle (not unmount)                                     │    │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘    │  │
│  │                                                                                  │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    BOTTOM NAV (FAB) - MOUNTED                            │    │  │
│  │  │  md:hidden  fixed bottom-6  z-index: 900                               │    │  │
│  │  │  [+ Add Entry] or [+ Add Book]                                          │    │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. NAVIGATION FLOWCHART: Book Selection → Header Morph → URL Update

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           NAVIGATION STATE MACHINE                                        │
│                                                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────────────────┐ │
│  │          │     │              │     │              │     │                         │ │
│  │  DASH    │────▶│   BOOKS     │────▶│   SELECT    │────▶│    BOOK DETAILS          │ │
│  │  BOARD   │     │   SECTION    │     │    BOOK     │     │                         │ │
│  │          │     │              │     │              │     │                         │ │
│  └──────────┘     └──────────────┘     └──────────────┘     └─────────────────────────┘ │
│       │                │                    │                      │                    │
│       │                │                    │                      │                    │
│       ▼                ▼                    ▼                      ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                         HEADER MORPHING LOGIC                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  IF: activeBook === null                                                   │   │ │
│  │  │      THEN: Show "My Books" + FAB (Add Book)                                │   │ │
│  │  │      ELSE: Show Book Name + Breadcrumb + FAB (Add Entry)                    │   │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                                 │
│       │                                                                                 │
│       ▼                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                         URL DEEP LINKING                                            │ │
│  │                                                                                     │ │
│  │   /page?tab=books              → effectiveSection = "books"                       │ │
│  │   /page?tab=settings            → effectiveSection = "settings"                   │ │
│  │   /page?tab=profile            → effectiveSection = "profile"                    │ │
│  │   /page?tab=reports            → effectiveSection = "reports" (STUB)             │ │
│  │   /page?tab=timeline           → effectiveSection = "timeline" (STUB)            │ │
│  │   /page?book=123                → effectiveBookId = "123"                        │ │
│  │                                                                                     │ │
│  │   Window.history.replaceState() called on every navigation                         │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. DATA-UI BRIDGE MAP: Dexie → Bridge Layer → UI Islands

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW: DEXIE TO UI ISLANDS                                 │
│                                                                                         │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                          OFFLINE DATABASE (DEXIE.JS)                               ║ │
│  ║                                                                                    ║ │
│  ║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    ║ │
│  ║   │              │  │              │  │              │  │                    │    ║ │
│  ║   │    books     │  │   entries    │  │   users      │  │    media           │    ║ │
│  ║   │   table      │  │    table     │  │    table     │  │      table         │    ║ │
│  ║   │              │  │              │  │              │  │                    │    ║ │
│  ║   │  - id        │  │  - id        │  │  - id        │  │  - id              │    ║ │
│  ║   │  - name      │  │  - bookId    │  │  - email     │  │  - cid             │    ║ │
│  ║   │  - balance   │  │  - amount    │  │  - sovereign │  │  - blob             │    ║ │
│  ║   │  - entries[] │  │  - type      │  │  - settings  │  │  - url              │    ║ │
│  ║   │              │  │  - date      │  │              │  │                    │    ║ │
│  ║   └──────────────┘  └──────────────┘  └──────────────┘  └────────────────────┘    ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝ │
│                                          │                                                │
│                                          │ useLiveQuery()                                │
│                                          ▼                                                │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                          BRIDGE LAYER (HOOKS)                                      ║ │
│  ║                                                                                    ║ │
│  ║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                    ║ │
│  ║   │                 │  │                 │  │                 │                    ║ │
│  ║   │  useBookImage()  │  │ useLocalPreview │  │  useProfile()   │                    ║ │
│  ║   │                 │  │     ()          │  │                 │                    ║ │
│  ║   │ - Dexie Query   │  │ - Dexie Query   │  │ - Dexie Query  │                    ║ │
│  ║   │ - Image URL     │  │ - Entry Data    │  │ - User Data    │                    ║ │
│  ║   │ - Lazy Loading  │  │ - Preview       │  │ - Settings     │                    ║ │
│  ║   │                 │  │                 │  │                 │                    ║ │
│  ║   └─────────────────┘  └─────────────────┘  └─────────────────┘                    ║ │
│  ║                                                                                    ║ │
│  ║   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                    ║ │
│  ║   │                 │  │                 │  │                 │                    ║ │
│  ║   │  useSettings()  │  │ useTranslation()│  │ useGuidance()   │                    ║ │
│  ║   │                 │  │                 │  │                 │                    ║ │
│  ║   │ - Dexie Query   │  │ - i18n JSON     │  │ - Help Flags    │                    ║ │
│  ║   │ - Theme         │  │ - Language      │  │ - Tooltips      │                    ║ │
│  ║   │ - Preferences   │  │ - Fallback      │  │                 │                    ║ │
│  ║   │                 │  │                 │  │                 │                    ║ │
│  ║   └─────────────────┘  └─────────────────┘  └─────────────────┘                    ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝ │
│                                          │                                                │
│                                          │ Returned Data                                 │
│                                          ▼                                                │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                    ZUSTAND STORE (STATE MANAGEMENT)                                 ║ │
│  ║                                                                                    ║ │
│  ║   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐              ║ │
│  ║   │                  │  │                  │  │                  │              ║ │
│  ║   │   bookSlice      │  │   entrySlice     │  │   syncSlice      │              ║ │
│  ║   │                  │  │                  │  │                  │              ║ │
│  ║   │ - books[]        │  │ - entries[]      │  │ - syncStatus     │              ║ │
│  ║   │ - activeBook     │  │ - activeEntry    │  │ - pendingOps     │              ║ │
│  ║   │ - loading        │  │ - filters        │  │ - lastSynced     │              ║ │
│  ║   │                  │  │                  │  │                  │              ║ │
│  ║   └──────────────────┘  └──────────────────┘  └──────────────────┘              ║ │
│  ║                                                                                    ║ │
│  ║   ┌──────────────────┐  ┌──────────────────┐                                      ║ │
│  ║   │                  │  │                  │                                      ║ │
│  ║   │   statsSlice     │  │   toastSlice     │                                      ║ │
│  ║   │                  │  │                  │                                      ║ │
│  ║   │ - totalBalance   │  │ - toasts[]       │                                      ║ │
│  ║   │ - incomeTotal    │  │ - undoStack     │                                      ║ │
│  ║   │ - expenseTotal   │  │                  │                                      ║ │
│  ║   │                  │  │                  │                                      ║ │
│  ║   └──────────────────┘  └──────────────────┘                                      ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝ │
│                                          │                                                │
│                                          │ getState() / subscribe()                     │
│                                          ▼                                                │
│  ╔═══════════════════════════════════════════════════════════════════════════════════╗ │
│  ║                      ISOLATED UI ISLANDS (COMPONENTS)                               ║ │
│  ║                                                                                    ║ │
│  ║   ┌─────────────────────────────┐  ┌───────────────────────────────────────────┐   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │     BooksSection            │  │     BooksList                             │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │  - BookCard[]               │  │  - Grid of BookCard                       │   ║ │
│  ║   │  - BooksList child          │  │  - Click → activeBook.set()               │   ║ │
│  ║   │  - AddBook FAB              │  │                                           │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   └─────────────────────────────┘  └───────────────────────────────────────────┘   ║ │
│  ║                                                                                    ║ │
│  ║   ┌─────────────────────────────┐  ┌───────────────────────────────────────────┐   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │     BookDetails             │  │     EntryModal                            │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │  - TransactionTable         │  │  - Add/Edit form                          │   ║ │
│  ║   │  - EntryCard[]              │  │  - Save → Dexie add()                    │   ║ │
│  ║   │  - StatsGrid                │  │  - Pusher emit                            │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   └─────────────────────────────┘  └───────────────────────────────────────────┘   ║ │
│  ║                                                                                    ║ │
│  ║   ┌─────────────────────────────┐  ┌───────────────────────────────────────────┐   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │     SettingsSection         │  │     ProfileSection                       │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   │  - InterfaceEngine          │  │  - IdentityHero                          │   ║ │
│  ║   │  - SystemRegistry           │  │  - SecurityForm                          │   ║ │
│  ║   │  - DangerZone               │  │  - DataSovereignty                        │   ║ │
│  ║   │                             │  │                                           │   ║ │
│  ║   └─────────────────────────────┘  └───────────────────────────────────────────┘   ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. PHYSICS PROFILE: Apple-Standard Animation Constants

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                    PHYSICS PROFILE: SPRING ANIMATION CONSTANTS                          │
│                              Apple-Human Interface Guidelines                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIGURATION #1: ROYAL GLIDE (Default Layout Transitions)                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  PROPERTY          │  VALUE        │  DESCRIPTION                           │  │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤  │ │
│  │  │  stiffness         │  300          │  Medium resistance - elegant feel   │  │ │
│  │  │  damping          │  35           │  Smooth settling                      │  │ │
│  │  │  mass              │  1            │  Standard mass                        │  │ │
│  │  │  duration          │  ~0.4s        │  Natural feel                         │  │ │
│  │  │  velocity          │  -            │  Preserved                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│  │  USAGE: Sidebar collapse, Section swaps, Header morphing                        │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIGURATION #2: MODAL ENTRY (Dialog Animations)                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  PROPERTY          │  VALUE        │  DESCRIPTION                           │  │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤  │ │
│  │  │  stiffness         │  400          │  Slightly faster                      │  │ │
│  │  │  damping           │  30            │  Quick settle                         │  │ │
│  │  │  mass              │  -            │  Default                               │  │ │
│  │  │  duration          │  ~0.25s       │  Snappy response                      │  │ │
│  │  │  velocity          │  -            │  Preserved                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│  │  USAGE: EntryModal, BookModal, ConflictResolverModal                           │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIGURATION #3: TOGGLE SWITCH (Instant Feedback)                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  PROPERTY          │  VALUE        │  DESCRIPTION                           │  │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤  │ │
│  │  │  stiffness         │  500          │  High response                        │  │ │
│  │  │  damping           │  30           │  Minimal overshoot                    │  │ │
│  │  │  mass              │  -            │  Default                               │  │ │
│  │  │  duration          │  ~0.15s       │  Immediate feedback                   │  │ │
│  │  │  velocity          │  -            │  Preserved                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│  │  USAGE: InterfaceEngine toggles, Theme switch, Language select                  │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIGURATION #4: QUICK TAP (Micro-Interactions)                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  PROPERTY          │  VALUE        │  DESCRIPTION                           │  │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤  │ │
│  │  │  stiffness         │  400          │  Balanced response                     │  │ │
│  │  │  damping           │  25           │  Slight bounce                        │  │ │
│  │  │  mass              │  -            │  Default                               │  │ │
│  │  │  duration          │  ~0.2s        │  Quick feel                           │  │ │
│  │  │  velocity          │  -            │  Preserved                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│  │  USAGE: BookCard hover, Button press, UndoToast appear                          │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐ │
│  │  CONFIGURATION #5: MOBILE NAV (Bottom Navigation)                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │  PROPERTY          │  VALUE        │  DESCRIPTION                           │  │ │
│  │  ├─────────────────────────────────────────────────────────────────────────────┤  │ │
│  │  │  stiffness         │  300          │  Gentle entry                          │  │ │
│  │  │  damping           │  35           │  Smooth arrival                        │  │ │
│  │  │  mass              │  1            │  Heavy feel - no bounce               │  │ │
│  │  │  duration          │  ~0.4s        │  Predictable                          │  │ │
│  │  │  velocity          │  -            │  Preserved                            │  │ │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │ │
│  │  USAGE: BottomNav show/hide, FAB appear, Mobile sidebar modal                  │ │
│  └───────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                              SPRING PHYSICS LEGEND                                      │
│                                                                                         │
│   STIFFNESS (Tension):                                                                  │
│   ├── 100-200 = Loose, bouncy (rubber band)                                          │
│   ├── 300-400 = Standard, balanced (Apple default)                                   │
│   └── 500-600 = Tight, snappy (toggle switches)                                      │
│                                                                                         │
│   DAMPING (Friction):                                                                   │
│   ├── 15-25 = Bouncy, oscillatory (spring)                                           │
│   ├── 30-35 = Smooth, natural (Apple standard)                                        │
│   └── 45-60 = Overdamped, no bounce (heavy doors)                                    │
│                                                                                         │
│   MASS (Inertia):                                                                       │
│   ├── 0.5 = Light, quick acceleration                                                 │
│   ├── 1.0 = Standard (Apple default)                                                  │
│   └── 2.0 = Heavy, slow acceleration                                                  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 5. COMPONENT LIFECYCLE STATE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         COMPONENT MOUNT/UNMOUNT STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   MOBILE (< 768px)                                                                     │
│   ════════════════                                                                     │
│                                                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │             │    │             │    │             │    │             │            │
│   │   Sidebar   │───▶│  UNMOUNTED  │    │   BottomNav │───▶│   MOUNTED   │            │
│   │             │    │             │    │             │    │             │            │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘            │
│        │                     ▲              │                    ▲                   │
│        │                     │              │                    │                   │
│        │              hidden md:block       │             md:hidden                   │
│        │                     │              │                    │                   │
│        ▼                     │              ▼                    │                   │
│   ┌─────────────┐           │         ┌─────────────┐           │                   │
│   │             │           │         │             │           │                   │
│   │   MOUNTED   │           │         │   UNMOUNTED │           │                   │
│   │             │           │         │             │           │                   │
│   └─────────────┘           │         └─────────────┘           │                   │
│                             │                                   │                   │
│   DESKTOP (>= 768px)        │       DESKTOP (>= 768px)          │                   │
│   ══════════════════        │       ══════════════════          │                   │
│                             │                                   │                   │
│   SECTION SWITCHING (All Breakpoints)                                              │
│   ════════════════════════════════                                                   │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────┐     │
│   │                                                                              │     │
│   │   [BooksSection]      [SettingsSection]    [ProfileSection]    [Reports]    │     │
│   │        │                    │                   │                  │         │     │
│   │        │                    │                   │                  │         │     │
│   │        ▼                    ▼                   ▼                  ▼         │     │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │     │
│   │   │                    CSS display TOGGLE                              │   │     │
│   │   │                                                                     │   │     │
│   │   │  className = { section === 'books' ? 'block' : 'hidden' }        │   │     │
│   │   │                                                                     │   │     │
│   │   │  ⚠️ NOT UNMOUNTED - Only hidden via CSS display property          │   │     │
│   │   │                                                                     │   │     │
│   │   └─────────────────────────────────────────────────────────────────────┘   │     │
│   │                                    │                                           │     │
│   │                                    │ AnimatePresence mode="wait"              │     │
│   │                                    ▼                                           │     │
│   │   ┌─────────────────────────────────────────────────────────────────────┐   │     │
│   │   │                    ANIMATION WRAPPER                               │   │     │
│   │   │                                                                     │   │     │
│   │   │  <motion.div key={effectiveSection}                               │   │     │
│   │   │        initial={{ opacity: 0, y: 20 }}                            │   │     │
│   │   │        animate={{ opacity: 1, y: 0 }}                            │   │     │
│   │   │        exit={{ opacity: 0, y: -20 }}>                             │   │     │
│   │   │                                                                     │   │     │
│   │   └─────────────────────────────────────────────────────────────────────┘   │     │
│   │                                                                              │     │
│   └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 6. FILE STRUCTURE: Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         VAULT PRO COMPONENT HIERARCHY                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  app/                                                                                  │
│  ├── page.tsx                               ← MAIN ENTRY POINT                         │
│  │   └── DashboardLayout                                                       │
│  │       ├── Sidebar (280px, desktop only)                                        │
│  │       │   ├── NavItem: Books                                                │
│  │       │   ├── NavItem: Reports (STUB)                                        │
│  │       │   ├── NavItem: Timeline (STUB)                                       │
│  │       │   ├── NavItem: Settings                                              │
│  │       │   └── SyncProgressBar                                                │
│  │       │                                                                         │
│  │       ├── DynamicHeader (morphs based on activeBook)                          │
│  │       │   ├── BreadcrumbPath                                                │
│  │       │   ├── SearchBar                                                     │
│  │       │   ├── SyncStatus                                                    │
│  │       │   └── FAB Trigger                                                   │
│  │       │                                                                         │
│  │       └── MainSlot (PLUG-AND-PLAY)                                          │
│  │           └── AnimatePresence                                                │
│  │               ├── BooksSection                                               │
│  │               │   ├── BooksList                                             │
│  │               │   │   └── BookCard                                          │
│  │               │   │       └── [useBookImage hook]                          │
│  │               │   │                                                         │
│  │               │   └── BookDetails  ← TRUE ISLAND (unmounts)                │
│  │               │       ├── TransactionTable                                  │
│  │               │       ├── EntryCard                                        │
│  │               │       └── StatsGrid                                         │
│  │               │                                                             │
│  │               ├── SettingsSection                                           │
│  │               │   ├── InterfaceEngine                                       │
│  │               │   ├── SystemRegistry                                        │
│  │               │   └── DangerZone                                            │
│  │               │                                                             │
│  │               ├── ProfileSection                                            │
│  │               │   ├── IdentityHero                                          │
│  │               │   ├── SecurityForm                                          │
│  │               │   ├── DataSovereignty                                       │
│  │               │   └── ProtocolAuditLog                                       │
│  │               │                                                             │
│  │               ├── ReportsSection (STUB - placeholder only)                 │
│  │               │                                                             │
│  │               └── TimelineSection (STUB - placeholder only)                │
│  │                                                                           │
│  ├── Modals/                                                                     │
│  │   ├── ModalPortal                                                            │
│  │   ├── EntryModal            ← Dexie write → Pusher emit                    │
│  │   ├── BookModal                                                            │
│  │   ├── ConflictResolverModal                                                │
│  │   ├── ShareModal                                                           │
│  │   └── ActionMenuModal                                                       │
│  │                                                                           │
│  hooks/                                                                          │
│  ├── useBookImage.ts           ← Bridge: Dexie → URL                          │
│  ├── useLocalPreview.ts       ← Bridge: Dexie → Preview                      │
│  ├── useProfile.ts             ← Bridge: Dexie → User Data                    │
│  ├── useSettings.ts            ← Bridge: Dexie → Theme/Config                 │
│  ├── useTranslation.ts         ← i18n → UI strings                            │
│  └── useGuidance.ts            ← Help flags → Tooltips                        │
│                                                                                  │
│  lib/vault/store/                                                              │
│  ├── slices/                                                                   │
│  │   ├── bookSlice.ts         ← books[] from Dexie                            │
│  │   ├── entrySlice.ts        ← entries[] from Dexie                         │
│  │   ├── syncSlice.ts         ← sync state management                        │
│  │   ├── statsSlice.ts        ← computed totals                              │
│  │   └── toastSlice.ts        ← notification queue                          │
│  └── index.ts (Zustand store)                                                 │
│                                                                                  │
│  lib/offlineDB.ts              ← Dexie initialization                         │
│  └── db.ts                                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Generated**: March 11, 2026  
**System**: Vault Pro - Enterprise Offline-First Cash-Book  
**Style**: Industrial Engineering (Google/SmartDraw Standard)