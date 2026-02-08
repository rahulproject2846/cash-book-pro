"use client";
import Dexie, { Table } from 'dexie';

// --- ১. ইন্টারফেসেস (Fixed for Dexie Error) ---

export interface LocalUser {
  _id: string;          
  username: string;
  email: string;
  preferences: {
    language: 'en' | 'bn';
    compactMode: boolean;
    isMidnight: boolean;
    autoLock: boolean;
    currency: string;
  };
  updatedAt: number;
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
  isPublic?: boolean;
}

export interface LocalBook {
  _id: string;
  localId?: number; 
  name: string;
  description?: string;
  isPublic?: boolean;
  shareToken?: string;
  updatedAt: number;
  synced: 0 | 1; // 🔥 ফিক্স: synced স্টেটটি ডিক্লেয়ার করা হয়েছে
  type?: string;
  phone?: string;
  image?: string;
}

// --- ২. ডাটাবেজ ইঞ্জিন (Version 7 for Stability) ---

export class VaultProLocalDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; 

  constructor() {
    super('VaultPro_Storage_v3'); 
    
    // Version 7 (Previous State)
    this.version(7).stores({
      books: '_id, updatedAt, synced', // (Previous Primary Key)
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted',
      users: '_id'
    });

    /**
     * 🔥 VERSION 8: THE RESET & FINAL LOCKDOWN
     * এটি ডাটাবেজকে আনলক করে প্রাইমারি কি কনফ্লিক্ট ঠিক করবে।
     */
    this.version(8).stores({
      // বইয়ের প্রাইমারি কি আবার '_id' তে ফিরিয়ে আনা হলো এবং synced যোগ করা হলো
      books: '_id, updatedAt, synced', 
      // entries টেবিলের ++localId এখানে ঠিক আছে
      entries: '++localId, _id, &cid, bookId, userId, synced, isDeleted',
      users: '_id'
    });
  }
}

export const db = new VaultProLocalDB();

// --- ৩. হেল্পার ফাংশনস ---

export const saveEntryToLocal = async (entryData: any) => {
  try {
    const timestamp = Date.now();
    const cid = entryData.cid || `cid_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: LocalEntry = {
      ...entryData,
      cid, 
      amount: Number(entryData.amount),
      type: entryData.type.toLowerCase(),
      status: (entryData.status || 'completed').toLowerCase(),
      synced: 0,
      isDeleted: 0,
      createdAt: entryData.createdAt || timestamp,
      updatedAt: timestamp
    };
    return await db.entries.put(newEntry);
  } catch (error) {
    console.error("❌ DB Error [saveEntryToLocal]:", error);
    throw error;
  }
};