import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ 
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Cash Book Pro | Professional Financial Management",
  description: "Advanced financial management application with real-time sync, analytics, and secure cloud storage. Track income, expenses, and manage your finances like a pro.",
  keywords: ["financial management", "cash book", "expense tracker", "income tracker", "budgeting", "finance app", "real-time sync"],
  authors: [{ name: "Cash Book Pro Team" }],
  creator: "Cash Book Pro",
  publisher: "Cash Book Pro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Cash Book Pro | Professional Financial Management',
    description: 'Advanced financial management application with real-time sync and analytics',
    siteName: 'Cash Book Pro',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Cash Book Pro - Professional Financial Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cash Book Pro | Professional Financial Management',
    description: 'Advanced financial management application with real-time sync and analytics',
    images: ['/icon-512.png'],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cash Book Pro",
    startupImage: [
      {
        url: "/icon-512.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased selection:bg-orange-500/30 overflow-x-hidden`} suppressHydrationWarning >
          {children}
      </body>
    </html>
  );
}
