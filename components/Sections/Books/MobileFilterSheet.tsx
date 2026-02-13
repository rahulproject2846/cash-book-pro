"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, BarChart3, Download, LayoutGrid, Zap } from 'lucide-react';
import CustomSelect from '@/components/UI/CustomSelect'; // তোর গ্লোবাল ফিক্সড কম্পোনেন্ট

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext'; // 🔥 ফিক্স: ডাইরেক্ট কন্টেক্সট কল
import { cn } from '@/lib/utils/helpers';

export const MobileFilterSheet = ({ 
    isOpen, onClose, categoryFilter, setCategoryFilter, userCategories, sortConfig, setSortConfig 
}: any) => {
    const { t } = useTranslation();
    const { openModal } = useModal(); // গ্লোবাল মডাল হুক

    // স্মার্ট অ্যাকশন হ্যান্ডলার
    const handleAction = (type: any) => {
        onClose();
        // একটু সময় দিয়ে মডাল ওপেন করা যাতে শিট বন্ধ হওয়ার এনিমেশন স্মুথ হয়
        setTimeout(() => {
            if (type === 'analytics' || type === 'export') {
                // মডাল কন্টেক্সট ব্যবহার করে ওপেন করা (বই সিলেক্ট করা থাকতে হবে)
                // যেহেতু এটি গ্লোবাল বাটন, আমরা এখানে currentBook এর চেক পরে Page লেভেলে হ্যান্ডেল করবো
                // অথবা এখানে 'openModal' এর মাধ্যমে প্যারেন্টকে জানাবো। 
                // নোট: এখানে আমরা সরাসরি গ্লোবাল ইভেন্টের বদলে useModal দিয়ে ট্রাই করছি, 
                // তবে তোর আর্কিটেকচার অনুযায়ী যদি page.tsx এ হ্যান্ডলার থাকে, তবে ইভেন্ট ডিসপ্যাচই সেফ।
                // কিন্তু আমরা স্ট্যান্ডার্ড ওয়েতে window event রাখছি তোর আগের লজিক সাপোর্ট করতে, 
                // তবে কোড ক্লিন করে।
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
                }
            }
        }, 300);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-end md:items-center justify-center sm:p-6 overflow-hidden">
                    
                    {/* --- 🌑 DARK BACKDROP --- */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-black/60 backdrop-blur-md" 
                    />

                    {/* --- 🍃 THE SHEET (Apple Card Style) --- */}
                    <motion.div 
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={cn(
                            "bg-[var(--bg-card)] border-t border-x border-[var(--border)]",
                            "w-full max-w-sm mx-auto rounded-t-[40px] md:rounded-[40px]",
                            "shadow-[0_-20px_60px_rgba(0,0,0,0.4)] relative z-10 flex flex-col",
                            "pb-8 md:pb-0" // সেইফ এরিয়া প্যাডিং
                        )}
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 opacity-30" />

                        <div className="p-8 space-y-8">
                            
                            {/* --- 🏷️ HEADER --- */}
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[3px] text-orange-500 flex items-center gap-2">
                                        <Zap size={14} fill="currentColor" strokeWidth={0} />
                                        {t('config_vault')}
                                    </span>
                                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">
                                        Protocol Settings V11.5
                                    </span>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center hover:text-red-500 transition-all active:scale-90 shadow-sm"
                                >
                                    <X size={20} strokeWidth={2.5}/>
                                </button>
                            </div>
                            
                            <div className="space-y-5">
                                {/* 1. CATEGORY SELECTOR (Layered for Z-Index) */}
                                <div className="relative z-50">
                                    <CustomSelect 
                                        label={t('classification')} 
                                        value={categoryFilter} 
                                        options={userCategories} 
                                        onChange={setCategoryFilter} 
                                        icon={LayoutGrid} 
                                        ttKey="tt_filter_category"
                                    />
                                </div>
                                
                                {/* 2. SORT TOGGLE (Elite Button) */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1">
                                        {t('sort_order') || "ORDERING"}
                                    </label>
                                    <button 
                                        onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} 
                                        className={cn(
                                            "w-full flex items-center justify-between px-6 h-16 rounded-[24px] border transition-all active:scale-[0.98] group",
                                            sortConfig.direction === 'desc' 
                                                ? "bg-orange-500/5 border-orange-500/40 shadow-lg shadow-orange-500/10" 
                                                : "bg-[var(--bg-app)] border-[var(--border)]"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "p-2.5 rounded-xl transition-all",
                                                sortConfig.direction === 'desc' ? "bg-orange-500 text-white" : "bg-[var(--bg-card)] text-orange-500 shadow-sm"
                                            )}>
                                                <ArrowUpDown size={18} className={cn("transition-transform duration-500", sortConfig.direction === 'asc' ? "" : "rotate-180")} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                                {t('action_toggle_sort')}
                                            </span> 
                                        </div>
                                        <div className="text-[9px] font-black uppercase text-orange-500 opacity-60 tracking-[2px]">
                                            {sortConfig.direction === 'asc' ? 'ASCENDING' : 'DESCENDING'}
                                        </div>
                                    </button>
                                </div>

                                {/* 3. ACTION GRID (Widgets) */}
                                <div className="grid grid-cols-2 gap-4 pt-2 relative z-0">
                                    <button 
                                        onClick={() => handleAction('analytics')} 
                                        className="h-24 rounded-[28px] bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center gap-3 text-blue-500 active:scale-95 transition-all hover:bg-blue-500/10 hover:border-blue-500/30"
                                    >
                                        <BarChart3 size={26} strokeWidth={2} />
                                        <span className="text-[9px] font-black uppercase tracking-[2px]">{t('nav_analytics')}</span>
                                    </button>

                                    <button 
                                        onClick={() => handleAction('export')} 
                                        className="h-24 rounded-[28px] bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center gap-3 text-green-500 active:scale-95 transition-all hover:bg-green-500/10 hover:border-green-500/30"
                                    >
                                        <Download size={26} strokeWidth={2} />
                                        <span className="text-[9px] font-black uppercase tracking-[2px]">{t('label_export')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};