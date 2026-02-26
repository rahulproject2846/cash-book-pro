// src/lib/offlineDB.ts
import Dexie, { Table } from 'dexie';

/**
 * VAULT PRO: CORE DATABASE ENGINE (V25.0 - INTEGRITY UPGRADE)
 * --------------------------------------------------------
 * Architecture: Local-First with Client-ID Integrity.
 * Phase 1 Fix: Surgical Duplicate Protection (&cid) for Books.
 * Phase 3 Prep: Telemetry Table addition.
 */

// --- ১. ডাটা টাইপ ডিফিনিশনস ---

export interface LocalUser {
  _id: string;          
  username: string;
  email: string;
  image?: string;        // ✅ ADDED: User profile image
  preferences: {
    language: 'en' | 'bn';
    compactMode: boolean;
    currency: string;
    turboMode?: boolean; // Phase 1 Turbo Mode
  };
  updatedAt: number;
  
  // 🔐 LICENSE & SECURITY FIELDS
  plan?: 'free' | 'pro';
  offlineExpiry?: number;
  riskScore?: number;
  receiptId?: string;
  licenseSignature?: string; // HMAC signature for tamper detection
  isMigrated?: boolean; // 🛡️ MIGRATION FLAG
}

export interface LocalBook {
  localId?: number;     
  _id?: string; 
  cid: string;        // মাস্টার প্রোটোকল: ডুপ্লিকেট প্রোটেকশন
  name: string;
  description?: string;
  type: 'general' | 'customer' | 'supplier'; // ✅ ADDED: Business type matching MongoDB
  phone?: string;     // ✅ ADDED: Contact phone for customer/supplier
  updatedAt: number;
  createdAt: number;  // ✅ ADDED: Creation timestamp (number for consistency)
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     // PIN TO TOP: Timestamp for sort order (undefined = not pinned)
  userId: string;        // 🛑 ADDED: Required for query filtering
  conflicted?: 0 | 1;     // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
  conflictReason?: string;    // 🚨 CONFLICT REASON: "VERSION_CONFLICT", "MERGE_CONFLICT", etc.
  serverData?: any;        // 🚨 SERVER DATA: Original server data that caused conflict
  image?: string;         // ✅ ADDED: Book cover image
  mediaCid?: string;       // 🚨 MEDIA CID: Reference to mediaStore record
  isPublic?: boolean;     // ✅ ADDED: Public sharing flag
  shareToken?: string | null;    // ✅ ADDED: Public sharing token (null for sparse index)
  localStatus?: 'pending_media' | 'ready'; // ✅ ADDED: Media upload status guard
  lastSniperFetch?: number;  // 🎯 ADDED: Track when image was last fetched by sniper
}

export interface LocalEntry {
  localId?: number;     
  _id?: string;         
  cid: string;          
  bookId: string;       
  userId: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  note?: string;
  date: string;
  time: string;
  status: 'completed' | 'pending';
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  createdAt: number;
  updatedAt: number;
  vKey: number;         
  checksum: string;     
  syncAttempts: number; 
  lastAttempt?: number; 
  _emergencyFlushed?: boolean;
  _emergencyFlushAt?: number;
  isPinned?: number;     // 📌 PIN TO TOP: Timestamp for sort order (undefined = not pinned)
  conflicted?: 0 | 1;     // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
  conflictReason?: string;    // 🚨 CONFLICT REASON: "VERSION_CONFLICT", "MERGE_CONFLICT", etc.
  serverData?: any;        // 🚨 SERVER DATA: Original server data that caused conflict
  mediaId?: string;        // 🚨 MEDIA ID: Reference to mediaStore record for entry images
}

// Phase 3 Prep: সাইলেন্ট অ্যাক্টিভিটি ট্র্যাকিং
export interface LocalTelemetry {
  id?: number;
  type: 'SYNC_ERROR' | 'APP_OPEN' | 'TRANS_COUNT';
  details: string;
  synced: 0 | 1;
  timestamp: number;
}

