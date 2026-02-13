"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, LucideIcon, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন cn utility

interface EliteDropdownProps {
    label: string;
    current: string;
    options: string[];
    onChange: (val: string) => void;
    icon: LucideIcon;
    ttKey?: string; // ঐচ্ছিক টুলটিপ কি
}

export const EliteDropdown = ({ label, current, options, onChange, icon: Icon, ttKey }: EliteDropdownProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার প্রোটোকল
    useEffect(() => {
        const handler = (e: MouseEvent) => { 
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ক্যাটাগরি বা লেবেল ট্রান্সলেশন লজিক
    const getTranslatedLabel = (key: string) => t(`category_${key.toLowerCase()}`) || key.toUpperCase();

    return (
        <div className="relative" ref={dropdownRef}>
            <Tooltip text={ttKey ? t(ttKey) : `${t('tt_filter_by')} ${label}`}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-11 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]",
                        "flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                        "active:scale-95 shadow-sm hover:border-orange-500/30 outline-none",
                        isOpen ? "border-orange-500 text-orange-500 ring-4 ring-orange-500/5 shadow-lg" : "text-[var(--text-main)]"
                    )}
                >
                    <Icon size={16} strokeWidth={2.5} className={cn("transition-colors", isOpen ? "text-orange-500" : "text-[var(--text-muted)] opacity-60")} />
                    <span className="hidden lg:block truncate max-w-[100px]">
                         {getTranslatedLabel(current)}
                    </span>
                    <ChevronDown size={12} className={cn("opacity-30 transition-transform duration-500", isOpen && "rotate-180 opacity-100")} />
                </button>
            </Tooltip>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="absolute right-0 mt-3 w-60 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl overflow-hidden"
                    >
                        {/* Dropdown Header Info */}
                        <div className="px-4 py-2.5 border-b border-[var(--border)] mb-1.5 flex items-center justify-between opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-[3px]">{label}</span>
                            <Zap size={10} fill="currentColor" strokeWidth={0} />
                        </div>

                        {/* Options List */}
                        <div className="max-h-[280px] overflow-y-auto no-scrollbar py-1">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl",
                                            "text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                                            isSelected 
                                                ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                            {getTranslatedLabel(opt)}
                                        </div>
                                        {isSelected && <Check size={14} strokeWidth={3} className="text-orange-500" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Subtle Footer Decor */}
                        <div className="mt-1 h-1 w-12 bg-[var(--border)] rounded-full mx-auto opacity-20" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};