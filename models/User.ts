import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * USER IDENTITY SCHEMA PROTOCOL (FINAL v3)
 * ---------------------------------------
 * Project: Vault Pro (Financial OS)
 * Module: Authentication Core
 * Updates: Added 'googleId' for secure linking and 'isVerified' for OTP logic.
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
  
  // Security & Verification
  isVerified: boolean; // OTP বা Google Login এর মাধ্যমে ভেরিফাইড কি না
  otpCode?: string;
  otpExpiry?: Date;
  
  // System Settings
  categories: string[];
  currency: string;
  preferences: {
    dailyReminder: boolean;
    weeklyReports: boolean;
    highExpenseAlert: boolean;
  };
  
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

  // --- ওটিপি ও ভেরিফিকেশন ---
  isVerified: {
    type: Boolean,
    default: false // রেজিস্ট্রেশনের পর ডিফল্ট false, OTP বা Google দিয়ে true হবে
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
    set: (cats: string[]) => cats.map(c => c.trim().toUpperCase())
  },
  currency: { 
    type: String, 
    default: 'BDT (৳)',
    trim: true 
  },
  preferences: {
    dailyReminder: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: false },
    highExpenseAlert: { type: Boolean, default: false }
  }
}, { 
  timestamps: true,
  versionKey: false 
});

// ২. ইনডেক্সিং: ইমেইল এবং গুগল আইডি দিয়ে সার্চ ফাস্ট করার জন্য
UserSchema.index({ email: 1 });
UserSchema.index({ googleId: 1 });

export default models.User || model<IUser>('User', UserSchema);