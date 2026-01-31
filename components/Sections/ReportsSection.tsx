"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, 
    Activity, Calendar, ArrowUpRight, Download, Loader2, ShieldCheck,
    Fingerprint, Zap, Filter
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

// Core Engine
import { db } from '@/lib/offlineDB';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

// --- Sub-component: Polished Analytics Card ---
const AnalyticCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="app-card p-8 border-l-4 border-[var(--border-color)] relative overflow-hidden group bg-[var(--bg-card)] shadow-xl transition-all hover:shadow-orange-500/5">
        <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Icon size={140} strokeWidth={1} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] ${color}`}>
                    <Icon size={16} />
                </div>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px] italic">{label}</p>
            </div>
            <h3 className="text-3xl md:text-4xl font-mono-finance font-bold text-[var(--text-main)] tracking-tight">
                {value}
            </h3>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-12 bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div className={`h-full ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '70%' }} />
                    </div>
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">Intelligence Verified</span>
                </div>
            )}
        </div>
    </div>
);

export const ReportsSection = ({ currentUser }: any) => {
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [showExportModal, setShowExportModal] = useState(false);

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- 1. LOCAL DATA ENGINE (No More API Calls) ---
    const fetchLocalAnalytics = async () => {
        try {
            if (!db.isOpen()) await db.open();
            // Fetch all entries from all books that are not deleted
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            
            // Sort by date for chronologic charts
            const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setAllEntries(sorted);
        } catch (error) {
            console.error("ANALYSIS_DB_ERROR");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalAnalytics();
        window.addEventListener('vault-updated', fetchLocalAnalytics);
        return () => window.removeEventListener('vault-updated', fetchLocalAnalytics);
    }, []);

    // --- 2. DATA PROCESSING (Normalized & Safe) ---
    const stats = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        // Use lowercase 'completed' to match our V3 logic
        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status.toLowerCase() === 'completed');

        const totalIn = filtered.filter(e => e.type.toLowerCase() === 'income').reduce((a, b) => a + b.amount, 0);
        const totalOut = filtered.filter(e => e.type.toLowerCase() === 'expense').reduce((a, b) => a + b.amount, 0);

        // Chart 1: Flow Trend Mapping
        const flowMap = new Map();
        filtered.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!flowMap.has(date)) flowMap.set(date, { name: date, income: 0, expense: 0 });
            const item = flowMap.get(date);
            if (e.type.toLowerCase() === 'income') item.income += e.amount;
            else item.expense += e.amount;
        });

        // Chart 2: Category Distribution
        const catMap = new Map();
        filtered.filter(e => e.type.toLowerCase() === 'expense').forEach(e => {
            const catName = e.category || 'Other';
            if (!catMap.has(catName)) catMap.set(catName, { name: catName, value: 0 });
            catMap.get(catName).value += e.amount;
        });

        return {
            filtered,
            totalIn,
            totalOut,
            net: totalIn - totalOut,
            areaData: Array.from(flowMap.values()),
            pieData: Array.from(catMap.values())
        };
    }, [allEntries, timeRange]);

    const PIE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#64748B'];

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[5px] text-white/20">Synthesizing Archives</p>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-32 max-w-6xl mx-auto px-2">
            
            {/* --- HEADER & RANGE --- */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-[var(--bg-card)] p-6 md:p-8 rounded-[32px] border border-[var(--border-color)] gap-6 shadow-xl">
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <Zap className="text-orange-500" size={14} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30">Analytics Intelligence</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                        Performance<span className="text-orange-500">.</span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-1.5 bg-[var(--bg-app)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                    {['7', '30', '90'].map((r) => (
                        <button 
                            key={r} onClick={() => setTimeRange(r)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:text-white'}`}
                        >
                            {r}D
                        </button>
                    ))}
                    <div className="w-px h-6 bg-[var(--border-color)] mx-2" />
                    <button className="p-2.5 text-[var(--text-muted)] hover:text-orange-500 transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticCard label="Global Inflow" value={`+${currencySymbol}${stats.totalIn.toLocaleString()}`} icon={TrendingUp} color="text-green-500" trend="up" />
                <AnalyticCard label="Global Outflow" value={`-${currencySymbol}${stats.totalOut.toLocaleString()}`} icon={TrendingDown} color="text-red-500" />
                <AnalyticCard label="Net Surplus" value={`${stats.net >= 0 ? '+' : '-'}${currencySymbol}${Math.abs(stats.net).toLocaleString()}`} icon={Wallet} color={stats.net >= 0 ? "text-blue-500" : "text-orange-500"} />
            </div>

            {/* --- VISUALIZATION ENGINE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Area Chart: Trend */}
                <div className="lg:col-span-2 app-card p-8 relative overflow-hidden bg-[var(--bg-card)] shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><Activity size={18} /></div>
                            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px]">Flow Velocity Trend</h4>
                        </div>
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[2px] border border-white/5 px-3 py-1 rounded-full">System v4.0</span>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '800'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '800'}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#0F0F0F', borderRadius: '16px', border: '1px solid #1F1F1F', fontSize: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'}}
                                    itemStyle={{fontWeight: '900', textTransform: 'uppercase'}}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fill="url(#chartIn)" dot={false} activeDot={{r: 6, strokeWidth: 0}} />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fill="url(#chartOut)" dot={false} activeDot={{r: 6, strokeWidth: 0}} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Pie Chart: Allocation */}
                <div className="app-card p-8 flex flex-col bg-[var(--bg-card)] shadow-2xl relative border-[var(--border-color)]">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><PieIcon size={18} /></div>
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px]">Capital Split</h4>
                    </div>
                    
                    <div className="flex-1 min-h-[300px] relative">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        innerRadius={80}
                                        outerRadius={105}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '12px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', backgroundColor: '#0F0F0F', border: 'none'}} />
                                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '8px', fontWeight: '900', paddingTop: '30px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-10">
                                <Fingerprint size={64} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[3px]">Awaiting Data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- GLOBAL ACTION AREA --- */}
            <div className="app-card p-10 bg-orange-500 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_30px_60px_-15px_rgba(249,115,22,0.3)]">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <Download size={32} strokeWidth={2.5} />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic leading-none">Export Global Archive</h3>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-[2px] mt-2">Generate consolidated financial intelligence report</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="w-full md:w-auto px-10 h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] hover:scale-[1.05] transition-all active:scale-95 shadow-2xl"
                >
                    EXECUTE ARCHIVE
                </button>
            </div>

            {/* Footnote */}
            <div className="flex flex-col items-center gap-3 opacity-20 py-10">
                <ShieldCheck size={28} />
                <p className="text-[9px] font-black uppercase tracking-[6px]">Consolidated Protocol Environment</p>
            </div>

            {/* Global Advanced Export */}
            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={showExportModal} 
                        onClose={() => setShowExportModal(false)} 
                        entries={stats.filtered} 
                        bookName="GLOBAL_VAULT_REPORT"
                    />
                )}
            </AnimatePresence>

        </motion.div>
    );
};