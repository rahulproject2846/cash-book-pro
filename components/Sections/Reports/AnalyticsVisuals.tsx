"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { Activity, PieChart as PieIcon, CreditCard, Wallet, Zap, ShieldCheck, Cpu, GitCommit, BadgeCheck } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

export const AnalyticsVisuals = ({ areaData, pieData, viaData, totalExpense, symbol }: any) => {
    const { T, t, language } = useTranslation();
    const PIE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'];

    // --- 🎨 CUSTOM ELITE GLASS TOOLTIP ---
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 border border-white/10 p-4 rounded-[20px] shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <GitCommit size={12} className="text-orange-500" />
                        <p className="text-[8px] font-black uppercase tracking-[3px] text-white/40">{payload[0].payload.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]" />
                        <p className="text-[14px] font-mono-finance font-black text-white tracking-tighter">
                            {symbol}{toBn(payload[0].value.toLocaleString(), language)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={cn("space-y-[1.5rem] md:space-y-[2.5rem] transition-all duration-500 pb-10")}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* --- 1. FLOW VELOCITY TREND (Area Chart) --- */}
                <div className={cn(
                    "lg:col-span-2 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
                    "p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500"
                )}>
                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div className="flex items-center gap-5">
                            <Tooltip text={t('tt_flow_velocity') || "Monitors transaction speed and volume"}>
                                <div className="p-3.5 bg-orange-500/10 rounded-[22px] text-orange-500 border border-orange-500/20 shadow-inner">
                                    <Activity size={24} strokeWidth={2.5} />
                                </div>
                            </Tooltip>
                            <div>
                                <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                    {T('flow_velocity') || "FLOW VELOCITY TREND"}
                                </h4>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-2 opacity-50">Sequential Intelligence Engine</p>
                            </div>
                        </div>
                        <Tooltip text={t('tt_live_feed') || "Data updated in real-time"}>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl cursor-help">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">LIVE FEED</span>
                            </div>
                        </Tooltip>
                    </div>
                    
                    <div className="h-[320px] w-full relative z-10 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px'}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} tickFormatter={(v) => toBn(v, language)} />
                                <ChartTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fill="url(#chartIn)" dot={false} activeDot={{r: 6, fill: '#10B981', strokeWidth: 4, stroke: '#fff'}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fill="url(#chartOut)" dot={false} activeDot={{r: 6, fill: '#EF4444', strokeWidth: 4, stroke: '#fff'}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- 2. CAPITAL SPLIT (Pie Chart) --- */}
                <div className={cn(
                    "bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
                    "p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group transition-all duration-500"
                )}>
                    <div className="flex items-center gap-4 mb-10">
                        <Tooltip text={t('tt_capital_split') || "Shows asset distribution across tags"}>
                            <div className="p-3.5 bg-blue-500/10 rounded-[22px] text-blue-500 border border-blue-500/20 shadow-inner">
                                <PieIcon size={24} strokeWidth={2.5} />
                            </div>
                        </Tooltip>
                        <div className="min-w-0">
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none truncate">
                                {T('capital_split') || "CAPITAL SPLIT"}
                            </h4>
                            <p className="text-[8px] font-bold text-blue-500 uppercase tracking-[2px] mt-2 opacity-50">Categorical Nodes</p>
                        </div>
                    </div>
                    
                    <div className="relative h-[250px] w-full flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                                            {pieData.map((e:any, i:number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{outline: 'none'}} />)}
                                        </Pie>
                                        <ChartTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px] opacity-40">{T('total_expense')}</p>
                                    <h5 className="text-[20px] font-mono-finance font-black text-[var(--text-main)] mt-1 tracking-tighter">
                                        {symbol}{toBn(totalExpense.toLocaleString(), language)}
                                    </h5>
                                </div>
                            </>
                        ) : (
                            <div className="text-center flex flex-col items-center gap-4 opacity-10">
                                <Zap size={48} className="text-orange-500" />
                                <p className="text-[10px] font-black uppercase tracking-[5px]">{T('awaiting_intel')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 space-y-2 overflow-y-auto no-scrollbar max-h-[180px] pr-2">
                        {pieData.map((item:any, i:number) => (
                            <Tooltip key={i} text={`${item.name}: ${symbol}${toBn(item.value.toLocaleString(), language)}`}>
                                <div className="flex justify-between items-center p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] group/item hover:border-orange-500/30 transition-all cursor-help">
                                    <div className="flex items-center gap-3 max-w-[70%]">
                                        <div className="w-2 h-2 rounded-full shadow-lg shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{item.name}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[12px] font-black text-[var(--text-main)] group-hover/item:text-orange-500 transition-colors">
                                            {toBn(Math.round((item.value / (totalExpense || 1)) * 100), language)}
                                        </span>
                                        <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-30">%</span>
                                    </div>
                                </div>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- 3. LIQUIDITY PROTOCOL (The OS Modules) --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <Tooltip text={t('tt_liquidity_monitor') || "Analyze available capital"}>
                        <div className="p-3 bg-purple-500/10 rounded-[20px] text-purple-500 border border-purple-500/20 shadow-inner">
                            <CreditCard size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('liquidity_protocol') || "LIQUIDITY ANALYSIS"}
                        </h4>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-2 opacity-50">Physical Asset Verification</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {['CASH', 'BANK'].map((method) => {
                        const amount = viaData[method] || 0;
                        const total = (viaData['CASH'] || 0) + (viaData['BANK'] || 0);
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const isCash = method === 'CASH';

                        return (
                            <motion.div 
                                key={method} whileHover={{ y: -5 }}
                                className={cn(
                                    "bg-[var(--bg-card)] p-8 border border-[var(--border)] rounded-[40px]",
                                    "relative overflow-hidden group shadow-2xl transition-all duration-500"
                                )}
                            >
                                {/* Elite Background Aura */}
                                <div className={cn(
                                    "absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] blur-3xl w-56 h-56 rounded-full transition-opacity duration-1000",
                                    isCash ? "bg-green-500" : "bg-blue-500"
                                )} />
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "p-4 rounded-[22px] shadow-2xl transition-all duration-700 text-white",
                                            isCash ? "bg-green-500 shadow-green-500/20" : "bg-blue-500 shadow-blue-500/20"
                                        )}>
                                            {isCash ? <Wallet size={26} strokeWidth={2.5} /> : <CreditCard size={26} strokeWidth={2.5} />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-black uppercase tracking-[3px] text-[var(--text-main)] leading-none">
                                                {T(isCash ? 'cash_archive' : 'bank_archive') || method}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <BadgeCheck size={10} className="text-orange-500 opacity-60" />
                                                <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest opacity-60">Verified Node</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h4 className={cn(
                                            "text-2xl font-mono-finance font-black tracking-tighter leading-none mb-2",
                                            isCash ? "text-green-500" : "text-blue-500"
                                        )}>
                                            {symbol}{toBn(amount.toLocaleString(), language)}
                                        </h4>
                                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)] opacity-30 tracking-widest">{toBn(Math.round(percentage), language)}% UNIT WEIGHT</span>
                                    </div>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="h-2.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 2.5, ease: "circOut", delay: 0.2 }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                isCash ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            )} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                         <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px] opacity-20">PROTOCOL {isCash ? 'CASH' : 'STREAMS'} ACTIVE</span>
                                         <Activity size={12} className="text-orange-500 opacity-10 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />
                                    </div>
                                </div>

                                {/* Hover Secret Action Detail */}
                                <div className="absolute top-6 right-8">
                                    <Tooltip text={isCash ? t('tt_cash_intel') : t('tt_bank_intel')}>
                                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] opacity-20 group-hover:opacity-100 transition-all cursor-help hover:text-orange-500 hover:border-orange-500/30 shadow-inner">
                                            <Zap size={16} fill="currentColor" strokeWidth={0} />
                                        </div>
                                    </Tooltip>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};