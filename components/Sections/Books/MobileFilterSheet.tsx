"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpDown, BarChart3, Download, LayoutGrid } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

export const MobileFilterSheet = ({ 
    isOpen, onClose, categoryFilter, setCategoryFilter, userCategories, sortConfig, setSortConfig 
}: any) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-end justify-center p-4 ">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md" />
                    <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                        className="bg-[var(--bg-app)] w-full max-w-lg rounded-[35px] border  border-[var(--border)] shadow-2xl relative z-10 p-8 space-y-8"
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[4px] text-orange-500">Vault Configuration</h3>
                            <button onClick={onClose} className="p-2 bg-[var(--bg-card)] rounded-xl text-[var(--text-muted)]"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <CustomSelect label="Filter Category" value={categoryFilter} options={userCategories} onChange={setCategoryFilter} icon={LayoutGrid} />
                            
                            <button onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="w-full hover:text-green-500flex items-center justify-between px-6 h-16 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                <span>Toggle Sort Order</span> <ArrowUpDown size={16} className={`text-orange-500 transition-transform ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />
                            </button>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button onClick={() => { triggerModal('analytics'); onClose(); }} className="h-20 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex flex-col items-center justify-center gap-2 text-orange-500 active:bg-orange-500 active:text-white transition-all">
                                    <BarChart3 size={24}/><span className="text-[9px] font-black uppercase">Analytics</span>
                                </button>
                                <button onClick={() => { triggerModal('export'); onClose(); }} className="h-20 rounded-2xl bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center gap-2 text-green-500 active:bg-green-500 active:text-white transition-all">
                                    <Download size={24}/><span className="text-[9px] font-black uppercase">Export</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};