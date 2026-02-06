"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Filter, Check, ChevronDown, BarChart3, ShieldCheck, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const AnalyticsHeader = ({ timeRange, setTimeRange, count }: any) => {
    const { T, t, language } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const ranges = [
        { label: t('range_7d') || '7 DAYS PROTOCOL', value: '7' },
        { label: t('range_30d') || '30 DAYS CYCLE', value: '30' },
        { label: t('range_90d') || '90 DAYS ARCHIVE', value: '90' }
    ];

    useEffect(() => {
        const handler = (e: MouseEvent) => { 
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mb-10 transition-all duration-500 w-full">
            
            {/* --- LEFT SECTION: SYSTEM IDENTITY --- */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-orange-500/30 shrink-0">
                    <BarChart3 size={28} strokeWidth={2.5} />
                </div>

                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">
                        {T('nav_analytics') || "INTELLIGENCE"}<span className="text-orange-500">.</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                            <Zap size={11} fill="currentColor" strokeWidth={0} />
                            <span className="text-[8px] font-black uppercase tracking-[2px]">
                                {toBn(count, language)} {T('protocols_label') || "RECORDS ANALYZED"}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-[3px] ml-1">
                            ENV V5.2
                        </span>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SECTION: RANGE SELECTOR --- */}
            <div className="relative" ref={menuRef}>
                <Tooltip text={t('tt_range_selector')}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`h-12 md:h-14 px-5 md:px-7 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm 
                            ${isMenuOpen ? 'border-orange-500 text-orange-500 shadow-xl ring-4 ring-orange-500/5' : 'text-[var(--text-muted)] hover:border-orange-500/30'}`}
                    >
                        <Clock size={18} strokeWidth={2.5} className={isMenuOpen ? 'text-orange-500' : 'opacity-60'} />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[8px] opacity-40 mb-1 tracking-[2px]">{T('range_selector') || "RANGE"}</span>
                            <span className="text-[11px] font-bold text-[var(--text-main)] tracking-widest">
                                {toBn(timeRange, language)}{T('label_days_short') || "D"}
                            </span>
                        </div>
                        <ChevronDown size={14} className={`opacity-30 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </Tooltip>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-60 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl"
                        >
                            <div className="px-4 py-2 border-b border-[var(--border)] mb-1 opacity-40">
                                <span className="text-[8px] font-black uppercase tracking-[3px]">{T('filter_class') || "CYCLE SELECTION"}</span>
                            </div>
                            <div className="py-1">
                                {ranges.map((r) => {
                                    const isSelected = timeRange === r.value;
                                    return (
                                        <button
                                            key={r.value}
                                            onClick={() => { setTimeRange(r.value); setIsMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0
                                                ${isSelected 
                                                    ? 'text-orange-500 bg-orange-500/10 shadow-sm' 
                                                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isSelected ? <Zap size={14} fill="currentColor" /> : <Clock size={14} />}
                                                {r.label}
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
        </div>
    );
};