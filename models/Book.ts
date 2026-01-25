// src/models/Book.ts (Full Code)
import mongoose, { Schema, model, models } from 'mongoose';

const BookSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // NEW: User ID
}, { timestamps: true });

export default models.Book || model('Book', BookSchema);