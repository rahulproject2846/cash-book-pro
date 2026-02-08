// src/lib/offlineDB.ts
import Dexie, { Table } from 'dexie';

/**
 * VAULT PRO: CORE DATABASE ENGINE (V10.0 - SOLID ROCK)
 * --------------------------------------------------------
 * Architecture: Local-First with Client-ID Integrity.
 * Primary Key: localId (++auto-increment)
 * Unique Index: cid (&Unique Client ID)
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
  localId?: number;     // লোকাল প্রাইমারি কি
  _id?: string;         // সার্ভার আইডি (সিঙ্ক হওয়ার পর আসবে)
  name: string;
  description?: string;
  updatedAt: number;
  synced: 0 | 1;        // সিঙ্ক দারোয়ানের জন্য ফ্ল্যাগ
  isDeleted: 0 | 1;     // সফট ডিলিট লজিক
}

export interface LocalEntry {
  localId?: number;     // লোকাল প্রাইমারি কি
  _id?: string;         // সার্ভার আইডি
  cid: string;          // ইউনিক ক্লায়েন্ট আইডি (মাস্ট-হ্যাভ ফর ডুপ্লিকেট প্রোটেকশন)
  bookId: string;       // এটি বুক এর localId বা _id রেফার করবে
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
  synced: 0 | 1;        // সিঙ্ক হয়েছে কি না
  isDeleted: 0 | 1;     // ডিলিট করা হয়েছে কি না
  createdAt: number;
  updatedAt: number;
}

// --- ২. ডাটাবেজ কনফিগারেশন ---

export class VaultProDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; 

  constructor() {
    // পুরনো সব জঞ্জাল এড়াতে নতুন ডাটাবেজ নাম
    super('VaultPro_Core_V1'); 
    
    this.version(1).stores({
      // ++localId = অটো ইনক্রিমেন্ট প্রাইমারি কি
      // &cid = ইউনিক ইনডেক্স (একই সিআইডি দুইবার ঢুকবে না)
      // synced = ইনডেক্স করা হয়েছে দ্রুত কুয়েরি করার জন্য
      books: '++localId, _id, synced, isDeleted, updatedAt',
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted, updatedAt',
      users: '_id'
    });
  }
}

export const db = new VaultProDB();

// --- ৩. কোর হেল্পার ফাংশন ---

/**
 * জেনারেট ইউনিক ক্লায়েন্ট আইডি (cid)
 */
export const generateCID = () => {
    return `cid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * ডাটাবেজ রিসেট (লগআউটের সময় ব্যবহার্য)
 */
export const clearVaultData = async () => {
  await db.books.clear();
  await db.entries.clear();
  await db.users.clear();
};