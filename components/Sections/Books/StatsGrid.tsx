"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Wallet, 
    ShieldCheck, Activity, Clock, Zap
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: ELITE STATS GRID (V5.2 POLISH)
 * ----------------------------------------
 * Handles Financial Summaries with Dynamic Aura and Bengali Numeral Sync.
 */

interface StatsProps {
    income?: number;
    expense?: number;
    pending?: number;
    labelPrefix?: string;
    currency?: string;
}

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const StatsGrid = ({ 
    income = 0, 
    expense = 0, 
    pending = 0, 
    labelPrefix = "Vault", 
    currency = "BDT (৳)" 
}: StatsProps) => {
    
    const { T, t, language } = useTranslation();
    const symbol = currency.match(/\(([^)]+)\)/)?.[1] || "৳";
    const surplus = income - expense;

    const cards = [
        { 
            id: 'inflow',
            label: T('label_inflow'), 
            value: income, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            glow: 'rgba(34, 197, 94, 0.15)',
            icon: TrendingUp,
            desc: T('desc_inflow')
        },
        { 
            id: 'outflow',
            label: T('label_outflow'), 
            value: expense, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            glow: 'rgba(239, 68, 68, 0.15)',
            icon: TrendingDown,
            desc: T('desc_outflow')
        },
        { 
            id: 'pending',
            label: T('label_pending'), 
            value: pending, 
            color: 'text-orange-500', 
            accent: 'bg-orange-500', 
            glow: 'rgba(249, 115, 22, 0.15)',
            icon: Clock,
            desc: T('desc_pending')
        },
        { 
            id: 'surplus',
            label: T('label_surplus'), 
            value: surplus, 
            color: surplus >= 0 ? 'text-blue-500' : 'text-red-500', 
            accent: surplus >= 0 ? 'bg-blue-500' : 'bg-red-500', 
            glow: surplus >= 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            icon: Wallet,
            desc: T('desc_surplus')
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--app-gap,0.75rem)] md:gap-[var(--app-gap,1.5rem)] transition-all duration-500">
            {cards.map((card, i) => {
                const Icon = card.icon;
                const isSurplus = card.id === 'surplus';

                return (
                    <Tooltip key={card.id} text={t(`tt_${card.id}`) || card.label}>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, type: "spring", damping: 25 }}
                            whileHover={{ y: -5, boxShadow: `0 20px 40px -10px ${card.glow}` }}
                            className="group relative bg-[var(--bg-card)] rounded-[32px] p-5 md:p-6 border border-[var(--border)] overflow-hidden transition-all duration-500 h-full flex flex-col"
                        >
                            {/* --- 1. GLASS AURA (Background Detail) --- */}
                            <div className={`absolute -right-8 -top-8 w-24 h-24 blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 ${card.accent}`} />

                            {/* --- 2. HEADER: METADATA STYLE --- */}
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] group-hover:border-orange-500/30 transition-all shadow-inner`}>
                                        <Icon size={16} className={card.color} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[2px] text-[var(--text-muted)] italic leading-none flex items-center gap-1.5">
                                            <Zap size={10} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                                            {card.label}
                                        </span>
                                        <span className="text-[7px] font-bold uppercase tracking-[1px] text-[var(--text-muted)] opacity-30 mt-1 hidden md:block">
                                            {card.desc}
                                        </span>
                                    </div>
                                </div>
                                {isSurplus && (
                                    <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                        <ShieldCheck size={12} className="text-blue-500" />
                                    </div>
                                )}
                            </div>

                            {/* --- 3. VALUE: BENGALI SYNCED (Fast Reading) --- */}
                            <div className="w-100 relative z-10 mt-auto">
                                <h3 className={`text-xl md:text-3xl font-mono-finance font-black tracking-tighter ${isSurplus ? card.color : 'text-[var(--text-main)]'}`}>
                                    <span className="text-xs md:text-sm mr-1 opacity-50 font-bold">
                                        {symbol}
                                    </span>
                                    {toBn(Math.abs(card.value).toLocaleString(), language)}
                                </h3>
                                
                                {/* --- 4. OS STATUS BAR (Micro-Detail) --- */}
                                <div className="flex items-center justify-between mt-5">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="h-1 flex-1 max-w-[60px] rounded-full bg-[var(--bg-app)] overflow-hidden border border-[var(--border)]">
                                            <motion.div 
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                                                className={`h-full ${card.accent} opacity-60`} 
                                            />
                                        </div>
                                        <span className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">
                                            {T('label_secured') || "SECURED"}
                                        </span>
                                    </div>
                                    <Activity size={12} className="text-[var(--text-muted)] opacity-20 group-hover:text-orange-500 transition-all animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    </Tooltip>
                );
            })}
        </div>
    );
};