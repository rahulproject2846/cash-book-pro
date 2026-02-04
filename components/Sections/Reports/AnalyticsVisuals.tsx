"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { Activity, PieChart as PieIcon, CreditCard, Wallet, Zap, ArrowRight } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const AnalyticsVisuals = ({ areaData, pieData, viaData, totalExpense, symbol }: any) => {
    const { T, t } = useTranslation();
    const PIE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'];

    // Custom Tooltip for Recharts (Theme Synced)
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0A0A0A] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{payload[0].payload.name}</p>
                    <p className="text-[12px] font-black text-orange-500 uppercase">
                        {symbol}{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-[var(--app-gap,1.5rem)] md:space-y-[var(--app-gap,2rem)] transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,1.5rem)]">
                
                {/* 1. Trend Analysis (Area Chart) */}
                <div className="lg:col-span-2 app-card p-[var(--card-padding,1.25rem)] md:p-[var(--card-padding,2rem)] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 shadow-inner"><Activity size={18} /></div>
                            <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
                                {T('flow_velocity') || "Flow Velocity Trend"}
                            </h4>
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.05} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} />
                                <ChartTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fill="url(#chartIn)" dot={false} activeDot={{r: 6, fill: '#10B981', strokeWidth: 0}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#chartOut)" dot={false} activeDot={{r: 6, fill: '#EF4444', strokeWidth: 0}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Capital Split (Pie Chart) */}
                <div className="app-card p-[var(--card-padding,1.25rem)] md:p-[var(--card-padding,2rem)] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shadow-inner"><PieIcon size={18} /></div>
                        <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
                            {T('capital_split') || "Capital Split"}
                        </h4>
                    </div>
                    
                    <div className="relative h-[220px] w-full flex items-center justify-center select-none pointer-events-auto">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                            {pieData.map((e:any, i:number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{outline: 'none'}} />)}
                                        </Pie>
                                        <ChartTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">{T('total_expense')}</p>
                                    <h5 className="text-[15px] font-mono-finance font-bold text-[var(--text-main)] mt-1">{symbol}{totalExpense.toLocaleString()}</h5>
                                </div>
                            </>
                        ) : (
                            <div className="text-center opacity-10 flex flex-col items-center gap-4">
                                <Zap size={40} />
                                <p className="text-[9px] font-black uppercase tracking-[3px]">{T('awaiting_intel')}</p>
                            </div>
                        )}
                    </div>

                    {/* Dominant Sectors (Grid optimized for Mobile) */}
                    <div className="mt-6 grid grid-cols-1 gap-2 overflow-y-auto no-scrollbar max-h-[180px]">
                        {pieData.map((item:any, i:number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border-color)] group hover:border-orange-500/20 transition-all">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{item.name}</span>
                                </div>
                                <span className="text-[10px] font-bold font-mono text-[var(--text-muted)] group-hover:text-orange-500">{Math.round((item.value / totalExpense) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. LIQUIDITY PROTOCOL (Redesigned Card UX) */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 shadow-inner"><CreditCard size={18} /></div>
                    <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
                        {T('liquidity_protocol') || "Liquidity Analysis"}
                    </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--app-gap,1rem)]">
                    {['CASH', 'BANK'].map((method) => {
                        const amount = viaData[method] || 0;
                        const total = (viaData['CASH'] || 0) + (viaData['BANK'] || 0);
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const isCash = method === 'CASH';

                        return (
                            <div key={method} className="app-card p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] relative overflow-hidden group hover:border-orange-500/30 transition-all shadow-lg">
                                {/* Background Glow */}
                                <div className={`absolute -right-4 -bottom-4 opacity-5 blur-2xl w-32 h-32 rounded-full pointer-events-none ${isCash ? 'bg-green-500' : 'bg-blue-500'}`} />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${isCash ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'} border border-current/10 shadow-xl`}>
                                            {isCash ? <Wallet size={20} /> : <CreditCard size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[2px] text-[var(--text-main)]">
                                                {T(isCash ? 'cash_archive' : 'bank_archive')}
                                            </p>
                                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-50">Stored Capital</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-mono-finance font-bold tracking-tighter ${isCash ? 'text-green-500' : 'text-blue-500'}`}>
                                            {symbol}{amount.toLocaleString()}
                                        </p>
                                        <span className="text-[8px] font-black uppercase text-[var(--text-muted)] opacity-40">{Math.round(percentage)}% UNIT WEIGHT</span>
                                    </div>
                                </div>

                                {/* Progress Bar Engine */}
                                <div className="space-y-2">
                                    <div className="h-1.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border-color)]">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 2, ease: "circOut" }}
                                            className={`h-full rounded-full ${isCash ? 'bg-green-500' : 'bg-blue-500'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} 
                                        />
                                    </div>
                                </div>

                                {/* Guidance Tooltip Trigger */}
                                <div className="absolute top-4 right-4">
                                    <Tooltip text={isCash ? t('tt_cash_intel') : t('tt_bank_intel')}>
                                        <Zap size={12} className="text-[var(--text-muted)] opacity-20 group-hover:opacity-100 transition-all cursor-help" />
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};