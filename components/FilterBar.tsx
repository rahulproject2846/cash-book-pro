"use client";
import React from 'react';
import { Search, Calendar, Filter, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const FilterBar = ({ searchQuery, setSearchQuery, dateFilter, setDateFilter }: any) => {
    // প্রফেশনাল ফিল্টার অপশন
    const filters = [
        { label: 'All Records', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
    ];

    return (
        <div className="space-y-5 mb-8 anim-fade-up">
            {/* ১. স্মার্ট সার্চ ইনপুট */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none">
                    <Search size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search protocol by identity..." 
                    className="app-input pl-12 pr-4 py-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl text-xs font-black uppercase tracking-widest focus:border-orange-500 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 shadow-sm transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* ২. ক্রনোলজিক্যাল ফিল্টার চিপস (Horizontal Scroll) */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-xl text-orange-500 shrink-0">
                    <Clock size={14} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Time range</span>
                </div>
                
                <div className="flex gap-2">
                    {filters.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setDateFilter(f.value)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all whitespace-nowrap active:scale-90 ${
                                dateFilter === f.value 
                                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};