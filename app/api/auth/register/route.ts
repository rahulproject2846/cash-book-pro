import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { username, email, password } = data; 

    // ১. ইনপুট ভ্যালিডেশন: কোনো ফিল্ড খালি থাকলে এরর
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Identity details (name, email, password) are missing" }, 
        { status: 400 }
      );
    }

    await connectDB();
    
    // ২. ইমেইল ক্লিন করা এবং আগের রেকর্ড চেক করা
    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    
    if (userExists) {
      return NextResponse.json(
        { message: "This email is already registered in the vault" }, 
        { status: 400 }
      );
    }

    // ৩. পাসওয়ার্ড হ্যাশ করা (সিকিউরিটি লেভেল ১০)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // ৪. ডিফল্ট ডাটা সহ ইউজার তৈরি করা
    // এটি করলে নতুন ইউজারের ড্যাশবোর্ড সাথে সাথেই রেডি থাকবে
    const user = await User.create({ 
      username, 
      email: cleanEmail, 
      password: hashedPassword,
      // ডিফল্ট ক্যাটাগরি এবং কারেন্সি সেট করে দেওয়া হচ্ছে
      categories: ['General', 'Salary', 'Food', 'Rent', 'Shopping', 'Loan'],
      currency: 'BDT (৳)',
      preferences: {
        dailyReminder: false,
        weeklyReports: false,
        highExpenseAlert: false
      }
    });
    
    // ৫. সফল রেজিস্ট্রেশন রেসপন্স
    return NextResponse.json({
      success: true,
      message: "Vault initialized successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        categories: user.categories,
        currency: user.currency
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("REGISTER_API_ERROR:", error.message);
    return NextResponse.json(
      { message: "System failure during registration" }, 
      { status: 500 }
    );
  }
}