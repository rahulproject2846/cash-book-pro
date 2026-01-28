import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta'
});

// PWA: প্রোডাকশন লেভেল মেটাডেটা সেটআপ
export const metadata: Metadata = {
  title: "Vault Pro | Secure Digital Ledger",
  description: "Private and secure financial protocol for personal and business wealth tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vault Pro",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
  formatDetection: {
    telephone: false,
  },
};

// স্ট্যাটাস বার এবং থিম কালার ফিক্স (Studio Grey থিমের সাথে সিঙ্ক করা)
export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // পিন্চ জুম বন্ধ করে পিওর অ্যাপ ফিল দেওয়া হয়েছে
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased selection:bg-orange-500/30`}>
        <Providers>
            {/* নোটিফিকেশন সিস্টেম - প্রিমিয়াম স্টাইল */}
            <Toaster 
              position="top-center" 
              toastOptions={{
                style: {
                  background: '#1A1A1B',
                  color: '#F0F0F0',
                  border: '1px solid #2D2D2D',
                  fontSize: '12px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  borderRadius: '16px',
                  padding: '12px 20px',
                },
              }}
            />
            {children}
        </Providers>
      </body>
    </html>
  );
}