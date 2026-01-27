"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, 
    Activity, Calendar, ArrowUpRight, Download, Loader2
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

// New Imports
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

export const ReportsSection = ({ currentUser }: any) => {
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30'); // Default 30 days
    const [showExportModal, setShowExportModal] = useState(false);

    // Get Dynamic Currency Symbol
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- 1. DATA AGGREGATION ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const booksRes = await fetch(`/api/books?userId=${currentUser._id}`);
                const books = await booksRes.json();
                
                let combinedData: any[] = [];
                await Promise.all(books.map(async (book: any) => {
                    const res = await fetch(`/api/entries?bookId=${book._id}`);
                    const data = await res.json();
                    if(Array.isArray(data)) combinedData = [...combinedData, ...data];
                }));

                combinedData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setAllEntries(combinedData);
            } catch (error) {
                console.error("Analytics Sync Error");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [currentUser]);

    // --- 2. DATA PROCESSING ---
    const stats = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status === 'Completed');

        const totalIn = filtered.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
        const totalOut = filtered.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);

        const flowMap = new Map();
        filtered.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!flowMap.has(date)) flowMap.set(date, { name: date, income: 0, expense: 0 });
            const item = flowMap.get(date);
            if (e.type === 'income') item.income += e.amount;
            else item.expense += e.amount;
        });

        const catMap = new Map();
        filtered.filter(e => e.type === 'expense').forEach(e => {
            if (!catMap.has(e.category)) catMap.set(e.category, { name: e.category, value: 0 });
            catMap.get(e.category).value += e.amount;
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

    const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Syncing Intelligence</p>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-7xl mx-auto">
            
            {/* --- TOP BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter italic ">Analytics Report</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1">Holistic view of all active ledgers</p>
                </div>
                <div className="flex bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    {['7', '30', '90'].map((r) => (
                        <button 
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                        >
                            {r} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* --- SUMMARY GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="app-card p-8 border-l-4 shadow-sm">
                    <TrendingUp className=" mb-4" size={24} />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Aggregate Inflow</p>
                    <h3 className="text-3xl font-mono-finance font-bold text-[var(--text-main)] mt-1">+{currencySymbol}{stats.totalIn.toLocaleString()}</h3>
                </div>
                <div className="app-card p-8 border-l-4 shadow-sm">
                    <TrendingDown className="text-red-500 mb-4" size={24} />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Aggregate Outflow</p>
                    <h3 className="text-3xl font-mono-finance font-bold text-[var(--text-main)] mt-1">-{currencySymbol}{stats.totalOut.toLocaleString()}</h3>
                </div>
                <div className="app-card p-8 border-l-4 shadow-sm">
                    <Wallet className="text-orange-500 mb-4" size={24} />
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Net Surplus</p>
                    <h3 className={`text-3xl font-mono-finance font-bold mt-1 ${stats.net >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {stats.net >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(stats.net).toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* --- CHARTS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 app-card p-8 shadow-sm">
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-2 mb-8">
                        <Activity size={18} className="text-orange-500" /> Cash Flow Trend
                    </h4>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)', fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'var(--text-muted)', fontWeight: 'bold'}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', fontSize: '12px'}}
                                    itemStyle={{fontWeight: 'bold'}}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fill="url(#chartIn)" />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#chartOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="app-card p-8 flex flex-col shadow-sm">
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest flex items-center gap-2 mb-8">
                        <PieIcon size={18} className="text-orange-500" /> Spending Distribution
                    </h4>
                    <div className="flex-1 min-h-[250px] relative">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '12px', fontSize: '10px', fontWeight: 'bold'}} />
                                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', paddingTop: '20px', textTransform: 'uppercase'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30">
                                <PieIcon size={48} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No Expense Data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- EXPORT FOOTER (UPDATED) --- */}
            <div className="app-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-dashed border-2 border-orange-500/20 bg-orange-500/5 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                        <Download size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight italic">Generate Data Archive</h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Global report for the last {timeRange} days</p>
                    </div>
                </div>
                <div className="w-full md:w-auto">
                    <button 
                        onClick={() => setShowExportModal(true)}
                        className="w-full md:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Download size={18} strokeWidth={3} />
                        <span>Export Selection</span>
                    </button>
                </div>
            </div>

            {/* 🔥 Advanced Export Modal Injection */}
            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={showExportModal} 
                        onClose={() => setShowExportModal(false)} 
                        entries={stats.filtered} 
                        bookName={`Global_Report_${timeRange}Days`}
                    />
                )}
            </AnimatePresence>

        </motion.div>
    );
};