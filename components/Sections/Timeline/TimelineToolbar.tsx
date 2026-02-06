"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Search, SlidersHorizontal, Check, ChevronDown, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const TimelineToolbar = ({ searchQuery, setSearchQuery, filterType, setFilterType }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // প্রোটোকল অপশনস
    const options = [
        { id: 'all', label: t('all') || 'VIEW ALL' },
        { id: 'income', label: t('income') || 'INFLOW ONLY' },
        { id: 'expense', label: t('expense') || 'OUTFLOW ONLY' }
    ];

    // ড্রপডাউনের বাইরে ক্লিক করলে ক্লোজ করার লজিক
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        /* ফিক্স ১: z-[500] এবং relative পজিশন নিশ্চিত করা হয়েছে যাতে এটি সবকিছুর ওপরে থাকে */
        <div className="relative z-[500] flex gap-[var(--app-gap,0.75rem)] items-center w-full bg-[var(--bg-app)]/80 backdrop-blur-md p-2 rounded-[24px] border border-[var(--border)] transition-all duration-300 shadow-sm">
            
            {/* --- ১. ফিক্সড হাইট সার্চ বার --- */}
            <div className="relative flex-1 group min-h-[48px] md:min-h-[56px]">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none z-10">
                    <Search size={18} strokeWidth={2.5} className="opacity-40 group-focus-within:opacity-100" />
                </div>
                
                <input 
                    placeholder={t('search_placeholder')} 
                    /* ফিক্স ২: h-full এবং নির্দিষ্ট min-h দেওয়া হয়েছে */
                    className="w-full h-12 md:h-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] pl-14 pr-10 text-[11px] font-bold uppercase tracking-[2px] outline-none transition-all focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/20 shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* --- ২. হাই প্রোফাইল ফিল্টার ড্রপডাউন --- */}
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    /* ফিক্স ৩: হ্যাপটিক বাটন স্টাইল */
                    className={`h-12 md:h-14 px-5 md:px-7 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm 
                        ${isOpen ? 'border-orange-500 text-orange-500 shadow-lg ring-4 ring-orange-500/5' : 'text-[var(--text-muted)] hover:border-orange-500/30'}`}
                >
                    <Filter size={18} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-60'} />
                    <span className="hidden lg:block truncate max-w-[100px]">
                        {options.find(o => o.id === filterType)?.label}
                    </span>
                    <ChevronDown size={14} className={`opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        /* ফিক্স ৪: z-[1000] এবং Glass-Heavy স্টাইল */
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                            className="absolute right-0 mt-3 w-56 bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        >
                            <div className="px-4 py-2 border-b border-[var(--border)] mb-1 opacity-40">
                                <span className="text-[8px] font-black uppercase tracking-[3px]">{T('filter_class')}</span>
                            </div>
                            <div className="py-1">
                                {options.map((opt) => {
                                    const isSelected = filterType === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            /* ফিক্স ৫: সিলেকশন লজিক নিশ্চিত করা হয়েছে */
                                            onClick={() => { 
                                                setFilterType(opt.id); 
                                                setIsOpen(false); 
                                            }}
                                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 
                                                ${isSelected 
                                                    ? 'text-orange-500 bg-orange-500/10' 
                                                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                        >
                                            {opt.label} 
                                            {isSelected && <Check size={14} strokeWidth={3} />}
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