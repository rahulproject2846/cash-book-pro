import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * VAULT (BOOK) SCHEMA PROTOCOL
 * ----------------------------
 * এটি প্রতিটি লেজারের জন্য মূল ডাটা স্ট্রাকচার। 
 * timestamps: true ব্যবহারের ফলে updatedAt দিয়ে আমরা 
 * "Last Active First" লজিকটি হ্যান্ডেল করি।
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (For Better IntelliSense)
export interface IBook extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>({
  name: { 
    type: String, 
    required: [true, "Vault identity name is required"],
    trim: true, // অপ্রয়োজনীয় স্পেস রিমুভ করবে
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
    index: true // সার্চ পারফরম্যান্স ফাস্ট করার জন্য ইনডেক্সিং
  },
  // পাবলিক শেয়ারিং প্রোটোকল
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  shareToken: { 
    type: String, 
    unique: true, 
    sparse: true, // শুধুমাত্র পাবলিক বইয়ের জন্য ইউনিক টোকেন থাকবে
    index: true
  },
}, { 
  timestamps: true, // অটোমেটিক createdAt এবং updatedAt ম্যানেজ করবে
  versionKey: false // __v ফিল্ডটি বাদ দেওয়া হয়েছে ক্লিনার ডাটার জন্য
});

// ২. ইনডেক্সিং: ইউজারের আন্ডারে যাতে বই দ্রুত খুঁজে পাওয়া যায়
BookSchema.index({ userId: 1, updatedAt: -1 });

export default models.Book || model<IBook>('Book', BookSchema);