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
  entryCount?: number;
  description?: string;
  vKey: number;         
  syncAttempts: number; 
  lastAttempt?: number; 
  isPinned?: number;     
  userId: string; 
  isPublic: number;
  shareToken?: string;
  type: 'general' | 'customer' | 'supplier';
  phone?: string;
  image?: string; 
  isDeleted?: number;
  conflicted?: number;
  conflictReason?: string;
  serverData?: any;
  createdAt: number;
  updatedAt: number; // 🚨 DNA HARDENING: Changed from Date to number for consistency
  mediaCid?: string; // ✅ ADDED: Cloudinary URL reference
  cachedBalance?: number; // ✅ ADDED: Unix Number (ms) cached balance
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
    required: true
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
    type: Number, 
    default: 1 
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
  },
  conflicted: {
    type: Number,
    default: 0,
    index: true
  },
  conflictReason: {
    type: String,
    default: ""
  },
  serverData: {
    type: Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Number,
    required: true
  },
  updatedAt: {
    type: Number,
    required: true
  },
  cachedBalance: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: false, // 🚨 DNA HARDENING: Disable Mongoose auto-timestamps to prevent Date injection
  versionKey: false 
});

// ৪. ইনডেক্সিং: সার্চ এবং সর্টিং পারফরম্যান্স অপ্টিমাইজেশন
BookSchema.index({ userId: 1, updatedAt: -1 });
BookSchema.index({ userId: 1, type: 1 }); 
BookSchema.index({ userId: 1, vKey: 1 }); 

// 🛡️ FORCE RECOMPILE: Delete existing model from cache to apply Number types
if (mongoose.models.Book) {
  delete (mongoose.models as any).Book;
}

const BookModel = mongoose.model('Book', BookSchema);
export default BookModel;