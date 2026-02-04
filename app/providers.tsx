"use client";

import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from "next-themes";
import { TranslationProvider } from '@/context/TranslationContext';
import { ModalProvider } from '@/context/ModalContext'; 
import { ModalRegistry } from '@/components/Modals/ModalRegistry'; 

/**
 * INTERNAL COMPONENT: THEME SYNCHRONIZER
 * এটি ইউজারের পছন্দ অনুযায়ী মিডনাইট এবং কম্প্যাক্ট মোড জোর করে ধরে রাখে।
 */
const ThemeSynchronizer = ({ currentUser }: { currentUser: any }) => {
    const { setTheme } = useTheme();

    useEffect(() => {
        if (!currentUser) return;

        const prefs = currentUser.preferences || {};
        const root = document.documentElement;

        // ১. মিডনাইট মোড লজিক (Midnight Mode Persistence)
        if (prefs.isMidnight) {
            root.classList.add('midnight-mode');
            setTheme('dark'); // মিডনাইট হলে অবশ্যই ডার্ক থিম হতে হবে
        } else {
            root.classList.remove('midnight-mode');
        }

        // ২. কম্প্যাক্ট মোড লজিক (Compact Mode Persistence)
        if (prefs.compactMode) {
            root.classList.add('compact-deck');
        } else {
            root.classList.remove('compact-deck');
        }

    }, [currentUser, setTheme]);

    return null; // এটি কোনো UI রেন্ডার করে না, শুধু লজিক চালায়
};

/**
 * VAULT PRO: MASTER PROVIDERS ENGINE
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // লোকাল স্টোরেজ থেকে ইউজার এবং প্রেফারেন্স লোড করা
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            setCurrentUser(parsedUser);
            
            // 🔥 IMMEDIATE DOM UPDATE (ফ্লিকারিং আটকানোর জন্য)
            const root = document.documentElement;
            if (parsedUser.preferences?.isMidnight) root.classList.add('midnight-mode');
            if (parsedUser.preferences?.compactMode) root.classList.add('compact-deck');
            
        } catch (e) {
            console.error("User Parse Error");
        }
    }

    // সেটিংস পেজ থেকে আপডেট হলে সাথে সাথে সিঙ্ক করা
    const syncUser = () => {
        const updatedUser = localStorage.getItem('cashbookUser');
        if (updatedUser) setCurrentUser(JSON.parse(updatedUser));
    };

    window.addEventListener('language-changed', syncUser);
    // আমরা ধরে নিচ্ছি সেটিংস আপডেট হলে আপনি 'settings-changed' বা স্টোরেজ ইভেন্ট ফায়ার করেন, 
    // অথবা লোকাল স্টোরেজ লিসেনার ব্যবহার করা যায়:
    window.addEventListener('storage', syncUser); 
    
    return () => {
        window.removeEventListener('language-changed', syncUser);
        window.removeEventListener('storage', syncUser);
    };
  }, []);

  return (
    <ModalProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={true} 
        disableTransitionOnChange
      >
        <TranslationProvider currentUser={currentUser}>
            
            {/* 🔥 এই লাইনটি আপনার ক্লাসগুলোকে ধরে রাখবে */}
            <ThemeSynchronizer currentUser={currentUser} />

            <div style={{ opacity: mounted ? 1 : 0 }} className="transition-opacity duration-300">
                {children}
            </div>
            
            {mounted && <ModalRegistry />}
            
        </TranslationProvider>
      </ThemeProvider>
    </ModalProvider>
  );
}