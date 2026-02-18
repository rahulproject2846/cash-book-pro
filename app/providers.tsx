"use client";

import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from "next-themes";
import { TranslationProvider } from '@/context/TranslationContext';
import { ModalProvider } from '@/context/ModalContext'; 
import { ModalRegistry } from '@/components/Modals/ModalRegistry'; 
import { PusherProvider } from '@/context/PusherContext'; // 🔥 নতুন ইমপোর্ট
import { Toaster } from 'react-hot-toast'; // 🚀 Move Toaster here for client-side logic
import { identityManager } from '@/lib/vault/core/IdentityManager'; // 🔥 Unified Identity Management
import { useMediaStore } from '@/lib/vault/MediaStore'; // 🚀 Media Store Integration
import { orchestrator } from '@/lib/vault/core/SyncOrchestrator'; // 🔥 Sync Orchestrator Integration

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

        // ৩. 🚀 TURBO MODE LOGIC (Performance Optimization)
        if (prefs.turboMode) {
            document.body.classList.add('turbo-mode');
        } else {
            document.body.classList.remove('turbo-mode');
        }

    }, [currentUser, setTheme]);

    return null; // এটি কোনো UI রেন্ডার করে না, শুধু লজিক চালাটে
};

/**
 * VAULT PRO: MASTER PROVIDERS ENGINE
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const mediaStore = useMediaStore();

  useEffect(() => {
    setMounted(true);
    
    // 🚀 GLOBAL EXPOSURE: Make orchestrator and mediaStore available globally
    if (typeof window !== 'undefined') {
      (window as any).orchestrator = orchestrator;
      // 🚀 Use hook function directly for proper store access
      window.mediaStore = useMediaStore; 
    }
    
    // 🔄 SYNC REQUEST LISTENER: Connect MediaStore to SyncOrchestrator
    const handleSyncRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      const userId = customEvent.detail?.userId;
      if (userId && window.orchestrator) {
        console.log('🔄 [GLOBAL EVENT] Sync requested for user:', userId);
        window.orchestrator.triggerSync(userId);
      }
    };

    window.addEventListener('sync-request', handleSyncRequest);
    
    // লোকাল স্টোরেজ থেকে ইউজার এবং প্রেফারেন্স লোড করা
    const userId = identityManager.getUserId();
    if (userId) {
        // Get user data from localStorage for now (IdentityManager handles persistence)
        const savedUser = localStorage.getItem('cashbookUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setCurrentUser(parsedUser);
                
                // IMMEDIATE DOM UPDATE (ফ্লিকারিং আটকানোর জন্য)
                const root = document.documentElement;
                if (parsedUser.preferences?.isMidnight) root.classList.add('midnight-mode');
                if (parsedUser.preferences?.compactMode) root.classList.add('compact-deck');
                if (parsedUser.preferences?.turboMode) document.body.classList.add('turbo-mode'); // 🚀 Turbo Mode immediate update
                
            } catch (e) {
                console.error("User Parse Error");
            }
        }
    }

    // সেটিংস পেজ থেকে আপডেট হলে সাথে সাথে সিঙ্ক করা
    const syncUser = () => {
        const userId = identityManager.getUserId();
        if (userId) {
            // Get user data from localStorage for now (IdentityManager handles persistence)
            const updatedUser = localStorage.getItem('cashbookUser');
            if (updatedUser) setCurrentUser(JSON.parse(updatedUser));
        }
    };

    window.addEventListener('language-changed', syncUser);
    window.addEventListener('storage', syncUser); 
    
    return () => {
        window.removeEventListener('language-changed', syncUser);
        window.removeEventListener('storage', syncUser);
        window.removeEventListener('sync-request', handleSyncRequest);
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
        {/* 🔥 PusherProvider এখানে যোগ করা হলো যাতে এটি ইউজার ডাটা পায় */}
        <PusherProvider currentUser={currentUser}>
            <TranslationProvider currentUser={currentUser}>
                
                {/* এই লাইনটি আপনার ক্লাসগুলোকে ধরে রাখবে */}
                <ThemeSynchronizer currentUser={currentUser} />

                {/* 🚀 TURBO MODE TOASTER (Client-side only) */}
                <Toaster
                  position="bottom-center"
                  reverseOrder={false}
                  gutter={12}
                  containerStyle={{
                    zIndex: 99999,
                    bottom: 40,
                  }}
                  toastOptions={{
                    duration: currentUser?.preferences?.turboMode ? 2000 : 4000, // 🚀 Dynamic duration based on Turbo Mode
                    style: {
                      background: 'var(--bg-card)',
                      backdropFilter: currentUser?.preferences?.turboMode ? 'none' : 'blur(20px) saturate(160%)', // 🚀 Turbo Mode optimization
                      WebkitBackdropFilter: currentUser?.preferences?.turboMode ? 'none' : 'blur(20px) saturate(160%)', // 🚀 Turbo Mode optimization
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '24px',
                      padding: '12px 24px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      maxWidth: '400px',
                    },
                    success: {
                      iconTheme: {
                        primary: 'var(--accent)',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      style: {
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backdropFilter: currentUser?.preferences?.turboMode ? 'none' : 'blur(25px)', // 🚀 Turbo Mode optimization
                        color: '#ef4444',
                      },
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />

                <div style={{ opacity: mounted ? 1 : 0 }} className="transition-opacity duration-300">
                    {children}
                </div>
                
                {mounted && <ModalRegistry />}
                
            </TranslationProvider>
        </PusherProvider>
      </ThemeProvider>
    </ModalProvider>
  );
}