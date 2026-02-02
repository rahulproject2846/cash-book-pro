"use client";
import React from 'react';
import { Search, SlidersHorizontal, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TimelineToolbar = ({ searchQuery, setSearchQuery, filterType, setFilterType }: any) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const options = ['all', 'income', 'expense'];

    return (
        <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                    placeholder="SEARCH PROTOCOL RECORDS..." 
                    className="w-full h-12 md:h-14 pl-12 pr-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-orange-500/40 outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-12 md:h-14 px-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-95"
                >
                    <SlidersHorizontal size={18} />
                    <span className="hidden md:block">{filterType}</span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-48 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-[24px] p-2 z-[500] shadow-2xl">
                            {options.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => { setFilterType(opt); setIsOpen(false); }}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all mb-1 last:mb-0 ${filterType === opt ? 'bg-[var(--bg-card)] text-orange-500' : 'text-[var(--text-muted)] hover:bg-[#1a1a1a] hover:text-orange-400'}`}
                                >
                                    {opt} {filterType === opt && <Check size={14} />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};