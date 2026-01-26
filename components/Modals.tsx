"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

// --- ১. গ্লোবাল মডাল লেআউট (Modal Base Frame) ---
export const ModalLayout = ({ title, children, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay with Blur */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Content Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="app-card w-full max-w-md relative z-10 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]">
          <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- ২. ডিলিট কনফার্মেশন মডাল (Security Logic Built-in) ---
export const DeleteConfirmModal = ({ targetName, confirmName, setConfirmName, onConfirm, onClose }: any) => {
  // কনফার্মেশন বাটন একটিভ হওয়ার লজিক
  const isMatch = confirmName.toLowerCase() === targetName.toLowerCase();

  return (
    <ModalLayout title="Security Check" onClose={onClose}>
      <div className="space-y-6">
        {/* Danger Alert Box */}
        <div className="flex gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500">
          <div className="shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold leading-tight uppercase">Permanent Action</p>
            <p className="text-xs opacity-80 font-medium leading-relaxed">
                You are about to delete <span className="font-bold underline">"{targetName}"</span>. This data cannot be recovered from the vault.
            </p>
          </div>
        </div>

        {/* Input Field */}
        <div>
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 block italic">
            Please type the name to confirm
          </label>
          <input 
            type="text" 
            placeholder={targetName}
            className="app-input font-bold uppercase tracking-wider border-red-500/20 focus:border-red-500"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[2px] text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={!isMatch}
            className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[2px] transition-all shadow-lg
                ${isMatch 
                  ? 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700 active:scale-95' 
                  : 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed opacity-50 shadow-none'
                }
            `}
          >
            Delete Forever
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};