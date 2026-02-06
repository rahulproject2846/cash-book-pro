"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Languages, ChevronDown, Check, Coins, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: REGION MODULE (ELITE EDITION)
 * ---------------------------------------
 * Handles System Language and Base Currency localization.
 * Optimized for OS-level consistency and Midnight Protocol.
 */
export const RegionModule = ({ currency, updateCurrency }: any) => {
    const { language, setLanguage, T, t } = useTranslation();

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] overflow-hidden shadow-xl transition-all duration-500 group">
            
            {/* Background Decor (World Blueprint) */}
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                <Globe size={280} strokeWidth={1} />
            </div>

            {/* Header: OS Section Style */}
            <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-inner">
                    <Globe size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                        {T('regional_protocol') || "REGIONAL PROTOCOL"}
                    </h4>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                        Localization & Currency Gateway
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--app-gap,2rem)] relative z-10">
                
                {/* --- ১. LANGUAGE SELECTOR (Elite Pills) --- */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Languages size={12} className="text-orange-500/60" /> {T('system_language')}
                    </label>
                    <div className="grid grid-cols-2 gap-3 bg-[var(--bg-app)] p-1.5 rounded-[22px] border border-[var(--border)]">
                        {/* English Selector */}
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`relative h-14 rounded-[18px] flex flex-col items-center justify-center transition-all duration-500 active:scale-95 overflow-hidden ${
                                language === 'en' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                            }`}
                        >
                            <span className="text-[12px] font-black uppercase tracking-widest z-10">English</span>
                            {language === 'en' && (
                                <motion.span 
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-[7px] font-bold uppercase opacity-60 z-10"
                                >
                                    {T('active_label') || "ACTIVE"}
                                </motion.span>
                            )}
                        </button>

                        {/* Bengali Selector */}
                        <button 
                            onClick={() => setLanguage('bn')}
                            className={`relative h-14 rounded-[18px] flex flex-col items-center justify-center transition-all duration-500 active:scale-95 overflow-hidden ${
                                language === 'bn' 
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                            }`}
                        >
                            <span className="text-[12px] font-bold z-10">বাংলা</span>
                            {language === 'bn' && (
                                <motion.span 
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-[7px] font-black uppercase opacity-70 z-10"
                                >
                                    {t('active_label') || "সক্রিয়"}
                                </motion.span>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- ২. CURRENCY SELECTOR (The Glass Select) --- */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Coins size={12} className="text-orange-500/60" /> {T('base_currency')}
                    </label>
                    <Tooltip text={t('tt_currency_select')}>
                        <div className="relative group/select">
                            <select 
                                value={currency}
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px] px-6 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:border-orange-500/50 hover:bg-[var(--bg-card)] transition-all outline-none text-[var(--text-main)] shadow-inner"
                            >
                                <option value="BDT (৳)">BDT (৳) - Bangladesh Taka</option>
                                <option value="USD ($)">USD ($) - US Dollar</option>
                                <option value="EUR (€)">EUR (€) - Euro</option>
                                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                            </select>
                            
                            {/* Native Style Chevron */}
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover/select:text-orange-500 transition-colors">
                                <ChevronDown size={18} strokeWidth={2.5} className="opacity-40 group-hover/select:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </Tooltip>
                </div>

            </div>

            {/* Bottom Indicator (Detailing) */}
            <div className="mt-8 flex items-center gap-2 px-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <Zap size={10} className="text-orange-500" fill="currentColor" />
                <span className="text-[8px] font-black uppercase tracking-[3px]">Global Synchronization Protocol Active</span>
            </div>
        </div>
    );
};