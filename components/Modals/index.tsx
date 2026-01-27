"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export const ModalLayout = ({ title, children, onClose }: any) => {
  return (
    /* ১. পুরো স্ক্রিন জুড়ে ফিক্সড কন্টেইনার */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      
      {/* ২. ব্লার ব্যাকগ্রাউন্ড - এটি এখন পুরো স্ক্রিন কভার করবে */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* ৩. মডাল কার্ড - এটি স্ক্রিনের একদম মাঝখানে থাকবে */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[var(--bg-card)] w-full max-w-md rounded-[32px] border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden"
      >
        {/* মডাল হেডার */}
        <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50">
          <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* মডাল বডি */}
        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};