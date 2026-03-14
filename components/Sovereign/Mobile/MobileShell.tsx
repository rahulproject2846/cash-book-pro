"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { DynamicHeader } from '@/components/Layout/DynamicHeader';
import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { useTranslation } from '@/hooks/useTranslation';
import { useVaultStore } from '@/lib/vault/store';
import { useModal } from '@/context/ModalContext';

interface MobileShellProps {
  children: React.ReactNode;
}

/**
 * 📱 MOBILE SHELL - Pure Stack Layout
 * 
 * Pathor Standard V1.0: Pure mobile layout with no desktop concerns.
 * Gets state from store internally - Gateway just passes children.
 * 
 * Stack Structure:
 * ┌─────────────────┐
 * │    HEADER       │  <- Fixed top
 * ├─────────────────┤
 * │   MAIN CONTENT │  <- Flexible middle
 * │                │
 * ├─────────────────┤
 * │  BOTTOM NAV    │  <- Fixed bottom
 * └─────────────────┘
 */

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  // Get state from store (Gateway passes children only)
  const store = useVaultState();
  const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = store;
  
  const mainContainerRef = useRef<HTMLElement>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isShielded, setIsShielded] = useState(false);
  
  const { t } = useTranslation();
  const { openModal } = useModal();
  
  // Handle scroll-based nav visibility
  useEffect(() => {
    const handleScroll = () => {
      const current = mainContainerRef?.current?.scrollTop || 0;
      setIsNavVisible(current < lastScrollY || current < 50);
      setLastScrollY(current);
    };

    const container = mainContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  // Session shield effect
  useEffect(() => {
    if (preferences?.autoLock) {
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
  }, [preferences?.autoLock]);

  // Get tooltip text based on context
  const getFabTooltip = () => {
    if (activeBook) return t('fab_add_entry');
    if (activeSection === 'books') return t('fab_add_book');
    return t('fab_add_book');
  };

  // Handle navigation back
  const handleBack = () => {
    setActiveBook(null);
  };

  // Handle FAB click
  const handleFabClick = () => {
    if (activeBook) {
      openModal('addEntry', { currentBook: activeBook });
    } else {
      openModal('addBook');
    }
  };

  // Handle nav item click
  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setActiveBook(null);
  };

  return (
    <div className="h-screen w-full bg-[var(--bg-app)] flex flex-col overflow-hidden">
      {/* Header Area */}
      <div className="flex-shrink-0">
        <DynamicHeader />
      </div>

      {/* Main Content Area - Flexible middle */}
      <main
        ref={mainContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        <div className="p-4 pb-24">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {isNavVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
            className="fixed bottom-0 left-0 right-0 z-[900] p-4 pb-safe"
          >
            <MobileBottomNavWrapper
              active={activeSection}
              onNavClick={handleNavClick}
              onFabClick={handleFabClick}
              onBack={handleBack}
              tooltip={getFabTooltip()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Shield Overlay */}
      <AnimatePresence>
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
 * 📱 MOBILE BOTTOM NAV WRAPPER
 */

interface MobileBottomNavWrapperProps {
  active: string;
  onNavClick: (id: string) => void;
  onFabClick: () => void;
  onBack: () => void;
  tooltip?: string;
}

const MobileBottomNavWrapper: React.FC<MobileBottomNavWrapperProps> = ({
  active,
  onNavClick,
  onFabClick,
  onBack,
  tooltip,
}) => {
  const navItems = [
    { id: 'books', label: 'Home' },
    { id: 'reports', label: 'Reports' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="bg-[var(--bg-card)]/95 backdrop-blur-lg border border-[var(--border)] h-[72px] rounded-[35px] shadow-2xl flex items-center justify-between px-6">
      <div className="flex gap-5">
        {navItems.slice(0, 2).map((item) => (
          <NavButton
            key={item.id}
            id={item.id}
            isActive={active === item.id}
            onClick={() => onNavClick(item.id)}
          />
        ))}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -top-6">
        <button
          onClick={onFabClick}
          className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-lg relative z-20 active:scale-90 transition-transform"
          title={tooltip}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className="flex gap-5">
        {navItems.slice(2).map((item) => (
          <NavButton
            key={item.id}
            id={item.id}
            isActive={active === item.id}
            onClick={() => onNavClick(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface NavButtonProps {
  id: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ id, isActive, onClick }) => {
  const icons: Record<string, React.ReactNode> = {
    books: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    reports: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    timeline: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    settings: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/></svg>,
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-90 ${
        isActive ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-60'
      }`}
    >
      {icons[id]}
      {isActive && (
        <motion.div layoutId="activeDot" className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full" />
      )}
    </button>
  );
};

export default MobileShell;
