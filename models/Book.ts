import mongoose, { Schema, model, models } from 'mongoose';

const BookSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // নতুন ফিচার: পাবলিক শেয়ারিং এর জন্য
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true },
}, { timestamps: true }); // timestamps: true থাকার কারণে updatedAt অটো কাজ করবে (Last Updated First এর জন্য)

export default models.Book || model('Book', BookSchema);