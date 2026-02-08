import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { Providers } from "./providers";
// 🔥 ১. মডাল রেজিস্ট্রি ইম্পোর্ট করুন (পাথ আপনার প্রোজেক্ট অনুযায়ী চেক করে নিন)
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
      <body className={`${jakarta.variable} font-sans antialiased selection:bg-orange-500/30`} suppressHydrationWarning={true} >
        <Providers>
            {/* নোটিফিকেশন সিস্টেম */}
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={12}
              toastOptions={{
                duration: 3500,
                style: {
                  background: 'rgba(25, 25, 25, 0.8)',
                  backdropFilter: 'blur(15px)',
                  WebkitBackdropFilter: 'blur(15px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  padding: '12px 24px',
                  fontSize: '10px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                },
                success: { iconTheme: { primary: '#F97316', secondary: '#fff' } },
                error: { style: { background: 'rgba(220, 38, 38, 0.9)', border: '1px solid rgba(255, 255, 255, 0.2)' } }
              }}
            />

            {/* ২. মেইন অ্যাপ কন্টেন্ট */}
            {children}

            {/* 🔥 ৩. মাস্ট ফিক্স: মডাল রেজিস্ট্রিকে এখানে বসান */}
            {/* এটি এখানে থাকায় কোনো প্যাডিং বা স্ট্যাকিং কনটেক্সট একে আটকাতে পারবে না */}
            <ModalRegistry /> 
        </Providers>
      </body>
    </html>
  );
}