import Dexie, { Table } from 'dexie';

/**
 * VAULT OFFLINE DATABASE PROTOCOL
 * -------------------------------
 * এটি ব্রাউজারের ভেতর একটি হাই-পারফরম্যান্স লোকাল ডাটাবেস তৈরি করে।
 * যখন সিস্টেম অফলাইন থাকে, তখন সব ট্রানজেকশন এখানে কিউ (Queue) হিসেবে জমা হয়।
 */

// ১. অফলাইন এন্ট্রি ইন্টারফেস
export interface PendingEntry {
  id?: number;
  data: {
    bookId: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    paymentMethod: string;
    note?: string;
    date: Date | string;
    status: 'Pending' | 'Completed';
  };
  timestamp: number; // কখন এন্ট্রিটি করা হয়েছে
  retryCount: number; // কতবার সিঙ্ক করার চেষ্টা করা হয়েছে
}

export class VaultOfflineDB extends Dexie {
  // টেবিল ডেফিনিশন
  pendingEntries!: Table<PendingEntry>;

  constructor() {
    super('VaultPro_LocalDB'); // ডাটাবেস নাম আপডেট করা হয়েছে
    
    // ২. স্কিমা ডেফিনিশন
    // ++id মানে অটো-ইনক্রিমেন্ট প্রাইমারি কি
    this.version(1).stores({
      pendingEntries: '++id, timestamp, retryCount' 
    });
  }
}

// ৩. ডাটাবেস ইন্সট্যান্স তৈরি
export const db = new VaultOfflineDB();

/**
 * অফলাইন ডাটাবেস হেল্পার ফাংশন
 */
export const queueOfflineEntry = async (entryData: any) => {
    try {
        await db.pendingEntries.add({
            data: entryData,
            timestamp: Date.now(),
            retryCount: 0
        });
        console.log("📡 PROTOCOL: Entry queued for background synchronization.");
    } catch (error) {
        console.error("❌ PROTOCOL_ERROR: Failed to queue offline entry.", error);
    }
};