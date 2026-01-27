import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // সেটিংসের জন্য নিচের ফিল্ডগুলো অবশ্যই থাকতে হবে
  categories: { 
    type: [String], 
    default: ['General', 'Salary', 'Food', 'Rent', 'Shopping', 'Loan'] 
  },
  currency: { type: String, default: 'BDT (৳)' },
  preferences: {
    dailyReminder: { type: Boolean, default: false },
    weeklyReports: { type: Boolean, default: false },
    highExpenseAlert: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

export default models.User || model('User', UserSchema);