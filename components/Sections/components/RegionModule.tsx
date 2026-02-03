"use client";
import React from 'react';
import { Globe, Languages, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const RegionModule = ({ currency, updateCurrency }: any) => {
    const { language, setLanguage } = useTranslation();

    return (
        <div className="app-card p-8 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute -right-6 -top-6 opacity-[0.02] rotate-12 pointer-events-none">
                <Globe size={200} />
            </div>

            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8 relative z-10">
                <Globe size={18} className="text-blue-500" /> Regional Protocol
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                
                {/* 1. Language Selector */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Languages size={12} /> System Language
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${language === 'en' ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-app)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}
                        >
                            <span className="text-[12px] font-black uppercase tracking-widest">English</span>
                            {language === 'en' && <span className="text-[7px] font-bold opacity-60">ACTIVE</span>}
                        </button>
                        <button 
                            onClick={() => setLanguage('bn')}
                            className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${language === 'bn' ? 'bg-[var(--text-main)] border-[var(--text-main)] text-[var(--bg-app)]' : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--text-main)]'}`}
                        >
                            <span className="text-[12px] font-bold uppercase tracking-widest">বাংলা</span>
                            {language === 'bn' && <span className="text-[7px] font-bold opacity-60">সক্রিয়</span>}
                        </button>
                    </div>
                </div>

                {/* 2. Currency Selector */}
                <div className="space-y-4">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Check size={12} /> Base Currency
                    </label>
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
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none group-hover:opacity-100 transition-opacity" size={16} />
                    </div>
                </div>

            </div>
        </div>
    );
};