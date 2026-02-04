"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Download, ShieldCheck, Activity } from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Modular Components
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsStats } from './AnalyticsStats';
import { AnalyticsVisuals } from './AnalyticsVisuals';

/**
 * VAULT PRO: MASTER REPORTS SECTION (STABILIZED)
 * --------------------------------------------
 * Orchestrates Financial Analytics, Visualizations, and Global Exports.
 * Fully integrated with Global Spacing, Language, and Guidance engines.
 */
export const ReportsSection = ({ currentUser }: any) => {
    const { T, t } = useTranslation();
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [showExportModal, setShowExportModal] = useState(false);

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // Data Fetching Logic (Preserved Protocol)
    const fetchLocalAnalytics = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            setAllEntries(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) { 
            console.error("ANALYSIS_PROTOCOL_FAULT"); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchLocalAnalytics();
        window.addEventListener('vault-updated', fetchLocalAnalytics);
        return () => window.removeEventListener('vault-updated', fetchLocalAnalytics);
    }, []);

    // Memory-Optimized Analytics Engine (Preserved Protocol)
    const processed = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status.toLowerCase() === 'completed');
        const pendingEntries = allEntries.filter(e => new Date(e.date) >= cutoff && e.status.toLowerCase() === 'pending');

        const totalIn = filtered.filter(e => e.type.toLowerCase() === 'income').reduce((a, b) => a + b.amount, 0);
        const totalOut = filtered.filter(e => e.type.toLowerCase() === 'expense').reduce((a, b) => a + b.amount, 0);
        const totalPending = pendingEntries.reduce((a, b) => a + b.amount, 0);

        const flowMap = new Map();
        filtered.forEach(e => {
            const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!flowMap.has(date)) flowMap.set(date, { name: date, income: 0, expense: 0 });
            const item = flowMap.get(date);
            e.type.toLowerCase() === 'income' ? item.income += e.amount : item.expense += e.amount;
        });

        const catMap = new Map();
        filtered.filter(e => e.type.toLowerCase() === 'expense').forEach(e => {
            const cat = (e.category || 'GENERAL').toUpperCase();
            if (!catMap.has(cat)) catMap.set(cat, { name: cat, value: 0 });
            catMap.get(cat).value += e.amount;
        });

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
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 transition-all">
            <Loader2 className="animate-spin text-orange-500" size={44} strokeWidth={1.5} />
            <span className="text-[10px] font-black uppercase tracking-[6px] text-[var(--text-muted)] animate-pulse">
                {t('syncing_intel') || "Syncing Intel"}
            </span>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="space-y-[var(--app-gap,1.5rem)] md:space-y-[var(--app-gap,2.5rem)] pb-32 max-w-6xl mx-auto px-[var(--app-padding,1rem)] md:px-[var(--app-padding,1.5rem)] transition-all duration-300"
        >
            {/* Header: Range Selector & Performance Title */}
            <AnalyticsHeader timeRange={timeRange} setTimeRange={setTimeRange} count={processed.filtered.length} />
            
            {/* 4-Card Summary Grid */}
            <AnalyticsStats stats={processed.stats} symbol={currencySymbol} />

            {/* Visual Charts: Area, Pie, and Liquidity Cards */}
            <AnalyticsVisuals 
                areaData={processed.areaData} 
                pieData={processed.pieData} 
                viaData={processed.viaData}
                totalExpense={processed.stats.totalOut}
                symbol={currencySymbol}
            />

            {/* --- CONSOLIDATED REGISTRY: MASTER EXPORT CTA --- */}
            <div className="app-card p-[var(--card-padding,1.5rem)] md:p-[var(--card-padding,2rem)] bg-orange-500 rounded-[var(--radius-card,35px)] flex flex-col md:flex-row items-center justify-between gap-[var(--app-gap,1.5rem)] shadow-2xl relative overflow-hidden group transition-all">
                <div className="flex items-center gap-5 md:gap-7 relative z-10 text-center md:text-left flex-col md:flex-row">
                    <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[24px] items-center justify-center text-white border border-white/20 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                        <Download size={28} strokeWidth={2.5} />
                    </div>
                    <div className="max-w-[320px]">
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                            {T('execute_report_title') || "Execute Report"}
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-bold text-white/70 uppercase tracking-[2px] mt-2 leading-relaxed">
                            {t('execute_report_desc') || "Prepare and download consolidated financial protocol archive"}
                        </p>
                    </div>
                </div>

                <Tooltip text={t('tt_execute_report')}>
                    <button 
                        onClick={() => setShowExportModal(true)} 
                        className="w-full md:w-auto px-10 h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-2xl relative z-10 border-none flex items-center justify-center gap-3"
                    >
                        <Activity size={16} className="animate-pulse text-orange-500" />
                        {T('btn_execute_archive') || "EXECUTE ARCHIVE"}
                    </button>
                </Tooltip>
            </div>

            {/* OS Signature Footer */}
            <div className="flex flex-col items-center gap-4 opacity-10 py-10 transition-all">
                <Tooltip text={t('tt_verified_os')}>
                    <div className="flex flex-col items-center gap-4">
                        <ShieldCheck size={28} className="text-[var(--text-main)]" />
                        <p className="text-[9px] font-black uppercase tracking-[8px] text-[var(--text-main)] text-center">
                            {T('intel_env_version') || "Intelligence Environment v4.8"}
                        </p>
                    </div>
                </Tooltip>
            </div>

            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={true} 
                        onClose={() => setShowExportModal(false)} 
                        entries={processed.filtered} 
                        bookName="GLOBAL_ARCHIVE" 
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};