// Safety Net: Conflict Audit Log Interface
export interface LocalAuditLog {
  localId?: number;
  cid: string;
  type: 'book' | 'entry';
  decision: 'local' | 'server';
  timestamp: number;
  userId: string;
}

// 🛡️ SAFETY SNAPSHOT: Pre-resolution backup interface
export interface LocalSnapshot {
  localId?: number;
  cid: string;
  type: 'book' | 'entry';
  record: any;               // 🚨 COMPLETE RECORD BACKUP
  timestamp: number;
  reason: 'pre_resolution_backup' | 'auto_backup' | 'manual_backup';
  userId: string;
}

// 🚀 BANKING-GRADE MEDIA ENGINE: Local Media Interface
export interface LocalMedia {
  localId?: number;
  cid: string;                    // 🚨 CRITICAL: Link to Book/Entry
  parentType: 'book' | 'entry' | 'user';  // Parent record type
  parentId: string;               // Parent record ID
  localStatus: 'pending_upload' | 'uploaded' | 'failed';  // 🚨 KEY FIELD
  blobData?: Blob;                // 🚨 TEMPORARY: Local blob storage
  cloudinaryUrl?: string;         // 🚨 FINAL: Cloudinary URL
  cloudinaryPublicId?: string;    // 🚨 CLOUDINARY REFERENCE
  mimeType: string;               // image/jpeg, application/pdf
  originalSize: number;           // File size in bytes
  compressedSize?: number;        // After local compression
  uploadProgress?: number;        // 0-100 percentage
  uploadError?: string;           // Error message if failed
  createdAt: number;
  uploadedAt?: number;            // When successfully uploaded
  userId: string;                 // Owner for security
}

// --- ২. হেল্পার ফাংশনস (Integrity & Utilities) ---

/**
 * Logic C: SHA-256 Checksum Generator (Enhanced for Field-Level Integrity)
 */
export const generateEntryChecksum = async (entry: { 
  amount: number; 
  date: string; 
  time?: string;
  title: string;
  note?: string;
  category?: string;
  paymentMethod?: string;
  type?: string;
  status?: string;
}): Promise<string> => {
    // 1. Normalize all fields (Trim ONLY - respect user's case)
    const title = entry.title?.trim() || "";
    const note = entry.note?.trim() || "";
    const category = entry.category?.trim() || "";
    const paymentMethod = entry.paymentMethod?.trim() || "";
    const type = entry.type?.trim() || "";
    const status = entry.status?.trim() || "";
    // 🚨 ROBUST DATE HANDLING: Works with both string and timestamp inputs
    const dateStr = String(entry.date);  // ZERO-LOGIC: Use raw string directly
    
    // 2. Construct Payload with ALL business fields (Enhanced integrity)
    const payload = `${entry.amount}:${String(entry.date)}:${String(entry.time || "")}:${title}:${note}:${category}:${paymentMethod}:${type}:${status}`;
    
    // 3. Generate SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256_${hashHex}`;
};

/**
 * 🔐 GENERATE CID - Secure Client ID (Native Implementation)
 * Replaces unsafe Math.random() with cryptographically secure UUID
 */
export const generateCID = () => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  return `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${uuid}`;
};

// --- ৩. ডাটাবেজ কনফিগারেশন ---

