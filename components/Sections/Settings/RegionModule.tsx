"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Languages, ChevronDown, Coins, Zap, BadgeCheck, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

export const RegionModule = ({ currency, updateCurrency }: any) => {
    const { language, setLanguage, t } = useTranslation();

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            {/* Background Decor */}
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <Globe size={320} className="text-blue-500" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                
                {/* --- ১. LANGUAGE SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-[20px] text-blue-500 border border-blue-500/20 shadow-inner">
                            <Languages size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                {t('system_language') || "IDENTITY LANGUAGE"}
                            </h4>
                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-[2px] mt-2 opacity-60">Localization Protocol</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-[var(--bg-app)] p-1.5 rounded-[22px] border border-[var(--border)] shadow-inner w-full">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "flex-1 h-14 rounded-[18px] flex flex-col items-center justify-center transition-all duration-500 active:scale-95",
                                language === 'en' ? "bg-orange-500 text-white shadow-xl" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            )}
                        >
                            <span className="text-[12px] font-black uppercase tracking-widest">English</span>
                        </button>
                        <button 
                            onClick={() => setLanguage('bn')}
                            className={cn(
                                "flex-1 h-14 rounded-[18px] flex flex-col items-center justify-center transition-all duration-500 active:scale-95",
                                language === 'bn' ? "bg-orange-500 text-white shadow-xl" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            )}
                        >
                            <span className="text-[14px] font-bold">বাংলা</span>
                        </button>
                    </div>
                </div>

                {/* --- ২. CURRENCY SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20 shadow-inner">
                            <Coins size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                {t('base_currency') || "FINANCIAL SYMBOL"}
                            </h4>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-2 opacity-60">Currency Registry</p>
                        </div>
                    </div>

                    <div className="relative group/select">
                        <select 
                            value={currency}
                            onChange={(e) => updateCurrency(e.target.value)}
                            className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px] px-6 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer focus:border-blue-500/40 transition-all outline-none text-[var(--text-main)] shadow-inner"
                        >
                            <option value="BDT (৳)">BDT (৳) - Bangladesh Taka</option>
                            <option value="USD ($)">USD ($) - US Dollar</option>
                            <option value="EUR (€)">EUR (€) - Euro</option>
                            <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)] opacity-30 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};