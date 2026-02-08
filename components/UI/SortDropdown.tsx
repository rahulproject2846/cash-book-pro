// src/components/UI/Dropdowns/SortDropdown.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip'; // নিশ্চিত করুন এই পাথটি সঠিক

// --- 🔘 MASTER COMPONENT: SORT DROPDOWN ---
export const SortDropdown = ({ current, options, onChange }: any) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    
    // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হয়ে যাওয়ার লজিক
    useEffect(() => {
        const handler = (e: any) => { 
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <Tooltip text={t('tt_change_sort_order') || "Change Sort Order"}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`h-11 w-11 lg:w-auto lg:px-4 justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500 shadow-lg ring-4 ring-orange-500/5' : 'hover:border-orange-500/30'}`}
                >
                    <ArrowDownUp size={16} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-100'} />
                    <span className="hidden lg:block text-[var(--text-main)] truncate max-w-[100px]">
                        {current}
                    </span>
                    <ChevronDown size={12} className={`hidden lg:block opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </Tooltip>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                        className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl"
                    >
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'text-orange-500 bg-orange-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                    >
                                        {opt} {isSelected && <Check size={14} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};