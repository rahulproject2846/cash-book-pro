import mongoose from 'mongoose';

/**
 * DATABASE CONNECTION PROTOCOL
 * ----------------------------
 * Next.js-এর Hot Reloading ফিচারের কারণে ডাটাবেস কানেকশন বার বার 
 * তৈরি হওয়া ঠেকাতে এখানে গ্লোবাল ক্যাশিং ব্যবহার করা হয়েছে।
 */

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  throw new Error("CRITICAL_ERROR: MONGODB_URI is not defined in environment variables.");
}

/** 
 * গ্লোবাল অবজেক্টে মঙ্গুস ক্যাশ করার জন্য টাইপ ডেফিনিশন 
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // ১. যদি কানেকশন আগে থেকেই থাকে, তবে সেটিই রিটার্ন করবে (Fast Path)
  if (cached!.conn) {
    return cached!.conn;
  }

  // ২. যদি কোনো কানেকশন পেন্ডিং থাকে, তবে সেটির জন্য অপেক্ষা করবে
  if (!cached!.promise) {
    const opts = {
      bufferCommands: false, // কমান্ড বাফার বন্ধ রাখা হয়েছে পারফরম্যান্সের জন্য
    };

    console.log("📡 INITIALIZING_DATABASE_PROTOCOL...");
    
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ DATABASE_SYNCHRONIZATION_COMPLETE");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null; // এরর হলে প্রমিজ রিসেট করবে
    console.error("❌ DATABASE_CONNECTION_FAILED:", e);
    throw e;
  }

  return cached!.conn;
}

export default connectDB;