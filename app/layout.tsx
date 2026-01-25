// src/app/layout.tsx (Full Code)
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast'; // ১. ইমপোর্ট করুন

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta'
});

export const metadata: Metadata = {
  title: "CashBook Pro | Smart Ledger",
  description: "Advanced Financial Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {/* ২. টোস্টার কম্পোনেন্টটি এখানে রাখুন */}
        <Toaster position="top-center" reverseOrder={false} />
        {children}
      </body>
    </html>
  );
}