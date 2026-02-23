"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { createPortal } from "react-dom";
import { useRouter } from 'next/navigation';

// Global Engine Hooks
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛰️ ১. MODAL PORTAL (সব দেয়াল ভেঙে বাইরে আসার জন্য) ---
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  return mounted ? createPortal(children, document.body) : null;
};

// --- 🍃 ২. MAIN MODAL LAYOUT (The Elite Shell) ---
export const ModalLayout = ({ title, children, onClose, isOpen = true }: any) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // বডি স্ক্রল লক প্রোটোকল
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <ModalPortal>
      {/* মেইন কন্টেইনার: z-index একদম টপ লেভেলে রাখা হয়েছে */}
      <div className={`fixed inset-0 z-[999999] flex justify-center overflow-hidden transition-all ${!isOpen ? 'pointer-events-none' : 'pointer-events-auto'} ${isMobile ? 'items-end' : 'items-center p-4'}`}>
        
        {/* ব্যাকড্রপ: ব্লার ল্যাভেল অপ্টিমাইজড যাতে কন্টেন্ট ক্লিয়ার থাকে */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-[10px] z-0"
        />

        {/* মডাল কার্ড: অপাসিটি ট্র্যাপ ফিক্স করার জন্য Force Animation */}
<motion.div 
    // layout সরিয়ে ফেলুন (এটি মোবাইলে ল্যাগ এবং অপাসিটি ট্র্যাপ তৈরি করে)
    initial={isMobile ? { y: "100%", opacity: 0 } : { scale: 0.9, opacity: 0 }}
    animate={{ 
        y: 0, 
        scale: 1, 
        opacity: 1 
    }}
    exit={isMobile ? { y: "100%", opacity: 0 } : { scale: 0.9, opacity: 0 }}
    transition={{ 
        // অপাসিটির জন্য ফিক্সড সময় (যাতে এটি স্প্রিংয়ের জন্য ওয়েট না করে)
        opacity: { duration: 0.2, ease: "linear" },
        // পজিশনের জন্য আপনার প্রিয় স্প্রিং - SLOWER DOWNWARD GLIDE
        y: { type: 'spring', damping: 30, stiffness: 260, mass: 1 },
        scale: { type: 'spring', damping: 30, stiffness: 400 }
    }}
    onClick={(e) => e.stopPropagation()} 
    className={`bg-[var(--bg-card)] w-full border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden
      ${isMobile 
        ? 'max-w-full rounded-t-[45px] border-x-0 h-auto max-h-[95vh]' 
        : 'max-w-md rounded-[35px]'
      }`}
>
          {/* আইফোন স্টাইল ড্র্যাগ হ্যান্ডেল (Visual Only) */}
          {isMobile && <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />}

          {/* হেডার সেকশন */}
          <div className="px-8 py-6 flex justify-between items-center border-b border-[var(--border)] bg-[var(--bg-app)]/30 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              <h2 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                {title}
              </h2>
              <div className="flex items-center gap-1.5 opacity-60">
                <ShieldCheck size={10} className="text-orange-500" />
                <p className="text-[7px] font-bold text-orange-500 uppercase tracking-[2px]">Secured Protocol Active</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center hover:text-red-500 transition-all active:scale-90 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>

          {/* বডি এরিয়া: এখানে মডালের কন্টেন্ট থাকে */}
          <div className={`p-8 overflow-y-auto no-scrollbar ${isMobile ? 'pb-28' : 'max-h-[70vh]'}`}>
            {children}
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

// --- 🗑️ ৩. DELETE CONFIRMATION MODAL (Logic Preserved) ---
export const DeleteConfirmModal = ({ targetName, onConfirm, onClose }: any) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [localConfirmName, setLocalConfirmName] = React.useState('');
    const [isDeleting, setIsDeleting] = React.useState(false);
    const isMatch = localConfirmName?.toLowerCase() === targetName?.toLowerCase();

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isMatch || isDeleting) return;
        
        setIsDeleting(true);
        onClose(); // CLOSE MODAL IMMEDIATELY
        
        // WAIT for modal animation to complete (500ms)
        setTimeout(() => {
            onConfirm(router); // CALL deleteBook AFTER modal closes WITH ROUTER
        }, 500);
    };

    return (
        <ModalLayout title={t('term_confirm_title') || "Security Protocol: Termination"} onClose={onClose}>
            <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-4 p-5 rounded-[28px] bg-red-500/5 border border-red-500/20 text-red-500">
                    <AlertTriangle size={24} className="shrink-0 animate-pulse" />
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest leading-tight">{t('label_termination')}</p>
                        <p className="text-[10px] font-bold opacity-70 leading-relaxed uppercase">
                            {t('term_warning')} <span className="underline italic text-red-600">"{targetName}"</span>
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 italic">
                        {t('placeholder_identity_confirm')}
                    </label>
                    <input 
                        type="text" 
                        placeholder={targetName} 
                        className="w-full h-15 bg-[var(--bg-app)] border border-[var(--border)] rounded-[22px] px-6 text-[13px] font-black uppercase tracking-widest text-red-500 focus:outline-none focus:border-red-500 transition-all shadow-inner" 
                        value={localConfirmName} 
                        onChange={(e) => setLocalConfirmName(e.target.value)} 
                        autoFocus 
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} disabled={isDeleting} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-all disabled:opacity-50 disabled:cursor-wait">
                        {t('cancel')}
                    </button>
                    <motion.button 
                        onClick={handleDelete}
                        disabled={!isMatch || isDeleting} 
                        whileTap={{ scale: 0.96 }}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-xl 
                            ${isMatch && !isDeleting
                                ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700 active:scale-95' 
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50 shadow-none'}`}
                    >
                        {isDeleting ? 'Deleting...' : t('btn_delete_identity')}
                    </motion.button>
                </div>
            </div>
        </ModalLayout>
    );
};

// --- 📦 ৪. EXPORTS ---
export { BookModal } from './BookModal';
export { EntryModal } from './EntryModal';
export { AdvancedExportModal } from './AdvancedExportModal';
export { ActionMenuModal } from './ActionMenuModal';