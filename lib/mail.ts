import nodemailer from 'nodemailer';

// জিমেইল বা SMTP কনফিগারেশন
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // আপনার জিমেইল (.env তে রাখতে হবে)
    pass: process.env.EMAIL_PASS  // জিমেইল অ্যাপ পাসওয়ার্ড
  }
});

export const sendOTP = async (to: string, code: string) => {
  try {
    const mailOptions = {
      from: `"Vault Pro Security" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Verification Code - Vault Pro',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #F97316;">Vault Pro Identity Check</h2>
          <p>Your security verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 5px; color: #000;">${code}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p style="font-size: 12px; color: #888;">If you didn't request this, please ignore.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("❌ Email Error:", error);
    return false;
  }
};