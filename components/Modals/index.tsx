"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

/**
 * VAULT PRO: MASTER MODAL ENGINE (V3 - THEME STABLE)
 * ----------------------------------
 * Fix: Added scroll-lock lifecycle and event stabilization while preserving theme variables.
 */

export const ModalLayout = ({ title, children, onClose }: any) => {
  
  // ১. স্ক্রল লক লজিক (থিম বা স্টাইলে কোনো প্রভাব ফেলবে না)
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* ২. ব্যাকড্রপ: অরিজিনাল ক্লাস বজায় রাখা হয়েছে */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
            e.stopPropagation(); // ইভেন্ট বাবলিং বন্ধ করবে
            onClose();
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* ৩. মডাল কার্ড: আপনার অরিজিনাল থিম ভেরিয়েবলগুলো ফেরত আনা হয়েছে */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        onClick={(e) => e.stopPropagation()} 
        className="bg-[var(--bg-card)] w-full max-w-md rounded-[32px] border border-[var(--border-color)] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative z-[10001] overflow-hidden"
      >
        {/* মডাল হেডার: অরিজিনাল থিম */}
        <div className="px-8 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 backdrop-blur-sm">
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

        {/* মডাল বডি */}
        <div className="p-8 max-h-[75vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- ২. ডিলিট কনফার্মেশন মডাল (থিম প্রোটেক্টেড) ---
// --- ২. ডিলিট কনফার্মেশন মডাল (Fixed: Local Typing State) ---
export const DeleteConfirmModal = ({ targetName, onConfirm, onClose }: any) => {
  // মডালের ভেতরেই লোকাল স্টেট ব্যবহার করা হয়েছে যাতে টাইপ করা যায়
  const [localConfirmName, setLocalConfirmName] = React.useState('');
  const isMatch = localConfirmName?.toLowerCase() === targetName?.toLowerCase();

  return (
    <ModalLayout title="Security Protocol: Termination" onClose={onClose}>
      <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4 p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500">
          <AlertTriangle size={24} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest leading-tight">Permanent Erasure</p>
            <p className="text-[11px] font-bold opacity-70 leading-relaxed uppercase">
                Warning: You are about to wipe <span className="underline italic">"{targetName}"</span> from the vault. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 italic">
            Type Identity to Confirm
          </label>
          <input 
            type="text" 
            placeholder={targetName}
            className="w-full h-14 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-2xl px-6 text-sm font-black uppercase tracking-widest text-red-500 focus:outline-none focus:border-red-500 transition-all"
            value={localConfirmName}
            onChange={(e) => setLocalConfirmName(e.target.value)} // এখন টাইপ করা যাবে
            autoFocus
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[2px] text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-all"
          >
            Abort
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
            Confirm
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

// --- ৩. অরিজিনাল এক্সপোর্টস (এগুলো কোনোভাবেই পরিবর্তন করা যাবে না) ---
export { BookModal } from './BookModal';
export { EntryModal } from './EntryModal';
export { AdvancedExportModal } from './AdvancedExportModal';