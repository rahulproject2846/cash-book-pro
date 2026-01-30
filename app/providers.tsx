"use client";
import React, { useEffect, useState } from 'react';
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // হাইড্রেসন এরর থেকে বাঁচতে মাউন্ট হওয়া পর্যন্ত অপেক্ষা করা
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // মাউন্ট হওয়ার আগে শুধু চিলড্রেন দেখাবে (থিম ছাড়া) যাতে লেআউট না লাফায়
    return <>{children}</>;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" // আপনার স্টুডিও থিম যেহেতু ডার্কে বেশি সুন্দর, তাই ডিফল্ট ডার্ক রাখা ভালো
      enableSystem={true} 
      disableTransitionOnChange // থিম পরিবর্তনের সময় যাতে ট্রানজিশন স্মুথ হয়
    >
      {children}
    </ThemeProvider>
  );
}