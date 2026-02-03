"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

// ১. মডাল টাইপ ডেফিনিশন (Strict Protocol)
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
  | 'shortcut' 
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

  // মডাল ওপেন করার ফাংশন
  const openModal = useCallback((view: ModalView, modalData: any = null) => {
    setData(modalData);
    setView(view);
    setIsOpen(true);
  }, []);

  // মডাল ক্লোজ করার ফাংশন
  const closeModal = useCallback(() => {
    setIsOpen(false);
    // ডিলে দিয়ে স্টেট রিসেট করা হয় যাতে এক্সিট অ্যানিমেশন স্মুথ থাকে
    setTimeout(() => {
      setView('none');
      setData(null);
    }, 300);
  }, []);

  return (
    <ModalContext.Provider value={{ view, isOpen, data, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

// কাস্টম হুক
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};