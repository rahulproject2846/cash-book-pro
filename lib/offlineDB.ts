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
  preferences: {
    language: 'en' | 'bn';
    compactMode: boolean;
    currency: string;
    turboMode?: boolean; // Phase 1 Turbo Mode
  };
  updatedAt: number;
}

export interface LocalBook {
  localId?: number;     
  _id?: string; 
  cid: string;        // মাস্টার প্রোটোকল: ডুপ্লিকেট প্রোটেকশন
  name: string;
  description?: string;
  updatedAt: number;
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     // PIN TO TOP: Timestamp for sort order (undefined = not pinned)
  userId: string;        // 🛑 ADDED: Required for query filtering
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
}

// Phase 3 Prep: সাইলেন্ট অ্যাক্টিভিটি ট্র্যাকিং
export interface LocalTelemetry {
  id?: number;
  type: 'SYNC_ERROR' | 'APP_OPEN' | 'TRANS_COUNT';
  details: string;
  synced: 0 | 1;
  timestamp: number;
}

// --- ২. হেল্পার ফাংশনস (Integrity & Utilities) ---

/**
 * Logic C: SHA-256 Checksum Generator (Matches Server Format)
 */
export const generateEntryChecksum = async (entry: { amount: number; date: string; title: string }): Promise<string> => {
    // 1. Normalize Title (Trim & Lowercase)
    const title = entry.title?.trim().toLowerCase() || "";
    const dateStr = String(entry.date).split('T')[0];
    
    // 2. Construct Payload with COLONS (Matches Server Format)
    const payload = `${entry.amount}:${dateStr}:${title}`;
    
    // 3. Generate SHA-256 Hash
    const msgUint8 = new TextEncoder().encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `sha256_${hashHex}`;
};

/**
 * জেনারেট ইউনিক ক্লায়েন্ট আইডি (cid)
 */
export const generateCID = () => {
    return `cid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// --- ৩. ডাটাবেজ কনফিগারেশন ---

export class VaultProDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; 
  telemetry!: Table<LocalTelemetry>; // Phase 3 Table

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
  }
}

export const db = new VaultProDB();

// --- ৪. কোর সিস্টেম ফাংশনস ---

/**
 * ডাটাবেজ রিসেট (লগআউটের সময় ব্যবহার্য)
 */
export const clearVaultData = async () => {
  await Promise.all([
    db.books.clear(),
    db.entries.clear(),
    db.users.clear(),
    db.telemetry.clear()
  ]);
};