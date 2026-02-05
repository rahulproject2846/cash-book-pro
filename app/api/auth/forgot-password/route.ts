import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * VAULT PRO: FORGOT PASSWORD ENGINE
 * ---------------------------------
 * Generates recovery protocol and dispatches to identity email.
 */
export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: "Identity not registered" }, { status: 404 });
    }

    // ১. রিকভারি ওটিপি জেনারেশন (৬ ডিজিট)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // ১০ মিনিট মেয়াদ

    // ২. ডাটাবেসে ওটিপি আপডেট
    user.resetOtp = otp;
    user.resetOtpExpires = otpExpires;
    await user.save();

    // ৩. নোডমেইলার ট্রান্সপোর্টার (আপনার মেইল কনফিগ অনুযায়ী)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Vault Pro Security" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "RECOVERY PROTOCOL: ACCESS KEY",
      html: `
        <div style="background:#0F0F0F; color:#FFF; padding:40px; font-family:sans-serif; text-align:center; border-radius:20px;">
          <h1 style="color:#F97316; letter-spacing:5px;">VAULT PRO</h1>
          <p style="text-transform:uppercase; font-size:10px; letter-spacing:2px; opacity:0.6;">Security Recovery Protocol Issued</p>
          <div style="background:#1A1A1B; padding:20px; border:1px solid #2D2D2D; border-radius:15px; margin:30px 0;">
            <span style="font-size:32px; font-weight:900; letter-spacing:10px; color:#F97316;">${otp}</span>
          </div>
          <p style="font-size:10px; opacity:0.4;">This key expires in 10 minutes. If you didn't request this, terminate this link.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Recovery protocol dispatched" }, { status: 200 });

  } catch (error: any) {
    console.error("FORGOT_PASS_ERROR:", error.message);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}