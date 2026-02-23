import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("CRITICAL_ERROR: MONGODB_URI is not defined.");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      // নিচের অপশনগুলো এপিআই রেসপন্স টাইম কমাতে সাহিটে
      maxPoolSize: 10,        // ১০টি কানেক্র ডি রাখবে (মোবাইল ইউজারের আইডি (মালিকানা ঠিক করার জন্য ফাস্ট হবে)
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      /** * ইনডেক্স ওয়ার্নিং ফিক্স: 
       * প্রোটেক্শন রান করে এপিআই ফাস্ট লোড হট। 
       */
      if (process.env.NODE_ENV === 'production') {
        mongooseInstance.set('autoIndex', false); 
      }
      return mongooseInstance;
    });
  }
  try {
    cached!.conn = await cached!.promise;
    // 🔥 [NUCLEAR] TOTAL PURGE - DECOMMISSIONED (Database is now clean)
  } catch (e) {
    cached!.promise = null;
    console.error(" DATABASE_CONNECTION_FAILED:", e);
    throw e;
  }
  return cached!.conn;
}

export default connectDB;