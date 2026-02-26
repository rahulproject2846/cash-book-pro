"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ThemeProvider, useTheme } from "next-themes";
import { TranslationProvider } from '@/context/TranslationContext';
import { ModalProvider } from '@/context/ModalContext'; 
import { ModalRegistry } from '@/components/Modals/ModalRegistry'; 
import { PusherProvider } from '@/context/PusherContext'; 
import { Toaster } from 'react-hot-toast'; 
import { AppleToastContainer } from '@/src/components/ui/AppleToastContainer'; 
import { useMediaStore } from '@/lib/vault/MediaStore'; 
import { useVaultStore } from '@/lib/vault/store';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * INTERNAL COMPONENT: THEME SYNCHRONIZER
 * Use store values directly to prevent state divergence.
 */
const ThemeSynchronizer = () => {
    const { setTheme, theme } = useTheme();
    const currentUser = useVaultStore(s => s.currentUser);
    const prefs = useMemo(() => currentUser?.preferences || {}, [currentUser]);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        // 1. Midnight Mode Handling
        if (prefs.isMidnight) {
            root.classList.add('midnight-mode');
            if (theme !== 'dark') setTheme('dark');
        } else {
            root.classList.remove('midnight-mode');
        }

        // 2. Compact Mode Handling
        if (prefs.compactMode) root.classList.add('compact-deck');
        else root.classList.remove('compact-deck');

        // 3. Turbo Mode Performance Shield
        if (prefs.turboMode) body.classList.add('turbo-active');
        else body.classList.remove('turbo-active');

    }, [prefs, setTheme, theme]);

    return null;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const currentUser = useVaultStore(s => s.currentUser);
  const turboMode = currentUser?.preferences?.turboMode;

  useEffect(() => {
    setMounted(true);
    
    // 🚀 CORRECT GLOBAL EXPOSURE: Expose store instances, not hooks
    if (typeof window !== 'undefined') {
      (window as any).orchestrator = require('@/lib/vault/core/SyncOrchestrator').orchestrator;
      (window as any).mediaStore = useMediaStore; // Keeping hook reference is okay if used carefully, but getState is better
    }
    
    const handleSyncRequest = (event: Event) => {
      const userId = (event as CustomEvent).detail?.userId;
      if (userId) getVaultStore().triggerManualSync();
    };

    window.addEventListener('sync-request', handleSyncRequest);
    return () => window.removeEventListener('sync-request', handleSyncRequest);
  }, []);

  return (
    <ModalProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={true} 
        disableTransitionOnChange
      >
        <PusherProvider currentUser={currentUser}>
            <TranslationProvider currentUser={currentUser}>
                <ThemeSynchronizer />

                <Toaster
                  position="bottom-center"
                  reverseOrder={false}
                  gutter={12}
                  containerStyle={{ zIndex: 99999, bottom: 40 }}
                  toastOptions={{
                    duration: turboMode ? 2000 : 4000,
                    style: {
                      background: 'var(--bg-card)',
                      backdropFilter: turboMode ? 'none' : 'blur(20px) saturate(160%)',
                      WebkitBackdropFilter: turboMode ? 'none' : 'blur(20px) saturate(160%)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)',
                      borderRadius: '24px',
                      padding: '12px 24px',
                      fontSize: '11px',
                      fontWeight: '600',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      maxWidth: '400px',
                    },
                    success: {
                      iconTheme: { primary: 'var(--accent)', secondary: '#fff' },
                    },
                    error: {
                      style: {
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backdropFilter: turboMode ? 'none' : 'blur(25px)',
                        color: '#ef4444',
                      },
                      iconTheme: { primary: '#ef4444', secondary: '#fff' },
                    },
                  }}
                />

                <div style={{ opacity: mounted ? 1 : 0 }} className="transition-opacity duration-300">
                    {children}
                </div>
                
                {mounted && <ModalRegistry />}
                <AppleToastContainer />
                
            </TranslationProvider>
        </PusherProvider>
      </ThemeProvider>
    </ModalProvider>
  );
}