"use client";
import React from 'react';
import { 
    Edit2, Trash2, Zap, Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- ১. ইন্টারফেস ডেফিনিশন (অপরিবর্তিত) ---
interface Transaction {
    _id?: string;
    localId?: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    status: 'completed' | 'pending';
    date: string | Date;
    time?: string;
    category: string;
    note?: string;
    via?: string;
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
    const { T, t } = useTranslation();

    return (
        <div className="hidden xl:block w-full overflow-x-auto no-scrollbar border-t border-[var(--border-color)] transition-all duration-300">
            <table className="w-full border-collapse min-w-[1300px]">
                {/* --- Table Header (Translated Keys) --- */}
                <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-app)]/40">
                        <th className="py-[var(--table-padding,1.25rem)] px-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-14">#</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-36">{T('label_date')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-24">{T('label_time')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-28">{T('label_ref_id')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">{T('label_protocol')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">{T('label_memo')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-32">{T('label_tag')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-24">{T('label_via')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-44">{T('label_amount')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-32">{T('label_status')}</th>
                        <th className="py-[var(--table-padding,1.25rem)] px-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 w-20">{T('label_options')}</th>
                    </tr>
                </thead>

                {/* --- Table Body --- */}
                <tbody className="divide-y divide-[var(--border-color)]/20">
                    {items.map((e, idx) => {
                        const isIncome = e.type === 'income';
                        const isCompleted = e.status === 'completed';

                        return (
                            <motion.tr 
                                key={e.localId || e._id || idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group hover:bg-orange-500/[0.02] transition-colors duration-150 border-[var(--border-color)]"
                            >
                                {/* 1. Index */}
                                <td className="py-[var(--table-padding,1.25rem)] px-6">
                                    <span className="text-[11px] font-mono text-[var(--text-muted)] opacity-30">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                </td>

                                {/* 2. Date */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="text-[13px] font-black uppercase text-[var(--text-main)] whitespace-nowrap">
                                        {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                    </span>
                                </td>

                                {/* 3. Time */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="text-[12px] font-bold text-[var(--text-muted)] tracking-widest uppercase">
                                        {e.time || '00:00'}
                                    </span>
                                </td>
                               
                                {/* 4. Ref ID */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="text-[9px] font-bold text-orange-500/40 uppercase tracking-[2px]">
                                        #{String(e.localId || e._id).slice(-4).toUpperCase()}
                                    </span>
                                </td>

                                {/* 5. Protocol (Title) */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <h4 className="text-[14px] font-black uppercase italic tracking-tighter text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate max-w-[200px]">
                                        {e.title}
                                    </h4>
                                </td>

                                {/* 6. Memo (Note) */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="text-[11px] font-medium italic text-[var(--text-muted)] opacity-60 truncate max-w-[200px] block">
                                        {e.note ? `"${e.note}"` : "—"}
                                    </span>
                                </td>

                                {/* 7. Category (Tag) */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-[8px] font-black uppercase tracking-[2px] text-orange-500/80">
                                        {e.category.toUpperCase()}
                                    </span>
                                </td>

                                {/* 8. Via */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                        {e.via || T('label_cash')}
                                    </span>
                                </td>

                                {/* 9. Amount */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4 text-right">
                                    <div className={`text-[17px] font-mono-finance font-bold tracking-tighter ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                        {isIncome ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                                    </div>
                                </td>

                                {/* 10. Status */}
                                <td className="py-[var(--table-padding,1.25rem)] px-4 text-center">
                                    <Tooltip text={t('tt_change_status')}>
                                        <button 
                                            onClick={() => onToggleStatus(e)}
                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[3px] transition-all active:scale-95 
                                                ${isCompleted 
                                                    ? 'bg-green-500/5 text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' 
                                                    : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]'}`}
                                        >
                                            {isCompleted ? <Zap size={10} fill="currentColor" /> : <Clock size={10} />}
                                            {t(e.status.toLowerCase())}
                                        </button>
                                    </Tooltip>
                                </td>

                                {/* 11. Options */}
                                <td className="py-[var(--table-padding,1.25rem)] px-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <Tooltip text={t('tt_edit_record')}>
                                            <button 
                                                onClick={() => onEdit(e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-blue-500 transition-all active:scale-90"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={t('tt_delete_record')}>
                                            <button 
                                                onClick={() => onDelete(e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Pagination / Footer Info (Injected Variables) */}
            {items.length > 0 && (
                <div className="py-[var(--app-gap,2.5rem)] flex flex-col items-center opacity-20 transition-all">
                    <div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent mb-4" />
                    <span className="text-[9px] font-black uppercase tracking-[12px]">
                        {T('ledger_end')}
                    </span>
                </div>
            )}
        </div>
    );
};