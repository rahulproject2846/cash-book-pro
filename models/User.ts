import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * USER IDENTITY SCHEMA PROTOCOL
 * ----------------------------
 * এটি পুরো ইকোসিস্টেমের মূল সিকিউরিটি এবং কনফিগারেশন মডেল। 
 * ইউজারের আইডেন্টিটি, ক্যাটাগরি এবং সিস্টেম প্রেফারেন্স এখানে সংরক্ষিত হয়।
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (Protocol Intelligence)
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
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
    minlength: [3, "Name must be at least 3 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Security email is mandatory"],
    unique: true,
    lowercase: true, // সবসময় ছোট হাতের অক্ষরে সেভ হবে
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email protocol"]
  },
  password: { 
    type: String, 
    required: [true, "Security key is required"],
    minlength: [6, "Key must be at least 6 characters"]
  },
  // ডায়নামিক সিস্টেম সেটিংস
  categories: { 
    type: [String], 
    default: ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'SHOPPING', 'LOAN'],
    set: (cats: string[]) => cats.map(c => c.trim().toUpperCase()) // অটো ফরম্যাট
  },
  currency: { 
    type: String, 
    default: 'BDT (৳)',
    trim: true 
  },
  // ইউজার প্রেফারেন্স প্রোটোকল
  preferences: {
    dailyReminder: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: false },
    highExpenseAlert: { type: Boolean, default: false }
  }
}, { 
  timestamps: true, // createdAt এবং updatedAt অটো হ্যান্ডেল হবে
  versionKey: false 
});

// ২. ইনডেক্সিং: ইমেইল দিয়ে যাতে দ্রুত লগইন করা যায়
UserSchema.index({ email: 1 });

export default models.User || model<IUser>('User', UserSchema);