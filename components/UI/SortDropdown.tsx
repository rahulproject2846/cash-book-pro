"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Check, ChevronDown, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন cn utility

interface SortDropdownProps {
    current: string;
    options: string[];
    onChange: (val: string) => void;
    ttKey?: string; // ঐচ্ছিক টুলটিপ কি
}

export const SortDropdown = ({ current, options, onChange, ttKey }: SortDropdownProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    
    // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার প্রোটোকল
    useEffect(() => {
        const handler = (e: any) => { 
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <Tooltip text={ttKey ? t(ttKey) : t('tt_change_sort_order') || "Sort Options"}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-11 w-11 lg:w-auto lg:px-4 flex items-center justify-center lg:justify-between",
                        "bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] transition-all",
                        "active:scale-95 outline-none shadow-sm",
                        isOpen 
                            ? "border-orange-500 text-orange-500 ring-4 ring-orange-500/5 shadow-lg" 
                            : "text-[var(--text-muted)] hover:border-orange-500/30 hover:text-[var(--text-main)]"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <ArrowDownUp size={16} strokeWidth={2.5} className={cn("transition-colors", isOpen ? "text-orange-500" : "opacity-60")} />
                        <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                            {current}
                        </span>
                    </div>
                    <ChevronDown size={12} className={cn(
                        "hidden lg:block opacity-30 transition-transform duration-500",
                        isOpen && "rotate-180 opacity-100"
                    )} />
                </button>
            </Tooltip>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="absolute right-0 mt-3 w-56 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl overflow-hidden"
                    >
                        {/* Subtle Header Decor */}
                        <div className="px-4 py-2 border-b border-[var(--border)] mb-1.5 flex items-center justify-between opacity-30">
                            <span className="text-[7px] font-black uppercase tracking-[3px]">ORDERING PROTOCOL</span>
                            <Zap size={10} fill="currentColor" strokeWidth={0} />
                        </div>

                        <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all mb-1 last:mb-0",
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isSelected 
                                                ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                            {opt}
                                        </div>
                                        {isSelected && <Check size={14} strokeWidth={3} className="text-orange-500" />}
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