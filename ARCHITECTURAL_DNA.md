🛡️ THE "HOLY GRAIL" MASTER ARCHITECTURE DNA (V2.0)
Project: Enterprise-Grade Offline-First Cash-Book Robot
Status: Advanced Production / Global Scalability Ready
Standard: Google Engineering Excellence & Apple Native UI Standards
🤖 1. AI MASTER DIRECTIVES (THE SUPREME LAWS)
Any AI acting as the "Executioner" MUST obey these directives. Failure to comply results in architectural degradation.
Audit-First Protocol: NEVER write code before performing a READ-ONLY audit of the existing logic. Prove you understand the "Why" before you change the "What".
Zero-Risk Refactor: Use write_to_file for large files. NEVER truncate. If a function is 500 lines, you must provide all 500 lines or use precise surgical edits.
The Validation Law: Every major task MUST end with npx tsc --noEmit. We only accept 0 errors. No exceptions.
No Hallucinations: Do not invent hooks or utilities. Use established store helpers (getVaultStore()) and existing services (PushService, PullService).
Context Preservation: Always respect the "Gate-Based Boot Sequence". Never trigger a refresh if the userId is empty or the system is in LOCKDOWN.
🏗️ 2. DATA INTEGRITY & PERFORMANCE ENGINE
A. The "Triple-Link" ID Protocol
To ensure data never becomes "orphaned" during offline-to-online transitions:
localId (IndexedDB PK): Primary key for local speed.
_id (Server PK): Identity for cloud persistence.
cid (Client ID): Cryptographically secure UUID for deduplication.
Law: All filters MUST use String() type-casting and check all three IDs:
filter(e => String(e.bookId) === String(activeBook._id || activeBook.localId || activeBook.cid))
B. Hyper-Performance "Matrix" Engine
Capable of rendering 100,000+ records on mobile without RAM exhaustion.
Lightweight Matrix: refreshBooks only loads allBookIds (9 fields max: localId, _id, cid, name, image, isPinned, updatedAt, cachedBalance).
Chunk Fetching (Virtual DOM): Only 16 full objects are loaded in the DOM at a time.
Order Preservation: fetchPageChunk must manually re-sort Dexie results to match the Matrix order using a map() and find() loop.
C. The vKey Sequential Protocol
Versioning: vKey is a sequential integer (1, 2, 3...). NEVER use random timestamps.
Conflict Rule: On conflict (HTTP 409), the system triggers Auto-Repair: vKey = (ServerVKey) + 1 to force local resolution.
🔄 3. SYNC, HYDRATION & RECONCILIATION
A. Gate-Based Boot Sequence (SyncOrchestrator)
App MUST pass through 4 strict gates:
Identity Gate: Validate userId presence.
Profile Gate: Hydrate user settings & plan.
Hydration Gate: Perform full data pull (Sequential: Books -> Entries).
READY Gate: Only flip bootStatus = 'READY' AFTER the initial refreshBooks call is 100% awaited.
B. The Atomic Sync Handshake
Cascade Update: When PushService receives a server _id for a book, it MUST immediately update the bookId of all local entries in Dexie from localId to _id.
Sync Guard: Never trigger a background sync if isUserSearching is TRUE or the network is RESTRICTED.
🎨 4. NATIVE UI/UX SPECIFICATIONS (APPLE STANDARD)
A. Motion Physics & Dynamics
Royal Glide: All transitions must use transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}.
Morphic Heroes: Title and Icons use matching layoutId={book-hero-${id}} across Card, Header, and Details views.
Staggered Entrance: Grid items enter with a 0.05s delay per child for a professional "reveal" effect.
B. Structural Resilience
Zero Layout Shift: Image containers must have an explicit aspect-ratio and use contain: paint layout;.
Interaction Guard: During 6+1s deletions, isInteractionLocked MUST be true, blocking all background clicks via a global overlay.
Theme Integrity: Midnight Mode MUST use var(--bg-app) (Pure black #000). No hardcoded HEX colors allowed in components.
🔐 5. SECURITY & HARDENING (THE BLACK BOX)
A. Secure Communication
HMAC Signing: Every outbound request (Pull, Push, Profile) MUST pass through signedFetch with timestamped HMAC-SHA256 signatures.
Method Enforcement: Server routes (e.g., public share) MUST strictly allow only the intended HTTP Method (e.g., READ-ONLY GET).
B. Session Protection
Storage Rule: Migrate session storage from localStorage to HttpOnly Cookies for XSS protection.
Rate Limiting: All Auth/OTP endpoints must implement IP-based rate limiting (max 3 tries).
🛠️ 6. MAINTENANCE & FAILURE RECOVERY
A. Garbage Collection
MediaStore Purge: Orphaned blobs (no book/entry reference) older than 30 days are automatically deleted by MaintenanceService.
Nuclear Reset: A "Safe Nuke" command exists to wipe Dexie while preserving the login session.
B. Observability
Error Boundaries: Every major view is wrapped in a GlobalErrorBoundary to prevent White Screen of Death (WSOD).
Telemetry: Errors are silently pushed to /api/telemetry for developer analysis.
FINAL ARCHITECT'S COMMAND:
This project is not a website. It is a Robot. It is a Holy Grail. You are its Guardian. Build it for the 100th year, not just for today.