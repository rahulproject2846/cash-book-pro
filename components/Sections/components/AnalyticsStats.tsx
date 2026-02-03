"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Wallet, 
    ShieldCheck, Activity, Clock 
} from 'lucide-react';

/**
 * VAULT PRO: ELITE ANALYTICS STATS (4-CARD PROTOCOL)
 * -----------------------------------------------
 * এটি ড্যাশবোর্ড এবং টাইমলাইনের সাথে সামঞ্জস্যপূর্ণ ৪টি কার্ড রেন্ডার করে।
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

export const AnalyticsStats = ({ stats, symbol }: StatsProps) => {
    
    const cards = [
        { 
            id: 'inflow',
            label: 'Vault Inflow', 
            value: stats.totalIn, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            icon: TrendingUp 
        },
        { 
            id: 'outflow',
            label: 'Vault Outflow', 
            value: stats.totalOut, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            icon: TrendingDown 
        },
        { 
            id: 'pending',
            label: 'Vault Pending', 
            value: stats.totalPending, 
            color: 'text-orange-500', 
            accent: 'bg-orange-500', 
            icon: Clock 
        },
        { 
            id: 'surplus',
            label: 'Vault Surplus', 
            value: stats.net, 
            color: stats.net >= 0 ? 'text-blue-500' : 'text-red-500', 
            accent: stats.net >= 0 ? 'bg-blue-500' : 'bg-red-500', 
            icon: Wallet 
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-1">
            {cards.map((s, i) => {
                const Icon = s.icon;
                return (
                    <motion.div 
                        key={s.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="app-card group relative p-5 md:p-6 overflow-hidden border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg hover:shadow-orange-500/5 transition-all duration-300"
                    >
                        {/* Background Deco Pattern */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity duration-500">
                            <Icon size={120} strokeWidth={1} />
                        </div>

                        {/* Top: Icon & Label */}
                        <div className="flex items-start justify-between mb-4 md:mb-6 relative z-10">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 md:p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] shadow-inner`}>
                                    <Icon size={16} className={s.color} strokeWidth={2.5} />
                                </div>
                                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[2px] text-[var(--text-muted)] italic leading-none">
                                    {s.label}
                                </p>
                            </div>
                            
                            {/* Security Seal on Surplus Card */}
                            {s.id === 'surplus' && (
                                <div className="p-1 bg-orange-500/5 rounded-full border border-orange-500/10">
                                    <ShieldCheck size={12} className="text-orange-500/40" />
                                </div>
                            )}
                        </div>

                        {/* Middle: Data Value */}
                        <div className="relative z-10">
                            <h3 className={`text-xl md:text-3xl font-mono-finance font-black tracking-tighter ${s.id === 'surplus' ? s.color : 'text-[var(--text-main)]'}`}>
                                <span className="text-xs md:text-sm mr-0.5 opacity-50">
                                    {s.value > 0 ? '+' : (s.value < 0 ? '-' : '')}
                                </span>
                                {symbol}{Math.abs(s.value).toLocaleString()}
                            </h3>
                            
                            {/* Footer Tracking */}
                            <div className="flex items-center justify-between mt-4 md:mt-5 opacity-40">
                                <div className="flex items-center gap-2">
                                    <div className="h-0.5 w-8 rounded-full bg-[var(--border-color)] overflow-hidden">
                                        <div className={`h-full w-full ${s.accent}`} />
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-widest">
                                        Secured
                                    </span>
                                </div>
                                <Activity size={10} className="group-hover:text-orange-500 transition-colors" />
                            </div>
                        </div>

                        {/* Bottom Accent Glow */}
                        <div className={`absolute bottom-0 left-0 w-full h-[2px] ${s.accent} opacity-0 group-hover:opacity-40 blur-[1px] transition-opacity`} />
                    </motion.div>
                );
            })}
        </div>
    );
};