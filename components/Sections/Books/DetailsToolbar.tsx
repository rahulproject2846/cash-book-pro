"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, ArrowDownUp, BarChart3, Download, Tag, 
    Check, SlidersHorizontal, ChevronDown 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// সিগন্যাল ফাংশন (অপরিবর্তিত)
const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

// --- Reusable Elite Dropdown (Modified for Language & Spacing) ---
const EliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: any) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`h-12 px-[var(--card-padding,1rem)] rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500/50 shadow-lg' : 'hover:border-orange-500/20'}`}
            >
                <Icon size={16} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)]'} />
                <span className="hidden lg:block text-[var(--text-muted)] truncate max-w-[80px]">
                     {current}
                </span>
                <ChevronDown size={12} className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 8, scale: 0.95 }} 
                        className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-card,22px)] p-2 z-[500] shadow-2xl"
                    >
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'border border-orange-500/20 text-orange-500 bg-[var(--bg-app)]' : 'text-[var(--text-muted)] hover:text-orange-400'}`}
                                    >
                                        {opt} {isSelected && <Check size={14} />}
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
    categoryFilter, setCategoryFilter, userCategories, onMobileToggle 
}: any) => {
    const { T, t } = useTranslation();

    return (
        <div className="flex items-center gap-[var(--app-gap,0.75rem)] w-full relative z-[100] transition-all duration-300">
            
            {/* 1. SEARCH - Dynamic Placeholder Injection */}
            <div className="relative flex-1 group h-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none" size={18} />
                <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder')} 
                    className="w-full h-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl px-11 text-[10px] font-black uppercase tracking-[2px] outline-none transition-all focus:border-orange-500/40 focus:bg-[var(--bg-card)] shadow-inner text-[var(--text-main)]"
                />
            </div>

            {/* 2. DESKTOP ACTIONS - Variables Injected */}
            <div className="hidden xl:flex items-center gap-[var(--app-gap,0.5rem)]">
                
                {/* SORT: Translated Options */}
                <EliteDropdown 
                    current={sortConfig.key} 
                    options={[t('sort_date'), t('sort_amount'), t('sort_title')]} 
                    onChange={(val: string) => setSortConfig({ key: val.toLowerCase(), direction: 'desc' })} 
                    icon={ArrowDownUp}
                />

                {/* CATEGORY: User Sync */}
                <EliteDropdown 
                    current={categoryFilter} 
                    options={userCategories} 
                    onChange={setCategoryFilter} 
                    icon={Tag}
                />

                {/* STATS: Tooltip & Language Integration */}
                <Tooltip text={t('tt_analytics')}>
                    <button 
                        onClick={() => triggerModal('analytics')} 
                        className="h-12 px-[var(--card-padding,1rem)] rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-[var(--text-muted)] hover:text-orange-500"
                    >
                        <BarChart3 size={18} />
                        <span className="hidden lg:inline">{T('nav_analytics')}</span>
                    </button>
                </Tooltip>

                {/* EXPORT: Tooltip & Language Integration */}
                <Tooltip text={t('tt_export')}>
                    <button 
                        onClick={() => triggerModal('export')} 
                        className="h-12 px-[var(--card-padding,1rem)] rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-[var(--text-muted)] hover:text-green-500"
                    >
                        <Download size={18} />
                        <span className="hidden lg:inline">{T('label_export') || "Export"}</span>
                    </button>
                </Tooltip>
            </div>

            {/* 3. MOBILE FILTER TOGGLE */}
            <Tooltip text={t('tt_filter_mobile') || "Filters"}>
                <button 
                    onClick={onMobileToggle} 
                    className="xl:hidden h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-orange-500 active:scale-90 shadow-sm transition-all"
                >
                    <SlidersHorizontal size={20} />
                </button>
            </Tooltip>
        </div>
    );
};