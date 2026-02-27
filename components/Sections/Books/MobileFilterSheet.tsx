"use client";
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, BarChart3, Download, Zap } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { cn } from '@/lib/utils/helpers';

/**
 * 🏆 AUTONOMOUS MOBILE FILTER SHEET
 * ----------------------------------------------------
 * logic: Directly connected to VaultStore
 * Action: Controlled by isMobileFilterOpen state
 */
export const MobileFilterSheet = () => {
    const { t } = useTranslation();
    const { openModal } = useModal();

    // 🚀 GET EVERYTHING FROM STORE (NO PROPS NEEDED)
    const {
        isMobileFilterOpen, setMobileFilterOpen,
        entrySortConfig, setEntrySortConfig,
        entryCategoryFilter, setEntryCategoryFilter,
        allEntries, activeBook
    } = useVaultState();

    // 🎯 DYNAMIC CATEGORIES FROM STORE
    const userCategories = useMemo(() => {
        const cats = new Set(allEntries.map((e: any) => e.category?.toUpperCase()).filter(Boolean));
        return ['ALL', ...Array.from(cats)];
    }, [allEntries]);

    if (!isMobileFilterOpen) return null;

    const handleAction = (type: 'analytics' | 'export') => {
        setMobileFilterOpen(false);
        setTimeout(() => {
            openModal(type, { currentBook: activeBook });
        }, 300);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[2000] flex items-end justify-center overflow-hidden">
                
                {/* --- 🌑 DARK BACKDROP --- */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setMobileFilterOpen(false)} 
                    className="fixed inset-0 bg-black/60 backdrop-blur-md" 
                />

                {/* --- 🍃 THE SHEET (Apple Card Style) --- */}
                <motion.div 
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => { if (info.offset.y > 100) setMobileFilterOpen(false); }}
                    initial={{ y: "100%" }} 
                    animate={{ y: 0 }} 
                    exit={{ y: "100%" }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={cn(
                        "bg-[var(--bg-card)] border-t border-[var(--border)]",
                        "w-full max-w-sm mx-auto rounded-t-[40px] relative z-10 flex flex-col pb-10"
                    )}
                >
                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 opacity-30" />

                    <div className="p-8 space-y-8">
                        
                        {/* --- 🏷️ HEADER --- */}
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black      text-orange-500 flex items-center gap-2">
                                    <Zap size={14} fill="currentColor" strokeWidth={0} />
                                    {t('config_vault') || "PROTOCOL CONFIG"}
                                </span>
                                <span className="text-[8px] font-bold text-[var(--text-muted)]      opacity-40">
                                    Adaptive Filter Engine
                                </span>
                            </div>
                            <button 
                                onClick={() => setMobileFilterOpen(false)} 
                                className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center active:scale-90"
                            >
                                <X size={20} strokeWidth={2.5}/>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* 1. CATEGORY SELECTOR */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)]     ml-1">
                                    {t('classification')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {userCategories.slice(0, 4).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setEntryCategoryFilter(cat)}
                                            className={cn(
                                                "h-12 rounded-2xl border text-[10px] font-black transition-all",
                                                entryCategoryFilter === cat 
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                                                    : "bg-[var(--bg-app)] border-[var(--border)] text-[var(--text-muted)]"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 2. SORT TOGGLE */}
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)]     ml-1">
                                    {t('sort_order') || "ORDERING"}
                                </label>
                                <button 
                                    onClick={() => setEntrySortConfig({ 
                                        ...entrySortConfig, 
                                        direction: entrySortConfig.direction === 'asc' ? 'desc' : 'asc' 
                                    })} 
                                    className={cn(
                                        "w-full flex items-center justify-between px-6 h-16 rounded-[24px] border transition-all active:scale-[0.98]",
                                        entrySortConfig.direction === 'desc' 
                                            ? "bg-orange-500/5 border-orange-500/40" 
                                            : "bg-[var(--bg-app)] border-[var(--border)]"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <ArrowUpDown size={18} className={cn("transition-transform duration-500", entrySortConfig.direction === 'asc' ? "" : "rotate-180")} />
                                        </div>
                                        <span className="text-[10px] font-black     text-[var(--text-main)]">
                                            {t('action_toggle_sort')}
                                        </span> 
                                    </div>
                                    <div className="text-[9px] font-black text-orange-500 opacity-60">
                                        {entrySortConfig.direction.toUpperCase ()}
                                    </div>
                                </button>
                            </div>

                            {/* 3. ACTION GRID */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button 
                                    onClick={() => handleAction('analytics')} 
                                    className="h-24 rounded-[28px] bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center gap-2 text-blue-500 active:scale-95 transition-all"
                                >
                                    <BarChart3 size={24} />
                                    <span className="text-[9px] font-black     ">{t('nav_analytics')}</span>
                                </button>

                                <button 
                                    onClick={() => handleAction('export')} 
                                    className="h-24 rounded-[28px] bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center gap-2 text-green-500 active:scale-95 transition-all"
                                >
                                    <Download size={24} />
                                    <span className="text-[9px] font-black     ">{t('label_export')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};