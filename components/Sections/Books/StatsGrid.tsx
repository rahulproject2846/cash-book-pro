"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ShieldCheck } from 'lucide-react';

export const StatsGrid = ({ income, expense, labelPrefix = "Total", currency = "৳" }: any) => {
    // ১. কারেন্সি সিম্বল লজিক (ইন্ডাস্ট্রি স্ট্যান্ডার্ড প্রসেসিং)
    const symbol = currency.match(/\(([^)]+)\)/)?.[1] || currency;
    const balance = income - expense;

    const stats = [
        { 
            label: `${labelPrefix} Inflow`, 
            value: income, 
            color: 'text-green-500', 
            bg: 'bg-green-500/5', 
            border: 'border-green-500', 
            icon: TrendingUp,
            isPositive: true
        },
        { 
            label: `${labelPrefix} Outflow`, 
            value: expense, 
            color: 'text-red-500', 
            bg: 'bg-red-500/5', 
            border: 'border-red-500', 
            icon: TrendingDown,
            isPositive: false
        },
        { 
            label: `${labelPrefix} Surplus`, 
            value: balance, 
            color: balance >= 0 ? 'text-blue-500' : 'text-red-500', 
            bg: balance >= 0 ? 'bg-blue-500/5' : 'bg-red-500/5', 
            border: balance >= 0 ? 'border-blue-500' : 'border-red-500', 
            icon: Wallet,
            isPositive: balance >= 0
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 anim-fade-up">
            {stats.map((s, i) => (
                <motion.div 
                    key={i} 
                    layout
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className={`app-card p-8 border-l-4 ${s.border} ${s.bg} relative overflow-hidden group shadow-sm`}
                >
                    {/* Background Visual Decor */}
                    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                        <s.icon size={100} strokeWidth={1} />
                    </div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${s.bg} border border-[var(--border-color)] text-[var(--text-muted)] group-hover:border-orange-500/30 transition-all`}>
                                <s.icon size={18} className={s.color} strokeWidth={2.5} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[2.5px] text-[var(--text-muted)] italic">
                                {s.label}
                            </p>
                        </div>
                        {i === 2 && (
                            <div className="opacity-20">
                                <ShieldCheck size={16} />
                            </div>
                        )}
                    </div>

                    <div className="relative z-10">
                        <h3 className={`text-3xl md:text-4xl font-mono-finance font-bold tracking-tighter ${i === 2 ? s.color : 'text-[var(--text-main)]'}`}>
                            {s.value < 0 ? '-' : (s.value > 0 ? '+' : '')}{symbol}{Math.abs(s.value).toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                             <div className={`h-1 w-12 rounded-full ${s.isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                <div className={`h-full rounded-full ${s.isPositive ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '60%' }}></div>
                             </div>
                             <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">System Synchronized</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};