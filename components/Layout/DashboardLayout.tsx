"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { DynamicHeader } from './DynamicHeader';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { useVaultStore } from '@/lib/vault/store';
import { useTranslation } from '@/hooks/useTranslation';
import { useHydrationGuard } from '@/hooks/useHydrationGuard';
import { useDeviceType } from '@/hooks/useDeviceType';
import { cn } from '@/lib/utils/helpers';
import SyncProgressBar from '@/components/UI/SyncProgressBar';
import { ConflictBackgroundService } from '@/lib/vault/ConflictBackgroundService';
import { useRouter } from 'next/navigation';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { useModal } from '@/context/ModalContext';

// Sovereign Shells
import { DesktopShell } from '@/components/Sovereign/Desktop';
import { MobileShell } from '@/components/Sovereign/Mobile';
import { PathorSkeleton } from '@/components/Sovereign/PathorSkeleton';

// --- Types ---
interface DashboardLayoutProps {
    children: React.ReactNode;
}

// --- DASHBOARD LAYOUT GATEWAY CONTROLLER ---
// Pathor Standard V1.0: Pure Gateway with zero layout CSS
// This component acts as a traffic controller that selects the appropriate shell
// based on device type, while keeping all the brain/logic intact.

export const DashboardLayout = (props: any) => {
    const { children } = props;
    
    // 🔒 ALL HOOKS FIRST - Rules of Hooks: No conditional returns before hooks
    const isMounted = useHydrationGuard();                                    // #1
    const deviceType = useDeviceType();                                      // #2 - Device detection
    const [collapsed, setCollapsed] = useState(false);                       // #3
    const [isShielded, setIsShielded] = useState(false);                     // #4
    const { theme, setTheme } = useTheme();                                 // #5
    const mainContainerRef = useRef<HTMLElement>(null);                      // #6
    const router = useRouter();                                              // #7
    const { openModal } = useModal();                                        // #8
    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState(); // #9
    const { t } = useTranslation();                                          // #10
    
    // Derived values after hooks
    const prefs = preferences || {};

    // 🔥 Theme/Midnight Effects (global - applies to both shells)
    useEffect(() => {                                                        // #11
        const root = document.documentElement;
        
        if (prefs.isMidnight) {
            if (theme !== 'dark') setTheme('dark');
            root.classList.add('midnight-mode');
        } else {
            root.classList.remove('midnight-mode');
        }
        
        if (prefs.compactMode) root.classList.add('compact-deck');
        else root.classList.remove('compact-deck');

        // Session Shield Auto-Lock
        if (!prefs.autoLock) {
            setIsShielded(false);
        } else {
            const handleBlur = () => setTimeout(() => setIsShielded(true), 500);
            const handleFocus = () => setIsShielded(false);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);
            return () => {
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('focus', handleFocus);
            };
        }
    }, [prefs.isMidnight, prefs.compactMode, prefs.autoLock, theme, setTheme]);

    // ConflictBackgroundService initialization (global)
    useEffect(() => {                                                        // #12
        ConflictBackgroundService.getInstance().restoreFromStorage();
        if (typeof window !== 'undefined' && (window as any).mediaStore) {
            (window as any).mediaStore.getState().processQueue();
        }
    }, []);

    // ✅ CONDITIONAL RETURN AFTER ALL HOOKS
    if (!isMounted) {
        return <PathorSkeleton />;
    }
    
    // ─────────────────────────────────────────────────────────
    // 🏛️ GATEWAY LOGIC: Select shell based on device type
    // ─────────────────────────────────────────────────────────
    
    // 🎯 SHELL SELECTION: No CSS fighting - pure JS selection
    // Each shell manages its own internal state - Gateway just selects
    if (deviceType === 'mobile') {
        return (
            <MobileShell>
                {children}
            </MobileShell>
        );
    }

    // Desktop shell
    return (
        <DesktopShell>
            {children}
        </DesktopShell>
    );
};


// ═════════════════════════════════════════════════════════════════════════════
// 🗂️ LEGACY LAYOUT CODE (Preserved for reference - DO NOT DELETE)
// ═════════════════════════════════════════════════════════════════════════════
// This was the original monolithic layout code that had both mobile and desktop
// concerns mixed together, causing CSS fighting via md:hidden / md:grid classes.
// 
// The new architecture separates these concerns into two independent shells:
// - DesktopShell: Pure L-Frame Grid (components/Sovereign/Desktop/)
// - MobileShell: Pure Flex Stack (components/Sovereign/Mobile/)
//
// To re-enable old layout for comparison:
// 1. Comment out the new Gateway return above
// 2. Uncomment the legacy return below
// 3. Add back the removed imports
// ═════════════════════════════════════════════════════════════════════════════

/*
const LegacyDashboardLayout = (props: any) => {
    const { children } = props;
    
    // All hooks (same as above)...
    const isMounted = useHydrationGuard();
    const [collapsed, setCollapsed] = useState(false);
    const [isShielded, setIsShielded] = useState(false);
    const { theme, setTheme } = useTheme();
    const mainContainerRef = useRef<HTMLElement>(null);
    const router = useRouter();
    const { openModal } = useModal();
    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState();
    const { t } = useTranslation();
    const prefs = preferences || {};

    // Effects...
    useEffect(() => { ... }, [...]);
    useEffect(() => { ... }, []);

    if (!isMounted) {
        return (
            <div className="h-screen w-full bg-[var(--bg-app)] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    // Legacy return with CSS fighting:
    return (
        <div 
            className="h-screen bg-[var(--bg-app)] flex flex-col md:grid md:grid-cols-[280px_1fr] md:grid-rows-[auto_1fr] md:grid-areas-layout"
        >
            // Sidebar - hidden on mobile via md:hidden
            <div className="hidden md:block" style={{ gridArea: 'sidebar' }}>
                <DesktopSidebar ... />
            </div>
            
            // Header
            <div className="w-full" style={{ gridArea: 'header' }}>
                <DynamicHeader />
            </div>
            
            // Main with MobileBottomNav inside
            <main className="w-full overflow-y-auto ...">
                <MobileBottomNav ... />
                {children}
            </main>
            
            // Shield overlay
            <AnimatePresence>...</AnimatePresence>
        </div>
    );
};
*/

export default DashboardLayout;
