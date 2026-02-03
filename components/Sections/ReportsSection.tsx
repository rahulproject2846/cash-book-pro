"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, ShieldCheck, Activity } from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';
import { Tooltip } from '@/components/UI/Tooltip';

// Modular Components
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AnalyticsStats } from './components/AnalyticsStats';
import { AnalyticsVisuals } from './components/AnalyticsVisuals';

export const ReportsSection = ({ currentUser }: any) => {
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [showExportModal, setShowExportModal] = useState(false);

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    const fetchLocalAnalytics = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            setAllEntries(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) { console.error("ANALYSIS_PROTOCOL_FAULT"); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchLocalAnalytics();
        window.addEventListener('vault-updated', fetchLocalAnalytics);
        return () => window.removeEventListener('vault-updated', fetchLocalAnalytics);
    }, []);

    const processed = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status.toLowerCase() === 'completed');
        const pendingEntries = allEntries.filter(e => new Date(e.date) >= cutoff && e.status.toLowerCase() === 'pending');

        const totalIn = filtered.filter(e => e.type.toLowerCase() === 'income').reduce((a, b) => a + b.amount, 0);
        const totalOut = filtered.filter(e => e.type.toLowerCase() === 'expense').reduce((a, b) => a + b.amount, 0);
        const totalPending = pendingEntries.reduce((a, b) => a + b.amount, 0);

        // Chart 1: Trend Map
        const flowMap = new Map();
        filtered.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!flowMap.has(date)) flowMap.set(date, { name: date, income: 0, expense: 0 });
            const item = flowMap.get(date);
            e.type.toLowerCase() === 'income' ? item.income += e.amount : item.expense += e.amount;
        });

        // Chart 2: Category Split
        const catMap = new Map();
        filtered.filter(e => e.type.toLowerCase() === 'expense').forEach(e => {
            const cat = (e.category || 'GENERAL').toUpperCase();
            if (!catMap.has(cat)) catMap.set(cat, { name: cat, value: 0 });
            catMap.get(cat).value += e.amount;
        });

        // Chart 3: Method Split
        const viaMap: { [key: string]: number } = { CASH: 0, BANK: 0 };
        filtered.filter(e => e.type.toLowerCase() === 'expense').forEach(e => {
            const method = (e.paymentMethod || 'CASH').toUpperCase();
            if (method === 'CASH' || method === 'BANK') viaMap[method] += e.amount;
        });

        return {
            filtered,
            stats: { totalIn, totalOut, totalPending, net: totalIn - totalOut },
            areaData: Array.from(flowMap.values()),
            pieData: Array.from(catMap.values()).sort((a:any, b:any) => b.value - a.value),
            viaData: viaMap
        };
    }, [allEntries, timeRange]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="animate-spin text-orange-500" size={44} strokeWidth={1.5} />
            <span className="text-[10px] font-black uppercase tracking-[6px] text-[var(--text-muted)] animate-pulse">Syncing Intel</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10 pb-32 max-w-6xl mx-auto px-4 md:px-6">
            
            <AnalyticsHeader timeRange={timeRange} setTimeRange={setTimeRange} count={processed.filtered.length} />
            
            <AnalyticsStats stats={processed.stats} symbol={currencySymbol} />

            <AnalyticsVisuals 
                areaData={processed.areaData} 
                pieData={processed.pieData} 
                viaData={processed.viaData}
                totalExpense={processed.stats.totalOut}
                symbol={currencySymbol}
            />

            {/* --- CONSOLIDATED REGISTRY (Redesigned Compact Card) --- */}
            <div className="app-card p-6 md:p-8 bg-orange-500 rounded-[35px] md:rounded-[45px] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 shadow-2xl relative overflow-hidden group">
                <div className="flex items-center gap-5 md:gap-7 relative z-10 text-center md:text-left flex-col md:flex-row">
                    {/* Compact Glass Icon for Desktop */}
                    <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[24px] items-center justify-center text-white border border-white/20 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                        <Download size={28} strokeWidth={2.5} />
                    </div>
                    <div className="max-w-[320px]">
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Execute Report</h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-white/70 uppercase tracking-[2px] mt-2 leading-relaxed">Prepare and download consolidated financial protocol archive</p>
                    </div>
                </div>

                <Tooltip text="Download PDF/Excel">
                <button 
                    onClick={() => setShowExportModal(true)} 
                    className="w-full md:w-auto px-10 h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10 border-none flex items-center justify-center gap-3"
                >
                    <Activity size={16} className="animate-pulse text-orange-500" />
                    EXECUTE ARCHIVE
                </button>
                </Tooltip>
            </div>

            {/* OS Signature Footer */}
            <div className="flex flex-col items-center gap-4 opacity-10 py-10">
                <ShieldCheck size={28} />
                <p className="text-[9px] font-black uppercase tracking-[8px]">Intelligence Environment v4.8</p>
            </div>

            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal isOpen={true} onClose={() => setShowExportModal(false)} entries={processed.filtered} bookName="GLOBAL_ARCHIVE" />
                )}
            </AnimatePresence>
        </motion.div>
    );
};