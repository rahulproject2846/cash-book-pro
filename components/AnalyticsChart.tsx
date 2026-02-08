"use client";
import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    Tooltip as ChartTooltip, Legend 
} from 'recharts';
import { PieChart as PieIcon, Activity, Zap, ShieldCheck } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const AnalyticsChart = ({ entries = [] }: { entries: any[] }) => {
    const { T, t, language } = useTranslation();
    
    // --- 🧬 ১. MEMOIZED LOGIC (Performance Optimized) ---
    const { categoryData, totalValue } = useMemo(() => {
        const data = entries
            .filter(e => 
                (e.type || '').toLowerCase() === 'expense' && 
                (e.status || '').toLowerCase() === 'completed'
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

    // --- 🎨 ২. CUSTOM ELITE TOOLTIP ---
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-card)]/90 border border-[var(--border)] p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <p className="text-[8px] font-black uppercase tracking-[3px] text-[var(--text-muted)] mb-2">{payload[0].name}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                        <p className="text-[13px] font-mono-finance font-bold text-[var(--text-main)] tracking-tighter">
                             {toBn(payload[0].value.toLocaleString(), language)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (categoryData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 opacity-20 gap-6">
                <div className="w-20 h-20 rounded-[35px] bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center shadow-inner">
                    <PieIcon size={32} strokeWidth={1} />
                </div>
                <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-[5px]">{T('awaiting_intel') || "NO ANALYTICS DATA"}</p>
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
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            animationBegin={0}
                            animationDuration={1500}
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

                {/* --- 🎯 ৩. CENTER LABEL (The Apple Standard) --- */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px] opacity-40">
                        {T('total_expense') || "TOTAL"}
                    </span>
                    <h3 className="text-xl md:text-2xl font-mono-finance font-black text-[var(--text-main)] tracking-tighter mt-1">
                        {toBn(totalValue.toLocaleString(), language)}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <ShieldCheck size={10} className="text-orange-500" />
                        <span className="text-[7px] font-black text-orange-500 uppercase tracking-widest">Protocol Sync</span>
                    </div>
                </div>
            </div>

            {/* --- 📊 ৪. ELITE LEGEND GRID --- */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] group hover:border-orange-500/30 transition-all active:scale-95">
                        <div className="w-2 h-2 rounded-full shrink-0 shadow-lg" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black uppercase text-[var(--text-main)] truncate tracking-wider">{item.name}</span>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-40">
                                {toBn(Math.round((item.value / totalValue) * 100), language)}% WEIGHT
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Info Footer */}
            <div className="mt-8 pt-4 border-t border-[var(--border)] opacity-20 flex justify-between items-center">
                 <span className="text-[7px] font-black uppercase tracking-[4px]">Visual Intelligence v5.2</span>
                 <Zap size={10} className="text-orange-500" fill="currentColor" />
            </div>
        </div>
    );
};