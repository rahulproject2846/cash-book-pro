import mongoose, { Schema, model, models } from 'mongoose';

const EntrySchema = new Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, default: 'General' },
  // নতুন ফিল্ডসমূহ:
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Card'], 
    default: 'Cash' 
  },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Entry || model('Entry', EntrySchema);