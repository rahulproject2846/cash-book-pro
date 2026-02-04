"use client";
import React from 'react';
import { Search, SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: TIMELINE TOOLBAR (STABILIZED)
 * --------------------------------------
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const TimelineToolbar = ({ searchQuery, setSearchQuery, filterType, setFilterType }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);
    
    // Translated Filter Options
    const options = [
        { id: 'all', label: t('all') || 'All' },
        { id: 'income', label: t('income') || 'Income' },
        { id: 'expense', label: t('expense') || 'Expense' }
    ];

    return (
        <div className="flex gap-[var(--app-gap,0.5rem)] items-center w-full transition-all duration-300">
            
            {/* --- ১. SEARCH INPUT WITH TOOLTIP --- */}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none" size={18} />
                <Tooltip text={t('tt_search_records') || "Search protocols"}>
                    <input 
                        placeholder={t('search_placeholder')} 
                        className="w-full h-12 md:h-14 pl-12 pr-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-orange-500/40 outline-none transition-all shadow-sm text-[var(--text-main)]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Tooltip>
            </div>

            {/* --- ২. FILTER DROPDOWN --- */}
            <div className="relative">
                <Tooltip text={t('tt_filter_type') || "Filter by type"}>
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className={`h-12 md:h-14 px-[var(--card-padding,1.25rem)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500/50 text-orange-500 shadow-lg' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                    >
                        <SlidersHorizontal size={18} />
                        <span className="hidden md:block">
                            {options.find(o => o.id === filterType)?.label || filterType}
                        </span>
                    </button>
                </Tooltip>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                            className="absolute right-0 mt-3 w-48 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-[var(--radius-card,24px)] p-2 z-[500] shadow-2xl"
                        >
                            {options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setFilterType(opt.id); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all mb-1 last:mb-0 ${filterType === opt.id ? 'bg-[var(--bg-card)] text-orange-500' : 'text-[var(--text-muted)] hover:bg-orange-500/5 hover:text-orange-400'}`}
                                >
                                    {opt.label} {filterType === opt.id && <Check size={14} />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};