import mongoose, { Schema, model, models } from 'mongoose';

const BookSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: String, default: 'admin' }, // ভবিষ্যতে মাল্টি-ইউজার করার জন্য
}, { timestamps: true });

export default models.Book || model('Book', BookSchema);