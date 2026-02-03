import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT (BOOK) SCHEMA PROTOCOL - V2 (Elite Upgrade)
 * -----------------------------------------------
 * এটি প্রতিটি লেজারের জন্য মূল ডাটা স্ট্রাকচার। 
 * নতুনভাবে Type (General/Customer/Supplier), Phone এবং Image সাপোর্ট যোগ করা হয়েছে।
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
  }
}, { 
  timestamps: true, 
  versionKey: false 
});

// ৩. ইনডেক্সিং: সার্চ এবং সর্টিং পারফরম্যান্স অপ্টিমাইজেশন
BookSchema.index({ userId: 1, updatedAt: -1 });
BookSchema.index({ userId: 1, type: 1 }); // টাইপ অনুযায়ী দ্রুত খোঁজার জন্য

export default models.Book || model<IBook>('Book', BookSchema);