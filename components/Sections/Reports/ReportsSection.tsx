"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BarChart3, Download, Fingerprint, Cpu } from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { useTranslation } from '@/hooks/useTranslation';
import { HubHeader } from '@/components/Layout/HubHeader';
import { TimeRangeSelector } from '@/components/TimeRangeSelector';
import { StatsGrid } from '@/components/UI/StatsGrid';
import { toBn } from '@/lib/utils/helpers';
import dynamic from 'next/dynamic';

// ১. চার্ট কম্পোনেন্টকে ডাইনামিক করো
const AnalyticsVisuals = dynamic(() => import('./AnalyticsVisuals').then(mod => mod.AnalyticsVisuals), { 
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-orange-500/5 rounded-[40px]" />
});

// ২. এক্সপোর্ট মোডালকে ডাইনামিক করো (এটি অনেক বড় লাইব্রেরি নিয়ে বসে থাকে)
const AdvancedExportModal = dynamic(() => import('@/components/Modals/AdvancedExportModal').then(mod => mod.AdvancedExportModal), { 
    ssr: false 
});

export const ReportsSection = ({ currentUser }: any) => {
    const { t, language } = useTranslation();
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [showExportModal, setShowExportModal] = useState(false);

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // ১. ডাটা লোড প্রোটোকল
    const fetchLocalAnalytics = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            setAllEntries(data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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

    // ২. অ্যানালিটিক্স ইঞ্জিন (Math Logic Restored)
    const processed = useMemo(() => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));

        const filtered = allEntries.filter(e => new Date(e.date) >= cutoff && e.status?.toLowerCase() === 'completed');
        const pendingEntries = allEntries.filter(e => new Date(e.date) >= cutoff && e.status?.toLowerCase() === 'pending');

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
            if (viaMap.hasOwnProperty(method)) viaMap[method] += e.amount;
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
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-orange-500/40">{t('syncing_intel')}</span>
        </div>
    );

    return (
        <div className="w-full max-w-[1440px] mx-auto pb-40">
            <HubHeader 
                title={t('nav_reports')} 
                subtitle={`${toBn(processed.filtered.length, language)} ${t('records_analyzed')}`}
                icon={BarChart3}
                showSearch={false}
            >
                {/* রেসপন্সিভ বাটন গ্রুপ স্লটে ইনজেক্ট করা হলো */}
                <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </HubHeader>

            <div className="px-[var(--app-padding,1.25rem)] md:px-8 space-y-10 mt-6">
                <StatsGrid 
        income={processed.stats.totalIn} 
        expense={processed.stats.totalOut} 
        pending={processed.stats.totalPending}
        surplus={processed.stats.net}
        currency={currentUser?.currency} 
        isReport={true}
    />

    {/* আপনার ভিজ্যুয়াল কম্পোনেন্টগুলো */}
    <AnalyticsVisuals 
        areaData={processed.areaData} 
        pieData={processed.pieData} 
        viaData={processed.viaData} 
        totalExpense={processed.stats.totalOut} 
        symbol={currencySymbol} 
    />
                {/* Export Protocol Section */}
                <div className="bg-orange-500 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl group">
                    <div className="absolute -right-10 -top-10 opacity-[0.1] rotate-12 group-hover:scale-110 transition-transform duration-700">
                        <Cpu size={300} strokeWidth={1} className="text-white" />
                    </div>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 text-white shadow-xl">
                                <Download size={28} />
                            </div>
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{t('execute_report_title')}</h3>
                                <p className="text-[10px] md:text-[12px] font-bold text-white/80 uppercase tracking-[2px] mt-3 opacity-80 max-w-xl">{t('execute_report_desc')}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowExportModal(true)} className="w-full lg:w-auto px-12 h-16 bg-black text-white rounded-[24px] text-[11px] font-black uppercase tracking-[4px] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4">
                            <Fingerprint size={20} className="text-orange-500" strokeWidth={3} />
                            {t('btn_execute_archive')}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showExportModal && <AdvancedExportModal isOpen={true} onClose={() => setShowExportModal(false)} entries={processed.filtered} bookName="GLOBAL_ARCHIVE" />}
            </AnimatePresence>
        </div>
    );
};