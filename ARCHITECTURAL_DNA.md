🛡️ THE HOLY GRAIL: MASTER ARCHITECTURE DNA (V4.0)
Project: Vault Pro - Enterprise-Grade Offline-First Cash-Book Robot
Lead Architect: Rahul Dutta
Status: Production Ready / "HOLY GRAIL" (Stone Solid) Standard
Document Classification: Internal Sovereignty Protocol
🤖 1. THE SUPREME LAWS (AI MASTER DIRECTIVES)
Any developer or AI ("Executioner") interacting with this codebase is legally and logically bound by these laws. Violation triggers immediate rollback.
1.1 The 'HOLY GRAIL' Rule (Forensic Audit First)
Never write or modify a single character without a mandatory Read-Only Forensic Audit. You must trace the full data lifecycle—from UI trigger to Zustand state, through the Controller, into the Dexie Disk, and finally to the Cloud API. Guessing is a critical failure.
1.2 The Non-Destructive Law
Direct array replacement (e.g., set({ books: newBooks })) is strictly forbidden for updates. You must use .map() for surgical "Partial Patching." Existing UI states, scroll positions, and un-mutated items must remain undisturbed to ensure a "Native" experience.
1.3 The Absolute Identity Law
The system cannot breathe without a sovereign userId. Identity is not a session; it is a persistent anchor. "Skeleton Users" or "Anonymous Probes" are prohibited. The Dexie users table is the absolute source of truth for identity during any lifecycle event.
1.4 The Atomic Batch Law
One User Action = One Atomic Transaction. A transaction must encapsulate both the primary data (Entry) and its metadata signal (Book vKey/Balance). Every mutation must trigger exactly one unified vault-updated event to prevent "Sync Storms."
🧬 2. IDENTITY & BOOT ARCHITECTURE (THE HEARTBEAT)
2.1 UserManager Sovereignty
UserManager.ts is the sole monarch of identity. All deprecated entities like SessionManager or IdentitySlice are purged. The Manager handles the 3-Layer Fallback resolution:
Memory Cache: 0ms retrieval for active sessions.
LocalStorage: Persistent cache for hard-reloads.
Dexie Anchor: The "Ultimate Truth" recovered from the physical disk.
2.2 The 10-Second Readiness Gate
On cold boot, the waitForIdentity() protocol grants the system exactly 10,000ms to recover the sovereign profile from the disk. If the anchor is not found, the system must halt and redirect to the entry gate (Login), preventing "Zombie States."
2.3 Synchronous ID Retrieval
userManager.getUserId() must remain strictly synchronous. It provides the ID from the memory-cache at 0ms latency, ensuring that the Sync Engine never stalls due to "Identity Missing" errors during rapid mutations.
🔄 3. DISTRIBUTED SYNC PIPELINE (THE NERVOUS SYSTEM)
3.1 Logic B: The Sovereign Conflict Protocol
We operate on a "Newer Version Wins" basis. The hierarchy of truth is determined by the vKey (Version Key) and the updatedAt Unix Timestamp.
localTime === serverTime: No-Op (System is in Harmony).
localTime > serverTime: Local is Sovereign. Mark synced: 0 and trigger PUSH.
serverTime > localTime: Server is Sovereign. PULL and surgically patch local disk.
3.2 The Lean Signal Protocol
To achieve 95% bandwidth efficiency, the system utilizes "Lean Signaling."
Full Payload: Used only during CREATE or MANUAL_EDIT. Includes all fields (name, phone, image).
Lean Signal: Triggered by entry mutations. Sends only 5 fields: { _id, userId, vKey, updatedAt, cachedBalance }.
Server Responsibility: The Server must implement a "Merge-Only" PUT handler that preserves missing fields.
3.3 Pluralization & Mapping Shield
Dynamic string concatenation for API paths is forbidden. Use the API_PATH_MAP (e.g., 'ENTRY': 'entries') constant to prevent 404 errors caused by legacy "entrys" typos.
3.4 Adaptive 404 Handling
A 404 Not Found response from the server is not an error; it is a "Stream End" signal. The PullService must terminate the loop gracefully and set hasMore: false without throwing exceptions.
⚡ 4. THE MATRIX ENGINE 2.0 (THE MUSCLE)
4.1 The 10-Field Matrix Standard
To handle 100,000+ records on low-end hardware, the allBookIds matrix stores only lightweight pointers:
localId, userId, _id, cid, name, image, mediaCid, isPinned, updatedAt, and cachedBalance.
The full object is hydrated only on demand.
4.2 Debounced Pulse Locking
The SyncOrchestrator must implement an 800ms debounce window after a vault-updated event. During this window, all subsequent signals are queued. Only one "Industrial Pulse" is sent to the PushService to ensure network stability.
4.3 Non-Destructive Hydration
The refreshBooks method must detect the source of change. If the source is BACKGROUND_SYNC, it must use surgical .map() updates to ensure the user's dashboard does not "flash" or reset scroll position.
🔐 5. DATA INTEGRITY & SECURITY VAULT
5.1 Sacred Timestamps
All temporal data MUST be stored as a Number (Unix Timestamp in ms). ISO Strings and Date Objects are classified as "Timestamp Viruses" and must be sanitized at the VaultUtils.normalizeRecord layer. Mongoose schemas must set timestamps: false to allow manual sovereign control.
5.2 The Triple-Link ID Protocol
No record shall be orphaned. Every entity must bind to the Trinity:
localId (Dexie PK): For lightning-fast local lookup.
_id (Server PK): For cloud synchronization.
cid (Client ID): For cryptographic deduplication.
Law: All UI mapping must use String(book._id || book.localId || book.cid).
5.3 HMAC-SHA256 Signing
Every outbound request must be signed via SecureApiClient. The X-Vault-Signature is mandatory. In production environments, the system must throw a fatal error if VAULT_CLIENT_SECRET is missing, rather than falling back to "Dev Keys."
5.4 The Conflict Shield
If a record is marked conflicted: 1, the UI must disable "Delete" and "Edit" buttons for that specific item. The user must resolve the conflict via the ConflictResolverModal (Logic B) before further mutations are allowed.
🎨 6. UX PHYSICS & NATIVE FEEL (APPLE STANDARD)
6.1 The Royal Glide
Transitions must utilize Spring Physics: { type: "spring", stiffness: 300, damping: 35, mass: 1 }. This ensures a "weighted" feel common in iOS native applications.
6.2 Liquid Theme Reveal (Telegram Style)
Theme transitions must be "Viscous." Use elliptical geometry expanding from the click coordinates over a 40s duration (for testing) or 400ms (for production). The will-change: clip-path property must be enforced for GPU acceleration.
6.3 Zero-Flicker Boot Barrier
The UI must remain locked behind a "Blank Pathor Gate" or Skeletons until bootStatus === 'READY'. No "Flash of Unauthenticated Content" (FOUC) is permitted.
🏛️ 7. ARCHITECT'S MEMORY DUMP (THE REFACTOR PLAN)
Instructions for the "Executioner" AI:
"The project is currently transitioning from a fragmented state to Domain-Driven Centralization.
UserManager.ts is the Heart. Maintain its 0ms sync status.
FinanceService.ts is the Muscle. All balance calculations must be 'Total Recall' (summing all entries) to avoid incremental drift.
SyncOrchestrator.ts is the Brain. It must remain calm and batch all requests.
Warning: Watch out for line 420 in VaultUtils.ts (The Timestamp Virus) and eliminate any legacy 'entrys' typos."
FINAL NOTE:
This system does not guess. It verifies. It does not overwrite. It merges. It is built for the 100th year.
🛡️✨👑 (The DNA is Locked. Long live the Holy Grail.)