"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * VAULT PRO: MASTER MODAL PROTOCOL (V12.0 ELITE)
 * -----------------------------------------------
 * Handles global modal states with framed-motion exit safety.
 * Added: 'deleteTagConfirm' and typed data handling.
 */

// ১. মডাল টাইপ ডেফিনিশন (Strict Registry)
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
  | 'deleteTagConfirm' // 🔥 ফিক্স: রেড লাইন দূর করার জন্য এটি যোগ করা হয়েছে
  | 'shortcut' 
  | 'conflictResolver' // 🔥 ফিক্স: vKey mismatch conflict resolution
  | 'none';

interface ModalContextType {
  view: ModalView;
  isOpen: boolean;
  data: any;
  openModal: (view: ModalView, data?: any) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ModalView>('none');
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  // ২. মডাল ওপেন প্রোটোকল (Memoized for performance)
  const openModal = useCallback((targetView: ModalView, modalData: any = null) => {
    setData(modalData);
    setView(targetView);
    // ছোট একটি ডিলে দিয়ে ওপেন করা হয় যাতে ডাটা প্রপারলি সিঙ্ক হয়
    requestAnimationFrame(() => {
        setIsOpen(true);
    });
  }, []);

  // ৩. মডাল ক্লোজ প্রোটোকল (Exit Animation Safety)
  const closeModal = useCallback(() => {
    setIsOpen(false);
    
    // 🔥 মাস্টার ডিলে: ৩৫০ms ওয়েট করা হয় যাতে Framer Motion এর exit অ্যানিমেশন শেষ হতে পারে।
    // এটি না থাকলে মডাল হুট করে গায়েব হয়ে যায়, যা দেখতে বিচ্ছিরি লাগে।
    setTimeout(() => {
      setView('none');
      setData(null);
    }, 350); 
  }, []);

  return (
    <ModalContext.Provider value={{ view, isOpen, data, openModal, closeModal }}>
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