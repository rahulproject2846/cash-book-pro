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

// PWA এবং মোবাইল অপ্টিমাইজেশনের জন্য মেটাডেটা
export const metadata: Metadata = {
  title: "CashBook Pro | Smart Ledger",
  description: "Secure Digital Ledger for your finances",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CashBook Pro",
  },
  formatDetection: {
    telephone: false,
  },
};

// স্ট্যাটাস বার এবং থিম কালার ফিক্স
export const viewport: Viewport = {
  themeColor: "#05070A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // পিন্চ জুম বন্ধ করে অ্যাপ ফিল দেওয়া
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <Providers>
            <Toaster position="top-center" />
            {children}
        </Providers>
      </body>
    </html>
  );
}