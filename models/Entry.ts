import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IEntry extends Document {
  cid: string; // 🔥 নতুন ফিল্ড: ক্লায়েন্ট আইডি
  bookId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  note?: string;
  date: Date;
  time?: string;
  status: 'completed' | 'pending' | 'Completed' | 'Pending';
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>({
  // 🔥 ১. CID (Client ID) - এটিই ডুপ্লিকেট কিলার
  cid: { 
    type: String, 
    required: [true, "Client ID (cid) is required for sync integrity"],
    index: true 
  },
  bookId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  category: { type: String, default: 'General' },
  paymentMethod: { type: String, default: 'Cash' },
  note: { type: String, default: "" },
  date: { type: Date, required: true, index: true },
  time: { type: String, default: "" },
  status: { 
    type: String, 
    default: 'Completed',
    index: true
  }
}, { 
  timestamps: true,
  versionKey: false
});

EntrySchema.index({ bookId: 1, cid: 1 }, { unique: true }); // 🔥 ডাবল প্রোটেকশন: একই বুকে একই CID দুইবার থাকতে পারবে না

export default models.Entry || model<IEntry>('Entry', EntrySchema);