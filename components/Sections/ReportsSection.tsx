"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, 
    Activity, Calendar, ArrowUpRight, Download, Loader2, ShieldCheck
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';

// Global Modal Integration
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

export const ReportsSection = ({ currentUser }: any) => {
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30'); // Default 30 days
    const [showExportModal, setShowExportModal] = useState(false);

    // Dynamic Currency Symbol Logic
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ১. ডেটা অ্যাগ্রিগেশন লজিক ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // ইউজারের সব বই খুঁজে বের করা
                const booksRes = await fetch(`/api/books?userId=${currentUser._id}`);
                const booksData = await booksRes.json();
                const books = booksData.books || booksData;
                
                // সব বইয়ের এন্ট্রি প্যারালালি ফেচ করা (পিক পারফরম্যান্স)
                let combinedData: any[] = [];
                await Promise.all(books.map(async (book: any) => {
                    const res = await fetch(`/api/entries?bookId=${book._id}`);
                    const entryData = await res.json();
                    const entries = entryData.entries || entryData;
                    if(Array.isArray(entries)) combinedData = [...combinedData, ...entries];
                }));

                combinedData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setAllEntries(combinedData);
            } catch (error) {
                console.error("ANALYTICS_SYNC_ERROR");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [currentUser]);

    // --- ২. ডেটা প্রসেসিং (Memoized for Performance) ---
    const stats = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status === 'Completed');

        const totalIn = filtered.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
        const totalOut = filtered.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);

        // চার্ট ১: ক্যাশ ফ্লো ট্রেন্ড (Area Chart)
        const flowMap = new Map();
        filtered.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!flowMap.has(date)) flowMap.set(date, { name: date, income: 0, expense: 0 });
            const item = flowMap.get(date);
            if (e.type === 'income') item.income += e.amount;
            else item.expense += e.amount;
        });

        // চার্ট ২: খরচ ক্যাটাগরি ডিস্ট্রিবিউশন (Pie Chart)
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
            <Loader2 className="animate-spin text-orange-500" size={44} />
            <p className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Synchronizing Intelligence</p>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-7xl mx-auto px-1">
            
            {/* --- TOP BAR: TITLE & RANGE SELECTION --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">Analytics Protocol</h2>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[3px] mt-2">Aggregate view of secure financial vaults</p>
                </div>
                <div className="flex bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-color)] shadow-xl">
                    {['7', '30', '90'].map((r) => (
                        <button 
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                        >
                            {r} Days
                        </button>
                    ))}
                </div>
            </div>

            {/* --- SUMMARY GRID (GHOST ICON EDITION) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inflow Card */}
                <div className="app-card p-8 border-l-4 border-green-500 bg-green-500/[0.02] relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><TrendingUp size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-[3px] italic mb-3">Aggregate Inflow</p>
                        <h3 className="text-4xl font-mono-finance font-bold text-[var(--text-main)]">+{currencySymbol}{stats.totalIn.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Outflow Card */}
                <div className="app-card p-8 border-l-4 border-red-500 bg-red-500/[0.02] relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><TrendingDown size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[3px] italic mb-3">Aggregate Outflow</p>
                        <h3 className="text-4xl font-mono-finance font-bold text-[var(--text-main)]">-{currencySymbol}{stats.totalOut.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Net Balance Card */}
                <div className="app-card p-8 border-l-4 border-blue-500 bg-blue-500/[0.02] relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity"><Wallet size={120} /></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[3px] italic mb-3">Total Net Surplus</p>
                        <h3 className={`text-4xl font-mono-finance font-bold ${stats.net >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                            {stats.net < 0 ? '-' : '+'}{currencySymbol}{Math.abs(stats.net).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            {/* --- DATA VISUALIZATION ENGINE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Cash Flow Area Chart */}
                <div className="lg:col-span-2 app-card p-8 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3">
                            <Activity size={20} className="text-orange-500" /> Vault Performance Trend
                        </h4>
                        <span className="text-[9px] font-bold text-orange-500 bg-orange-500/5 px-3 py-1 rounded-full border border-orange-500/10">REAL-TIME SYNC</span>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.areaData}>
                                <defs>
                                    <linearGradient id="chartIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="chartOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '800'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'var(--text-muted)', fontWeight: '800'}} />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1A1A1B', borderRadius: '20px', border: '1px solid #2D2D2D', fontSize: '11px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}
                                    itemStyle={{fontWeight: '900', textTransform: 'uppercase'}}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} fill="url(#chartIn)" />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fill="url(#chartOut)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spending Distribution Pie Chart */}
                <div className="app-card p-8 flex flex-col shadow-2xl relative">
                    <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] flex items-center gap-3 mb-10">
                        <PieIcon size={20} className="text-orange-500" /> Capital Allocation
                    </h4>
                    <div className="flex-1 min-h-[280px] relative">
                        {stats.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.pieData}
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '16px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '900', paddingTop: '30px', textTransform: 'uppercase', letterSpacing: '1px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20">
                                <ShieldCheck size={64} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[3px]">Protocol: No Data Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- FINAL ACTION FOOTER --- */}
            <div className="app-card p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-dashed border-2 border-orange-500/20 bg-orange-500/[0.02] shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-orange-500/40">
                        <Download size={32} strokeWidth={2.5} />
                    </div>
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight italic">Initialize Data Archive</h3>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1">Download encrypted statement for the last {timeRange} days</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="app-btn-primary px-12 py-5 shadow-2xl shadow-orange-500/30 text-xs font-black tracking-[3px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    EXECUTE ARCHIVE
                </button>
            </div>

            {/* Creditor line */}
            <div className="text-center pt-4 opacity-30">
                <p className="text-[9px] font-black uppercase tracking-[5px] text-[var(--text-main)]">Engine Architecture v4.5.2</p>
                <p className="text-[8px] font-bold mt-2 uppercase tracking-[3px] text-[var(--text-muted)] italic">Design and Development by Rahul</p>
            </div>

            {/* Advanced Export Modal Integration */}
            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={showExportModal} 
                        onClose={() => setShowExportModal(false)} 
                        entries={stats.filtered} 
                        bookName={`Vault_Global_Archive_${timeRange}D`}
                    />
                )}
            </AnimatePresence>

        </motion.div>
    );
};