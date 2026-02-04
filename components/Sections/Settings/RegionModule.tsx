"use client";
import React from 'react';
import { Globe, Languages, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: REGION MODULE (100% STABLE)
 * ------------------------------------
 * Handles System Language and Base Currency localization.
 * Fully integrated with Compact Mode, Multi-language, and Tooltips.
 */
export const RegionModule = ({ currency, updateCurrency }: any) => {
    const { language, setLanguage, T, t } = useTranslation();

    return (
        <div className="app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden transition-all duration-300">
            {/* Background Decor */}
            <div className="absolute -right-6 -top-6 opacity-[0.02] rotate-12 pointer-events-none">
                <Globe size={200} />
            </div>

            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8 relative z-10">
                <Globe size={18} className="text-blue-500" /> {T('regional_protocol')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--app-gap,2rem)] relative z-10">
                
                {/* --- ১. LANGUAGE SELECTOR --- */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Languages size={12} /> {T('system_language')}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {/* English Toggle */}
                        <Tooltip text={t('tt_lang_en')}>
                            <button 
                                onClick={() => setLanguage('en')}
                                className={`w-full h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${language === 'en' ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-app)] shadow-lg' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/50'}`}
                            >
                                <span className="text-[12px] font-black uppercase tracking-widest">English</span>
                                {language === 'en' && <span className="text-[7px] font-bold opacity-60">{T('active_label')}</span>}
                            </button>
                        </Tooltip>

                        {/* Bengali Toggle */}
                        <Tooltip text={t('tt_lang_bn')}>
                            <button 
                                onClick={() => setLanguage('bn')}
                                className={`w-full h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${language === 'bn' ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-app)] shadow-lg' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/50'}`}
                            >
                                <span className="text-[12px] font-bold uppercase tracking-widest">বাংলা</span>
                                {language === 'bn' && <span className="text-[7px] font-bold opacity-60">{t('active_label')}</span>}
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* --- ২. CURRENCY SELECTOR --- */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Check size={12} /> {T('base_currency')}
                    </label>
                    <Tooltip text={t('tt_currency_select')}>
                        <div className="relative group">
                            <select 
                                value={currency}
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border-color)] rounded-2xl px-5 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:border-blue-500/50 transition-all outline-none text-[var(--text-main)]"
                            >
                                <option value="BDT (৳)">BDT (৳) - Bangladesh Taka</option>
                                <option value="USD ($)">USD ($) - US Dollar</option>
                                <option value="EUR (€)">EUR (€) - Euro</option>
                                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none group-hover:text-blue-500 transition-all" size={16} />
                        </div>
                    </Tooltip>
                </div>

            </div>
        </div>
    );
};