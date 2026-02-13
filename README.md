This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


git add .
git commit -m "fix: update saveBook signature to accept editTarget"
git push origin main



CASH-BOOK-APP
├─ .next/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  │  ├─ delete/
│  │  │  │  └─ route.ts
│  │  │  ├─ forgot-password/
│  │  │  │  └─ route.ts
│  │  │  ├─ google/
│  │  │  │  └─ route.ts
│  │  │  ├─ login/
│  │  │  │  └─ route.ts
│  │  │  ├─ register/
│  │  │  │  └─ route.ts
│  │  │  ├─ update/
│  │  │  │  └─ route.ts
│  │  │  └─ verify/
│  │  │     └─ route.ts
│  │  ├─ books/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  └─ share/
│  │  │     └─ route.ts
│  │  ├─ entries/
│  │  │  ├─ [id]/
│  │  │  │  └─ route.ts
│  │  │  ├─ all/
│  │  │  │  └─ route.ts
│  │  │  └─ status/
│  │  │     └─ [id]/
│  │  │        └─ route.ts
│  │  ├─ public/
│  │  │  └─ [token]/
│  │  │     └─ route.ts
│  │  ├─ stats/
│  │  │  └─ global/
│  │  │     └─ route.ts
│  │  ├─ user/
│  │  │  └─ settings/
│  │  │     └─ route.ts
│  │  └─ share/
│  │     └─ [token]/
│  │        └─ page.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ manifest.ts
│  ├─ page.tsx
│  └─ providers.tsx
├─ components/
│  ├─ Auth/
│  │  ├─ views/
│  │  │  ├─ ForgotPassView.tsx
│  │  │  ├─ LoginView.tsx
│  │  │  ├─ OtpView.tsx
│  │  │  ├─ RegisterView.tsx
│  │  │  └─ SocialAuth.tsx
│  │  ├─ AuthScreen.tsx
│  │  └─ index.ts
│  ├─ Layout/
│  │  ├─ CommandHub.tsx
│  │  ├─ DashboardLayout.tsx
│  │  ├─ DynamicHeader.tsx
│  │  └─ HubHeader.tsx
│  ├─ Modals/
│  │  ├─ AdvancedExportModal.tsx
│  │  ├─ BookModal.tsx
│  │  ├─ EntryModal.tsx
│  │  ├─ index.tsx
│  │  ├─ ModalPortal.tsx
│  │  ├─ ModalRegistry.tsx
│  │  └─ ShareModal.tsx
│  ├─ Sections/
│  │  ├─ Books/
│  │  │  ├─ BookDetails.tsx
│  │  │  ├─ BooksList.tsx
│  │  │  ├─ BooksSection.tsx
│  │  │  ├─ DetailsToolbar.tsx
│  │  │  ├─ MobileFilterSheet.tsx
│  │  │  ├─ MobileTransactionCards.tsx
│  │  │  ├─ StatsGrid.tsx
│  │  │  └─ TransactionTable.tsx
│  │  ├─ Profile/
│  │  │  ├─ DangerZone.tsx
│  │  │  ├─ DataSovereignty.tsx
│  │  │  ├─ IdentityHero.tsx
│  │  │  ├─ ProfileSection.tsx
│  │  │  ├─ ProtocolAuditLog.tsx
│  │  │  └─ SecurityForm.tsx
│  │  ├─ Reports/
│  │  │  ├─ AnalyticsHeader.tsx
│  │  │  ├─ AnalyticsStats.tsx
│  │  │  ├─ AnalyticsVisuals.tsx
│  │  │  └─ ReportsSection.tsx
│  │  ├─ Settings/
│  │  │  ├─ ExperienceModule.tsx
│  │  │  ├─ GovernanceModule.tsx
│  │  │  ├─ RegionModule.tsx
│  │  │  ├─ SettingsHeader.tsx
│  │  │  ├─ SettingsSection.tsx
│  │  │  └─ SystemMaintenance.tsx
│  │  ├─ Timeline/
│  │  │  ├─ TimelineFeed.tsx
│  │  │  ├─ TimelineMobileCards.tsx
│  │  │  ├─ TimelineSection.tsx
│  │  │  └─ TotalStats.tsx
│  │  └─ UI/
│  │     ├─ AnalyticsChart.tsx
│  │     ├─ CustomSelect.tsx
│  │     ├─ EliteDropdown.tsx
│  │     ├─ EntryRow.tsx
│  │     ├─ ExportTools.tsx
│  │     ├─ FilterBar.tsx
│  │     ├─ FormComponents.tsx
│  │     ├─ SortDropdown.tsx
│  │     ├─ Tooltip.tsx
│  │     └─ time-range-selector.tsx
│  ├─ context/
│  │  ├─ ModalContext.tsx
│  │  └─ TranslationContext.tsx
│  ├─ hooks/
│  │  ├─ useGuidance.ts
│  │  ├─ useProfile.ts
│  │  ├─ useSettings.ts
│  │  ├─ useTranslation.ts
│  │  └─ useVault.ts
│  └─ MasterTransactionCard.tsx
├─ lib/
│  ├─ utils/
│  │  └─ helpers.ts
│  └─ vault/
│     ├─ db.ts
│     ├─ exportUtils.ts
│     ├─ mail.ts
│     ├─ offlineDB.ts
│     ├─ SyncOrchestrator.ts
│     └─ translations.ts
├─ models/
│  ├─ Book.ts
│  ├─ Entry.ts
│  └─ User.ts
├─ node_modules/
├─ public/
├─ .env.local
├─ .gitignore
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ README.md
├─ structure.txt
├─ tailwind.config.ts
└─ tsconfig.json




