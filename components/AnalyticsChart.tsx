"use client";
import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    Tooltip as ChartTooltip 
} from 'recharts';
import { PieChart as PieIcon, Zap, ShieldCheck, GitCommit } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

export const AnalyticsChart = ({ entries = [] }: { entries: any[] }) => {
    const { T, t, language } = useTranslation();
    
    // --- 🧬 ১. MEMOIZED LOGIC (Standardized) ---
    const { categoryData, totalValue } = useMemo(() => {
        const data = entries
            .filter(e => 
                String(e.type).toLowerCase() === 'expense' && 
                String(e.status).toLowerCase() === 'completed'
            )
            .reduce((acc: any, curr) => {
                const catName = (curr.category || 'GENERAL').toUpperCase();
                const amount = Number(curr.amount) || 0;
                const found = acc.find((item: any) => item.name === catName);
                if (found) found.value += amount;
                else acc.push({ name: catName, value: amount });
                return acc;
            }, []);

        const total = data.reduce((sum: number, item: any) => sum + item.value, 0);
        return { categoryData: data, totalValue: total };
    }, [entries]);

    const COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#06B6D4', '#FACC15'];

    // --- 🎨 ২. CUSTOM ELITE GLASS TOOLTIP ---
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 border border-white/10 p-4 rounded-[20px] shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                        <p className="text-[8px] font-black uppercase tracking-[3px] text-white/40">{payload[0].name}</p>
                    </div>
                    <p className="text-[14px] font-mono-finance font-black text-white tracking-tighter">
                         {toBn(payload[0].value.toLocaleString(), language)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (categoryData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-20 gap-6 grayscale">
                <div className="w-24 h-24 rounded-[40px] bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center shadow-inner">
                    <PieIcon size={40} strokeWidth={1} />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[5px]">{T('awaiting_intel') || "NO ANALYTICS DATA"}</p>
                    <p className="text-[8px] font-bold uppercase tracking-[2px] mt-2">Registry is currently empty</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full transition-all duration-500">
            <div className="h-[300px] md:h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%" cy="50%"
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1200}
                        >
                            {categoryData.map((entry: any, index: number) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    className="hover:opacity-80 transition-all cursor-pointer outline-none"
                                />
                            ))}
                        </Pie>
                        <ChartTooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                {/* --- 🎯 ৩. CENTER LABEL (The Apple Identity Node) --- */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[4px] opacity-30">
                        {T('total_expense') || "TOTAL"}
                    </span>
                    <h3 className="text-2xl font-mono-finance font-black text-[var(--text-main)] tracking-tighter mt-1">
                        {toBn(totalValue.toLocaleString(), language)}
                    </h3>
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border)] shadow-inner">
                        <ShieldCheck size={10} className="text-orange-500" />
                        <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Protocol Sync</span>
                    </div>
                </div>
            </div>

            {/* --- 📊 ৪. ELITE LEGEND GRID --- */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryData.map((item: any, i: number) => (
                    <Tooltip key={i} text={`${item.name}: ${toBn(item.value.toLocaleString(), language)}`}>
                        <div className={cn(
                            "flex items-center gap-3 p-4 bg-[var(--bg-app)] rounded-[22px] border border-[var(--border)]",
                            "group hover:border-orange-500/30 transition-all active:scale-[0.98] cursor-help"
                        )}>
                            <div 
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-lg group-hover:scale-125 transition-transform" 
                                style={{backgroundColor: COLORS[i % COLORS.length]}} 
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] font-black uppercase text-[var(--text-main)] truncate tracking-wider leading-none mb-1">
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono-finance font-bold text-orange-500">
                                        {toBn(Math.round((item.value / (totalValue || 1)) * 100), language)}%
                                    </span>
                                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase opacity-30">WEIGHT</span>
                                </div>
                            </div>
                        </div>
                    </Tooltip>
                ))}
            </div>

            {/* OS Identity Footer */}
            <div className="mt-12 pt-6 border-t border-[var(--border)]/50 opacity-20 group-hover:opacity-50 flex justify-between items-center transition-opacity duration-1000">
                 <div className="flex items-center gap-2">
                    <GitCommit size={12} strokeWidth={3} className="text-orange-500" />
                    <span className="text-[8px] font-black uppercase tracking-[4px]">Visual Intelligence V11.5</span>
                 </div>
                 <Zap size={12} className="text-orange-500" fill="currentColor" strokeWidth={0} />
            </div>
        </div>
    );
};