// src/models/User.ts (Full Code: Final Type Fix)
import mongoose, { Schema, model, models } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface Update: createdAt field added
interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date; // <--- FIX: Added the missing field
  matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Method to compare password
UserSchema.methods.matchPassword = async function (this: IUser, enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default (models.User || model<IUser>('User', UserSchema)) as mongoose.Model<IUser>;