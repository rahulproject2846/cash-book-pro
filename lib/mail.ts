import nodemailer from 'nodemailer';

// ENTERPRISE-GRADE EMAIL TRANSPORT POOLING
// Reuse transporter for optimal performance and connection management
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // আপনার জিমেইল (.env তে রাখতে হবে)
        pass: process.env.EMAIL_PASS  // জিমেইল অ্যাপ পাসওয়ার্ড
      }
    });
  }
  return transporter;
};

// ENTERPRISE-GRADE RATE LIMITING
// In-memory rate limiter: Max 1 OTP per minute per email
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60000; // 1 minute

// SECURE EMAIL MASKING
const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `${username[0]}***@${domain}`;
  return `${username.slice(0, 2)}***@${domain}`;
};

export const sendOTP = async (to: string, code: string) => {
  try {
    // RATE LIMITING CHECK
    const lastSent = rateLimitMap.get(to) || 0;
    if (Date.now() - lastSent < RATE_LIMIT_MS) {
      console.warn(` [RATE_LIMIT] OTP request blocked for ${maskEmail(to)}`);
      throw new Error('Rate limit exceeded. Please wait before requesting another OTP.');
    }

    // REUSE TRANSPORTER (Connection Pooling)
    const mailTransporter = getTransporter();
    
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

    await mailTransporter.sendMail(mailOptions);
    
    // UPDATE RATE LIMIT MAP ON SUCCESS
    rateLimitMap.set(to, Date.now());
    
    return true;
  } catch (error) {
    // SECURE ERROR LOGGING (No full email exposure)
    console.error(" Email Error:", error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};