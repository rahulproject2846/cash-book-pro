"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, Download, ShieldCheck, Activity, 
    BarChart3, Zap, Fingerprint, ShieldAlert, Cpu
} from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Modular Components (v5.2 Refined)
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsStats } from './AnalyticsStats';
import { AnalyticsVisuals } from './AnalyticsVisuals';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const ReportsSection = ({ currentUser }: any) => {
    const { T, t, language } = useTranslation();
    const [allEntries, setAllEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30');
    const [showExportModal, setShowExportModal] = useState(false);

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- 🧬 ১. DATA PROTOCOL (Logic Preserved) ---
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

    // --- 🧬 ২. ANALYTICS ENGINE (Logic Preserved) ---
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
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6 transition-all duration-500">
            <div className="relative">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <BarChart3 className="absolute inset-0 m-auto text-orange-500/40" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[5px] text-orange-500/40 animate-pulse">
                {t('syncing_intel') || "Compiling Intelligence"}
            </span>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1400px] mx-auto space-y-[var(--app-gap,2.5rem)] pb-40 px-[var(--app-padding,1.25rem)] md:px-8 transition-all duration-500"
        >
            {/* --- ১. MASTER HEADER (Fixed: No Duplication) --- */}
            <AnalyticsHeader 
                timeRange={timeRange} 
                setTimeRange={setTimeRange} 
                count={processed.filtered.length} 
            />
            
            {/* --- ২. SUMMRY GRID --- */}
            <AnalyticsStats stats={processed.stats} symbol={currencySymbol} />

            {/* --- ৩. VISUAL LAYERING (Charts) --- */}
            <AnalyticsVisuals 
                areaData={processed.areaData} 
                pieData={processed.pieData} 
                viaData={processed.viaData}
                totalExpense={processed.stats.totalOut}
                symbol={currencySymbol}
            />

            {/* --- ৪. MASTER EXPORT CTA (OS Component Style) --- */}
            <div className="relative bg-orange-500 rounded-[40px] p-8 md:p-12 overflow-hidden shadow-[0_30px_60px_-15px_rgba(249,115,22,0.3)] group transition-all duration-500">
                {/* Visual Background Decoration */}
                <div className="absolute -right-10 -top-10 opacity-[0.1] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Cpu size={300} strokeWidth={1} className="text-white" />
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                    <div className="flex items-center gap-6 text-center lg:text-left flex-col lg:flex-row max-w-2xl">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-2xl rounded-[30px] flex items-center justify-center text-white border border-white/30 shadow-2xl group-hover:rotate-6 transition-transform">
                            <Download size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-tight">
                                {T('execute_report_title') || "EXECUTE ARCHIVE PROTOCOL"}
                            </h3>
                            <p className="text-[10px] md:text-[12px] font-bold text-white/80 uppercase tracking-[2px] mt-3 leading-relaxed opacity-80">
                                {t('execute_report_desc') || "Compile and unseal consolidated financial intelligence into a secure offline extraction format."}
                            </p>
                        </div>
                    </div>

                    <Tooltip text={t('tt_execute_report')}>
                        <button 
                            onClick={() => setShowExportModal(true)} 
                            className="w-full lg:w-auto px-12 h-16 bg-black text-white rounded-[24px] text-[11px] font-black uppercase tracking-[4px] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 group/btn"
                        >
                            <Fingerprint size={20} className="text-orange-500 group-hover/btn:rotate-12 transition-transform" strokeWidth={3} />
                            {T('btn_execute_archive') || "EXECUTE EXTRACTION"}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* --- ৫. OS IDENTITY FOOTER --- */}
            <div className="flex flex-col items-center gap-4 py-20">
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent opacity-30 mb-2" />
                <div className="flex items-center gap-6 opacity-20 hover:opacity-50 transition-opacity duration-500 cursor-default">
                    <ShieldCheck size={32} strokeWidth={1.5} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[8px] leading-none">
                            {T('vault_pro_split_1')} {T('vault_pro_split_2')}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-[3px] mt-2">
                            {T('intel_env_version') || "INTELLIGENCE ENGINE V5.2"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modals Interface */}
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