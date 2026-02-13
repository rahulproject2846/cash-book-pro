"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Wallet, 
    ShieldCheck, Activity, Clock, Zap
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

interface StatsProps {
    income?: number;
    expense?: number;
    pending?: number;
    surplus?: number; // সরাসরি দিলে ভালো, না দিলে আমরা ক্যালকুলেট করে নেব
    currency?: string;
    isReport?: boolean; // রিপোর্ট পেজের জন্য কি কোনো স্পেশাল স্টাইল লাগবে?
}

export const StatsGrid = ({ 
    income = 0, 
    expense = 0, 
    pending = 0, 
    surplus: externalSurplus,
    currency = "BDT (৳)",
    isReport = false
}: StatsProps) => {
    const { t, language } = useTranslation();
    const symbol = currency.match(/\(([^)]+)\)/)?.[1] || "৳";
    const finalSurplus = externalSurplus !== undefined ? externalSurplus : (income - expense);

    const cards = [
        { id: 'inflow', label: t('label_inflow'), value: income, color: 'text-green-500', accent: 'bg-green-500', glow: 'rgba(34, 197, 94, 0.15)', icon: TrendingUp, desc: t('desc_inflow') },
        { id: 'outflow', label: t('label_outflow'), value: expense, color: 'text-red-500', accent: 'bg-red-500', glow: 'rgba(239, 68, 68, 0.15)', icon: TrendingDown, desc: t('desc_outflow') },
        { id: 'pending', label: t('label_pending'), value: pending, color: 'text-orange-500', accent: 'bg-orange-500', glow: 'rgba(249, 115, 22, 0.15)', icon: Clock, desc: t('desc_pending') },
        { id: 'surplus', label: t('label_surplus'), value: finalSurplus, color: finalSurplus >= 0 ? 'text-blue-500' : 'text-red-500', accent: finalSurplus >= 0 ? 'bg-blue-500' : 'bg-red-500', glow: finalSurplus >= 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', icon: Wallet, desc: t('desc_surplus') },
    ];

    return (
        <div className="w-full space-y-6">
            {/* --- 📱 MOBILE VIEW: ELITE UNIFIED MODULE --- */}
            <div className="md:hidden">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[var(--bg-card)] rounded-[35px] border border-[var(--border)] p-6 overflow-hidden shadow-xl"
                >
                    <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 pointer-events-none">
                        <Zap size={150} strokeWidth={1} className="text-orange-500" />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                <Zap size={12} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                                <span className="text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">{t('label_surplus')}</span>
                            </div>
                            <h3 className={cn("text-3xl font-mono-finance font-black tracking-tighter leading-none", finalSurplus >= 0 ? 'text-blue-500' : 'text-red-500')}>
                                <span className="text-sm mr-1 opacity-50 font-sans">{symbol}</span>
                                {toBn(Math.abs(finalSurplus).toLocaleString(), language)}
                            </h3>
                            <div className="mt-4">
                                <span className="px-2 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[7px] font-black text-green-500 uppercase tracking-widest">
                                    {t('status_secured') || "PROTOCOL SECURED"}
                                </span>
                            </div>
                        </div>

                        <div className="pl-6 border-l border-[var(--border)]/50 space-y-3 shrink-0">
                            {cards.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-0.5 opacity-40">
                                        <item.icon size={10} className={item.color} />
                                        <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">{item.label}</span>
                                    </div>
                                    <p className={cn("text-[12px] font-mono-finance font-bold tracking-tight", item.color)}>
                                        {toBn(item.value.toLocaleString(), language)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* --- 🖥️ DESKTOP VIEW: ELITE AURA GRID --- */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-[var(--app-gap,1.5rem)] transition-all duration-500">
                {cards.map((card, i) => (
                    <Tooltip key={card.id} text={t(`tt_${card.id}`) || card.label}>
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, type: "spring", damping: 25 }}
                            whileHover={{ y: -5, boxShadow: `0 20px 40px -10px ${card.glow}` }}
                            className="group relative bg-[var(--bg-card)] rounded-[32px] p-6 border border-[var(--border)] overflow-hidden transition-all duration-500 w-100 h-full flex flex-col"
                        >
                            <div className={cn("absolute -right-8 -top-8 w-24 h-24 blur-[50px] opacity-10 group-hover:opacity-30 transition-opacity duration-700", card.accent)} />
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] group-hover:border-orange-500/30 transition-all">
                                        <card.icon size={16} className={card.color} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-[2px] text-[var(--text-muted)] italic leading-none flex items-center gap-1.5">
                                            <Zap size={10} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                                            {card.label}
                                        </span>
                                        <span className="text-[7px] font-bold uppercase tracking-[1px] text-[var(--text-muted)] opacity-30 mt-1">{card.desc}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto relative z-10">
                                <h3 className={cn("text-3xl font-mono-finance font-black tracking-tighter", card.id === 'surplus' ? card.color : 'text-[var(--text-main)]')}>
                                    <span className="text-sm mr-1 opacity-50 font-bold">{symbol}</span>
                                    {toBn(Math.abs(card.value).toLocaleString(), language)}
                                </h3>
                                <div className="flex items-center justify-between mt-5">
                                    <div className="h-1 flex-1 max-w-[60px] rounded-full bg-[var(--bg-app)] overflow-hidden border border-[var(--border)]">
                                        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} className={cn("h-full opacity-60", card.accent)} />
                                    </div>
                                    <Activity size={12} className="text-[var(--text-muted)] opacity-20 group-hover:text-orange-500 transition-all animate-pulse" />
                                </div>
                            </div>
                        </motion.div>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};