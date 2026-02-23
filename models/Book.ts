import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT (BOOK) SCHEMA PROTOCOL - V11.0 (Stability Upgrade)
 * -----------------------------------------------
 * Fix: Removed duplicate updatedAt and matched Interface with Schema fields.
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস
export interface IBook extends Document {
  cid: string;        
  name: string;
  description?: string;
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     
  userId: string; 
  isPublic: boolean;
  shareToken?: string;
  type: 'general' | 'customer' | 'supplier';
  phone?: string;
  image?: string; 
  isDeleted?: number;
  createdAt: Date;
  updatedAt: Date; // কেবল একবার রাখা হয়েছে
  mediaCid?: string; // ✅ ADDED: Cloudinary URL reference
}

const BookSchema = new Schema<IBook>({
  // সিঙ্ক প্রোটোকল ফিল্ডস (ইন্টারফেসের সাথে মিল রেখে যোগ করা হয়েছে)
  cid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  userId: { 
    type: String, // Interface এর সাথে মিল রাখতে String করা হয়েছে (Casting Error এড়াতে)
    required: true,
    index: true 
  },
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
  vKey: {
    type: Number,
    default: 1,
    required: true
  },
  syncAttempts: {
    type: Number,
    default: 0
  },
  lastAttempt: {
    type: Number
  },
  isPinned: {
    type: Number,
    default: 0
  },
  // পাবলিক শেয়ারিং ও অন্যান্য প্রোটোকল
  isPublic: { 
    type: Boolean, 
    default: true 
  },
  shareToken: { 
    type: String, 
    default: null,
    sparse: true
  },
  type: { 
    type: String, 
    enum: ['general', 'customer', 'supplier'],
    default: 'general',
    index: true
  },
  phone: { 
    type: String, 
    trim: true, 
    default: "" 
  },
  image: { 
    type: String, 
    default: "" 
  },
  mediaCid: {  // ✅ ADDED: Cloudinary URL reference
    type: String,
    default: "",
    index: true  // For faster lookup
  },
  isDeleted: {
    type: Number,
    default: 0,
    index: true
  }
}, { 
  timestamps: true, 
  versionKey: false 
});

// ৪. ইনডেক্সিং: সার্চ এবং সর্টিং পারফরম্যান্স অপ্টিমাইজেশন
BookSchema.index({ userId: 1, updatedAt: -1 });
BookSchema.index({ userId: 1, type: 1 }); 
BookSchema.index({ userId: 1, vKey: 1 }); 

export default models.Book || model<IBook>('Book', BookSchema);