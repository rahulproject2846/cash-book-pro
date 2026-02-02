"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, ArrowDownUp, BarChart3, Download, Tag, 
    Check, SlidersHorizontal, ChevronDown 
} from 'lucide-react';

// সিগন্যাল ফাংশন যা গ্লোবাল মডাল ওপেন করবে
const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

// --- Reusable Elite Dropdown (Used for both Sort and Category) ---
const EliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
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
                className={`h-12 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500/50 shadow-lg' : 'hover:border-orange-500/20'}`}
            >
                <Icon size={16} className={isOpen ? 'text-orange-500 ' : 'text-[var(--text-muted)]'} />
                <span className="hidden lg:block text-[var(--text-muted)] truncate max-w-[80px] ">
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
                        className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] p-2 z-[500] shadow-2xl hover:text-green-500"
                    >
                        
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'border-[var(--border)] text-orange-500 bg-[var(--bg-app)]' : 'text-[var(--text-muted)] bg-[var(--bg-card)] hover:text-orange-400'}`}
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

    return (
        <div className="flex items-center gap-2 md:gap-3 w-full relative z-[100] ">
            
            {/* 1. SEARCH - Contained Box Style (Matches app-input) */}
            <div className="relative flex-1 group h-12 ">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]  group-focus-within:text-orange-500 transition-colors hover:text-green-500 pointer-events-none" size={18} />
                <input 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="SEARCH PROTOCOLS..." 
                    className="w-full h-full bg-[var(--bg-app)] placeholder:text-[var(--text-muted)] border border-[var(--border)] bg-[var(--bg-card)] rounded-xl px-11 text-[10px] font-black uppercase tracking-[2px] outline-none transition-all focus:border-orange-500/40 focus:bg-[var(--bg-card)] placeholder:text-[#222] shadow-inner"
                />
            </div>

            {/* 2. DESKTOP ACTIONS */}
            <div className="hidden xl:flex items-center gap-2 ">
                
                {/* UNIFIED SORT DROPDOWN */}
                <EliteDropdown 
                    label=""
                    current={sortConfig.key} 
                    options={['Date', 'Amount', 'Title']} 
                    onChange={(val: string) => setSortConfig({ key: val.toLowerCase(), direction: 'desc' })} 
                    icon={ArrowDownUp}
                />

                {/* UNIFIED CATEGORY DROPDOWN */}
                <EliteDropdown 
                    label=""
                    current={categoryFilter} 
                    options={userCategories} 
                    onChange={setCategoryFilter} 
                    icon={Tag}
                />

                {/* ICON ACTIONS */}
                <button 
                    onClick={() => triggerModal('analytics')} 
                    className="h-12 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-[var(--text-muted)] border-[var(--border-color)] hover:text-orange-500"
                    title="Analytics"
                >
                    <BarChart3 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stats</span>
                </button>

                <button 
                    onClick={() => triggerModal('export')} 
                    className="h-12 px-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 text-[var(--text-muted)] border-[var(--border-color)] hover:text-green-500"
                    title="Export"
                >
                    <Download size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Export</span>
                </button>
            </div>

            {/* 3. MOBILE CONFIG TOGGLE (On the same line as Search) */}
            <button 
                onClick={onMobileToggle} 
                className="xl:hidden h-12 w-12 flex items-center justify-center rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-orange-500 active:scale-90 shadow-sm"
            >
                <SlidersHorizontal size={20} />
            </button>
        </div>
    );
};