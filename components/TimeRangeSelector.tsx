'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { cn, toBn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';

interface TimeRangeSelectorProps {
    value: string;
    onChange: (val: string) => void;
}

export const TimeRangeSelector = ({ value, onChange }: TimeRangeSelectorProps) => {
    const { t, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const options = [
        { label: t('last_7_days') || '7 DAYS', days: '7', short: '7D' },
        { label: t('last_30_days') || '30 DAYS', days: '30', short: '30D' },
        { label: t('last_90_days') || '90 DAYS', days: '90', short: '90D' }
    ];

    useEffect(() => {
        const handler = (e: any) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const activeLabel = options.find(opt => opt.days === value)?.short || '30D';

    return (
        <div ref={dropdownRef} className="relative w-full md:w-auto">
            {/* --- 📱 MOBILE VIEW: COMPACT DROPDOWN --- */}
            <div className="md:hidden">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-11 w-full px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-between text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-orange-500" strokeWidth={2.5} />
                        <span className="text-[var(--text-main)]">{toBn(activeLabel, language)}</span>
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} 
                            className="absolute right-0 mt-2 bg-[var(--bg-card)] backdrop-blur-3xl border border-[var(--border)] rounded-[24px] p-2 z-[1000] shadow-2xl"
                        >
                            {options.map((opt) => (
                                <button 
                                    key={opt.days} 
                                    onClick={() => { onChange(opt.days); setIsOpen(false); }} 
                                    className={cn(
                                        "w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0",
                                        value === opt.days ? "text-orange-500 bg-orange-500/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    )}
                                >
                                    {toBn(opt.label, language)}
                                    {value === opt.days && <Check size={14} strokeWidth={3} />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- 💻 DESKTOP VIEW: SEGMENTED BUTTONS --- */}
            <div className="hidden md:flex bg-[var(--bg-card)] border border-[var(--border)] p-1.5 rounded-[22px] h-12 items-center relative overflow-hidden shadow-inner">
                {options.map((option) => {
                    const isActive = value === option.days;
                    return (
                        <button
                            key={option.days}
                            onClick={() => onChange(option.days)}
                            className={cn(
                                "relative min-w-[70px] px-4 h-full flex flex-col items-center justify-center transition-all duration-500 z-10 outline-none",
                                isActive ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            )}
                        >
                            <span className="relative z-20 text-[11px] font-black leading-none">{toBn(option.days, language)}</span>
                            <span className="relative z-20 text-[6px] font-black uppercase tracking-[1px] mt-0.5 opacity-60">DAYS</span>
                            {isActive && (
                                <motion.div layoutId="activeRange" className="absolute inset-0 bg-orange-600 rounded-[16px] shadow-lg" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};