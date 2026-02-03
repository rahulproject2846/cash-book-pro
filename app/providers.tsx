"use client";

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from "next-themes";
import { TranslationProvider } from '@/context/TranslationContext';
import { ModalProvider } from '@/context/ModalContext'; 
import { ModalRegistry } from '@/components/Modals/ModalRegistry'; 

/**
 * VAULT PRO: MASTER PROVIDERS ENGINE
 * ---------------------------------
 * This file orchestrates Theme, Translation, and the Global Modal System.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ১. মাউন্ট স্ট্যাটাস এবং ইউজার ডাটা সিঙ্ক
  useEffect(() => {
    setMounted(true);
    
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
        try {
            setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("User Parse Error");
        }
    }

    const syncUser = () => {
        const updatedUser = localStorage.getItem('cashbookUser');
        if (updatedUser) setCurrentUser(JSON.parse(updatedUser));
    };

    window.addEventListener('language-changed', syncUser);
    return () => window.removeEventListener('language-changed', syncUser);
  }, []);

  // ২. রি-রেন্ডার সেফটি এবং এরর প্রিভেনশন
  // প্রোভাইডারগুলোকে রিটার্ন ব্লকের ভেতরে রাখা হয়েছে যাতে children (page.tsx) 
  // সবসময় প্রোভাইডারগুলোর অ্যাক্সেস পায়, এমনকি মাউন্ট হওয়ার আগেই।
  return (
    <ModalProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={true} 
        disableTransitionOnChange
      >
        <TranslationProvider currentUser={currentUser}>
          
          {/* মাউন্ট হওয়ার আগে কন্টেন্ট অপাসিটি ০ থাকবে যাতে হাইড্রেশন এরর না হয় */}
          <div style={{ opacity: mounted ? 1 : 0 }} className="transition-opacity duration-300">
              {children}
          </div>
          
          {/* গ্লোবাল মডাল লেয়ার: এটি অ্যাপ মাউন্ট হওয়ার পর ডাইনামিকালি রেন্ডার হবে */}
          {mounted && <ModalRegistry />}
          
        </TranslationProvider>
      </ThemeProvider>
    </ModalProvider>
  );
}