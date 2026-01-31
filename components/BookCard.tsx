"use client";
import React from 'react';
import { Book, ChevronRight, Activity, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const BookCard = ({ book, onClick, stats, onQuickAdd, currencySymbol = "৳" }: any) => {
    
    // 🔥 ফিক্স: যদি কোনো কারণে stats না আসে, তবে ডিফল্ট ভ্যালু ব্যবহার করবে (Safety Check)
    const safeStats = stats || { balance: 0, inflow: 0, outflow: 0, lastUpdated: 0 };

    // ১. হেলথ কালার ডিটেকশন
    const isPositive = safeStats.balance >= 0;
    const healthColor = isPositive ? 'text-green-500' : 'text-red-500';
    const healthBorder = isPositive ? 'group-hover:border-green-500/50' : 'group-hover:border-red-500/50';
    const healthBg = isPositive ? 'group-hover:bg-green-500/5' : 'group-hover:bg-red-500/5';

    // ২. অ্যাক্টিভিটি টাইম ফরম্যাট
    const getLastActivity = () => {
        if (!safeStats.lastUpdated) return "New Vault";
        const diff = Date.now() - safeStats.lastUpdated;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(safeStats.lastUpdated).toLocaleDateString();
    };

    // ৩. মাইক্রো-বার চার্ট ক্যালকুলেশন
    const totalFlow = (safeStats.inflow || 0) + (safeStats.outflow || 0);
    const incomePercent = totalFlow === 0 ? 0 : (safeStats.inflow / totalFlow) * 100;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick} 
            className={`app-card p-6 cursor-pointer relative group flex flex-col justify-between overflow-hidden h-[220px] border-2 border-[var(--border-color)] transition-all duration-300 ${healthBorder} ${healthBg}`}
        >
            {/* Background Dot Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '12px 12px' }} 
            />

            {/* TOP SECTION */}
            <div className="flex justify-between items-start z-10 relative">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Book size={20} strokeWidth={2.5} />
                </div>
                
                {/* Quick Add Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
                    className="w-9 h-9 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                    <Plus size={18} strokeWidth={3} />
                </motion.button>
            </div>

            {/* MIDDLE SECTION */}
            <div className="z-10 mt-3">
                <div className="flex items-center gap-2 mb-1">
                    <Activity size={10} className={healthColor} />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{getLastActivity()}</span>
                </div>
                <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-tight truncate">
                    {book.name}
                </h3>
            </div>

            {/* BOTTOM SECTION */}
            <div className="z-10 mt-auto pt-4 border-t border-[var(--border-color)] group-hover:border-transparent transition-colors">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Net Asset</p>
                        <h4 className={`text-xl font-mono-finance font-bold leading-none ${healthColor}`}>
                            {safeStats.balance < 0 ? '-' : '+'}{currencySymbol}{Math.abs(safeStats.balance).toLocaleString()}
                        </h4>
                    </div>
                    
                    {/* Mini Trend Indicators */}
                    <div className="flex gap-2">
                        <div className="flex items-center gap-0.5 text-[9px] font-bold text-green-500 opacity-60">
                            <TrendingUp size={10} /> {(safeStats.inflow / 1000).toFixed(1)}k
                        </div>
                        <div className="flex items-center gap-0.5 text-[9px] font-bold text-red-500 opacity-60">
                            <TrendingDown size={10} /> {(safeStats.outflow / 1000).toFixed(1)}k
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${incomePercent}%` }} />
                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ flex: 1 }} />
                </div>
            </div>
        </motion.div>
    );
};