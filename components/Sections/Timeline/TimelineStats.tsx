"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Wallet, Zap, ShieldCheck } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const TimelineStats = ({ stats, symbol }: any) => {
    const { T, t, language } = useTranslation();

    const metrics = [
        { 
            id: 'inflow', 
            label: T('label_inflow'), 
            val: stats.inflow, 
            color: 'text-green-500', 
            bg: 'bg-green-500/10',
            icon: TrendingUp,
            tt: t('tt_inflow') 
        },
        { 
            id: 'outflow', 
            label: T('label_outflow'), 
            val: stats.outflow, 
            color: 'text-red-500', 
            bg: 'bg-red-500/10',
            icon: TrendingDown,
            tt: t('tt_outflow') 
        },
        { 
            id: 'pending', 
            label: T('label_pending'), 
            val: stats.pending, 
            color: 'text-orange-500', 
            bg: 'bg-orange-500/10',
            icon: Clock,
            tt: t('tt_pending') 
        },
        { 
            id: 'surplus', 
            label: T('label_surplus'), 
            val: stats.total, 
            color: stats.total >= 0 ? 'text-blue-500' : 'text-red-500', 
            bg: stats.total >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10',
            icon: Wallet,
            tt: t('tt_surplus'),
            isMain: true
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[var(--bg-card)]/60 backdrop-blur-xl border border-[var(--border)] rounded-[28px] md:rounded-full p-2 shadow-xl overflow-hidden transition-all duration-500"
        >
            <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-between gap-1 md:gap-0">
                {metrics.map((m, i) => (
                    <React.Fragment key={m.id}>
                        <Tooltip text={m.tt}>
                            <motion.div 
                                whileHover={{ backgroundColor: 'var(--bg-app)' }}
                                className={`flex-1 flex items-center gap-3 px-6 py-3 md:py-4 transition-all cursor-default group relative
                                    ${m.isMain ? 'bg-orange-500/5 md:bg-transparent' : ''}`}
                            >
                                {/* Metric Icon */}
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0 border border-white/5 shadow-inner transition-all group-hover:scale-110`}>
                                    <m.icon size={16} className={m.color} strokeWidth={2.5} />
                                </div>

                                {/* Label & Value */}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[2px] text-[var(--text-muted)] opacity-60 leading-none mb-1 flex items-center gap-1">
                                        {m.label}
                                        {m.isMain && <ShieldCheck size={8} className="text-orange-500" />}
                                    </span>
                                    <h3 className={`text-sm md:text-lg font-mono-finance font-bold tracking-tighter leading-none ${m.color} truncate`}>
                                        <span className="text-[10px] opacity-40 mr-0.5">{symbol}</span>
                                        {toBn(Math.abs(m.val).toLocaleString(), language)}
                                    </h3>
                                </div>

                                {/* Glow Indicator */}
                                {m.isMain && (
                                    <div className="absolute right-4 hidden md:block opacity-20">
                                        <Zap size={14} className="text-orange-500" fill="currentColor" />
                                    </div>
                                )}
                            </motion.div>
                        </Tooltip>

                        {/* Divider for Desktop */}
                        {i < metrics.length - 1 && (
                            <div className="hidden md:block h-8 w-px bg-[var(--border)] opacity-30" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    );
};