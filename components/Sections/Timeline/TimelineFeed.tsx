"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, Inbox, Edit2, Trash2, 
    Zap, Clock, ShieldCheck, ChevronLeft, ChevronRight ,Database
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { EntryCard } from '@/components/UI/EntryCard';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

// তারিখকে সম্পূর্ণ বাংলায় রূপান্তর করার এলিট হেল্পার
const formatDateBn = (dateStr: string, lang: string) => {
    const date = new Date(dateStr);
    if (lang !== 'bn') return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    
    const day = toBn(date.getDate().toString().padStart(2, '0'), 'bn');
    const year = toBn(date.getFullYear().toString(), 'bn');
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${day} ${months[date.getMonth()]} ${year}`;
};

export const TimelineFeed = ({ 
    groupedEntries, currencySymbol, isEmpty, 
    isSwitchingPage, pagination, onEdit, onDelete, onToggleStatus 
}: any) => {
    const { t, language } = useTranslation();

    if (isEmpty) return (
        <div className="py-40 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6 opacity-20">
            <Inbox size={60} strokeWidth={1} />
            <p className="font-black uppercase text-[11px] tracking-[5px]">{t('no_timeline_records')}</p>
        </div>
    );

    return (
        <div className="relative min-h-[600px] transition-all duration-500">
            
            <AnimatePresence>
                {isSwitchingPage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--bg-app)]/40 backdrop-blur-md z-[100] flex flex-col items-center justify-center rounded-[40px]"
                    >
                        <Loader2 className="animate-spin text-orange-500" size={48} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-12">
                {Object.keys(groupedEntries).map((date) => (
                    <div key={date} className="relative">
                        
                        {/* --- 📊 THE MASTER LEDGER TABLE (Apple Metal Style) --- */}
                        <div className={cn(
                            "hidden md:block overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]",
                            "rounded-[40px] shadow-2xl transition-all duration-500"
                        )}>
                            <table className="w-full border-collapse">
                                <thead className="border-b border-[var(--border)] bg-[var(--bg-app)]/30">
                                    <tr className="text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">
                                        <th className="py-6 px-6 text-left w-14">#</th>
                                        <th className="py-6 px-4 text-left w-36">{t('label_date')}</th>
                                        <th className="py-6 px-4 text-left w-24">{t('label_time')}</th>
                                        <th className="py-6 px-4 text-left w-32">{t('label_ref_id')}</th>
                                        <th className="py-6 px-4 text-left">{t('label_protocol')}</th>
                                        <th className="py-6 px-4 text-left">{t('label_memo')}</th>
                                        <th className="py-6 px-4 text-left w-32">{t('label_tag')}</th>
                                        <th className="py-6 px-4 text-left w-28">{t('label_via')}</th>
                                        <th className="py-6 px-4 text-right w-44">{t('label_amount')}</th>
                                        <th className="py-6 px-4 text-center w-36">{t('label_status')}</th>
                                        <th className="py-6 px-6 text-right w-24">{t('label_options')}</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--border)]/10">
                                    {groupedEntries[date].map((e: any, idx: number) => {
                                        const isIncome = e.type === 'income';
                                        const isCompleted = e.status === 'completed';

                                        return (
                                            <motion.tr 
                                                key={e.localId || e._id}
                                                whileHover={{ backgroundColor: 'rgba(255, 120, 0, 0.01)' }}
                                                className="group transition-all duration-200"
                                            >
                                                {/* 1. INDEX */}
                                                <td className="py-6 px-6">
                                                    <span className="text-[10px] font-mono-finance font-bold text-[var(--text-muted)] opacity-20">
                                                        {toBn(String(idx + 1).padStart(2, '0'), language)}
                                                    </span>
                                                </td>

                                                {/* 2. DATE */}
                                                <td className="py-6 px-4">
                                                    <span className="text-[12px] font-black uppercase text-[var(--text-main)] whitespace-nowrap">
                                                        {formatDateBn(e.date, language)}
                                                    </span>
                                                </td>

                                                {/* 3. TIME */}
                                                <td className="py-6 px-4">
                                                    <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-widest">
                                                        {toBn(e.time || '00:00', language)}
                                                    </span>
                                                </td>

                                                {/* 4. REF ID (With Shield) */}
                                                <td className="py-6 px-4">
                                                    <Tooltip text={t('tt_verified_node') || "Registry Unit Verified"}>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-500/40 uppercase tracking-[2px] cursor-help">
                                                            <ShieldCheck size={11} strokeWidth={3} />
                                                            {toBn(String(e.localId || e._id).slice(-6).toUpperCase(), language)}
                                                        </div>
                                                    </Tooltip>
                                                </td>

                                                {/* 5. PROTOCOL (Title) */}
                                                <td className="py-6 px-4">
                                                    <h4 className="text-[13px] font-black uppercase italic tracking-tighter text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate max-w-[180px]">
                                                        {e.title}
                                                    </h4>
                                                </td>

                                                {/* 6. MEMO */}
                                                <td className="py-6 px-4">
                                                    <span className="text-[10px] font-bold italic text-[var(--text-muted)] opacity-30 truncate max-w-[150px] block">
                                                        {e.note ? `"${e.note}"` : "—"}
                                                    </span>
                                                </td>

                                                {/* 7. TAG (Category) */}
                                                <td className="py-6 px-4">
                                                    <Tooltip text={`${t('tt_classification')}: ${e.category}`}>
                                                        <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-[2px] cursor-default">
                                                            {e.category?.toUpperCase() || 'GENERAL'}
                                                        </span>
                                                    </Tooltip>
                                                </td>

                                                {/* 8. VIA */}
                                                <td className="py-6 px-4">
                                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] bg-[var(--bg-app)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                                                        {t(e.paymentMethod || 'cash')}
                                                    </span>
                                                </td>

                                                {/* 9. AMOUNT */}
                                                <td className="py-6 px-4 text-right">
                                                    <div className={cn(
                                                        "text-[20px] font-mono-finance font-black tracking-tighter",
                                                        isIncome ? "text-green-500" : "text-red-500"
                                                    )}>
                                                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount).toLocaleString(), language)}
                                                    </div>
                                                </td>

                                                {/* 10. STATUS (Interactive Toggle) */}
                                                <td className="py-6 px-4 text-center">
                                                    <Tooltip text={t('tt_toggle_status') || "Switch Protocol State"}>
                                                        <button 
                                                            onClick={() => onToggleStatus(e)}
                                                            className={cn(
                                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[2px] transition-all active:scale-95",
                                                                isCompleted 
                                                                    ? "bg-green-500/5 text-green-500 border-green-500/20 shadow-lg shadow-green-500/5" 
                                                                    : "bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shadow-lg shadow-yellow-500/5"
                                                            )}
                                                        >
                                                            {isCompleted ? <Zap size={10} fill="currentColor" strokeWidth={0} /> : <Clock size={10} strokeWidth={3} />}
                                                            {t(e.status)}
                                                        </button>
                                                    </Tooltip>
                                                </td>

                                                {/* 11. OPTIONS (Elite Actions) */}
                                                <td className="py-6 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <Tooltip text={t('tt_edit_record')}>
                                                            <button 
                                                                onClick={() => onEdit(e)}
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-90"
                                                            >
                                                                <Edit2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip text={t('tt_delete_record')}>
                                                            <button 
                                                                onClick={() => onDelete(e)}
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90"
                                                            >
                                                                <Trash2 size={16} strokeWidth={2.5} />
                                                            </button>
                                                        </Tooltip>
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

            {/* --- 🧭 ELITE OS PAGINATION --- */}
            <div className="flex flex-col md:flex-row justify-between items-center py-12 gap-8 border-t border-[var(--border)]/30 mt-20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-500/10 rounded-[22px] flex items-center justify-center text-orange-500 shadow-inner">
                        <Database size={24} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{t('protocol_index')}</p>
                        <p className="text-[13px] font-black text-[var(--text-main)] uppercase tracking-[2px] mt-2">
                            {toBn(pagination.currentPage, language)} <span className="opacity-20 mx-2">/</span> {toBn(pagination.totalPages, language)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <Tooltip text={t('tt_prev_page')} position="bottom">
                        <button 
                            disabled={pagination.currentPage === 1 || isSwitchingPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            className="w-16 h-16 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[25px] disabled:opacity-20 hover:border-orange-500 active:scale-90 transition-all shadow-xl"
                        >
                            <ChevronLeft size={32} strokeWidth={3} />
                        </button>
                    </Tooltip>

                    <div className="px-10 h-16 flex items-center justify-center bg-orange-500 text-white rounded-[28px] text-[14px] font-black uppercase tracking-[5px] shadow-2xl shadow-orange-500/40">
                        {toBn(pagination.currentPage, language)}
                    </div>

                    <Tooltip text={t('tt_next_page')} position="bottom">
                        <button 
                            disabled={pagination.currentPage === pagination.totalPages || isSwitchingPage}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            className="w-16 h-16 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[25px] disabled:opacity-20 hover:border-orange-500 active:scale-90 transition-all shadow-xl"
                        >
                            <ChevronRight size={32} strokeWidth={3} />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};