"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, ArrowDownUp, Tag, Check, 
    ChevronDown, X, SlidersHorizontal
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ Master Transition Config ---
const fastTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
} as const;

// --- 🔘 Elite Dropdown ---
const EliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: any) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getTranslatedLabel = (key: string) => t(`category_${key.toLowerCase()}`) || key;

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="h-11 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm hover:border-orange-500/30"
            >
                <Icon size={16} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-60'} />
                <span className="hidden lg:block text-[var(--text-main)] truncate max-w-[100px]">
                     {getTranslatedLabel(current)}
                </span>
                <ChevronDown size={12} className={`hidden lg:block opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 5 }} 
                        className="absolute right-0 mt-3 w-56 bg-[var(--dropdown-main)] backdrop-blur-3xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl"
                    >
                        <div className="px-4 py-2 border-b border-[var(--border)] mb-1 opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-[3px]">{label}</span>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'text-orange-500 bg-orange-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                    >
                                        {getTranslatedLabel(opt)} 
                                        {isSelected && <Check size={14} strokeWidth={3} />}
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

export const DetailsToolbar = ({ 
    searchQuery, setSearchQuery, sortConfig, setSortConfig, 
    categoryFilter, setCategoryFilter, userCategories 
}: any) => {
    const { T, t } = useTranslation();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // 🔥 ফিক্স ১: প্যাডিং ভেরিয়েবল ডিফাইন
    const appPaddingX = 'px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)]';
    const appPaddingNegativeX = 'mx-[-1.25rem] md:mx-[-2.5rem]';

    return (
        /* 🔥 ফিক্স ২: Outer Sticky Div with Negative Margin */
        <div 
            className={`sticky top-[4.5rem] md:top-20 z-[300] bg-[var(--bg-app)]/80 backdrop-blur-xl transition-all duration-500 w-auto ${appPaddingNegativeX} border-b border-transparent hover:border-[var(--bg-app)]`}
        >
            {/* 🔥 ফিক্স ৩: Inner Div with Positive Padding */}
            <div className={`py-4 ${appPaddingX}`}> 
                <motion.div layout className="flex items-center gap-3 h-12 relative w-full">
                    
                    {/* --- ১. স্মার্ট সার্চ এরিয়া --- */}
                    <motion.div 
                        layout
                        transition={fastTransition}
                        className="relative flex items-center min-w-0 flex-1"
                    >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10 pointer-events-none">
                            <Search size={18} strokeWidth={2.5} />
                        </div>
                        <input 
                            onFocus={() => setIsSearchExpanded(true)}
                            onBlur={() => { if (!searchQuery) setIsSearchExpanded(false); }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search_placeholder')}
                            className="w-full h-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] pl-12 pr-12 text-[11px] font-bold uppercase tracking-widest focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all shadow-inner text-[var(--text-main)] placeholder:opacity-20"
                        />
                        <AnimatePresence>
                            {(isSearchExpanded || searchQuery) && (
                                <motion.button 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                                    className="absolute right-3 p-1.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-full text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={16} strokeWidth={3} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* --- ২. ফিল্টার বাটনসমূহ --- */}
                    <motion.div 
                        layout
                        transition={fastTransition}
                        className={`flex items-center gap-2 shrink-0 ${isSearchExpanded && window.innerWidth < 768 ? 'hidden' : 'flex'}`}
                    >
                        <EliteDropdown 
                            label={T('sort_by')}
                            current={sortConfig.key} 
                            options={[t('sort_date'), t('sort_amount'), t('sort_title')]} 
                            onChange={(val: string) => setSortConfig({ key: val.toLowerCase(), direction: 'desc' })} 
                            icon={ArrowDownUp}
                        />

                        <EliteDropdown 
                            label={T('classification')}
                            current={categoryFilter} 
                            options={userCategories} 
                            onChange={setCategoryFilter} 
                            icon={Tag}
                        />
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};