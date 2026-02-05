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

// --- 🔘 Elite Dropdown (Native-Sheet Style) ---
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
                className={`h-12 px-4 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-4 ring-orange-500/5' : 'hover:border-orange-500/30'}`}
            >
                <Icon size={16} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-60'} />
                <span className="hidden lg:block text-[var(--text-main)] truncate max-w-[80px]">
                     {current}
                </span>
                <ChevronDown size={12} className={`opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                        className="absolute right-0 mt-3 w-56 bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-2 z-[500] shadow-2xl"
                    >
                        <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{label || t('protocol_selection')}</span>
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

export const DetailsToolbar = ({ 
    searchQuery, setSearchQuery, sortConfig, setSortConfig, 
    categoryFilter, setCategoryFilter, userCategories, onMobileToggle 
}: any) => {
    const { T, t } = useTranslation();

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-[var(--app-gap,0.75rem)] w-full relative z-[100] transition-all duration-300 bg-[var(--bg-app)]/50 backdrop-blur-md p-2 rounded-[24px]"
        >
            
            {/* 1. ELITE SEARCH BAR */}
            <div className="relative flex-1 group h-12">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none z-10">
                    <Search size={18} strokeWidth={2.5} className="opacity-40 group-focus-within:opacity-100" />
                </div>
                <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder')} 
                    className="w-full h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] pl-14 pr-6 text-[11px] font-bold uppercase tracking-[2px] outline-none transition-all focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 shadow-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/20"
                />
            </div>

            {/* 2. DESKTOP ACTIONS (Unified Spacing) */}
            <div className="hidden xl:flex items-center gap-[var(--app-gap,0.75rem)]">
                
                {/* SORT: Premium Menu */}
                <EliteDropdown 
                    label={T('sort_by')}
                    current={sortConfig.key} 
                    options={[t('sort_date'), t('sort_amount'), t('sort_title')]} 
                    onChange={(val: string) => setSortConfig({ key: val.toLowerCase(), direction: 'desc' })} 
                    icon={ArrowDownUp}
                />

                {/* CATEGORY: Filter Logic */}
                <EliteDropdown 
                    label={T('classification')}
                    current={categoryFilter} 
                    options={userCategories} 
                    onChange={setCategoryFilter} 
                    icon={Tag}
                />

                {/* ANALYTICS: Haptic Button 
                <Tooltip text={t('tt_analytics')}>
                    <button 
                        onClick={() => triggerModal('analytics')} 
                        className="h-12 px-5 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30"
                    >
                        <BarChart3 size={18} strokeWidth={2.5} />
                        <span className="hidden lg:inline">{T('nav_analytics')}</span>
                    </button>
                </Tooltip>

                 EXPORT: Elite Action 
                <Tooltip text={t('tt_export')}>
                    <button 
                        onClick={() => triggerModal('export')} 
                        className="h-12 px-5 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 text-[var(--text-muted)] hover:text-green-500 hover:border-green-500/30"
                    >
                        <Download size={18} strokeWidth={2.5} />
                        <span className="hidden lg:inline">{T('label_export')}</span>
                    </button>
                </Tooltip> */}
            </div>

            {/* 3. MOBILE CONTROL TOGGLE */}
            <div className="xl:hidden flex items-center">
                <Tooltip text={t('tt_filter_mobile')}>
                    <button 
                        onClick={onMobileToggle} 
                        className="h-12 w-12 flex items-center justify-center rounded-full bg-orange-500 text-white active:scale-90 shadow-lg shadow-orange-500/20 transition-all border-none"
                    >
                        <SlidersHorizontal size={20} strokeWidth={3} />
                    </button>
                </Tooltip>
            </div>
        </motion.div>
    );
};