// src/models/User.ts
import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * USER IDENTITY SCHEMA PROTOCOL (FINAL v11.0 - UNBREAKABLE)
 * ---------------------------------------
 * Project: Vault Pro (Financial OS)
 * Module: Authentication Core
 * Updates: Added 'isActive' flag for administrative control and blocking.
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (Protocol Intelligence)
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Credentials login এর জন্য
  
  // Google & Auth Specifics
  googleId?: string; // Google Unique ID (Security Layer)
  authProvider: 'credentials' | 'google';
  image?: string;
  isCustomImage: boolean; // ম্যানুয়াল আপলোড ফ্ল্যাগ
  mediaCid?: string; // ✅ ADDED: Cloudinary URL reference
  
  // Security & Verification
  isVerified: boolean; // OTP বা Google Login এর মাধ্যমে ভেরিফাইড কি না
  isActive: boolean;   // অ্যাডমিন কন্ট্রোল: true মানে সচল, false মানে ব্লকড
  otpCode?: string;
  otpExpiry?: Date;
  
  // System Settings
  categories: string[];
  currency: string;
  vKey: number;
  preferences: {
    turboMode: boolean;
    isMidnight: boolean;
    compactMode: boolean;
    autoLock: boolean;
    dailyReminder: boolean;
    weeklyReports: boolean;
    highExpenseAlert: boolean;
    showTooltips: boolean;
    expenseLimit: number;
    language: string;
  };
  
  // 🔐 LICENSE & SECURITY FIELDS
  plan: { type: String, enum: ['free', 'pro'], default: 'free' };
  offlineExpiry: { type: Number, default: 0 };
  riskScore: { type: Number, default: 0 };
  receiptId: { type: String, default: null };
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: [true, "Username identity is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Security email is mandatory"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email protocol"]
  },
  password: { 
    type: String, 
    // যদি গুগল দিয়ে লগইন করে, তবে পাসওয়ার্ড বাধ্যতামূলক নয়
    required: function() { return this.authProvider === 'credentials'; },
    minlength: [6, "Key must be at least 6 characters"]
  },

  // --- Google & Auth Specifics ---
  googleId: {
    type: String,
    unique: true,
    sparse: true, // null বা undefined ভ্যালু এলাউ করে (যাদের গুগল নেই)
    select: false // ডিফল্ট কুয়েরিতে হাইড থাকবে
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials'
  },
  image: {
    type: String,
    default: "" // ডিফল্ট বা গুগল ইমেজ URL
  },
  isCustomImage: {
    type: Boolean,
    default: false // ম্যানুয়ালি আপলোড করলে এটি true হবে, তখন আর গুগল সিঙ্ক হবে না
  },
  mediaCid: {  
    type: String,
    default: "",
    index: true  
  },

  // --- ওটিপি ও ভেরিফিকেশন ---
  isVerified: {
    type: Boolean,
    default: false // রেজিস্ট্রেশনের পর ডিফল্ট false, OTP বা Google দিয়ে true হবে
  },
  isActive: {
    type: Boolean,
    default: true // ডিফল্টভাবে ইউজার সচল থাকবে
  },
  otpCode: {
    type: String,
    select: false // সিকিউরিটি: এটি ক্লায়েন্টে যাবে না
  },
  otpExpiry: {
    type: Date,
    select: false
  },

  // --- সিস্টেম সেটিংস ---
  categories: { 
    type: [String], 
    default: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
    set: (cats: string[]) => cats.map(c => c.trim())
  },
  currency: { 
    type: String, 
    default: 'BDT (৳)',
    trim: true 
  },
  preferences: {
    turboMode: { type: Boolean, default: false },
    isMidnight: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false },
    autoLock: { type: Boolean, default: false },
    dailyReminder: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: false },
    highExpenseAlert: { type: Boolean, default: false },
    showTooltips: { type: Boolean, default: true },
    expenseLimit: { type: Number, default: 0 },
    language: { type: String, default: 'en' }
  },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  offlineExpiry: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  receiptId: { type: String, default: null }
}, { 
  timestamps: true,
  versionKey: false 
});

// ২. ইনডেক্সিং: ইমেইল এবং গুগল আইডি দিয়ে সার্চ ফাস্ট করার জন্য
UserSchema.index({ isActive: 1 }); // ব্লকড ইউজারদের দ্রুত ফিল্টার করার জন্য ইনডেক্স

export default models.User || model<IUser>('User', UserSchema);