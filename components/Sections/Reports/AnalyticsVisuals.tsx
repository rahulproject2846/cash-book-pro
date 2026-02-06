"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { Activity, PieChart as PieIcon, CreditCard, Wallet, Zap, ShieldCheck, Cpu } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const AnalyticsVisuals = ({ areaData, pieData, viaData, totalExpense, symbol }: any) => {
    const { T, t, language } = useTranslation();
    const PIE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'];

    // --- 🎨 CUSTOM GLASS TOOLTIP ---
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--bg-card)]/90 border border-[var(--border)] p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <p className="text-[8px] font-black uppercase tracking-[3px] text-[var(--text-muted)] mb-2">{payload[0].payload.name}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                        <p className="text-[13px] font-mono-finance font-bold text-[var(--text-main)] tracking-tighter">
                            {symbol}{toBn(payload[0].value.toLocaleString(), language)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-[var(--app-gap,1.5rem)] md:space-y-[var(--app-gap,2.5rem)] transition-all duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,1.5rem)] md:gap-[var(--app-gap,2rem)]">
                
                {/* --- 1. FLOW VELOCITY TREND (Area Chart) --- */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,1.5rem)] md:p-8 shadow-xl relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-inner">
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                    {T('flow_velocity') || "FLOW VELOCITY TREND"}
                                </h4>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">Sequential Financial Analytics</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-xl">
                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                             <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">LIVE DATA</span>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full relative z-10 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900', letterSpacing: '1px'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} tickFormatter={(v) => toBn(v, language)} />
                                <ChartTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fill="url(#chartIn)" dot={false} activeDot={{r: 6, fill: '#10B981', strokeWidth: 4, stroke: '#fff'}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fill="url(#chartOut)" dot={false} activeDot={{r: 6, fill: '#EF4444', strokeWidth: 4, stroke: '#fff'}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- 2. CAPITAL SPLIT (Pie Chart) --- */}
                <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,1.5rem)] md:p-8 flex flex-col shadow-xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20 shadow-inner">
                            <PieIcon size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                {T('capital_split') || "CAPITAL SPLIT"}
                            </h4>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">Categorical Distribution</p>
                        </div>
                    </div>
                    
                    <div className="relative h-[240px] w-full flex items-center justify-center select-none">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={75} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                                            {pieData.map((e:any, i:number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{outline: 'none', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'}} />)}
                                        </Pie>
                                        <ChartTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{T('total_expense')}</p>
                                    <h5 className="text-[18px] font-mono-finance font-black text-[var(--text-main)] mt-1 tracking-tighter">
                                        {symbol}{toBn(totalExpense.toLocaleString(), language)}
                                    </h5>
                                </div>
                            </>
                        ) : (
                            <div className="text-center flex flex-col items-center gap-4 opacity-20">
                                <Zap size={48} className="text-orange-500" />
                                <p className="text-[10px] font-black uppercase tracking-[4px]">{T('awaiting_intel')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-2 overflow-y-auto no-scrollbar max-h-[160px] pr-2">
                        {pieData.map((item:any, i:number) => (
                            <div key={i} className="flex justify-between items-center p-3.5 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] group/item hover:border-orange-500/30 transition-all active:scale-[0.98]">
                                <div className="flex items-center gap-3 max-w-[70%]">
                                    <div className="w-2 h-2 rounded-full shadow-lg shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{item.name}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[11px] font-black text-[var(--text-main)] group-hover/item:text-orange-500">{toBn(Math.round((item.value / totalExpense) * 100), language)}</span>
                                    <span className="text-[7px] font-bold text-[var(--text-muted)] opacity-50">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- 3. LIQUIDITY PROTOCOL (The OS Modules) --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-500 border border-purple-500/20 shadow-inner">
                        <CreditCard size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('liquidity_protocol') || "LIQUIDITY ANALYSIS"}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">Stored Capital Assessment</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--app-gap,1.5rem)]">
                    {['CASH', 'BANK'].map((method) => {
                        const amount = viaData[method] || 0;
                        const total = (viaData['CASH'] || 0) + (viaData['BANK'] || 0);
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        const isCash = method === 'CASH';

                        return (
                            <motion.div 
                                key={method} whileHover={{ y: -5 }}
                                className="bg-[var(--bg-card)] p-7 border border-[var(--border)] rounded-[32px] relative overflow-hidden group shadow-xl transition-all duration-500"
                            >
                                <div className={`absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.08] blur-3xl w-48 h-48 rounded-full transition-opacity duration-700 ${isCash ? 'bg-green-500' : 'bg-blue-500'}`} />
                                
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3.5 rounded-[22px] shadow-2xl transition-all duration-500 ${isCash ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                                            {isCash ? <Wallet size={24} strokeWidth={2.5} /> : <CreditCard size={24} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[2.5px] text-[var(--text-main)]">
                                                {T(isCash ? 'cash_archive' : 'bank_archive') || method}
                                            </p>
                                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-widest mt-1 opacity-60">Protocol Validated</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h4 className={`text-2xl font-mono-finance font-black tracking-tighter ${isCash ? 'text-green-500' : 'text-blue-500'}`}>
                                            {symbol}{toBn(amount.toLocaleString(), language)}
                                        </h4>
                                        <span className="text-[8px] font-black uppercase text-[var(--text-muted)] opacity-30 tracking-widest">{toBn(Math.round(percentage), language)}% UNIT WEIGHT</span>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="h-2 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 2.5, ease: "circOut" }}
                                            className={`h-full rounded-full ${isCash ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                         <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">Active Node</span>
                                         <Activity size={10} className="text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity animate-pulse" />
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4">
                                    <Tooltip text={isCash ? t('tt_cash_intel') : t('tt_bank_intel')}>
                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] opacity-20 group-hover:opacity-100 transition-all cursor-help hover:text-orange-500 hover:border-orange-500/30 shadow-inner">
                                            <Zap size={14} fill="currentColor" strokeWidth={0} />
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