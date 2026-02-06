"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, History, ChevronLeft, ChevronRight, 
    Loader2, Database, Zap, Inbox, Activity, 
    ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck
} from 'lucide-react';

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

export const TimelineFeed = ({ 
    groupedEntries, 
    currencySymbol, 
    isEmpty, 
    isSwitchingPage, 
    pagination 
}: any) => {
    const { T, t, language } = useTranslation();

    if (isEmpty) return (
        <div className="py-40 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6 opacity-30">
            <Inbox size={48} strokeWidth={1} />
            <p className="font-black uppercase text-[11px] tracking-[5px]">{T('no_timeline_records')}</p>
        </div>
    );

    return (
        <div className="relative min-h-[600px] transition-all duration-500">
            
            {/* --- ⏳ LOADING OVERLAY --- */}
            <AnimatePresence>
                {isSwitchingPage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--bg-app)]/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-4 rounded-[32px]"
                    >
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-10">
                {Object.keys(groupedEntries).map((date) => (
                    <div key={date} className="relative">
                        
                        {/* --- 🗓️ STICKY DATE HEADER --- */}
                        <div className="sticky top-20 z-20 flex items-center gap-4 py-3 mb-4 bg-[var(--bg-app)]/80 backdrop-blur-md">
                            <div className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">
                                {date}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent opacity-50" />
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">
                                {toBn(groupedEntries[date].length, language)} {T('protocols_label')}
                            </span>
                        </div>

                        {/* --- 📊 THE HYBRID LEDGER TABLE --- */}
                        <div className="overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] shadow-sm">
                            <table className="w-full border-collapse">
                                {/* Desktop Table Header */}
                                <thead className="hidden md:table-header-group border-b border-[var(--border)] bg-[var(--bg-app)]/30">
                                    <tr>
                                        <th className="py-4 px-6 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_time')}</th>
                                        <th className="py-4 px-6 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_protocol')}</th>
                                        <th className="py-4 px-6 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_tag')}</th>
                                        <th className="py-4 px-6 text-right text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_amount')}</th>
                                        <th className="py-4 px-6 text-center text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-20"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--border)]/10">
                                    {groupedEntries[date].map((e: any, idx: number) => {
                                        const isIncome = e.type === 'income';
                                        const isCompleted = e.status === 'completed';

                                        return (
                                            <motion.tr 
                                                key={e.localId || e._id}
                                                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.02)' }}
                                                className="group transition-all duration-200"
                                            >
                                                {/* 1. TIME & NODE */}
                                                <td className="py-4 md:py-5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isIncome ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                                        <span className="text-[10px] md:text-[12px] font-bold text-[var(--text-muted)] font-mono">
                                                            {toBn(e.time || '00:00', language)}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 2. ACTIVITY / TITLE */}
                                                <td className="py-4 md:py-5 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] md:text-[15px] font-black uppercase italic tracking-tighter text-[var(--text-main)] group-hover:text-orange-500 transition-colors">
                                                            {e.title}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-40 uppercase tracking-widest mt-1 truncate max-w-[150px] md:max-w-xs">
                                                            {e.note || `// ${T('protocol_secured')}`}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* 3. CLASSIFICATION (Desktop Only) */}
                                                <td className="hidden md:table-cell py-4 md:py-5 px-6">
                                                    <span className="px-3 py-1 bg-[var(--bg-app)] border border-[var(--border)] rounded-lg text-[8px] font-black uppercase tracking-[2px] text-orange-500/70">
                                                        {e.category}
                                                    </span>
                                                </td>

                                                {/* 4. AMOUNT (Haptic Typography) */}
                                                <td className="py-4 md:py-5 px-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className={`text-[16px] md:text-[20px] font-mono-finance font-bold tracking-tighter ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                                            {isIncome ? '+' : '-'}{currencySymbol}{toBn(e.amount.toLocaleString(), language)}
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 opacity-40">
                                                            {isCompleted ? <Zap size={8} fill="currentColor" className="text-orange-500" /> : <Clock size={8} />}
                                                            <span className="text-[8px] font-black uppercase tracking-widest">{T(e.status)}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 5. QUICK LINK / ACTION */}
                                                <td className="py-4 md:py-5 px-6 text-center">
                                                    <div className="w-8 h-8 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:text-orange-500">
                                                        <ArrowUpRight size={16} />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 🧭 MASTER PAGINATION --- */}
            <div className="flex flex-col md:flex-row justify-between items-center py-12 gap-8 border-t border-[var(--border)] mt-16">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                        <Database size={14} />
                    </div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">
                        {T('protocol_index')} {toBn(pagination.currentPage, language)} / {toBn(pagination.totalPages, language)}
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    <button 
                        disabled={pagination.currentPage === 1 || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 active:scale-90 transition-all shadow-sm"
                    >
                        <ChevronLeft size={22} strokeWidth={3}/>
                    </button>

                    <div className="px-8 py-3.5 bg-orange-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[3px] shadow-xl shadow-orange-500/20">
                        {T('page_label') || "PAGE"} {toBn(pagination.currentPage, language)}
                    </div>

                    <button 
                        disabled={pagination.currentPage === pagination.totalPages || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 active:scale-90 transition-all shadow-sm"
                    >
                        <ChevronRight size={22} strokeWidth={3}/>
                    </button>
                </div>
            </div>
        </div>
    );
};