"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useVaultState } from '@/lib/vault/store/storeHelper';

/**
 * VAULT PRO: MASTER MODAL PROTOCOL (V12.0 ELITE)
 * -----------------------------------------------
 * Handles global modal states with framed-motion exit safety.
 * Added: 'deleteTagConfirm' and typed data handling.
 * INTEGRATED: Central overlay state management
 */

// ১. মডাল টাইপ ডেফিনিশ (Strict Registry)
type ModalView = 
  | 'addBook' 
  | 'editBook' 
  | 'addEntry' 
  | 'editEntry' 
  | 'analytics' 
  | 'export' 
  | 'share' 
  | 'deleteBookConfirm' 
  | 'deleteConfirm' 
  | 'deleteTagConfirm' // ফিক্স: রেড লাইন দূর করার জন্য এটি যোগ করা হয়েছে
  | 'shortcut' 
  | 'conflictResolver' // ফিক্স: vKey mismatch conflict resolution
  | 'actionMenu' //  Action Menu for FAB
  | 'none';

interface ModalContextType {
  view: ModalView;
  isOpen: boolean;
  data: any;
  openModal: (view: ModalView, data?: any) => void;
  closeModal: (onClosed?: () => void) => void;
  switchModal: (view: ModalView, data?: any) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ModalView>('none');
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  // CENTRAL OVERLAY STATE INTEGRATION
  const { registerOverlay, unregisterOverlay } = useVaultState();

  // ২. মডাল ওপেন প্রোটোকল (Memoized for performance)
  const openModal = useCallback((targetView: ModalView, modalData: any = null) => {
    setData(modalData);
    setView(targetView);
    setIsOpen(true); // SYNC: Set isOpen immediately
    
    // REGISTER OVERLAY IN CENTRAL STATE
    registerOverlay('Modal');
    
    // NATIVE NAVIGATION: Push modal state to history
    if (typeof window !== 'undefined') {
      window.history.pushState(
        { 
          type: 'modal-view',
          modalView: targetView,
          timestamp: Date.now()
        }, 
        `Modal: ${targetView}`, 
        `#modal-${targetView}`
      );
    }
  }, [registerOverlay]);

  // ৩. মডাল ক্লোজ প্রোটোকল (Exit Animation Safety)
  const closeModal = useCallback((onClosed?: () => void) => {
    setIsOpen(false);
    setView('none'); // SYNC: Set view immediately, no delay
    setData(null); // SYNC: Clear data immediately
    
    // UNREGISTER OVERLAY FROM CENTRAL STATE
    unregisterOverlay('Modal');
    
    // Execute callback immediately since state is now synchronized
    if (typeof onClosed === 'function') {
      onClosed();
    }
  }, [unregisterOverlay]);

  // ৪. মডাল সুইচ প্রোটোকল (No Delay - Instant Switch)
  const switchModal = useCallback((targetView: ModalView, modalData: any = null) => {
    setView(targetView);
    setData(modalData);
    if (!isOpen) setIsOpen(true);
  }, [isOpen, registerOverlay]);

  return (
    <ModalContext.Provider value={{ view, isOpen, data, openModal, closeModal, switchModal }}>
      {children}
    </ModalContext.Provider>
  );
};

// ৪. কাস্টম ইজি-হুক
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("CRITICAL_FAULT: useModal must be used within a ModalProvider node.");
  }
  return context;
};