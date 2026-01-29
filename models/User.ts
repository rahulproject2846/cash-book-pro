import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * USER IDENTITY SCHEMA PROTOCOL (UPDATED)
 * ---------------------------------------
 * এটি পুরো ইকোসিস্টেমের মূল সিকিউরিটি এবং কনফিগারেশন মডেল। 
 * আপডেট: গুগল লগইন, ইমেজ সিঙ্ক লজিক এবং ওটিপি ভেরিফিকেশন সাপোর্ট যুক্ত করা হয়েছে।
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (Protocol Intelligence)
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // গুগলের ক্ষেত্রে পাসওয়ার্ড অপশনাল হতে পারে
  image?: string;
  isCustomImage: boolean; // ম্যানুয়াল আপলোড ফ্ল্যাগ
  authProvider: 'credentials' | 'google';
  otpCode?: string;
  otpExpiry?: Date;
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
  // --- নতুন প্রোফাইল ফিচার ---
  image: {
    type: String,
    default: "" // ডিফল্ট বা গুগল ইমেজ URL এখানে থাকবে
  },
  isCustomImage: {
    type: Boolean,
    default: false // ম্যানুয়ালি আপলোড করলে এটি true হবে, তখন আর গুগল সিঙ্ক হবে না
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials'
  },
  // --- ওটিপি ভেরিফিকেশন ---
  otpCode: {
    type: String,
    select: false // ডিফল্ট কুয়েরিতে এটি রিটার্ন করবে না (সিকিউরিটি)
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

// ২. ইনডেক্সিং: ইমেইল সার্চ ফাস্ট করার জন্য
UserSchema.index({ email: 1 });

export default models.User || model<IUser>('User', UserSchema);