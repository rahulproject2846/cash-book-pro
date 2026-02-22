"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowDownUp, Tag, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { AppleMenu } from '@/components/UI/AppleMenu'; // ✅ UNIFIED APPLE MENU
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

// --- 🛠️ Master Transition Config ---
const fastTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3
} as const;

export const DetailsToolbar = () => {
    const { t } = useTranslation();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // AUTONOMOUS STORE ACCESS - NO PROPS
    const {
        entrySortConfig, entryCategoryFilter, entrySearchQuery,
        setEntrySortConfig, setEntryCategoryFilter, setEntrySearchQuery
    } = useVaultState();

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
                            onBlur={() => { if (!entrySearchQuery) setIsSearchExpanded(false); }}
                            value={entrySearchQuery}
                            onChange={(e) => setEntrySearchQuery(e.target.value)}
                            placeholder={t('search_placeholder') || "Search records..."}
                            className={cn(
                                "w-full h-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px]",
                                "pl-12 pr-12 text-[11px] font-bold uppercase tracking-widest",
                                "focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none",
                                "transition-all shadow-inner text-[var(--text-main)] placeholder:opacity-20"
                            )}
                        />
                        <AnimatePresence>
                            {(isSearchExpanded || entrySearchQuery) && (
                                <motion.button 
                                    initial={{ opacity: 0, scale: 0.8 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => { setIsSearchExpanded(false); setEntrySearchQuery(''); }}
                                    className="absolute right-3 p-1.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-full text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={14} strokeWidth={3} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* --- ২. ফিল্টার বাটনসমূহ (Using Unified AppleMenu) --- */}
                    <motion.div 
                        layout
                        transition={fastTransition}
                        className={cn(
                            "flex items-center gap-2 shrink-0",
                            isSearchExpanded && window.innerWidth < 768 ? 'hidden' : 'flex'
                        )}
                    >
                        <AppleMenu
                            trigger={
                                <button 
                                    className={cn(
                                        "h-11 px-4 rounded-2xl bg-(--bg-card) border border-(--border)",
                                        "flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                        "active:scale-95 shadow-sm hover:border-orange-500/30 outline-none",
                                        "text-(--text-main)"
                                    )}
                                >
                                    <ArrowDownUp size={16} strokeWidth={2.5} className="text-(--text-muted) opacity-60" />
                                    <span className="hidden lg:block truncate max-w-25">
                                        {t('sort_by')}
                                    </span>
                                </button>
                            }
                            headerText="SORT BY"
                            width="w-60"
                        >
                            {['createdAt', 'amount', 'title'].map((opt) => {
                                const isSelected = entrySortConfig.key === opt;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setEntrySortConfig({ key: opt, direction: 'desc' })}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all mb-1 last:mb-0",
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isSelected 
                                                ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                : "text-(--text-muted) hover:bg-(--bg-app) hover:text-(--text-main)"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                            {opt === 'createdAt' ? 'Date' : opt === 'amount' ? 'Amount' : 'Title'}
                                        </div>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                    </button>
                                );
                            })}
                        </AppleMenu>

                        <AppleMenu
                            trigger={
                                <button 
                                    className={cn(
                                        "h-11 px-4 rounded-2xl bg-(--bg-card) border border-(--border)",
                                        "flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                        "active:scale-95 shadow-sm hover:border-orange-500/30 outline-none",
                                        "text-(--text-main)"
                                    )}
                                >
                                    <Tag size={16} strokeWidth={2.5} className="text-(--text-muted) opacity-60" />
                                    <span className="hidden lg:block truncate max-w-25">
                                        {t('classification')}
                                    </span>
                                </button>
                            }
                            headerText="CLASSIFICATION"
                            width="w-60"
                        >
                            {(['all', ...[]] as string[]).map((opt: string) => {
                                const isSelected = entryCategoryFilter === opt;
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => setEntryCategoryFilter(opt)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all mb-1 last:mb-0",
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isSelected 
                                                ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                : "text-(--text-muted) hover:bg-(--bg-app) hover:text-(--text-main)"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                            {opt}
                                        </div>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                    </button>
                                );
                            })}
                        </AppleMenu>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};