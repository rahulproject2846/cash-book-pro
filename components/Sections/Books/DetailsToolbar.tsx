"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp, Tag, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { EliteDropdown } from '@/components/UI/EliteDropdown'; // ✅ গ্লোবাল ইম্পোর্ট
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

// --- 🛠️ Master Transition Config ---
const fastTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
} as const;

export const DetailsToolbar = ({ 
    searchQuery, setSearchQuery, sortConfig, setSortConfig, 
    categoryFilter, setCategoryFilter, userCategories 
}: any) => {
    const { T, t } = useTranslation();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // ডাইনামিক প্যাডিং ফিক্স (Elite Spacing)
    const appPaddingX = 'px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)]';
    const appPaddingNegativeX = 'mx-[-1.25rem] md:mx-[-2.5rem]';

    return (
        /* 🔥 Sticky Toolbar Container */
        <div className={cn(
            "sticky top-[4.5rem] md:top-20 z-[300]",
            "bg-[var(--bg-app)]/80 backdrop-blur-xl transition-all duration-500",
            "border-b border-transparent hover:border-[var(--bg-app)]",
            appPaddingNegativeX // Negative margin for edge-to-edge feel
        )}>
            <div className={cn("py-4", appPaddingX)}> 
                <motion.div layout className="flex items-center gap-3 h-12 relative w-full">
                    
                    {/* --- ১. স্মার্ট সার্চ এরিয়া (Glass Input) --- */}
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
                            placeholder={t('search_placeholder') || "Search records..."}
                            className={cn(
                                "w-full h-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px]",
                                "pl-12 pr-12 text-[11px] font-bold uppercase tracking-widest",
                                "focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none",
                                "transition-all shadow-inner text-[var(--text-main)] placeholder:opacity-20"
                            )}
                        />
                        <AnimatePresence>
                            {(isSearchExpanded || searchQuery) && (
                                <motion.button 
                                    initial={{ opacity: 0, scale: 0.8 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => { setIsSearchExpanded(false); setSearchQuery(''); }}
                                    className="absolute right-3 p-1.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-full text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={14} strokeWidth={3} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* --- ২. ফিল্টার বাটনসমূহ (Using EliteDropdown) --- */}
                    <motion.div 
                        layout
                        transition={fastTransition}
                        className={cn(
                            "flex items-center gap-2 shrink-0",
                            isSearchExpanded && window.innerWidth < 768 ? 'hidden' : 'flex'
                        )}
                    >
                        <EliteDropdown 
                            label={T('sort_by')}
                            current={sortConfig.key} 
                            options={['createdAt', 'amount', 'title']} // ফিক্স: ডাটাবেজ ফিল্ড নেম ব্যবহার করা হলো
                            onChange={(val: string) => setSortConfig({ key: val, direction: 'desc' })} 
                            icon={ArrowDownUp}
                            ttKey="tt_change_sort_order"
                        />

                        <EliteDropdown 
                            label={T('classification')}
                            current={categoryFilter} 
                            options={userCategories} 
                            onChange={setCategoryFilter} 
                            icon={Tag}
                            ttKey="tt_filter_category"
                        />
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};