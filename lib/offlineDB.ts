import Dexie, { Table } from 'dexie';

// ১. এন্ট্রি ইন্টারফেস (নিখুঁত স্কিমা)
export interface LocalEntry {
  localId?: number;     // Dexie Auto-increment
  _id?: string;         // MongoDB ID
  cid: string;          // Client ID (Unique)
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
  synced: 0 | 1;        // ০ = আনসিঙ্কড, ১ = সিঙ্কড
  isDeleted: 0 | 1;     // ১ = ডিলিট করতে হবে
  createdAt: number;
  updatedAt: number;
}

export interface LocalBook {
  _id: string;
  name: string;
  description?: string;
  updatedAt: number;
  synced?: 0 | 1;
}

export class VaultProLocalDB extends Dexie {
  books!: Table<LocalBook>;
  entries!: Table<LocalEntry>;

  constructor() {
    super('VaultPro_Storage_v3'); 
    
    this.version(3).stores({
      books: '_id, updatedAt',
      // synced এবং isDeleted ইনডেক্স করা হয়েছে দ্রুত খোঁজার জন্য
      entries: '++localId, _id, cid, bookId, userId, synced, isDeleted'
    });
  }
}

export const db = new VaultProLocalDB();

// এন্ট্রি সেভ করার ফাংশন
export const saveEntryToLocal = async (entryData: any) => {
  try {
    const timestamp = Date.now();
    // CID জেনারেটর (যদি না থাকে)
    const cid = entryData.cid || `cid_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    const newEntry: LocalEntry = {
      ...entryData,
      cid, 
      amount: Number(entryData.amount),
      type: entryData.type.toLowerCase(),
      status: (entryData.status || 'completed').toLowerCase(),
      synced: 0, // নতুন ডাটা সবসময় আনসিঙ্কড
      isDeleted: 0,
      createdAt: entryData.createdAt || timestamp,
      updatedAt: timestamp
    };

    // যদি _id থাকে (মানে সার্ভারের ডাটা এডিট হচ্ছে), তবে _id দিয়ে আপডেট হবে
    // আর নতুন হলে cid দিয়ে অ্যাড হবে
    const id = await db.entries.put(newEntry);
    return id;
  } catch (error) {
    console.error("❌ DB Error:", error);
    throw error;
  }
};