BTN_CREATE_VAULT
TT_ACCOUNT-SETTING
NET_ASSET
TT_CHANGE_SORT_ORDER
TT_IMPORT_LEDGER
TT_INFLOW
TT_OUTFLOW
TT_PENDING
TT_SURPLUS
TT_FILTER_VATEGORY
LABEL_DATE	
LABEL_TIME	
LABEL_REF_ID	
LABEL_MEMO	
LABEL_STATUS	
LABEL_OPTIONS
TT_TOGGLE_STATUS
PROTOCOL_ARCHIVE
RECORDS_ANALYZED
DESC_INFLOW
DESC_OUTFLOW
DESC_PENDING
DESC_SURPLUS
EXECUTE_REPORT_TITLE
execute_report_desc
BTN_EXECUTE_ARCHIVE
RECORDS_FOUND
TT_FILTER_BY
TT_FILTER_BY_FILTER_TYPE
PROTOCOL_INDEX
GOVERNANCE_ACTIVE
NODE_ONLINE
PLACEHOLDER_NEW_TAG
LABEL_MONTHLY_CAP
TITLE_INITIALIZE_VAULT
LABEL_VISUAL_ID
placeholder_ledger_name
placeholder_vault_memo
type_general
type_customer
type_supplier
VIA_PROTOCOL
category_general
category_amount
category_title
category_all
category_general
category_salary
category_food
category_rent
category_shopping
category_date
category_income
category_expense
ACTION_ACCOUNT_SETTINGS
LABEL_INTEGRITY
TT_UPLOAD_PHOTO
TT_REMOVE_PHOTO
TT_VAULT_AUTH
LABEL_STANDARD_IDENTITY
TT_NETWORK_STABLE
LABEL_RANK_MASTER
DATA_SOVEREIGNTY_TITLE
TT_ARCHIVE_STATUS
ACTION_BACKUP
ACTION_RESTORE
AUDIT_LOG_TITLE
TT_AUDIT_LOG
TT_MONITOROING
TT_EVENT_IDENTITY
TT_EVENT_BACKUP
TT_EVENT_SESSION
time_just_now
time_2h_ago
event_identity_updated
event_backup_exported
event_session_verified
time_yesterday
audit_node_info
DATA_SOVEREIGNTY_TITLE
TT_SOVEREIGNTY_DESC
TT_RESTORE_IDENTITY
TT_BACKUP_IDENTITY
data_sovereignty_desc
ACTION_RESTORE
ACTION_BACKUP
TT_DENGER_NODE
TT_TERMINATOR_WARNING
IDENTITY_VERIFIED




TT_INTEGRITY_SCORE






AUTH_SECURITY_PORTAL
placeholder_email
current-password
auth_forgot_key
BTN_UNSEAL
BTN_LINK_GOOGLE
auth_new_operator
BTN_INITIALIZE
BIOMETRIC_ID
CLOUD_SYNC
VAULT_PRO_SPLIT_1
auth_tagline
AUTH_FORGOT_KEY_TITLE
auth_forgot_desc
placeholder_email
BTN_SEND_RECOVERY
BTN_BACK_TO_LOGIN
AUTH_SECURE_TRANSACTION
TITLE_PROTOCOL_INIT
auth_create_identity
placeholder_name
placeholder_key
BTN_REQUEST_CODE
BTN_UNSEA
auth_existing_operator
TITLE_PROTOCOL_VERIFY
AUTH_PROTO_DISPATCHED
LABEL_ENTRY_KEY
BTN_ADJUST_DETAIL
BTN_CONFIRM_IDENTITY





















