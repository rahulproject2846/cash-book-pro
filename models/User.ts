// src/models/User.ts (Full Code: HASHING HOOK REMOVED)
import mongoose, { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  // পাসওয়ার্ড এখন সরাসরি সেভ হবে, হ্যাশিং হবে API তে
  password: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now }
});

// Method to compare password
UserSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default (models.User || model<IUser>('User', UserSchema)) as mongoose.Model<IUser>;