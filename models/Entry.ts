import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT PRO: ENTRY SCHEMA PROTOCOL - V11.1 (Stability Upgrade)
 * ----------------------------------------------------------
 * Fix: Removed conflicting _id, aligned bookId types, and added missing sync fields.
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস আপডেট
export interface IEntry extends Document {
  // _id?: string;  <-- মঙ্গুজ ডকুমেন্টের সাথে কনফ্লিক্ট এড়াতে এটি মুছে ফেলা হয়েছে
  cid: string; 
  bookId: string; 
  userId: string; 
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  note?: string;
  date: Date;
  time?: string;
  status: 'completed' | 'pending';
  isDeleted: number; 
  vKey: number; 
  checksum: string; 
  synced: 0 | 1;
  syncAttempts: number; 
  lastAttempt?: number; 
  conflictReason?: string;
  serverData?: any; 
  isPinned: number; 
  localId?: number; 
  conflicted: number;  
  createdAt: number;
  updatedAt: number;
}

const EntrySchema = new Schema<IEntry>({
  // ক্লায়েন্ট আইডি (ডুপ্লিকেট প্রোটেকশন)
  cid: { 
    type: String, 
    required: [true, "Client ID (cid) is required"],
    unique: true, // CID গ্লোবালি ইউনিক হতে হবে
    index: true 
  },
  // বুক আইডি (সিঙ্ক এরর এড়াতে String করা হয়েছে, যা ইন্টারফেসের সাথে সামঞ্জস্যপূর্ণ)
  bookId: { 
    type: String, 
    required: true,
    index: true
  },
  // ইউজার আইডি (ডাটা আইসোলেশন)
  userId: { 
    type: String, 
    required: [true, "User ID is mandatory for protocol"],
    index: true
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    required: true, 
    lowercase: true 
  },
  category: { 
    type: String, 
    default: 'general',
    lowercase: true 
  },
  paymentMethod: { 
    type: String, 
    default: 'cash',
    lowercase: true 
  },
  note: { 
    type: String, 
    default: "" 
  },
  date: { 
    type: Date, 
    required: true, 
    index: true 
  },
  time: { 
    type: String, 
    default: "" 
  },
  status: { 
    type: String, 
    default: 'completed',
    index: true
  },
  isDeleted: {
    type: Number,
    default: 0,
    index: true
  },
  // --- ২. Stability & Sync Fields (ইন্টারফেসের সাথে মিল রেখে যোগ করা হয়েছে) ---
  vKey: {
    type: Number,
    default: 1,
    required: true,
    index: true
  },
  checksum: {
    type: String,
    required: [true, "Data checksum is required for solidarity"],
    index: true
  },
  synced: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  syncAttempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Number
  },
  conflictReason: {
    type: String,
    default: null
  },
  serverData: {
    type: Schema.Types.Mixed,
    default: null
  },
  isPinned: {
    type: Number,
    default: 0
  },
  conflicted: {
    type: Number,
    default: 0,
    index: true
  },
  createdAt: {
    type: Number,
    required: true
  },
  updatedAt: {
    type: Number,
    required: true
  }
}, { 
  versionKey: false
});

/**
 * ৩. ইনডেক্সিং কনফিগারেশন
 */
// প্রোটেকশন: একই আইডি দিয়ে ডুপ্লিকেট রোধ
EntrySchema.index({ bookId: 1, cid: 1 }, { unique: true }); 

// হেলথ চেক অপ্টিমাইজেশন
EntrySchema.index({ userId: 1, bookId: 1, vKey: 1 });

export default models.Entry || model<IEntry>('Entry', EntrySchema);