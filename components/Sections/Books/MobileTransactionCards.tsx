"use client";
import React, { useState } from 'react';
import { 
    Edit2, Trash2, Zap, Clock, 
    Calendar, MoreVertical, X, Hash, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

// --- ২. একক কার্ড কম্পোনেন্ট (Refactored for Compact & i18n) ---
const TransactionCard = ({ e, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { T, t } = useTranslation();
    const [showActions, setShowActions] = useState(false);
    const isIncome = e.type === 'income';
    const isCompleted = e.status === 'completed';

    return (
        <motion.div 
            layout
            className="bg-[var(--bg-card)] rounded-[var(--radius-card,32px)] border border-[var(--border-color)] p-[var(--card-padding,1.5rem)] shadow-sm relative overflow-hidden transition-all duration-300"
        >
            {/* 1. Top Header: Date & REF Integration */}
            <div className="flex justify-between items-center mb-[var(--app-gap,1.25rem)]">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="p-1.5 bg-[var(--bg-app)] rounded-lg text-[var(--text-muted)] shrink-0">
                        <Calendar size={12} />
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] whitespace-nowrap">
                        <span>{new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                        <span className="opacity-20">•</span>
                        <span className="text-orange-500/60 flex items-center gap-0.5">
                            # {T('label_ref') || "REF"}: {String(e.localId || e._id).slice(-4).toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full shrink-0">
                    <span className="text-[8px] font-black uppercase tracking-[2px] text-orange-500">
                        {e.category.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* 2. Middle Body: Title & Inline Note */}
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none truncate">
                        {e.title}
                    </h4>
                    
                    <div className="mt-2.5 flex items-center gap-1.5 opacity-40">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] truncate max-w-[180px]">
                            {e.note ? `# ${T('label_note') || "NOTE"}: "${e.note}"` : `# ${T('no_memo') || "NO PROTOCOL MEMO"}`}
                        </span>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className={`text-2xl font-mono-finance font-bold tracking-tighter leading-none ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                    </div>
                    {e.time && (
                        <p className="text-[8px] font-black text-[var(--text-muted)] opacity-30 uppercase tracking-widest mt-1">
                            {T('label_at') || "AT"} {e.time}
                        </p>
                    )}
                </div>
            </div>

            {/* 3. Bottom Footer: Status & Actions */}
            <div className="mt-[var(--app-gap,1.5rem)] pt-[var(--app-gap,1.25rem)] border-t border-[var(--border-color)]/30 flex justify-between items-center">
                {/* Status Button with Tooltip */}
                <Tooltip text={t('tt_toggle_status') || "Change Status"}>
                    <button 
                        onClick={() => onToggleStatus(e)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-[3px] transition-all active:scale-95 
                            ${isCompleted 
                                ? 'bg-green-500/5 text-green-500 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' 
                                : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]'}`}
                    >
                        {isCompleted ? <Zap size={11} fill="currentColor" /> : <Clock size={11} />}
                        {t(e.status.toLowerCase())}
                    </button>
                </Tooltip>

                {/* Staggered Action Menu */}
                <div className="flex items-center gap-2 relative">
                    <AnimatePresence>
                        {showActions && (
                            <div className="flex gap-2 mr-1">
                                <Tooltip text={t('tt_delete')}>
                                    <motion.button
                                        initial={{ opacity: 0, x: 15, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 10, scale: 0.8 }}
                                        transition={{ duration: 0.2, delay: 0.05 }}
                                        onClick={() => { onDelete(e); setShowActions(false); }}
                                        className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center active:scale-90"
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                </Tooltip>
                                
                                <Tooltip text={t('tt_edit')}>
                                    <motion.button
                                        initial={{ opacity: 0, x: 15, scale: 0.8 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 10, scale: 0.8 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => { onEdit(e); setShowActions(false); }}
                                        className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center active:scale-90"
                                    >
                                        <Edit2 size={16} />
                                    </motion.button>
                                </Tooltip>
                            </div>
                        )}
                    </AnimatePresence>

                    <Tooltip text={showActions ? t('tt_close') : t('tt_more')}>
                        <button 
                            onClick={() => setShowActions(!showActions)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 border
                                ${showActions 
                                    ? 'bg-[var(--text-main)] border-transparent text-[var(--bg-card)] rotate-90' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/30'}`}
                        >
                            {showActions ? <X size={18} /> : <MoreVertical size={18} />}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </motion.div>
    );
};

// --- ৩. মেইন কন্টেইনার কম্পোনেন্ট (Refactored Spacing & Ending text) ---
export const MobileTransactionCards = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { T } = useTranslation();

    return (
        <div className="xl:hidden space-y-[var(--app-gap,1rem)] pb-24 transition-all duration-300">
            {items.map((e: any, idx: number) => (
                <TransactionCard 
                    key={e.localId || e._id || idx}
                    e={e}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                    currencySymbol={currencySymbol}
                />
            ))}
            
            {items.length > 0 && (
                <div className="text-center py-6">
                    <div className="h-px w-12 bg-[var(--border-color)] mx-auto mb-4 opacity-60" />
                    <span className="text-[9px] font-black uppercase tracking-[6px] text-[var(--text-muted)] opacity-20">
                        {T('archive_end') || "Protocol Archive End"}
                    </span>
                </div>
            )}
        </div>
    );
};