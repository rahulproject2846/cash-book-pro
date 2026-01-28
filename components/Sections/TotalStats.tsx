"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';

export const TotalStats = ({ totalIncome, totalExpense, pendingAmount, currencySymbol = "৳" }: any) => {
    // ১. ব্যালেন্স ক্যালকুলেশন লজিক
    const netBalance = totalIncome - totalExpense;

    const stats = [
        { 
            label: 'Net Surplus', 
            value: netBalance, 
            icon: Wallet, 
            color: netBalance >= 0 ? 'text-blue-500' : 'text-red-500',
            bg: netBalance >= 0 ? 'bg-blue-500/5' : 'bg-red-500/5',
            border: netBalance >= 0 ? 'border-blue-500' : 'border-red-500'
        },
        { 
            label: 'Total Inflow', 
            value: totalIncome, 
            icon: TrendingUp, 
            color: 'text-green-500',
            bg: 'bg-green-500/5',
            border: 'border-green-500'
        },
        { 
            label: 'Total Outflow', 
            value: totalExpense, 
            icon: TrendingDown, 
            color: 'text-red-500',
            bg: 'bg-red-500/5',
            border: 'border-red-500'
        },
        { 
            label: 'Pending Protocol', 
            value: pendingAmount, 
            icon: Clock, 
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/5',
            border: 'border-yellow-500'
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
            {stats.map((item, i) => (
                <div 
                    key={i} 
                    className={`app-card p-5 border-l-4 ${item.border} ${item.bg} relative overflow-hidden group shadow-sm transition-all hover:shadow-md`}
                >
                    {/* Background Ghost Icon - Studio Style */}
                    <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <item.icon size={80} strokeWidth={1} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-lg ${item.bg} border border-[var(--border-color)]`}>
                                <item.icon size={16} className={item.color} strokeWidth={2.5} />
                            </div>
                            {i === 0 && <ShieldCheck size={14} className="text-[var(--text-muted)] opacity-20" />}
                        </div>
                        
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] italic">
                            {item.label}
                        </p>
                        
                        <h3 className={`text-xl md:text-2xl font-mono-finance font-bold mt-1 tracking-tighter ${i === 0 ? item.color : 'text-[var(--text-main)]'}`}>
                            {item.value < 0 ? '-' : (item.value > 0 && i !== 3 ? '+' : '')}{currencySymbol}{Math.abs(item.value).toLocaleString()}
                        </h3>

                        {/* স্মার্ট ইন্ডিকেটর লাইন */}
                        <div className="w-8 h-0.5 bg-[var(--border-color)] mt-3 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color.replace('text', 'bg')}`} style={{ width: '40%' }}></div>
                        </div>
                    </div>
                </div>
            ))}
        </motion.div>
    );
};