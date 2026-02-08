"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, Database, Zap, Inbox, Edit2, Trash2, 
    Clock, ShieldCheck, ChevronLeft, ChevronRight 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: UNIVERSAL BENGALI CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { 
        '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', 
        '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', 
        ',':',', '.':'.', ':':':', '/': '/'
    };
    return str.split('').map(c => bnNums[c] || c).join('');
};

// তারিখকে সম্পূর্ণ বাংলায় রূপান্তর (যেমন: ০৬ FEB ২০২৬)
const formatDateBn = (dateStr: string, lang: string) => {
    if (lang !== 'bn') return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    
    const date = new Date(dateStr);
    const day = toBn(date.getDate().toString().padStart(2, '0'), 'bn');
    const year = toBn(date.getFullYear().toString(), 'bn');
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${day} ${months[date.getMonth()]} ${year}`;
};

export const TimelineFeed = ({ 
    groupedEntries, 
    currencySymbol, 
    isEmpty, 
    isSwitchingPage, 
    pagination,
    onEdit, 
    onDelete, 
    onToggleStatus 
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
            
            <AnimatePresence>
                {isSwitchingPage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--bg-app)]/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center rounded-[32px]"
                    >
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-12">
                {Object.keys(groupedEntries).map((date) => (
                    <div key={date} className="relative">
                        
                        {/* --- 📊 THE MASTER LEDGER TABLE (SCREENSHOT MATCH) --- */}
                        <div className="hidden md:block overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] shadow-2xl">
                            <table className="w-full border-collapse">
                                <thead className="border-b border-[var(--border-color)] bg-[var(--bg-app)]/40">
                                    <tr className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">
                                        <th className="py-5 px-6 text-left w-14">#</th>
                                        <th className="py-5 px-4 text-left w-36">{T('label_date')}</th>
                                        <th className="py-5 px-4 text-left w-24">{T('label_time')}</th>
                                        <th className="py-5 px-4 text-left w-28">{T('label_ref_id')}</th>
                                        <th className="py-5 px-4 text-left">{T('label_protocol')}</th>
                                        <th className="py-5 px-4 text-left">{T('label_memo')}</th>
                                        <th className="py-5 px-4 text-left w-32">{T('label_tag')}</th>
                                        <th className="py-5 px-4 text-left w-24">{T('label_via')}</th>
                                        <th className="py-5 px-4 text-right w-44">{T('label_amount')}</th>
                                        <th className="py-5 px-4 text-center w-36">{T('label_status')}</th>
                                        <th className="py-5 px-6 text-right w-24">{T('label_options')}</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-[var(--border-color)]/10">
                                    {groupedEntries[date].map((e: any, idx: number) => {
                                        const isIncome = e.type === 'income';
                                        const isCompleted = e.status === 'completed';

                                        return (
                                            <motion.tr 
                                                key={e.localId || e._id}
                                                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
                                                className="group transition-all duration-200"
                                            >
                                                {/* 1. INDEX */}
                                                <td className="py-5 px-6">
                                                    <span className="text-[11px] font-mono-finance font-bold text-[var(--text-muted)] opacity-30">
                                                        {toBn(String(idx + 1).padStart(2, '0'), language)}
                                                    </span>
                                                </td>

                                                {/* 2. DATE */}
                                                <td className="py-5 px-4">
                                                    <span className="text-[13px] font-black uppercase text-[var(--text-main)] whitespace-nowrap">
                                                        {formatDateBn(e.date, language)}
                                                    </span>
                                                </td>

                                                {/* 3. TIME */}
                                                <td className="py-5 px-4">
                                                    <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-widest">
                                                        {toBn(e.time || '00:00', language)}
                                                    </span>
                                                </td>

                                                {/* 4. REF ID (With Shield) */}
                                                <td className="py-5 px-4">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-500/40 uppercase tracking-[2px]">
                                                        <ShieldCheck size={10} strokeWidth={3} />
                                                        {toBn(String(e.localId || e._id).slice(-4).toUpperCase(), language)}
                                                    </div>
                                                </td>

                                                {/* 5. PROTOCOL (Title) */}
                                                <td className="py-5 px-4">
                                                    <h4 className="text-[14px] font-black uppercase italic tracking-tighter text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate max-w-[200px]">
                                                        {e.title}
                                                    </h4>
                                                </td>

                                                {/* 6. MEMO */}
                                                <td className="py-5 px-4">
                                                    <span className="text-[11px] font-bold italic text-[var(--text-muted)] opacity-40 truncate max-w-[150px] block">
                                                        {e.note ? `"${e.note}"` : "—"}
                                                    </span>
                                                </td>

                                                {/* 7. TAG (Category) */}
                                                <td className="py-5 px-4">
                                                    <span className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[8px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/10">
                                                        {e.category?.toUpperCase() || 'GENERAL'}
                                                    </span>
                                                </td>

                                                {/* 8. VIA */}
                                                <td className="py-5 px-4">
                                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border-color)]">
                                                        {T(e.paymentMethod || 'cash')}
                                                    </span>
                                                </td>

                                                {/* 9. AMOUNT */}
                                                <td className="py-5 px-4 text-right">
                                                    <div className={`text-[18px] font-mono-finance font-bold tracking-tighter ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(e.amount.toLocaleString(), language)}
                                                    </div>
                                                </td>

                                                {/* 10. STATUS */}
                                                <td className="py-5 px-4 text-center">
                                                    <button 
                                                        onClick={() => onToggleStatus(e)}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[2.5px] transition-all active:scale-95 
                                                            ${isCompleted 
                                                                ? 'bg-green-500/5 text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' 
                                                                : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]'}`}
                                                    >
                                                        {isCompleted ? <Zap size={10} fill="currentColor" strokeWidth={0} /> : <Clock size={10} strokeWidth={3} />}
                                                        {T(e.status)}
                                                    </button>
                                                </td>

                                                {/* 11. OPTIONS (COMMANDS) */}
                                                <td className="py-5 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                        <Tooltip text={t('tt_edit_record')}>
                                                            <button 
                                                                onClick={() => onEdit(e)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-90 shadow-sm"
                                                            >
                                                                <Edit2 size={14} strokeWidth={2.5} />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip text={t('tt_delete_record')}>
                                                            <button 
                                                                onClick={() => onDelete(e)}
                                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90 shadow-sm"
                                                            >
                                                                <Trash2 size={14} strokeWidth={2.5} />
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

                        {/* মোবাইল কার্ড ভিউ এর জন্য আমরা পরবর্তী ধাপে একটি নতুন ফাইল বানাবো */}
                    </div>
                ))}
            </div>

            {/* --- 🧭 MASTER PAGINATION (Elite OS Style) --- */}
            <div className="flex flex-col md:flex-row justify-between items-center py-12 gap-8 border-t border-[var(--border-color)]/30 mt-20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                        <Database size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{T('protocol_index')}</p>
                        <p className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[2px] mt-1.5">
                            {toBn(pagination.currentPage, language)} <span className="opacity-20 mx-1">/</span> {toBn(pagination.totalPages, language)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <button 
                        disabled={pagination.currentPage === 1 || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 hover:border-orange-500/50 active:scale-90 transition-all shadow-lg"
                    >
                        <ChevronLeft size={28} strokeWidth={3} />
                    </button>

                    <div className="min-w-[120px] h-14 flex items-center justify-center bg-orange-500 text-white rounded-[24px] text-[13px] font-black uppercase tracking-[4px] shadow-2xl shadow-orange-500/30">
                        {T('page_label') || "PAGE"} {toBn(pagination.currentPage, language)}
                    </div>

                    <button 
                        disabled={pagination.currentPage === pagination.totalPages || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 hover:border-orange-500/50 active:scale-90 transition-all shadow-lg"
                    >
                        <ChevronRight size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};