export class VaultProDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; 
  telemetry!: Table<LocalTelemetry>; // Phase 3 Table
  audits!: Table<any>; // Audit Framework Table
  auditLogs!: Table<LocalAuditLog>; // Safety Net - Conflict Audit Log
  snapshots!: Table<LocalSnapshot>; // 🛡️ Safety Snapshots Table
  mediaStore!: Table<LocalMedia>;  // 🚀 BANKING-GRADE MEDIA ENGINE
  syncPoints!: Table<any>; // 🔄 SYNC CHECKPOINTS

  constructor() {
    super('VaultPro_Core_V1'); 
    
    // Version 1: Initial Solid Rock
    this.version(1).stores({
      books: '++localId, _id, synced, isDeleted, updatedAt',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt',
      users: '_id'
    });

    // Version 3: The Integrity & Intelligence Upgrade (Phase 1-4 Ready)
    this.version(3).stores({
      // &cid added to books for Surgical Duplicate Fix
      books: '++localId, _id, &cid, synced, isDeleted, updatedAt, vKey, syncAttempts',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt, vKey, syncAttempts',
      users: '_id',
      telemetry: '++id, type, synced, timestamp' // Phase 3 Readiness
    });

    // 🚀 Version 4: FINAL FIX (Schema Update)
    // Added 'userId' to books schema to fix "KeyPath not indexed" error
    // Added 'isPinned' for faster sorting
    this.version(4).stores({
      books: '++localId, _id, userId, &cid, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      users: '_id',
      telemetry: '++id, type, synced, timestamp'
    }).upgrade(async (tx) => {
        // Upgrade logic: Ensure all books have a userId if missing (Optional safeguard)
        // Dexie automatically handles the schema index update
    });

    // 🎯 Version 6: AUDIT FRAMEWORK (Telemetry System)
    // Added 'audits' table for centralized logging system
    this.version(6).stores({
      books: '++localId, _id, userId, &cid, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId'
    }).upgrade(async (tx) => {
        // Initialize audit system
        console.log('Vault Pro: Audit Framework initialized');
    });

    // 🎯 Version 7: COMPOUND INDEX OPTIMIZATION
    // Added [userId+isDeleted] compound index for ultra-fast UI filtering
    this.version(7).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      entries: '++localId, _id, &cid, bookId, userId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId'
    }).upgrade(async (tx) => {
        console.log('Vault Pro: Compound index optimization applied');
    });

    // 🎯 Version 8: CONFLICT TRACKING SYSTEM
    // Added conflicted, conflictReason, and serverData fields for both books and entries
    // Added &conflicted index for efficient conflict queries
    this.version(8).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, &conflicted',
      entries: '++localId, _id, &cid, bookId, userId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, &conflicted',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId'
    }).upgrade(async (tx) => {
      // Initialize conflict tracking system
      console.log('Vault Pro: Conflict tracking system initialized');
    });

    // 🎯 Version 9: CONFLICT INDEX FIX
    // Removed ampersand from conflicted field to make it a regular index (not unique)
    this.version(9).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId'
    }).upgrade(async (tx) => {
      console.log('Vault Pro: Conflict index fixed - conflicted is now a regular index');
    });

    // 🎯 Version 10: SAFETY NET - CONFLICT AUDIT LOG
    // Added auditLogs table for tracking conflict resolutions
    this.version(10).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp'  // SAFETY SNAPSHOTS
    }).upgrade(async (tx) => {
      console.log('Vault Pro: Safety Net - Conflict Audit Log initialized');
    });

    // Version 11: BANKING-GRADE MEDIA ENGINE
    // Added mediaStore table for offline-first Cloudinary pipeline
    this.version(11).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',  // SAFETY SNAPSHOTS
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt'  // MEDIA STORE
    }).upgrade(async (tx) => {
      console.log(' Vault Pro: Banking-Grade Media Engine initialized');
    });

    // Version 12: MEDIA CID INDEX FIX
    // Added mediaCid index to books store for efficient CID clearing
    // Added mediaId index to entries store for efficient entry image operations
    this.version(12).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',  // SAFETY SNAPSHOTS
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt'  // MEDIA STORE
    }).upgrade(async (tx) => {
      // FIXED: Indexes are already defined in .stores() - no manual creation needed
      console.log(' Vault Pro: Version 12 indexes handled automatically by Dexie');
    });

    // Version 13: V6.2 SECURITY SCHEMA
    // Added security fields indexing for efficient license validation and risk analysis
    this.version(13).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, plan, offlineExpiry, riskScore, receiptId', // V6.2 SECURITY INDEXES
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp', // SAFETY SNAPSHOTS
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt', // MEDIA STORE
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp' // SYNC CHECKPOINTS
    }).upgrade(async (tx) => {
      console.log('Vault Pro: V6.2 Security Schema Applied.');
    });

    // Version 14: HIGH-SPEED PAGINATION OPTIMIZATION
    // Added compound indexes for database-level pagination and filtering
    this.version(14).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, &mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], [userId+isDeleted+bookId], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, plan, offlineExpiry, riskScore, receiptId', // V6.2 SECURITY INDEXES
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp', // SAFETY SNAPSHOTS
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt', // MEDIA STORE
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp' // SYNC CHECKPOINTS
    }).upgrade(tx => {
      console.log('✅ Vault Pro: Database upgraded to V14 with Compound Indexes');
    });

    // Version 26: V26 SCROLL MEMORY / TRIPLE INDEX GUARANTEE
    // Ensures [userId+isDeleted+updatedAt] exists for high-speed dashboard refreshBooks query
    this.version(26).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, &mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], [userId+isDeleted+bookId], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, plan, offlineExpiry, riskScore, receiptId',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt',
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp'
    }).upgrade(() => {
      console.log('✅ Vault Pro: Database upgraded to V26');
    });

    // Version 27: USER ID INDEX FIX
    // Added userId index to users table for PullService security verification
    this.version(27).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], [userId+isDeleted+bookId], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, userId, plan, offlineExpiry, riskScore, receiptId', // ✅ ADDED userId INDEX
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt',
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp'
    }).upgrade(() => {
      console.log('✅ Vault Pro: Database upgraded to V27 - userId index added to users table');
    });

    // Version 28: MEDIA CID UNIQUE CONSTRAINT FIX
    // Removed & from mediaCid to prevent constraint violations
    this.version(28).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, mediaCid, conflicted',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], [userId+isDeleted+bookId], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, userId, plan, offlineExpiry, riskScore, receiptId',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt',
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp'
    }).upgrade(() => {
      console.log('✅ Vault Pro: Database upgraded to V28 - mediaCid unique constraint removed');
    });

    // Version 29: SCHEMA ALIGNMENT UPGRADE
    // Added missing fields to match MongoDB schema: type, phone, createdAt, isPublic, shareToken, localStatus
    this.version(29).stores({
      books: '++localId, _id, userId, &cid, [userId+isDeleted], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, image, mediaCid, conflicted, type, phone, createdAt, isPublic, shareToken, localStatus',
      entries: '++localId, _id, &cid, bookId, userId, &mediaId, [userId+isDeleted], [userId+isDeleted+bookId], [userId+isDeleted+updatedAt], synced, isDeleted, updatedAt, vKey, syncAttempts, isPinned, conflicted',
      users: '_id, userId, plan, offlineExpiry, riskScore, receiptId',
      telemetry: '++id, type, synced, timestamp',
      audits: '++id, type, level, timestamp, sessionId, userId',
      auditLogs: '++localId, cid, userId, timestamp',
      snapshots: '++localId, cid, userId, timestamp',
      mediaStore: '++localId, &cid, parentType, parentId, localStatus, userId, createdAt, uploadedAt',
      syncPoints: '++id, userId, type, offset, lastSequence, timestamp'
    }).upgrade(() => {
      console.log('✅ Vault Pro: Database upgraded to V29 - schema alignment with MongoDB completed');
    });
  }
}

export const db = typeof window !== "undefined" ? new VaultProDB() : null as any;

// --- ৪. কোর সিস্টেম ফাংশনস ---

/**
 * ডাটাবেজ রিসেট (লগআউটের সময় ব্যবহার্য)
 */
export const clearVaultData = async () => {
  if (typeof window === "undefined" || !db) return;
  await Promise.all([
    db.books.clear(),
    db.entries.clear(),
    db.users.clear(),
    db.telemetry.clear(),
    db.audits.clear(),
    db.auditLogs.clear(),
    db.snapshots.clear()  // CLEAR SAFETY SNAPSHOTS
  ]);
};

// Emergency debugging: Expose database instance to global window
if (typeof window !== 'undefined') {
  (window as any).db = db;
}