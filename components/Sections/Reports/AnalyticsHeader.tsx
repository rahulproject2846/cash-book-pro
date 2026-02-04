"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Filter, Check, ChevronDown } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: ANALYTICS HEADER (STABILIZED)
 * --------------------------------------
 * Handles Performance titles and Time-range Selection.
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const AnalyticsHeader = ({ timeRange, setTimeRange }: any) => {
    const { T, t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Translated Range Options
    const ranges = [
        { label: t('range_7d') || '7 Days Protocol', value: '7' },
        { label: t('range_30d') || '30 Days Cycle', value: '30' },
        { label: t('range_90d') || '90 Days Archive', value: '90' }
    ];

    // Outside Click Handler (Preserved Logic)
    useEffect(() => {
        const handler = (e: any) => { 
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex flex-row items-center justify-between gap-[var(--app-gap,1rem)] px-[var(--card-padding,0.25rem)] mb-[var(--app-gap,2rem)] mt-[var(--app-gap,1rem)] transition-all duration-300">
            
            {/* --- LEFT SIDE: IDENTITY & TITLE --- */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner shrink-0">
                    <Zap className="w-5 h-5 md:w-8 md:h-8" fill="currentColor" />
                </div>
                
                <div className="flex flex-col">
                    <h2 className="text-xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                        {T('performance_title') || "Performance"}
                    </h2>
                    <p className="text-[7px] md:text-[11px] font-black uppercase tracking-[2px] text-orange-500 mt-1 md:mt-2 opacity-80">
                        {t('analytics_intelligence') || "Analytics Intelligence"}
                    </p>
                </div>
            </div>

            {/* --- RIGHT SIDE: RANGE SELECTOR WITH TOOLTIP --- */}
            <div className="relative" ref={menuRef}>
                <Tooltip text={t('tt_range_selector') || "Select time range"}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 md:gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 md:px-6 py-2 md:py-3.5 rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-all hover:border-orange-500/30"
                    >
                        <Filter size={14} className="text-orange-500 md:w-[18px] md:h-[18px]" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                            {timeRange}{T('label_days_short') || "D"}
                        </span>
                        <ChevronDown size={12} className={`opacity-30 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                </Tooltip>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-2 z-[500] shadow-2xl backdrop-blur-xl"
                        >
                            {ranges.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => { setTimeRange(r.value); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0
                                        ${timeRange === r.value ? 'bg-[var(--bg-app)] text-orange-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-400'}`}
                                >
                                    {r.label}
                                    {timeRange === r.value && <Check size={14} className="text-orange-500" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};