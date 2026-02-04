"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Wallet, 
    ShieldCheck, Activity, Clock 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: ELITE STATS GRID (100% STABLE)
 * ----------------------------------------
 * Handles Financial Summaries with Dynamic Scaling and Localization.
 */

interface StatsProps {
    income?: number;
    expense?: number;
    pending?: number;
    labelPrefix?: string;
    currency?: string;
}

export const StatsGrid = ({ 
    income = 0, 
    expense = 0, 
    pending = 0, 
    labelPrefix = "Vault", 
    currency = "BDT (৳)" 
}: StatsProps) => {
    
    const { T, t } = useTranslation();
    const symbol = currency.match(/\(([^)]+)\)/)?.[1] || "৳";
    const surplus = income - expense;

    // ডাইনামিক্যালি ল্যাঙ্গুয়েজ ম্যাপ করা হয়েছে
    const cards = [
        { 
            id: 'inflow',
            label: T('label_inflow') || 'Inflow', 
            value: income, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            icon: TrendingUp,
            desc: T('desc_inflow') || "Assets Gained",
            tt: t('tt_inflow') || "Total incoming assets"
        },
        { 
            id: 'outflow',
            label: T('label_outflow') || 'Outflow', 
            value: expense, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            icon: TrendingDown,
            desc: T('desc_outflow') || "Capital Spent",
            tt: t('tt_outflow') || "Total outgoing capital"
        },
        { 
            id: 'pending',
            label: T('label_pending') || 'Pending', 
            value: pending, 
            color: 'text-orange-500', 
            accent: 'bg-orange-500', 
            icon: Clock,
            desc: T('desc_pending') || "Protocol Queue",
            tt: t('tt_pending') || "Transactions awaiting finalization"
        },
        { 
            id: 'surplus',
            label: T('label_surplus') || 'Surplus', 
            value: surplus, 
            color: surplus >= 0 ? 'text-blue-500' : 'text-red-500', 
            accent: surplus >= 0 ? 'bg-blue-500' : 'bg-red-500', 
            icon: Wallet,
            desc: T('desc_surplus') || "Net Position",
            tt: t('tt_surplus') || "Remaining net balance"
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--app-gap,0.75rem)] md:gap-[var(--app-gap,1.5rem)] transition-all duration-300">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <Tooltip key={card.id} text={card.tt}>
                        <motion.div 
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4 }}
                            className="app-card group relative p-[var(--card-padding,1rem)] md:p-[var(--card-padding,1.5rem)] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg hover:shadow-2xl transition-all duration-300 h-full"
                        >
                            {/* Background Deco */}
                            <div className="absolute -right-4 -bottom-4 opacity-[0.01] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none">
                                <Icon size={120} strokeWidth={1} />
                            </div>

                            {/* Top Section */}
                            <div className="flex items-start justify-between mb-[var(--app-gap,1rem)]">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className={`p-1.5 md:p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] group-hover:border-orange-500/20 transition-all shadow-inner`}>
                                        <Icon size={16} className={card.color} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[2px] text-[var(--text-muted)] italic leading-none">
                                            {labelPrefix} {card.label}
                                        </p>
                                        <p className="hidden md:block text-[7px] font-bold uppercase tracking-[1px] text-[var(--text-muted)] opacity-30 mt-1">
                                            {card.desc}
                                        </p>
                                    </div>
                                </div>
                                
                                {card.id === 'surplus' && (
                                    <div className="p-1 md:p-1.5 bg-orange-500/5 rounded-full border border-orange-500/10">
                                        <ShieldCheck size={12} className="text-orange-500/40" />
                                    </div>
                                )}
                            </div>

                            {/* Value Section */}
                            <div className="relative z-10">
                                <h3 className={`text-lg md:text-3xl font-mono-finance font-black tracking-tighter ${card.id === 'surplus' ? card.color : 'text-[var(--text-main)]'}`}>
                                    <span className="text-xs md:text-sm mr-0.5 opacity-50">
                                        {card.value > 0 ? '+' : (card.value < 0 ? '-' : '')}
                                    </span>
                                    {symbol}{Math.abs(card.value).toLocaleString()}
                                </h3>
                                
                                {/* Status Indicator */}
                                <div className="flex items-center justify-between mt-3 md:mt-5">
                                    <div className="flex items-center gap-1.5 md:gap-2">
                                        <div className="h-0.5 md:h-1 w-6 md:w-10 rounded-full bg-[var(--border-color)] overflow-hidden">
                                            <motion.div 
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "0%" }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={`h-full w-full ${card.accent} opacity-60`} 
                                            />
                                        </div>
                                        <span className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">
                                            {T('label_secured') || "SECURED"}
                                        </span>
                                    </div>
                                    <Activity size={10} className="text-[var(--text-muted)] opacity-20 group-hover:text-orange-500 group-hover:opacity-40 transition-all" />
                                </div>
                            </div>
                        </motion.div>
                    </Tooltip>
                );
            })}
        </div>
    );
};