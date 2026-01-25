import mongoose, { Schema, model, models } from 'mongoose';

const EntrySchema = new Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'General' },
  paymentMethod: { type: String, default: 'Cash' },
  note: { type: String, default: '' },
  date: { type: Date, required: true }, 
  time: { type: String, default: "" }, // নতুন ফিল্ড: সময়
  status: { type: String, enum: ['Completed', 'Pending'], default: 'Completed' }
}, { timestamps: true });

export default models.Entry || model('Entry', EntrySchema);