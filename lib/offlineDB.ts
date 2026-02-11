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
 * Logic C: Checksum Generator
 */
export const generateEntryChecksum = (entry: Partial<LocalEntry>): string => {
  const payload = `${entry.amount}-${entry.date}-${entry.title?.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; 
  }
  return `v1_${Math.abs(hash)}`;
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
    }).upgrade(async (tx) => {
        // Backward Compatibility: Hydrate existing books
        await tx.table('books').toCollection().modify(book => {
            if (book.vKey === undefined) book.vKey = 1;
            if (book.syncAttempts === undefined) book.syncAttempts = 0;
            // পুরনো বই যাদের cid নেই, তাদের জন্য cid জেনারেট করা হলো (Index collision রোধে)
            if (!book.cid) book.cid = `old_${generateCID()}`;
        });

        await tx.table('entries').toCollection().modify(entry => {
            if (entry.vKey === undefined) entry.vKey = 1;
            if (entry.syncAttempts === undefined) entry.syncAttempts = 0;
            if (!entry.checksum) {
                entry.checksum = generateEntryChecksum(entry);
            }
        });
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