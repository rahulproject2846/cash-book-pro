"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, Activity } from 'lucide-react';

/**
 * VAULT PRO: PURE STATS GRID UI
 * ----------------------------
 * এটি অ্যাপের গ্লোবাল এবং বুক-স্পেসিফিক ব্যালেন্স কার্ড রেন্ডার করে।
 * স্টুডিও গ্রে থিম এবং গ্লাস-মরফিজম ইফেক্ট যুক্ত করা হয়েছে।
 */

export const StatsGrid = ({ 
    income = 0, 
    expense = 0, 
    labelPrefix = "Total", 
    currency = "BDT (৳)" 
}: any) => {
    
    // কারেন্সি সিম্বল প্রসেসিং (e.g. "BDT (৳)" -> "৳")
    const symbol = currency.match(/\(([^)]+)\)/)?.[1] || currency;
    const balance = income - expense;

    const cards = [
        { 
            label: `${labelPrefix} Inflow`, 
            value: income, 
            color: 'text-green-500', 
            accent: 'bg-green-500', 
            icon: TrendingUp,
            desc: "Total assets gained"
        },
        { 
            label: `${labelPrefix} Outflow`, 
            value: expense, 
            color: 'text-red-500', 
            accent: 'bg-red-500', 
            icon: TrendingDown,
            desc: "Total capital spent"
        },
        { 
            label: `${labelPrefix} Surplus`, 
            value: balance, 
            color: balance >= 0 ? 'text-blue-500' : 'text-orange-500', 
            accent: balance >= 0 ? 'bg-blue-500' : 'bg-orange-500', 
            icon: Wallet,
            desc: "Net vault position"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map((card, i) => (
                <motion.div 
                    key={card.label} 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="app-card p-7 relative overflow-hidden group border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl"
                >
                    {/* Background Design Element */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                        <card.icon size={120} strokeWidth={1} />
                    </div>

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] group-hover:border-orange-500/20 transition-all shadow-inner`}>
                                <card.icon size={18} className={card.color} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] italic">
                                    {card.label}
                                </p>
                                <p className="text-[7px] font-bold uppercase tracking-[2px] text-[var(--text-muted)] opacity-40">
                                    {card.desc}
                                </p>
                            </div>
                        </div>
                        {i === 2 && (
                            <div className="p-1.5 bg-orange-500/5 rounded-full border border-orange-500/10">
                                <ShieldCheck size={14} className="text-orange-500/40" />
                            </div>
                        )}
                    </div>

                    <div className="relative z-10">
                        <h3 className={`text-3xl md:text-4xl font-mono-finance font-bold tracking-tight ${i === 2 ? card.color : 'text-[var(--text-main)]'}`}>
                            {card.value < 0 ? '-' : (card.value > 0 ? '+' : '')}{symbol}{Math.abs(card.value).toLocaleString()}
                        </h3>
                        
                        <div className="flex items-center justify-between mt-5">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-10 rounded-full bg-[var(--border-color)] overflow-hidden">
                                    <motion.div 
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "0%" }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className={`h-full w-full ${card.accent}`} 
                                    />
                                </div>
                                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Verified</span>
                            </div>
                            <Activity size={12} className="text-[var(--text-muted)] opacity-20" />
                        </div>
                    </div>

                    {/* Interactive Bottom Glow */}
                    <div className={`absolute bottom-0 left-0 w-full h-[2px] ${card.accent} opacity-0 group-hover:opacity-30 blur-sm transition-opacity`} />
                </motion.div>
            ))}
        </div>
    );
};