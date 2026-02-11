import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { Providers } from "./providers";
import { ModalRegistry } from "@/components/Modals/ModalRegistry";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta'
});

export const metadata: Metadata = {
  title: "Vault Pro | Secure Digital Ledger",
  description: "Private and secure financial protocol.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vault Pro",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased selection:bg-orange-500/30 overflow-x-hidden`} suppressHydrationWarning >
        <Providers>
            {/* ১. এলিট নোটিফিকেশন ইঞ্জিন (V12 Fix) */}
<Toaster
  position="bottom-center"
  reverseOrder={false}
  gutter={12}
  containerStyle={{
    zIndex: 99999,
    bottom: 40,
  }}
  toastOptions={{
    duration: 4000,
    // ডাইনামিক থিম ম্যাচিং স্টাইল
    style: {
      background: 'var(--bg-card)', // আপনার গ্লাস ব্যাকগ্রাউন্ড
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      color: 'var(--text-main)', // মোড অনুযায়ী টেক্সট কালার
      border: '1px solid var(--border-color)', // আপনার থিমের বর্ডার
      borderRadius: '24px',
      padding: '12px 24px',
      fontSize: '11px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      boxShadow: 'var(--card-shadow)', // আপনার অ্যাপল স্টাইল শ্যাডো
      maxWidth: '400px',
    },
    // সাকসেস টোস্ট - অ্যাকসেন্ট কালার (Orange) ফোকাসড
    success: {
      iconTheme: {
        primary: 'var(--accent)', // আপনার সিগনেচার অরেঞ্জ
        secondary: '#fff',
      },
    },
    // এরর টোস্ট - ভাইব্রেন্ট রেড কিন্তু গ্লাসি
    error: {
      style: {
        background: 'rgba(239, 68, 68, 0.15)', // খুব হালকা রেড ব্যাকগ্রাউন্ড
        border: '1px solid rgba(239, 68, 68, 0.3)', // রেড বর্ডার
        backdropFilter: 'blur(25px)',
        color: '#ef4444', // টেক্সট রেড
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
  }}
/>
            {/* ২. মেইন অ্যাপ কন্টেন্ট */}
            {children}

            {/* ৩. গ্লোবাল মডাল হাব (Elite Layering) */}
            <ModalRegistry /> 
        </Providers>
      </body>
    </html>
  );
}