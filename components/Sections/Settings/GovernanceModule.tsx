"use client";
import React, { useState, useEffect } from 'react';
import { 
    Layers, Plus, X, Tag, Cpu, ShieldAlert, 
    BadgeCheck, Save, ArrowRight 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

export const GovernanceModule = ({ 
    categories, addCategory, removeCategory, 
    limitBuffer, setLimitBuffer, saveLimit, 
    newCat, setNewCat 
}: any) => {
    const { t, language } = useTranslation();
    const { openModal } = useModal();
    const [isFocused, setIsFocused] = useState<string | null>(null);

    // --- 🛡️ SECURE DELETE PROTOCOL ---
    const confirmDeleteTag = (cat: string) => {
        openModal('deleteConfirm', {
            targetName: cat,
            title: "REGISTRY PURGE",
            onConfirm: () => removeCategory(cat)
        });
    };

    // --- ⚡ INPUT BUG FIX: Handling leading zeros ---
    const handleLimitChange = (val: string) => {
        const num = val.replace(/^0+/, ''); // শুরুতে থাকা ০ গুলো মুছে ফেলে
        setLimitBuffer(num === '' ? 0 : Number(num));
    };

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* Apple Style Glass Background Decor */}
            <div className="absolute -right-20 -top-20 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <Layers size={450} className="text-orange-500" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                
                {/* --- ১. REGISTRY TAG MANAGER --- */}
                <div className="space-y-6 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20">
                                <Tag size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-main)]       ">
                                {t('registry_tags') || "REGISTRY TAGS"}
                            </h4>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1 group transition-all">
                            <input 
                                onFocus={() => setIsFocused('tag')}
                                onBlur={() => setIsFocused(null)}
                                className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px] px-6 text-[12px] font-black     outline-none focus:border-orange-500/50 transition-all placeholder:text-[var(--text-muted)]/10 text-[var(--text-main)]" 
                                placeholder={t('placeholder_new_tag')} 
                                value={newCat}
                                onChange={(e) => setNewCat(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && newCat && addCategory(newCat)}
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 text-orange-500">
                                <Cpu size={18} />
                            </div>
                        </div>
                        <button 
                            onClick={() => newCat && addCategory(newCat)} 
                            className="bg-orange-500 text-white w-14 h-14 rounded-[22px] flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all shadow-xl shadow-orange-500/20"
                        >
                            <Plus size={28} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Elite Tag Scroll Container */}
                    <div className={cn(
                        "flex gap-3 pb-2 transition-all",
                        // Mobile: Left-to-Right Scroll | Desktop: Wrap with Bottom Scroll
                        "overflow-x-auto md:flex-wrap md:overflow-y-auto max-h-48 no-scrollbar"
                    )}>
                        <AnimatePresence mode="popLayout">
                            {categories.map((cat: string) => (
                                <motion.div 
                                    layout key={cat} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border)] px-4 py-2.5 rounded-2xl shrink-0 hover:border-orange-500/30 transition-all cursor-default group/tag"
                                >
                                    <span className="text-[10px] font-black   text-[var(--text-muted)] group-hover/tag:text-orange-500  ">
                                        {cat}
                                    </span>
                                    <button onClick={() => confirmDeleteTag(cat)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                        <X size={14} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- ২. EXPENSE THRESHOLD (Standalone Master Section) --- */}
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-[20px] text-red-500 border border-red-500/20">
                            <ShieldAlert size={22} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-base font-black text-[var(--text-main)]       ">
                            {t('expense_threshold') || "EXPENSE THRESHOLD"}
                        </h4>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <input 
                                type="text" // Type text রাখা হয়েছে ০ বাগ ফিক্স করার জন্য
                                inputMode="numeric"
                                onFocus={() => setIsFocused('limit')}
                                onBlur={() => setIsFocused(null)}
                                className={cn(
                                    "w-full h-16 bg-[var(--bg-app)] border-2 rounded-[25px] pl-6 pr-10 text-2xl font-mono-finance font-black transition-all outline-none",
                                    limitBuffer > 0 ? "border-red-500/30 text-red-500" : "border-[var(--border)] text-[var(--text-muted)] opacity-20"
                                )} 
                                value={limitBuffer === 0 ? '' : limitBuffer}
                                onChange={(e) => handleLimitChange(e.target.value)}
                                placeholder="0000"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <span className="text-[8px] font-black text-[var(--text-muted)]      opacity-30">
                                    {t('label_monthly_cap') || "PROTOCOL LIMIT"}
                                </span>
                            </div>
                        </div>

                        {/* Elite Save Button */}
                        <Tooltip text={t('tt_save_limit') || "Commit Changes"}>
                            <button 
                                onClick={saveLimit}
                                className="bg-zinc-800 text-white w-16 h-16 rounded-[25px] flex items-center justify-center hover:bg-zinc-700 active:scale-90 transition-all border-2 border-white/5 shadow-2xl"
                            >
                                <Save size={24} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                    </div>

                    {/* Saved Status Indicator */}
                    <AnimatePresence>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-2 mt-2">
                            <BadgeCheck size={12} className="text-green-500 opacity-40" />
                            <p className="text-[9px] font-bold text-[var(--text-muted)]      opacity-40">
                                Current Active Registry Cap: <span className="text-[var(--text-main)]">{toBn(limitBuffer, language)}</span>
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
};