"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

// Global Engine Hooks
import { useTranslation } from '@/hooks/useTranslation';

/**
 * VAULT PRO: MASTER MODAL ENGINE (STABILIZED V4)
 * --------------------------------------------
 * Core layout and shared modal components.
 * Fully integrated with Global Spacing and Language.
 */

export const ModalLayout = ({ title, children, onClose }: any) => {
  
  // ১. স্ক্রল লক লজিক (অপরিবর্তিত)
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* ২. ব্যাকড্রপ */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
            e.stopPropagation(); 
            onClose();
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* ৩. মডাল কার্ড (Compact & Theme Ready) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()} 
        className="bg-[var(--bg-card)] w-full max-w-md rounded-[var(--radius-card,32px)] border border-[var(--border-color)] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative z-[10001] overflow-hidden"
      >
        {/* মডাল হেডার */}
        <div className="px-[var(--card-padding,2rem)] py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 backdrop-blur-sm">
          <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
            {title}
          </h2>
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* মডাল বডি (Dynamic Padding) */}
        <div className="p-[var(--card-padding,2rem)] max-h-[75vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- ২. ডিলিট কনফার্মেশন মডাল (Refactored for Language & Compact) ---
export const DeleteConfirmModal = ({ targetName, onConfirm, onClose }: any) => {
  const { T, t } = useTranslation();
  // মডালের ভেতরেই লোকাল স্টেট ব্যবহার করা হয়েছে যাতে টাইপ করা যায় (Preserved)
  const [localConfirmName, setLocalConfirmName] = React.useState('');
  const isMatch = localConfirmName?.toLowerCase() === targetName?.toLowerCase();

  return (
    <ModalLayout title={T('term_confirm_title') || "Security Protocol: Termination"} onClose={onClose}>
      <div className="space-y-[var(--app-gap,1.5rem)]" onClick={(e) => e.stopPropagation()}>
        
        {/* Warning Badge */}
        <div className="flex gap-4 p-[var(--card-padding,1.25rem)] rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500">
          <AlertTriangle size={24} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest leading-tight">
                {T('label_termination') || "Permanent Erasure"}
            </p>
            <p className="text-[11px] font-bold opacity-70 leading-relaxed uppercase">
                {t('term_warning') || "Warning: This action is irreversible."} <span className="underline italic">"{targetName}"</span>
            </p>
          </div>
        </div>

        {/* Typing Input */}
        <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 italic">
                {t('placeholder_identity_confirm') || "Type Identity to Confirm"}
            </label>
            <input 
                type="text" 
                placeholder={targetName}
                className="w-full h-14 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-2xl px-6 text-sm font-black uppercase tracking-widest text-red-500 focus:outline-none focus:border-red-500 transition-all shadow-inner"
                value={localConfirmName}
                onChange={(e) => setLocalConfirmName(e.target.value)} 
                autoFocus
            />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
            <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[2px] text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-all"
            >
                {T('cancel') || "Abort"}
            </button>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if (isMatch) onConfirm();
                }}
                disabled={!isMatch}
                className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-xl
                    ${isMatch 
                    ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700 active:scale-95' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 shadow-none'
                    }
                `}
            >
                {T('btn_delete_identity') || "Confirm"}
            </button>
        </div>
      </div>
    </ModalLayout>
  );
};

// --- ৩. অরিজিনাল এক্সপোর্টস (অপরিবর্তিত) ---
export { BookModal } from './BookModal';
export { EntryModal } from './EntryModal';
export { AdvancedExportModal } from './AdvancedExportModal';