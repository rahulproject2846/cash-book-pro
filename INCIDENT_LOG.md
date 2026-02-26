🚨 INCIDENT LOG (Architectural Battle History)
Project: Cash-Book (Holy Grail Architecture)
Maintained by: Master Architect & Lead Developer
IR-2026-02-22: The Infinite Refresh Loop
Severity: 🔴 Critical | Status: ✅ Resolved
1. Summary
The application entered an infinite refresh cycle during tab synchronization, causing the UI to freeze with a permanent spinner.
2. Root Cause
SyncOrchestrator was broadcasting refresh signals via BroadcastChannel without a sourceTabId. Each tab (including the sender) received the message and triggered a fresh broadcast, creating a feedback loop.
3. Resolution
Implemented a unique tabId for each session. Updated SyncOrchestrator to ignore broadcast events where event.sourceTabId === currentTabId.
IR-2026-02-24: E11000 Duplicate Key Crash
Severity: 🔴 Critical | Status: ✅ Resolved
1. Summary
New books could not be saved or deleted. MongoDB reported: duplicate key error collection: test.books index: shareToken_1 dup key: { shareToken: "" }.
2. Root Cause
The shareToken field was marked as unique: true but not sparse. MongoDB treated multiple empty strings ("") as duplicate values.
3. Resolution
Updated the Mongoose model to use sparse: true and changed the default value from an empty string ("") to null. Manually dropped the corrupted index from MongoDB.
IR-2026-02-25: The ID Orphanage (Data Leakage)
Severity: 🟠 High | Status: ✅ Resolved
1. Summary
Dashboard reported 0 balance and empty tables even though data existed in the database.
2. Root Cause
After an offline book was synced, it received a new server _id. However, the associated entries still referenced the old localId. Since the UI filtered entries by _id, the entries became "orphaned."
3. Resolution
Implemented the "Triple-Link Protocol" in all store filters, matching entries against _id, localId, and cid. Added a Cascade ID Update in PushService to remap entries immediately after a book sync.
IR-2026-02-26: The UI Grid Collapse
Severity: 🟡 Medium | Status: ✅ Resolved
1. Summary
The Dashboard layout broke into a single column, and React threw "Duplicate key" errors for every card.
2. Root Cause
A refactor changed the React key from the indexed localId to a non-indexed id property that was often undefined. This broke React's reconciliation engine and CSS Grid logic.
3. Resolution
Restored the localId as the primary key and enforced the grid grid-cols-2 lg:grid-cols-4 structure in BooksList.tsx.
IR-2026-02-27: Vercel Build Failure
Severity: 🔴 Critical | Status: ✅ Resolved
1. Summary
The project failed to deploy to Vercel production due to a "Prerender Error" on the main page.
2. Root Cause
The useSearchParams hook was being used in a client component without a <Suspense> boundary. Next.js could not statically generate the page during build.
3. Resolution
Wrapped the main application logic in a React <Suspense> boundary in app/page.tsx, ensuring proper client-side hydration.
IR-2026-02-28: The Dexie Range Ghost (Type Mismatch)
Severity: 🔴 Critical | Status: ✅ Resolved
1. Summary
App crashed on load or sync with the error: First argument to inAnyRange() must be an Array of two-value Arrays. UI became completely blank.
2. Root Cause
The fetchPageChunk function in bookSlice.ts was passing a mixed array of both Number (localId) and String (_id/cid) to a single Dexie .anyOf() query. Dexie's internal engine failed to parse this mixed-type array into a valid range.
3. Resolution
Separated the IDs by type before querying. Executed db.books.where('localId').anyOf(numericIds) and db.books.where('_id').anyOf(stringIds) separately, then merged the results.
IR-2026-02-28: The 404 Sync Deadlock
Severity: 🔴 Critical | Status: ✅ Resolved
1. Summary
Background pull service entered an infinite loop, spamming the network tab with Server response: 404 and Retrieved 16 items, 0 valid after sequence check, draining device resources.
2. Root Cause
The API server returned a 404 status instead of an empty array `