🔍 VAULT PRO DEEP AUDIT - TECHNICAL BLUEPRINT
📊 DATA SCHEMA ANALYSIS
🗃️ DEXIE DATABASE TABLES (Version 5)
Table	Primary Keys	Indexes	Purpose
books	++localId (auto-increment), _id (server string)	userId, &cid, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned	Local-first book storage with dual ID system
entries	++localId (auto-increment), _id (server string)	&cid, bookId, userId, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned	Transaction entries with book relationship
users	_id (server string)	None	User authentication data
telemetry	++id (auto-increment)	type, synced, timestamp	System logging and debugging
audits	++id (auto-increment)	type, level, timestamp, sessionId, userId	Comprehensive audit framework
🔑 CRITICAL ID SYSTEM
Dual ID Architecture:

localId: Auto-increment number (Dexie primary key)
_id: Server-generated string (MongoDB ObjectId)
cid: Client-generated unique identifier (cid_${timestamp}_${random})
Type Safety Issues Identified:

bookId declared as string in schema but can be number in legacy data
Server sends string IDs, local Dexie uses number primary keys
Mixed type comparisons causing filter failures
🔄 DATA FLOW MAP: NEW ENTRY LIFECYCLE
UI INPUT
    ↓
useVaultActions.saveEntry()
    ↓
[VALIDATION] Checksum generation + CID creation
    ↓
[LOCAL DB] db.entries.put() with localId + synced: 0
    ↓
[UI REACTIVITY] setForceRefresh() triggers useLiveQuery
    ↓
[SYNC ORCHESTRATOR] triggerSync() detects synced: 0
    ↓
[SERVER POST] /api/entries with checksum validation
    ↓
[PUSHER SIGNAL] vault_channel_${userId} → sync_signal
    ↓
[REALTIME ENGINE] enforceServerFirstAuthority()
    ↓
[LOCAL UPDATE] db.entries.update() with server _id + synced: 1
    ↓
[UI REFRESH] dispatchDatabaseUpdate() → useLiveQuery → UI
⚙️ SYNC ENGINE ARCHITECTURE
SyncOrchestrator Core Logic
Two-Phase Sync System:

PUSH (Local → Server)
Scans synced: 0 records
Batch processing with BATCH_SIZE = 50
Atomic ID Bridge updates during book sync
Conflict resolution with vKey comparison
PULL (Server → Local)
Hydration with timestamp-based queries
Batch processing in chunks of 50
Duplicate prevention via CID lookup
ID Bridge maintains referential integrity
Critical Sync Components
Component	Role	Key Files
SyncOrchestrator	Main sync coordinator	lib/vault/SyncOrchestrator.ts
RealtimeEngine	Pusher signal handler	lib/vault/core/RealtimeEngine.ts
ShadowManager	Emergency storage handling	lib/vault/core/ShadowManager.ts
SecurityGate	System block/validation	lib/vault/core/SecurityGate.ts
🔗 ID BRIDGE ANALYSIS
Files Manipulating bookId/localId:
lib/vault/SyncOrchestrator.ts
typescript
// Lines 149-166: Atomic ID Bridge in triggerSync
await db.entries.where('bookId').equals(String(book.localId)).modify({ 
  bookId: String(sId), // String conversion critical
  synced: 1, 
  updatedAt: Date.now() 
});
hooks/vault/useVaultState.ts
typescript
// Lines 61-69: Type-neutral filtering
const selectedId = String(currentBook?._id || currentBook?.localId || '');
const entryBookId = String(entry.bookId || '');
const matchesBookId = entryBookId === selectedId;
hooks/vault/useVaultActions.ts
typescript
// Line 54: bookId assignment in saveEntry
bookId: currentBook?._id || currentBook?.localId || bookId,
lib/vault/core/RealtimeEngine.ts
typescript
// Lines 147-163: ID Bridge in realtime updates
await db.entries.where('bookId').equals(String(localRecord.localId)).modify({
  bookId: serverData._id,
  synced: 1,
  updatedAt: Date.now()
});
🕸️ DEPENDENCY GRAPH
Hook Dependencies:
useVault (Main Hook)
├── useVaultState
│   ├── useLiveQuery (dexie-react-hooks)
│   ├── db (offlineDB)
│   └── VaultUtils (normalizeTimestamp)
├── useVaultActions
│   ├── db (offlineDB)
│   ├── generateCID, generateChecksum (offlineDB)
│   └── VaultUtils (logVaultError)
└── useVaultCalculations
    ├── db (offlineDB)
    └── VaultUtils (normalizeTimestamp)
