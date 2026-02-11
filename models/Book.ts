// src/models/Book.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT (BOOK) SCHEMA PROTOCOL - V11.0 (Stability Upgrade)
 * -----------------------------------------------
 * Architecture: Logical Clock (vKey) integrated for Sync Conflict Resolution.
 * Logic B: If Server vKey > Local vKey, client triggers background hydration.
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস
export interface IBook extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  isPublic: boolean;
  shareToken?: string;
  // --- নতুন প্রোটোকল ফিল্ডস ---
  type: 'general' | 'customer' | 'supplier';
  phone?: string;
  image?: string; // Base64 বা ইমেজ URL
  // --- Stability Upgrade Field ---
  vKey: number; // Logic B: Logical Clock for Conflict Resolution
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>({
  name: { 
    type: String, 
    required: [true, "Vault identity name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"]
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
    default: ""
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  // পাবলিক শেয়ারিং প্রোটোকল
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  shareToken: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true
  },
  // --- ২. নতুন ডাইনামিক ফিল্ডস (Elite OS Upgrade) ---
  type: { 
    type: String, 
    enum: ['general', 'customer', 'supplier'], // প্রোটোকল ভ্যালিডেশন
    default: 'general',
    lowercase: true, // Strict Protocol: Always lowercase in DB
    index: true
  },
  phone: { 
    type: String, 
    trim: true, 
    default: "" 
  },
  image: { 
    type: String, 
    default: "" // ভল্ট আইডেন্টিটি ইমেজ (Base64)
  },
  // --- ৩. Stability Protocol Field ---
  vKey: {
    type: Number,
    default: 1, // Default to 1 for backward compatibility
    required: true
  }
}, { 
  timestamps: true, 
  versionKey: false // Mongoose default __v off (We use our custom vKey)
});

// ৪. ইনডেক্সিং: সার্চ এবং সর্টিং পারফরম্যান্স অপ্টিমাইজেশন
BookSchema.index({ userId: 1, updatedAt: -1 });
BookSchema.index({ userId: 1, type: 1 }); // টাইপ অনুযায়ী দ্রুত খোঁজার জন্য
BookSchema.index({ userId: 1, vKey: 1 }); // Logic D: Health Check performance

export default models.Book || model<IBook>('Book', BookSchema);