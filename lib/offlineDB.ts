// src/lib/offlineDB.ts
import Dexie, { Table } from 'dexie';

/**
 * VAULT PRO: CORE DATABASE ENGINE (V11.0 - UNBREAKABLE)
 * --------------------------------------------------------
 * Architecture: Local-First with Client-ID Integrity.
 * Logic Layers: Outbox Pattern, Logical Clocks, Checksum Validation.
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
  };
  updatedAt: number;
}

export interface LocalBook {
  localId?: number;     
  _id?: string;         
  name: string;
  description?: string;
  updatedAt: number;
  synced: 0 | 1;        
  isDeleted: 0 | 1;     
  // --- Stability Upgrade Fields ---
  vKey: number;         // Logical Clock (Version)
  syncAttempts: number; // Outbox: Logic A
  lastAttempt?: number; // Backoff: Logic A
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
  // --- Stability Upgrade Fields ---
  vKey: number;         // Logical Clock: Logic B
  checksum: string;     // Data Solidarity: Logic C
  syncAttempts: number; // Outbox: Logic A
  lastAttempt?: number; // Backoff: Logic A
}

// --- ২. হেল্পার ফাংশনস (Integrity & Utilities) ---

/**
 * Logic C: Checksum Generator
 * Generates a unique hash of the financial core to prevent data rotting.
 */
export const generateEntryChecksum = (entry: Partial<LocalEntry>): string => {
  const payload = `${entry.amount}-${entry.date}-${entry.title?.trim().toLowerCase()}`;
  // Simple fast hash (Murmur-style alternative)
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
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

  constructor() {
    super('VaultPro_Core_V1'); 
    
    // Version 1: Initial Solid Rock
    this.version(1).stores({
      books: '++localId, _id, synced, isDeleted, updatedAt',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt',
      users: '_id'
    });

    // Logic Layer: Logic A, B, C (Stability Upgrade)
    // We increment version to 2 and add new indices for sync optimization
    this.version(2).stores({
      books: '++localId, _id, synced, isDeleted, updatedAt, vKey, syncAttempts',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt, vKey, syncAttempts',
      users: '_id'
    }).upgrade(async (tx) => {
        // Backward Compatibility: Hydrate existing data with default stability keys
        await tx.table('books').toCollection().modify(book => {
            if (book.vKey === undefined) book.vKey = 1;
            if (book.syncAttempts === undefined) book.syncAttempts = 0;
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
  await db.books.clear();
  await db.entries.clear();
  await db.users.clear();
};