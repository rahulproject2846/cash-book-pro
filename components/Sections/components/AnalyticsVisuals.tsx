"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { Activity, PieChart as PieIcon, CreditCard, Wallet, Zap } from 'lucide-react';

export const AnalyticsVisuals = ({ areaData, pieData, viaData, totalExpense, symbol }: any) => {
    const PIE_COLORS = ['var(--accent)', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'];

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* 1. Trend Analysis (Area Chart) */}
                <div className="lg:col-span-2 app-card p-5 md:p-8 bg-[var(--bg-card)] shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500 shadow-inner"><Activity size={18} /></div>
                            <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px]">Flow Velocity Trend</h4>
                        </div>
                    </div>
                    
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.05} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '900'}} />
                                <Tooltip contentStyle={{backgroundColor: '#0F0F0F', borderRadius: '16px', border: '1px solid #222', fontSize: '10px'}} itemStyle={{fontWeight: '900', textTransform: 'uppercase'}} />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fill="url(#chartIn)" dot={false} activeDot={{r: 6}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#chartOut)" dot={false} activeDot={{r: 6}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Capital Split (Pie Chart with Total in Center) */}
                <div className="app-card p-5 md:p-8 flex flex-col bg-[var(--bg-card)] shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 shadow-inner"><PieIcon size={18} /></div>
                        <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px]">Capital Split</h4>
                    </div>
                    
                    <div className="relative h-[220px] w-full flex items-center justify-center">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                            {pieData.map((e:any, i:number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{borderRadius: '16px', backgroundColor: '#0F0F0F', border: 'none'}} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Total Amount (The Intel) */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Total Expense</p>
                                    <h5 className="text-[15px] font-mono-finance font-bold text-[var(--text-main)] mt-1">{symbol}{totalExpense.toLocaleString()}</h5>
                                </div>
                            </>
                        ) : (
                            <div className="text-center opacity-10 flex flex-col items-center gap-4">
                                <Zap size={40} />
                                <p className="text-[9px] font-black uppercase tracking-[3px]">Awaiting Intel</p>
                            </div>
                        )}
                    </div>

                    {/* Dominant Sectors (Pill List) */}
                    <div className="mt-6 space-y-2 overflow-y-auto no-scrollbar max-h-[150px]">
                        {pieData.slice(0, 4).map((item:any, i:number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border)]">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">{item.name}</span>
                                </div>
                                <span className="text-[10px] font-bold font-mono text-[var(--accent)]">{Math.round((item.value / totalExpense) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. VIA Protocol Analysis (Cash vs Bank Comparison Bar) */}
            <div className="app-card p-5 md:p-8 bg-[var(--bg-card)] border border-[var(--border)] shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500 shadow-inner"><CreditCard size={18} /></div>
                    <h4 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[2px]">Liquidity Protocol (Cash vs Bank)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                    {['CASH', 'BANK'].map((method) => {
                        const amount = viaData[method] || 0;
                        const total = (viaData['CASH'] || 0) + (viaData['BANK'] || 0);
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        return (
                            <div key={method} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        {method === 'CASH' ? <Wallet size={16} className="text-green-500"/> : <CreditCard size={16} className="text-blue-500"/>}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">{method} Archive</span>
                                    </div>
                                    <span className="text-[11px] font-mono-finance font-bold text-[var(--text-main)]">{symbol}{amount.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--bg-app)] rounded-full overflow-hidden border border-[var(--border)]">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${method === 'CASH' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};