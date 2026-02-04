"use client";
import Dexie, { Table } from 'dexie';

// --- ১. ইন্টারফেসেস (Strict Type Definitions) ---

export interface LocalUser {
  _id: string;          // MongoDB ID
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
  name: string;
  description?: string;
  isPublic?: boolean;
  shareToken?: string;
  updatedAt: number;
  synced?: 0 | 1;
}

// --- ২. ডাটাবেজ ইঞ্জিন ---

export class VaultProLocalDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;
  users!: Table<LocalUser>; // 🔥 রেড লাইন ফিক্স: ইউজার টেবিল যোগ করা হলো

  constructor() {
    super('VaultPro_Storage_v3'); 
    
    this.version(4).stores({ // ভলিউম ৪ (স্কিমা আপডেট)
      books: '_id, updatedAt',
      entries: '++localId, _id, cid, bookId, userId, synced, isDeleted',
      users: '_id' // 🔥 ইউজারের প্রোফাইল সেভ করার জন্য
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