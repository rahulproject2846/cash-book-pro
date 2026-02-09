"use client";
import React from 'react';
import { 
    Edit2, Trash2, Zap, Clock, ShieldCheck, GitCommit 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

interface Transaction {
    _id?: string;
    localId?: string | number;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    status: 'completed' | 'pending';
    date: string | Date;
    time?: string;
    category: string;
    note?: string;
    paymentMethod?: string; // ডাটাবেজ ফিল্ড
    via?: string; // লিগ্যাসি সাপোর্ট
}

interface TableProps {
    items: Transaction[];
    onEdit: (item: Transaction) => void;
    onDelete: (item: Transaction) => void;
    onToggleStatus: (item: Transaction) => void;
    currencySymbol: string;
}

export const TransactionTable = ({ 
    items, onEdit, onDelete, onToggleStatus, currencySymbol 
}: TableProps) => {
    const { T, t, language } = useTranslation();

    // তারিখ ফরম্যাটিং প্রোটোকল
    const formatDate = (dateStr: any) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
        }).toUpperCase();
    };

    return (
        <div className={cn(
            "hidden xl:block w-full overflow-hidden transition-all duration-500",
            "bg-[var(--bg-card)] border border-[var(--border)] rounded-[40px] shadow-2xl"
        )}>
            <table className="w-full border-collapse min-w-[1300px]">
                {/* --- TABLE HEADER (Master Standard) --- */}
                <thead>
                    <tr className="whitespace-nowrap border-b border-[var(--border)] bg-[var(--bg-app)]/40">
                        <th className="py-6 px-6 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-14">#</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-36">{T('label_date')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-24">{T('label_time')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-32">{T('label_ref_id')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_protocol')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{T('label_memo')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-36">{T('label_tag')}</th>
                        <th className="py-6 px-4 text-left text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-28">{T('label_via')}</th>
                        <th className="py-6 px-4 text-right text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-44">{T('label_amount')}</th>
                        <th className="py-6 px-4 text-center text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-36">{T('label_status')}</th>
                        <th className="py-6 px-6 text-right text-[9px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50 w-24">{T('label_options')}</th>
                    </tr>
                </thead>

                {/* --- TABLE BODY --- */}
                <tbody className="divide-y divide-[var(--border)]/10">
                    {items.map((e, idx) => {
                        const isIncome = e.type === 'income';
                        const isCompleted = e.status.toLowerCase() === 'completed';
                        const rowKey = e.localId || e._id || idx;

                        return (
                            <motion.tr 
                                key={rowKey}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="group hover:bg-orange-500/[0.02] transition-all duration-200"
                            >
                                {/* 1. Index */}
                                <td className="py-5 px-6">
                                    <span className="text-[10px] font-mono-finance font-bold text-[var(--text-muted)] opacity-20">
                                        {toBn(String(idx + 1).padStart(2, '0'), language)}
                                    </span>
                                </td>

                                {/* 2. Date */}
                                <td className="py-5 px-4">
                                    <span className="text-[12px] font-black uppercase text-[var(--text-main)] whitespace-nowrap">
                                        {formatDate(e.date)}
                                    </span>
                                </td>

                                {/* 3. Time */}
                                <td className="py-5 px-4">
                                    <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-widest opacity-60">
                                        {toBn(e.time || '00:00', language)}
                                    </span>
                                </td>
                               
                                {/* 4. Ref ID */}
                                <td className="py-5 px-4">
                                    <Tooltip text={t('tt_verified_node')}>
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-500/30 uppercase tracking-[2px] cursor-help">
                                            <ShieldCheck size={11} strokeWidth={3} />
                                            {toBn(String(e.localId || e._id).slice(-6).toUpperCase(), language)}
                                        </div>
                                    </Tooltip>
                                </td>

                                {/* 5. Protocol (Title) */}
                                <td className="py-5 px-4">
                                    <h4 className="text-[13px] font-black uppercase italic tracking-tighter text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate max-w-[200px]">
                                        {e.title}
                                    </h4>
                                </td>

                                {/* 6. Memo (Note) */}
                                <td className="py-5 px-4">
                                    <span className="text-[10px] font-bold italic text-[var(--text-muted)] opacity-30 truncate max-w-[150px] block">
                                        {e.note ? `"${e.note}"` : "—"}
                                    </span>
                                </td>

                                {/* 7. Category (Tag) */}
                                <td className="py-5 px-4">
                                    <span className="px-3 py-1.5 rounded-xl bg-orange-500/5 border border-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-[2px] cursor-default">
                                        {e.category?.toUpperCase() || 'GENERAL'}
                                    </span>
                                </td>

                                {/* 8. Via (Payment Method) */}
                                <td className="py-5 px-4">
                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border)]">
                                        {T((e.paymentMethod || e.via || 'cash').toLowerCase())}
                                    </span>
                                </td>

                                {/* 9. Amount (Fintech Tabular) */}
                                <td className="py-5 px-4 text-right">
                                    <div className={cn(
                                        "text-[18px] font-mono-finance font-black tracking-tighter",
                                        isIncome ? "text-green-500" : "text-red-500"
                                    )}>
                                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount).toLocaleString(), language)}
                                    </div>
                                </td>

                                {/* 10. Status Toggle */}
                                <td className="py-5 px-4 text-center">
                                    <Tooltip text={t('tt_toggle_status')}>
                                        <button 
                                            onClick={(event) => { event.stopPropagation(); onToggleStatus(e); }}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[2px] transition-all active:scale-95",
                                                isCompleted 
                                                    ? "bg-green-500/5 text-green-500 border-green-500/20 shadow-lg shadow-green-500/5" 
                                                    : "bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shadow-lg shadow-yellow-500/5"
                                            )}
                                        >
                                            {isCompleted ? <Zap size={10} fill="currentColor" strokeWidth={0} /> : <Clock size={10} strokeWidth={3} />}
                                            {T(e.status.toLowerCase())}
                                        </button>
                                    </Tooltip>
                                </td>

                                {/* 11. Command Options (Fixed Modal Triggers) */}
                                <td className="py-5 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <Tooltip text={t('tt_edit_record')}>
                                            <button 
                                                onClick={(event) => { event.stopPropagation(); onEdit(e); }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-90 shadow-sm"
                                            >
                                                <Edit2 size={16} strokeWidth={2.5} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={t('tt_delete_record')}>
                                            <button 
                                                onClick={(event) => { event.stopPropagation(); onDelete(e); }}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90 shadow-sm"
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

            {/* End Ledger Signal */}
            {items.length > 0 && (
                <div className="py-16 flex flex-col items-center opacity-10 group-hover:opacity-30 transition-opacity duration-1000">
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--text-main)] to-transparent mb-4" />
                    <div className="flex items-center gap-3">
                        <GitCommit size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-[8px]">{T('ledger_end')}</span>
                        <GitCommit size={14} strokeWidth={3} />
                    </div>
                </div>
            )}
        </div>
    );
};