"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Filter, Check, ChevronDown } from 'lucide-react';

export const AnalyticsHeader = ({ timeRange, setTimeRange, count }: any) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const ranges = [
        { label: '7 Days Protocol', value: '7' },
        { label: '30 Days Cycle', value: '30' },
        { label: '90 Days Archive', value: '90' }
    ];

    // Outside Click Handler
    useEffect(() => {
        const handler = (e: any) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex flex-row items-center justify-between gap-4 px-1 mb-8 mt-4">
            
            {/* --- Left Side: Icon + Text (Moving 1 to 2) --- */}
            <div className="flex items-center gap-3">
                {/* Zap Icon (Now on the Left) */}
                <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner shrink-0">
                    <Zap className="w-5 h-5 md:w-8 md:h-8" fill="currentColor" />
                </div>
                
                <div className="flex flex-col">
                    <h2 className="text-xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                        Performance
                    </h2>
                    <p className="text-[7px] md:text-[11px] font-black uppercase tracking-[2px] text-orange-500 mt-1 md:mt-2 opacity-80">
                        Analytics Intelligence
                    </p>
                </div>
            </div>

            {/* --- Right Side: Range Selector (Moving 3 to 1) --- */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 md:gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 md:px-6 py-2 md:py-3.5 rounded-xl md:rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                    <Filter size={14} className="text-orange-500 md:w-[18px] md:h-[18px]" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                        {timeRange}D
                    </span>
                    <ChevronDown size={12} className={`opacity-30 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-52 bg-[#121212] border border-[#222] rounded-[24px] p-2 z-[500] shadow-2xl"
                        >
                            {ranges.map((r) => (
                                <button
                                    key={r.value}
                                    onClick={() => { setTimeRange(r.value); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0
                                        ${timeRange === r.value ? 'bg-[#1a1a1a] text-orange-500' : 'text-[#555] hover:bg-[#1a1a1a] hover:text-orange-400'}`}
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