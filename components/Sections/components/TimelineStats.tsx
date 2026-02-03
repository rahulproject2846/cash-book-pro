"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, Wallet, ShieldCheck, Activity } from 'lucide-react';

export const TimelineStats = ({ stats, symbol }: any) => {
    const cards = [
        { id: 'inflow', label: 'Vault Inflow', val: stats.inflow, color: 'text-green-500', accent: 'bg-green-500', icon: TrendingUp },
        { id: 'outflow', label: 'Vault Outflow', val: stats.outflow, color: 'text-red-500', accent: 'bg-red-500', icon: TrendingDown },
        { id: 'pending', label: 'Vault Pending', val: stats.pending, color: 'text-orange-500', accent: 'bg-orange-500', icon: Clock },
        { id: 'surplus', label: 'Vault Surplus', val: stats.total, color: stats.total >= 0 ? 'text-blue-500' : 'text-red-500', accent: stats.total >= 0 ? 'bg-blue-500' : 'bg-red-500', icon: Wallet },
    ];

    return (
        <div className="hidden grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {cards.map((s, i) => (
                <motion.div 
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="app-card group relative p-5 md:p-6 overflow-hidden border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg"
                >
                    <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] shadow-inner">
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

                    <div className="relative z-10">
                        <h3 className={`text-xl md:text-3xl font-mono-finance font-black tracking-tighter ${s.id === 'surplus' ? s.color : 'text-[var(--text-main)]'}`}>
                            <span className="text-sm mr-0.5 opacity-50">{s.val > 0 ? '+' : (s.val < 0 ? '-' : '')}</span>
                            {symbol}{Math.abs(s.val).toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2 mt-4 opacity-40">
                            <div className="h-0.5 w-8 rounded-full bg-[var(--border-color)] overflow-hidden">
                                <div className={`h-full w-full ${s.accent}`} />
                            </div>
                            <span className="text-[7px] font-black uppercase tracking-widest">Secured</span>
                            <Activity size={10} className="ml-auto" />
                        </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 w-full h-[2px] ${s.accent} opacity-0 group-hover:opacity-40 transition-opacity`} />
                </motion.div>
            ))}
        </div>
    );
};