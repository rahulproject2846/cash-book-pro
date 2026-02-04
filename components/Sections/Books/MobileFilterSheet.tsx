"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, BarChart3, Download, LayoutGrid } from 'lucide-react';
import CustomSelect from '@/components/UI/CustomSelect'; // ইমপোর্ট পাথ চেক করে নিন

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

/**
 * VAULT PRO: MOBILE FILTER SHEET (STABILIZED)
 * -----------------------------------------
 * Fully integrated with Global Spacing, Language, and Tooltips.
 */
export const MobileFilterSheet = ({ 
    isOpen, onClose, categoryFilter, setCategoryFilter, userCategories, sortConfig, setSortConfig 
}: any) => {
    const { T, t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4 transition-all duration-300">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md" 
                    />

                    {/* Sheet Content */}
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="bg-[var(--bg-app)] w-full max-w-lg rounded-[var(--radius-card,35px)] border border-[var(--border-color)] shadow-2xl relative z-10 p-[var(--card-padding,2rem)] space-y-[var(--app-gap,2rem)]"
                    >
                        {/* Header Area */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-orange-500">
                                {T('config_vault') || "Vault Configuration"}
                            </h3>
                            <Tooltip text={t('tt_close') || "Close"}>
                                <button 
                                    onClick={onClose} 
                                    className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                >
                                    <X size={20}/>
                                </button>
                            </Tooltip>
                        </div>
                        
                        <div className="space-y-[var(--app-gap,1rem)]">
                            {/* Category Selector with Translated Label */}
                            <CustomSelect 
                                label={t('label_filter_cat') || "Filter Category"} 
                                value={categoryFilter} 
                                options={userCategories} 
                                onChange={setCategoryFilter} 
                                icon={LayoutGrid} 
                            />
                            
                            {/* Sort Toggle Button */}
                            <button 
                                onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} 
                                className="w-full flex items-center justify-between px-6 h-16 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] hover:border-orange-500/30 transition-all active:scale-[0.98]"
                            >
                                <span>{T('action_toggle_sort') || "Toggle Sort Order"}</span> 
                                <ArrowUpDown size={16} className={`text-orange-500 transition-transform duration-500 ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />
                            </button>

                            {/* Action Grid (Analytics & Export) */}
                            <div className="grid grid-cols-2 gap-[var(--app-gap,1rem)] pt-4">
                                <Tooltip text={t('tt_analytics')}>
                                    <button 
                                        onClick={() => { triggerModal('analytics'); onClose(); }} 
                                        className="w-full h-20 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center justify-center gap-2 text-orange-500 active:bg-orange-500 active:text-white transition-all shadow-sm"
                                    >
                                        <BarChart3 size={24}/>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{T('nav_analytics')}</span>
                                    </button>
                                </Tooltip>

                                <Tooltip text={t('tt_export')}>
                                    <button 
                                        onClick={() => { triggerModal('export'); onClose(); }} 
                                        className="w-full h-20 rounded-2xl bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center gap-2 text-green-500 active:bg-green-500 active:text-white transition-all shadow-sm"
                                    >
                                        <Download size={24}/>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{T('label_export')}</span>
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};