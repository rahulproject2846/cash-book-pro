// src/models/Entry.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT PRO: ENTRY SCHEMA PROTOCOL - V11.0 (Stability Upgrade)
 * ----------------------------------------------------------
 * Logic B: Logical Clock (vKey) for Conflict Resolution.
 * Logic C: Checksum for Data Solidarity (Integrity Protection).
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস আপডেট
export interface IEntry extends Document {
  cid: string; 
  bookId: mongoose.Types.ObjectId;
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
  isDeleted: boolean; 
  // --- Stability Upgrade Fields ---
  vKey: number;       // Logical Clock
  checksum: string;   // Data Solidarity (Hash of Amount+Date+Title)
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  // ক্লায়েন্ট আইডি (ডুপ্লিকেট প্রোটেকশন)
  cid: { 
    type: String, 
    required: [true, "Client ID (cid) is required"],
    index: true 
  },
  // বুক আইডি রেফারেন্স
  bookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
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
  // Strict lowercase convention for V3 engine
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
  // Status protocol: Always lowercase
  status: { 
    type: String, 
    default: 'completed',
    lowercase: true,
    index: true
  },
  // সফট ডিলিট লজিক (সিঙ্ক ইন্টিগ্রিটির জন্য)
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  // --- ২. Stability Upgrade Fields (Elite Logic) ---
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
  }
}, { 
  timestamps: true,
  versionKey: false
});

/**
 * ৩. ইনডেক্সিং কনফিগারেশন
 */
// প্রোটেকশন: একই বুকে একই CID দুইবার থাকতে পারবে না
EntrySchema.index({ bookId: 1, cid: 1 }, { unique: true }); 

// হেলথ চেক অপ্টিমাইজেশন: দ্রুত ভ্যালিডেশন এর জন্য
EntrySchema.index({ userId: 1, bookId: 1, vKey: 1 });

export default models.Entry || model<IEntry>('Entry', EntrySchema);