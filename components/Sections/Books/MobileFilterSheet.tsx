"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, BarChart3, Download, LayoutGrid, Zap } from 'lucide-react';
import CustomSelect from '@/components/UI/CustomSelect';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

export const MobileFilterSheet = ({ 
    isOpen, onClose, categoryFilter, setCategoryFilter, userCategories, sortConfig, setSortConfig 
}: any) => {
    const { T, t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                // ফিক্স ১: items-center ব্যবহার করা হয়েছে যাতে এটি মাঝখানে থাকে
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 overflow-hidden">
                    
                    {/* --- 🌑 DARK BACKDROP --- */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-black/70 backdrop-blur-md" 
                    />

                    {/* --- 🍃 THE CENTERED SHEET --- */}
                    <motion.div 
                        // ফিক্স ২: নিচ থেকে আসবে (y: 100%) কিন্তু সেন্টারে থামবে
                        initial={{ y: "100%", opacity: 0, scale: 0.9 }} 
                        animate={{ y: 0, opacity: 1, scale: 1 }} 
                        exit={{ y: "100%", opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-sm rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative z-10 flex flex-col overflow-visible"
                    >
                        {/* Apple Style Decoration */}
                        <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-4 opacity-20" />

                        <div className="p-7 space-y-7">
                            
                            {/* --- 🏷️ HEADER --- */}
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[3px] text-orange-500 flex items-center gap-2">
                                        <Zap size={12} fill="currentColor" strokeWidth={0} />
                                        {T('config_vault')}
                                    </span>
                                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">Protocol Settings v5.2</span>
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="w-9 h-9 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center hover:text-red-500 transition-all active:scale-90 shadow-sm"
                                >
                                    <X size={18}/>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {/* ফিক্স ৩: ড্রপডাউন কন্টেইনারকে আলাদা লেয়ার দেওয়া হয়েছে */}
                                <div className="relative z-[2001] p-1 bg-[var(--bg-card)] rounded-[22px] border border-[var(--border)]">
                                    <CustomSelect 
                                        label={T('classification')} 
                                        value={categoryFilter} 
                                        options={userCategories} 
                                        onChange={setCategoryFilter} 
                                        icon={LayoutGrid} 
                                    />
                                </div>
                                
                                {/* Elite Sort Toggle */}
                                <button 
                                    onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} 
                                    className={`w-full flex items-center justify-between px-5 h-14 bg-[var(--bg-app)] rounded-[20px] border transition-all active:scale-[0.97] group ${sortConfig.direction === 'desc' ? 'border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-[var(--border)]'}`}
                                >
                                    <div className="flex bg-blackitems-center gap-3">
                                        <div className={`p-2 rounded-lg transition-all ${sortConfig.direction === 'desc' ? 'bg-orange-500 text-white' : 'bg-[var(--bg-card)] text-orange-500'}`}>
                                            <ArrowUpDown size={14} className={`transition-transform duration-500 ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                            {T('action_toggle_sort')}
                                        </span> 
                                    </div>
                                    <div className="text-[8px] font-black uppercase text-orange-500 opacity-60 tracking-[1.5px]">
                                        {sortConfig.direction === 'asc' ? 'A-Z' : 'Z-A'}
                                    </div>
                                </button>

                                {/* Action Grid */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                        onClick={() => { triggerModal('analytics'); onClose(); }} 
                                        className="group w-full h-20 rounded-[25px] bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center gap-2 text-blue-500 active:scale-95 transition-all"
                                    >
                                        <BarChart3 size={24} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-[2px]">{T('nav_analytics')}</span>
                                    </button>

                                    <button 
                                        onClick={() => { triggerModal('export'); onClose(); }} 
                                        className="group w-full h-20 rounded-[25px] bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center gap-2 text-green-500 active:scale-95 transition-all"
                                    >
                                        <Download size={24} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[8px] font-black uppercase tracking-[2px]">{T('label_export')}</span>
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