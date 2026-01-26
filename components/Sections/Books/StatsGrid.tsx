"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export const StatsGrid = ({ income, expense, labelPrefix = "Total" }: any) => {
    const stats = [
        { label: `${labelPrefix} Inflow`, value: income, color: 'text-green-500', bg: 'bg-green-500/5', border: 'border-green-500', icon: TrendingUp },
        { label: `${labelPrefix} Outflow`, value: expense, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500', icon: TrendingDown },
        { label: `${labelPrefix} Balance`, value: income - expense, color: 'text-blue-500', bg: 'bg-blue-500/5', border: 'border-blue-500', icon: Wallet },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 anim-fade-up">
            {stats.map((s, i) => (
                <motion.div 
                    key={i} 
                    whileHover={{ y: -5 }}
                    className={`app-card p-8 border-l-4 ${s.border} ${s.bg}`}
                >
                    <div className="flex items-center gap-3 mb-2 text-[var(--text-muted)]">
                        <s.icon size={20} className={s.color} />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">{s.label}</p>
                    </div>
                    <h3 className={`text-3xl font-finance font-bold ${i === 2 ? (s.value >= 0 ? 'text-blue-500' : 'text-red-500') : 'text-[var(--text-main)]'}`}>
                        {s.value >= 0 ? '+' : ''}{s.value.toLocaleString()}
                    </h3>
                </motion.div>
            ))}
        </div>
    );
};