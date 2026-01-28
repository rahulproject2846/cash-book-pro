import mongoose, { Schema, model, models, Document } from 'mongoose';

/**
 * TRANSACTION (ENTRY) SCHEMA PROTOCOL
 * ----------------------------------
 * এটি প্রতিটি আয় ও ব্যয়ের জন্য মূল ডাটা মডেল। 
 * ইনডেক্সিং এবং ভ্যালিডেশনের মাধ্যমে ডাটা ইনটেগ্রিটি নিশ্চিত করা হয়েছে।
 */

// ১. টাইপস্ক্রিপ্ট ইন্টারফেস (Security & Intelligence)
export interface IEntry extends Document {
  bookId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  note?: string;
  date: Date;
  time?: string;
  status: 'Completed' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  bookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: [true, "Vault ID (bookId) is mandatory"],
    index: true // বুক অনুযায়ী ট্রানজেকশন দ্রুত লোড করার জন্য
  },
  title: { 
    type: String, 
    required: [true, "Transaction identity (title) is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"]
  },
  amount: { 
    type: Number, 
    required: [true, "Capital amount is required"],
    min: [0, "Amount cannot be negative"] 
  },
  type: { 
    type: String, 
    enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid protocol type'
    },
    required: true 
  },
  category: { 
    type: String, 
    default: 'General',
    trim: true 
  },
  paymentMethod: { 
    type: String, 
    default: 'Cash',
    trim: true 
  },
  note: { 
    type: String, 
    trim: true,
    maxlength: [500, "Note cannot exceed 500 characters"],
    default: "" 
  },
  date: { 
    type: Date, 
    required: [true, "Timestamp (date) is mandatory"],
    index: true // তারিখ অনুযায়ী ফিল্টারিং ফাস্ট করার জন্য
  },
  time: { 
    type: String, 
    default: "" 
  },
  status: { 
    type: String, 
    enum: ['Completed', 'Pending'], 
    default: 'Completed',
    index: true
  }
}, { 
  timestamps: true,
  versionKey: false // ক্লিন ডাটার জন্য __v বাদ দেওয়া হয়েছে
});

// ২. ইনডেক্সিং প্রোটোকল: 
// ড্যাশবোর্ড এবং ডিটেইলস পেজে সার্চ ও ফিল্টারিং সুপার ফাস্ট হবে
EntrySchema.index({ bookId: 1, date: -1, createdAt: -1 });
EntrySchema.index({ bookId: 1, type: 1, status: 1 }); // এনালিটিক্স এর জন্য

export default models.Entry || model<IEntry>('Entry', EntrySchema);