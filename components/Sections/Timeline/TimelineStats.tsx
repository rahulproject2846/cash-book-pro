"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Wallet, ShieldCheck, Activity } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: TIMELINE STATS (STABILIZED)
 * ------------------------------------
 * Integrated with Compact Mode, Multi-language, and Guidance.
 */
export const TimelineStats = ({ stats, symbol }: any) => {
    const { T, t } = useTranslation();

    const cards = [
        { 
            id: 'inflow', 
            label: T('label_inflow'), 
            val: stats.inflow, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            icon: TrendingUp,
            tt: t('tt_inflow') 
        },
        { 
            id: 'outflow', 
            label: T('label_outflow'), 
            val: stats.outflow, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            icon: TrendingDown,
            tt: t('tt_outflow') 
        },
        { 
            id: 'pending', 
            label: T('label_pending'), 
            val: stats.pending, 
            color: 'text-orange-500', 
            accent: 'bg-orange-500', 
            icon: Clock,
            tt: t('tt_pending') 
        },
        { 
            id: 'surplus', 
            label: T('label_surplus'), 
            val: stats.total, 
            color: stats.total >= 0 ? 'text-blue-500' : 'text-red-500', 
            accent: stats.total >= 0 ? 'bg-blue-500' : 'bg-red-500', 
            icon: Wallet,
            tt: t('tt_surplus') 
        },
    ];

    return (
        // 🔥 প্রোটোকল নোট: 'hidden' ক্লাসটি আপনার আগের রিকোয়েস্ট অনুযায়ী রাখা হয়েছে।
        <div className=" grid grid-cols-2 md:grid-cols-4 gap-[var(--app-gap,1rem)] md:gap-[var(--app-gap,1.5rem)] transition-all duration-300">
            {cards.map((s, i) => (
                <Tooltip key={s.id} text={s.tt}>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="app-card group relative p-[var(--card-padding,1.25rem)] md:p-[var(--card-padding,1.5rem)] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg hover:shadow-2xl transition-all h-full"
                    >
                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 md:p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] shadow-inner group-hover:border-orange-500/20 transition-all">
                                    <s.icon size={16} className={s.color} strokeWidth={2.5} />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-muted)] italic leading-none">
                                    {s.label}
                                </p>
                            </div>
                            {s.id === 'surplus' && (
                                <div className="p-1 bg-orange-500/5 rounded-full border border-orange-500/10">
                                    <ShieldCheck size={12} className="text-orange-500/40" />
                                </div>
                            )}
                        </div>

                        {/* Value Section */}
                        <div className="relative z-10">
                            <h3 className={`text-xl md:text-3xl font-mono-finance font-black tracking-tighter ${s.id === 'surplus' ? s.color : 'text-[var(--text-main)]'}`}>
                                <span className="text-sm mr-0.5 opacity-50">
                                    {s.val > 0 ? '+' : (s.val < 0 ? '-' : '')}
                                </span>
                                {symbol}{Math.abs(s.val).toLocaleString()}
                            </h3>
                            
                            {/* Footer Metrics */}
                            <div className="flex items-center gap-2 mt-4 opacity-40 group-hover:opacity-100 transition-all">
                                <div className="h-0.5 w-8 rounded-full bg-[var(--border-color)] overflow-hidden">
                                    <motion.div 
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "0%" }}
                                        className={`h-full w-full ${s.accent}`} 
                                    />
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    {T('label_secured') || "Secured"}
                                </span>
                                <Activity size={10} className="ml-auto text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>

                        {/* Hover Interaction Glow */}
                        <div className={`absolute bottom-0 left-0 w-full h-[2px] ${s.accent} opacity-0 group-hover:opacity-40 transition-opacity blur-[1px]`} />
                    </motion.div>
                </Tooltip>
            ))}
        </div>
    );
};