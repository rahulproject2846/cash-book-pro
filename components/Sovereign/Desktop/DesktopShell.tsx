"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { DesktopSidebar } from '@/components/Layout/DesktopSidebar';
import { DynamicHeader } from '@/components/Layout/DynamicHeader';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { useTranslation } from '@/hooks/useTranslation';
import { useVaultStore } from '@/lib/vault/store';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';

interface DesktopShellProps {
  children: React.ReactNode;
}

/**
 * 🖥️ DESKTOP SHELL - L-Frame Grid Layout
 * 
 * Pathor Standard V1.0: Pure desktop layout with no mobile concerns.
 * Uses CSS Grid for L-Frame: sidebar | main content
 * Gets state from store internally - Gateway just passes children.
 * 
 * Grid Areas:
 * ┌──────────┬─────────────┐
 * │ SIDEBAR  │   HEADER    │
 * │          ├─────────────┤
 * │          │             │
 * │          │   MAIN      │
 * │          │  CONTENT    │
 * │          │             │
 * └──────────┴─────────────┘
 */

export const DesktopShell: React.FC<DesktopShellProps> = ({ children }) => {
  // Get state from store (Gateway passes children only)
  const store = useVaultState();
  const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = store;
  
  const [collapsed, setCollapsed] = useState(false);
  const [isShielded, setIsShielded] = useState(false);
  
  const { t } = useTranslation();
  const router = useRouter();
  const { openModal } = useModal();
  
  const prefs = preferences || {};
  const isCompact = !!prefs.compactMode;

  // Session shield effect
  useEffect(() => {
    if (prefs.autoLock) {
      const handleBlur = () => setTimeout(() => setIsShielded(true), 500);
      const handleFocus = () => setIsShielded(false);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setIsShielded(false);
    }
  }, [prefs.autoLock]);

  // Navigation handlers
  const handleLogout = async () => {
    const { logout } = useVaultStore.getState();
    await logout();
  };

  const handleBack = () => {
    setActiveBook(null);
    router.push('?');
  };

  const handleFabClick = () => {
    if (activeBook) {
      openModal('addEntry', { currentBook: activeBook });
    } else {
      openModal('addBook');
    }
  };

  const getFabTooltip = () => {
    if (activeBook) return t('fab_add_entry');
    if (activeSection === 'books') return t('fab_add_book');
    return t('fab_add_book');
  };

  return (
    <div 
      className="h-screen w-full bg-[var(--bg-app)] overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: collapsed ? '90px 1fr' : '280px 1fr',
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: `
          "sidebar header"
          "sidebar main"
        `,
      }}
    >
      {/* Sidebar Area */}
      <div style={{ gridArea: 'sidebar' }}>
        <DesktopSidebar 
          active={activeSection}
          setActive={setActiveSection}
          onLogout={handleLogout}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isCompact={isCompact}
          onResetBook={handleBack}
        />
      </div>

      {/* Header Area */}
      <div style={{ gridArea: 'header' }} className="w-full">
        <DynamicHeader />
      </div>

      {/* Main Content Area */}
      <main 
        className="w-full overflow-y-auto custom-scrollbar h-full relative bg-[var(--bg-app)]"
        style={{ gridArea: 'main' }}
      >
        {/* Desktop FAB */}
        <DesktopFAB 
          onFabClick={handleFabClick}
          tooltip={getFabTooltip()}
        />
        
        <div className={prefs.compactMode ? "max-w-6xl mx-auto p-6" : "p-6 md:p-10"}>
          {children}
        </div>
      </main>

      {/* Session Shield Overlay */}
      <AnimatePresence mode="wait">
        {isShielded && activeSection !== 'settings' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center text-white"
          >
            <motion.div 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }} 
              className="w-24 h-24 bg-orange-500 rounded-[35px] flex items-center justify-center mb-8"
            >
              <Fingerprint size={56} strokeWidth={2} />
            </motion.div>
            <h2 className="text-3xl font-black">{t('session_shield')}</h2>
            <p className="text-[10px] font-bold text-white/40 mt-4 flex items-center gap-2">
              <ShieldCheck size={12} /> {t('protocol_locked')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * 🟠 DESKTOP FLOATING ACTION BUTTON
 */

interface DesktopFABProps {
  onFabClick: () => void;
  tooltip?: string;
}

const DesktopFAB: React.FC<DesktopFABProps> = ({ onFabClick, tooltip }) => {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={onFabClick}
        className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-90 transition-transform"
        title={tooltip}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

export default DesktopShell;
