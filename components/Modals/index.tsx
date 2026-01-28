"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

// --- ১. গ্লোবাল মডাল লেআউট (The Master Frame) ---
// এটি সব মডালকে স্ক্রিনের একদম মাঝখানে (Centered) রাখবে
export const ModalLayout = ({ title, children, onClose }: any) => {
  return (
    <div className="modal-overlay">
      {/* ব্যাকড্রপ: এটি পুরো স্ক্রিন ব্লার করবে */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-backdrop"
      />

      {/* মডাল কার্ড: স্টুডিও গ্রে থিম */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[var(--bg-card)] w-full max-w-md rounded-[32px] border border-[var(--border-color)] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative z-10 overflow-hidden mx-4"
      >
        {/* মডাল হেডার */}
        <div className="px-8 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 backdrop-blur-sm">
          <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* মডাল বডি: স্মার্ট স্ক্রল এরিয়া */}
        <div className="p-8 max-h-[75vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- ২. ডিলিট কনফার্মেশন মডাল (Security Protocol) ---
export const DeleteConfirmModal = ({ targetName, confirmName, setConfirmName, onConfirm, onClose }: any) => {
  const isMatch = confirmName.toLowerCase() === targetName.toLowerCase();

  return (
    <ModalLayout title="Security Protocol: Termination" onClose={onClose}>
      <div className="space-y-6">
        {/* এলার্ট বক্স */}
        <div className="flex gap-4 p-5 rounded-2xl bg-red-500/5 border border-red-500/20 text-red-500">
          <AlertTriangle size={24} className="shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest leading-tight">Permanent Erasure</p>
            <p className="text-[11px] font-bold opacity-70 leading-relaxed uppercase">
                Warning: You are about to wipe <span className="underline italic">"{targetName}"</span> from the vault. This action is irreversible.
            </p>
          </div>
        </div>

        {/* ইনপুট ভ্যালিডেশন */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 italic">
            Type Identity to Confirm
          </label>
          <input 
            type="text" 
            placeholder={targetName}
            className="app-input h-14 font-black uppercase tracking-widest border-red-500/20 focus:border-red-500 text-red-500 bg-red-500/[0.02]"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoFocus
          />
        </div>

        {/* অ্যাকশন বাটনস */}
        <div className="flex gap-3 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-[2px] text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-all"
          >
            Abort
          </button>
          <button 
            onClick={onConfirm}
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

// --- ৩. অন্য মডালগুলো এখান থেকেই এক্সপোর্ট করা হচ্ছে ---
// এতে করে অন্য পেজ থেকে ইমপোর্ট করা সহজ হবে
export { BookModal } from './BookModal';
export { EntryModal } from './EntryModal';
export { AdvancedExportModal } from './AdvancedExportModal';