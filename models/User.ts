// src/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
});

const User = models.User || model('User', UserSchema);
export default User;