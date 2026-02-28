"use client";
import React, { useState } from 'react';
import { 
    Layers, Plus, X, Tag, Cpu, ShieldAlert, 
    BadgeCheck, Save, Globe, Coins, Check
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/context/ModalContext';

/**
 * 🏆 SYSTEM REGISTRY V14.0 (HOLLY GRILL UNIFIED)
 * ----------------------------------------------------
 * Row 2: Governance & Regional Protocols.
 * Features: Input Shield, Multi-Link ID Safety, Global Variables.
 * Symmetric Grid: 2-Column Desktop | 1-Column Mobile.
 */
export const SystemRegistry = ({ 
    categories, addCategory, removeCategory, 
    limitBuffer, setLimitBuffer, saveLimit, 
    newCat, setNewCat, currency, updateCurrency 
}: any) => {
    const { t, language, setLanguage } = useTranslation();
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

    // --- ⚡ INPUT SHIELD: Holly Grill Security ---
    const handleLimitChange = (val: string) => {
        // Numeric only, remove leading zeros, cap at 999,999,999
        const cleanNum = val.replace(/[^0-9]/g, '').replace(/^0+/, '');
        const finalNum = cleanNum === '' ? 0 : Math.min(Number(cleanNum), 999999999);
        setLimitBuffer(finalNum);
    };

    const royalGlide = { type: "spring", stiffness: 400, damping: 30 };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--app-gap,2.5rem)]">
            
            {/* --- 📦 SECTION A: GOVERNANCE PROTOCOL --- */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group flex flex-col"
            >
                {/* Visual Decor */}
                <div className="absolute -right-20 -top-20 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                    <Layers size={450} className="text-[var(--accent)]" />
                </div>
                
                <div className="relative z-10 space-y-10 flex-1">
                    {/* Tag Manager */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--accent)]/10 rounded-[20px] text-[var(--accent)] border border-[var(--accent)]/20">
                                <Tag size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">
                                {t('registry_tags') || "REGISTRY TAGS"}
                            </h4>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <input 
                                    onFocus={() => setIsFocused('tag')} onBlur={() => setIsFocused(null)}
                                    className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px] px-6 text-[12px] font-black outline-none focus:border-[var(--accent)]/50 transition-all placeholder:text-[var(--text-muted)]/20 text-[var(--text-main)]" 
                                    placeholder={t('placeholder_new_tag')} 
                                    value={newCat}
                                    onChange={(e) => setNewCat(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && newCat && addCategory(newCat)}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20 text-[var(--accent)]">
                                    <Cpu size={18} />
                                </div>
                            </div>
                            <button 
                                onClick={() => newCat && addCategory(newCat)} 
                                className="bg-[var(--accent)] text-white w-14 h-14 rounded-[22px] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/20"
                            >
                                <Plus size={28} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto md:flex-wrap no-scrollbar pb-2">
                            <AnimatePresence mode="popLayout">
                                {categories.map((cat: string) => (
                                    <motion.div 
                                        layout key={cat} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                        className="flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border)] px-4 py-2.5 rounded-2xl shrink-0 hover:border-[var(--accent)]/30 transition-all cursor-default group/tag"
                                    >
                                        <span className="text-[10px] font-black text-[var(--text-muted)] group-hover/tag:text-[var(--accent)] uppercase">
                                            {cat}
                                        </span>
                                        <button onClick={() => confirmDeleteTag(cat)} className="text-[var(--text-muted)] hover:text-[var(--destructive)] transition-colors">
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Threshold Controller */}
                    <div className="space-y-6 pt-4 border-t border-[var(--border)] opacity-90">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--destructive)]/10 rounded-[20px] text-[var(--destructive)] border border-[var(--destructive)]/20">
                                <ShieldAlert size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">
                                {t('expense_threshold') || "EXPENSE THRESHOLD"}
                            </h4>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input 
                                    type="text" inputMode="numeric"
                                    className={cn(
                                        "w-full h-16 bg-[var(--bg-app)] border-2 rounded-[25px] pl-6 pr-10 text-2xl font-mono-finance font-black transition-all outline-none",
                                        limitBuffer > 0 ? "border-[var(--destructive)]/30 text-[var(--destructive)]" : "border-[var(--border)] text-[var(--text-muted)] opacity-20"
                                    )} 
                                    value={limitBuffer === 0 ? '' : limitBuffer}
                                    onChange={(e) => handleLimitChange(e.target.value)}
                                    placeholder="0000"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <span className="text-[8px] font-black text-[var(--text-muted)] opacity-30 uppercase">
                                        {t('label_monthly_cap') || "PROTOCOL LIMIT"}
                                    </span>
                                </div>
                            </div>

                            <Tooltip text={t('tt_save_limit') || "Commit Changes"}>
                                <button 
                                    onClick={saveLimit}
                                    className="bg-[var(--bg-card)] text-[var(--text-main)] w-16 h-16 rounded-[25px] flex items-center justify-center hover:bg-[var(--accent)] hover:text-white active:scale-95 transition-all border border-[var(--border)] shadow-2xl"
                                >
                                    <Save size={24} strokeWidth={2.5} />
                                </button>
                            </Tooltip>
                        </div>
                        
                        <div className="flex items-center gap-2 px-2">
                            <BadgeCheck size={12} className="text-green-500 opacity-60" />
                            <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-60">
                                Registry Cap: <span className="text-[var(--text-main)]">{toBn(limitBuffer, language)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- 🌍 SECTION B: REGIONAL PROTOCOL --- */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group flex flex-col"
            >
                <div className="relative z-10 space-y-12 flex-1">
                    {/* Language Switcher */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--accent)]/10 rounded-[20px] text-[var(--accent)] border border-[var(--accent)]/20">
                                <Globe size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Language</h4>
                        </div>

                        <div className="flex p-1.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-[28px] relative overflow-hidden">
                            {[
                                { id: 'en', label: 'English' },
                                { id: 'bn', label: 'বাংলা' }
                            ].map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => setLanguage(lang.id as any)}
                                    className={cn(
                                        "flex-1 py-4 text-[11px] font-black rounded-[22px] transition-all duration-500 relative z-10",
                                        language === lang.id ? "text-white" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    )}
                                >
                                    {language === lang.id && (
                                        <motion.div 
                                            layoutId="lang-bg" 
                                            className="absolute inset-0 bg-[var(--accent)] rounded-[22px] -z-10 shadow-lg"
                                            transition={royalGlide as any}
                                        />
                                    )}
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Currency Registry */}
                    <div className="space-y-6 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--accent)]/10 rounded-[20px] text-[var(--accent)] border border-[var(--accent)]/20">
                                <Coins size={22} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Currency Registry</h4>
                        </div>

                        <div className="relative group">
                            <select 
                                value={currency}
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="w-full h-16 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[25px] px-8 text-[12px] font-black appearance-none outline-none focus:border-[var(--accent)]/50 transition-all text-[var(--text-main)]"
                            >
                                <option value="BDT (৳)">BDT (৳) - Bangladesh Taka</option>
                                <option value="USD ($)">USD ($) - US Dollar</option>
                                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                                <option value="EUR (€)">EUR (€) - Euro</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                                <Check size={18} strokeWidth={3} />
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-40 px-2 tracking-widest uppercase">
                            Financial Node localization protocol active
                        </p>
                    </div>
                </div>
            </motion.div>

        </div>
    );
};