"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Wallet, 
    ShieldCheck, Activity, Clock, Zap
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: ELITE ANALYTICS STATS (V5.2 POLISH)
 * -------------------------------------------
 * Renders a 4-card summary with Dynamic Aura and Bengali Numeral Sync.
 */

interface StatsProps {
    stats: {
        totalIn: number;
        totalOut: number;
        totalPending: number;
        net: number;
    };
    symbol: string;
}

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const AnalyticsStats = ({ stats, symbol }: StatsProps) => {
    const { T, t, language } = useTranslation();
    
    const cards = [
        { 
            id: 'inflow',
            label: T('label_inflow') || 'Vault Inflow', 
            value: stats.totalIn, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            glow: 'rgba(34, 197, 94, 0.15)',
            icon: TrendingUp,
            desc: T('desc_inflow')
        },
        { 
            id: 'outflow',
            label: T('label_outflow') || 'Vault Outflow', 
            value: stats.totalOut, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            glow: 'rgba(239, 68, 68, 0.15)',
            icon: TrendingDown, 
            desc: T('desc_outflow')
        },
        { 
            id: 'pending',
            label: T('label_pending') || 'Vault Pending', 
            value: stats.totalPending, 
            color: 'text-orange-500', 
            accent: 'bg-orange-500', 
            glow: 'rgba(249, 115, 22, 0.15)',
            icon: Clock,
            desc: T('desc_pending')
        },
        { 
            id: 'surplus',
            label: T('label_surplus') || 'Vault Surplus', 
            value: stats.net, 
            color: stats.net >= 0 ? 'text-blue-500' : 'text-red-500', 
            accent: stats.net >= 0 ? 'bg-blue-500' : 'bg-red-500', 
            glow: stats.net >= 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
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
                    <Tooltip key={card.id} text={t(`tt_${card.id}_desc`) || card.label}>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, type: "spring", damping: 25 }}
                            whileHover={{ y: -5, boxShadow: `0 20px 40px -10px ${card.glow}` }}
                            className="group relative bg-[var(--bg-card)] w-full rounded-[32px] border border-[var(--border)] p-5 md:p-6 overflow-hidden transition-all duration-500 h-full flex flex-col"
                        >
                            {/* --- 1. GLASS AURA (Background Detail) --- */}
                            <div className={`absolute -right-8 -top-8 w-24 h-24 blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-700 ${card.accent}`} />

                            {/* --- 2. HEADER: METADATA STYLE --- */}
                            <div className="flex items-start justify-between mb-8 relative z-10">
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

                            {/* --- 3. VALUE: BENGALI SYNCED (Tabular Layout) --- */}
                            <div className="relative z-10 mt-auto">
                                <h3 className={`text-xl md:text-3xl font-mono-finance font-black tracking-tighter ${isSurplus ? card.color : 'text-[var(--text-main)]'}`}>
                                    <span className="text-xs md:text-sm mr-1 opacity-40 font-sans">
                                        {card.value > 0 ? '+' : (card.value < 0 ? '-' : '')}
                                    </span>
                                    <span className="text-xs md:text-sm mr-0.5 opacity-50">{symbol}</span>
                                    {toBn(Math.abs(card.value).toLocaleString(), language)}
                                </h3>
                                
                                {/* --- 4. OS HEALTH INDICATOR --- */}
                                <div className="flex items-center justify-between mt-5">
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="h-1 flex-1 max-w-[50px] md:max-w-[70px] rounded-full bg-[var(--bg-app)] overflow-hidden border border-[var(--border)]">
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
                                    <Activity size={10} className="text-[var(--text-muted)] opacity-20 group-hover:text-orange-500 transition-all animate-pulse" />
                                </div>
                            </div>

                            {/* Hover Interaction Bottom Glow */}
                            <div className={`absolute bottom-0 left-0 w-full h-[2px] ${card.accent} opacity-0 group-hover:opacity-40 blur-[1px] transition-opacity`} />
                        </motion.div>
                    </Tooltip>
                );
            })}
        </div>
    );
};