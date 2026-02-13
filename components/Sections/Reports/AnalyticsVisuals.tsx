"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// ✅ Lucide Icons: সরাসরি লাইব্রেরি থেকে ইম্পোর্ট, Next.js অটো-অপ্টিমাইজ করবে
import { 
    Activity, 
    PieChart as PieIcon, 
    CreditCard, 
    Wallet, 
    Zap, 
    GitCommit, 
    BadgeCheck 
} from 'lucide-react';

// ✅ Recharts Dynamic Imports: Named Export এরর (Export default doesn't exist) সমাধান করা হয়েছে
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const ChartTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';


export const AnalyticsVisuals = ({ areaData, pieData, viaData, totalExpense, symbol }: any) => {
    const { t, language } = useTranslation();
    
    // ✅ Memoized Colors to prevent re-renders
    const PIE_COLORS = useMemo(() => ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'], []);

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
                
                {/* --- 1. FLOW VELOCITY TREND --- */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-10 shadow-2xl relative overflow-hidden group transition-all duration-500">
                    <div className="flex justify-between items-start mb-12 relative z-10">
                        <div className="flex items-center gap-5">
                            <Tooltip text={t('tt_flow_velocity') || "Monitors transaction speed"}>
                                <div className="p-3.5 bg-orange-500/10 rounded-[22px] text-orange-500 border border-orange-500/20 shadow-inner">
                                    <Activity size={24} strokeWidth={2.5} />
                                </div>
                            </Tooltip>
                            <div>
                                <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                                    {t('flow_velocity') || "FLOW VELOCITY TREND"}
                                </h4>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-2 opacity-50">Sequential Intelligence Engine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">LIVE FEED</span>
                        </div>
                    </div>
                    
                    <div className="h-[320px] w-full relative z-10 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--border)" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} tickFormatter={(v) => toBn(v, language)} />
                                <ChartTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fill="url(#chartIn)" activeDot={{r: 6}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fill="url(#chartOut)" activeDot={{r: 6}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- 2. CAPITAL SPLIT --- */}
                <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group transition-all duration-500">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3.5 bg-blue-500/10 rounded-[22px] text-blue-500 border border-blue-500/20 shadow-inner">
                            <PieIcon size={24} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none truncate">
                                {t('capital_split') || "CAPITAL SPLIT"}
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
                                            {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <ChartTooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px] opacity-40">{t('total_expense')}</p>
                                    <h5 className="text-[20px] font-mono-finance font-black text-[var(--text-main)] mt-1 tracking-tighter">
                                        {symbol}{toBn(totalExpense.toLocaleString(), language)}
                                    </h5>
                                </div>
                            </>
                        ) : (
                            <div className="text-center flex flex-col items-center gap-4 opacity-10">
                                <Zap size={48} className="text-orange-500" />
                                <p className="text-[10px] font-black uppercase tracking-[5px]">{t('awaiting_intel')}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 space-y-2 overflow-y-auto no-scrollbar max-h-[180px] pr-2">
                        {pieData.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] group/item hover:border-orange-500/30 transition-all">
                                <div className="flex items-center gap-3 max-w-[70%]">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{item.name}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[12px] font-black text-[var(--text-main)] group-hover/item:text-orange-500">
                                        {toBn(Math.round((item.value / (totalExpense || 1)) * 100), language)}
                                    </span>
                                    <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-30">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- 3. LIQUIDITY ANALYSIS --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-1">
                    <div className="p-3 bg-purple-500/10 rounded-[20px] text-purple-500 border border-purple-500/20 shadow-inner">
                        <CreditCard size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {t('liquidity_protocol') || "LIQUIDITY ANALYSIS"}
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
                                className="bg-[var(--bg-card)] p-8 border border-[var(--border)] rounded-[40px] relative overflow-hidden group shadow-2xl transition-all duration-500"
                            >
                                <div className={cn(
                                    "absolute -right-12 -bottom-12 opacity-[0.03] group-hover:opacity-[0.08] blur-3xl w-56 h-56 rounded-full transition-opacity duration-1000",
                                    isCash ? "bg-green-500" : "bg-blue-500"
                                )} />
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "p-4 rounded-[22px] shadow-2xl text-white",
                                            isCash ? "bg-green-500" : "bg-blue-500"
                                        )}>
                                            {isCash ? <Wallet size={26} strokeWidth={2.5} /> : <CreditCard size={26} strokeWidth={2.5} />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-black uppercase tracking-[3px] text-[var(--text-main)]">
                                                {t(isCash ? 'cash_archive' : 'bank_archive') || method}
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
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000",
                                                isCash ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                            )} 
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};