Core Dependencies:
SyncOrchestrator
├── VaultUtils (safeDexieLookup, safeDexiePut, isNewerRecord)
├── ShadowManager (broadcast)
├── SecurityGate (checkSecurityStatus)
├── RealtimeEngine (constructor)
└── db (offlineDB)
👻 ORPHANED ENTRY HUNT
Root Causes Identified:
Type Mismatch Issues:
Legacy entries have numeric bookId
Server sends string bookId
Filter comparisons fail silently
ID Bridge Failures:
Missing atomic updates during sync
Race conditions between push/pull
Incomplete cleanup of old references
Timing Issues:
UI queries before ID Bridge completes
Stale cache during sync operations
Critical Code Locations:
High Risk:

typescript
// hooks/vault/useVaultState.ts:67-69
const entryBookId = String(entry.bookId || '');
const matchesBookId = entryBookId === selectedId;
// Risk: Empty bookId strings match empty selectedId
Medium Risk:

typescript
// lib/vault/SyncOrchestrator.ts:74
const legacyEntries = await db.entries.where('bookId').equals('').toArray();
// Risk: Only catches empty strings, not numeric values
🔍 GHOST FILE AUDIT
Missing/Referenced Files:
Referenced File	Status	Location
apply-optimistic-ops.ts	NOT FOUND	Referenced in error logs
cache-middleware.ts	NOT FOUND	Referenced in error logs
dexieHelpers.ts	CONSOLIDATED	Merged into VaultUtils.ts
utils/helpers.ts	CONSOLIDATED	Merged into VaultUtils.ts
Node Modules Check:
No optimistic middleware found in node_modules
References likely from previous development iterations
Current codebase uses consolidated VaultUtils.ts
🎯 CRITICAL FINDINGS & RECOMMENDATIONS
🚨 IMMEDIATE ISSUES:
Type Safety Gap:
typescript
// PROBLEM: bookId can be number or string
interface LocalEntry {
  bookId: string; // But legacy data has numbers
}
Incomplete Cleanup:
typescript
// PROBLEM: Only catches empty strings
const legacyEntries = await db.entries.where('bookId').equals('').toArray();
// MISSING: Numeric bookId values
Race Condition:
typescript
// PROBLEM: UI can query before ID Bridge completes
await db.entries.where('bookId').equals(String(book.localId)).modify({...});
// No await for completion before UI refresh
🔧 RECOMMENDED FIXES:
Enhanced Cleanup:
typescript
// Fix all legacy bookId types
const allEntries = await db.entries.toArray();
const orphanedEntries = allEntries.filter(e => 
  typeof e.bookId === 'number' || e.bookId === ''
);
Type Safety:
typescript
// Union type for bookId
interface LocalEntry {
  bookId: string | number;
}
Atomic Operations:
typescript
// Ensure ID Bridge completes before UI refresh
await db.transaction('rw', [db.entries, db.books], async () => {
  // All ID Bridge operations here
});
📋 SOURCE OF TRUTH SUMMARY
Data Flow Integrity:
✅ Schema: Dual ID system (localId + _id) properly defined
✅ Sync: Batch processing with atomic operations
⚠️ Type Safety: Mixed string/number bookId handling
⚠️ Cleanup: Incomplete legacy data handling
✅ Real-time: Pusher integration with proper channels
Root Cause of "0 Data" Issue:
Primary: Type mismatch in bookId filtering
Secondary: Incomplete ID Bridge updates
Tertiary: Race conditions during sync
Immediate Action Items:
Fix type safety in LocalEntry.bookId
Enhance cleanup to handle numeric bookId values
Add transaction boundaries for ID Bridge operations
Implement comprehensive data validation
This blueprint provides the complete technical foundation needed to resolve the sync engine and UI data visibility issues with 100% logic accuracy.