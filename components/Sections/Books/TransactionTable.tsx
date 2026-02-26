"use client";
import React, { useState, useDeferredValue, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Edit2, Trash2, Zap, Clock, ShieldCheck, GitCommit, Copy, 
    MoreHorizontal, ArrowUpRight, ArrowDownLeft, Tag
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { useVaultStore } from '@/lib/vault/store/index';
import { useInteractionGuard } from '@/lib/vault/store/storeHelper';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';

// --- 📱 MOBILE TRANSACTION CARD COMPONENT ---
const TransactionCard = memo(({ e, idx, onEdit, onDelete, onContextMenu, language, formatDate, t, currencySymbol }: any) => {
    const isIncome = e.type === 'income';
    const isCompleted = e.status?.toLowerCase() === 'completed';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            onContextMenu={(event) => onContextMenu(event, e)}
            className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] p-5 shadow-sm active:scale-[0.98] transition-all"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner",
                        isIncome ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                        {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                        <h4 className="text-[13px] font-black text-[var(--text-main)]     line-clamp-1">{e.title}</h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)]     opacity-50">{formatDate(e.date)}</p>
                    </div>
                </div>
                <div className={cn(
                    "text-lg font-mono-finance font-black",
                    isIncome ? "text-green-500" : "text-red-500"
                )}>
                    {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount).toLocaleString(), language)}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]/50">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[8px] font-black text-orange-500  ">
                        {e.category || 'GENERAL'}
                    </span>
                    <div className={cn(
                        "flex items-center gap-1.5 text-[8px] font-bold    ",
                        isCompleted ? "text-green-500" : "text-yellow-500"
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isCompleted ? "bg-green-500" : "bg-yellow-500")} />
                        {t(e.status?.toLowerCase() || 'completed')}
                    </div>
                </div>
                
                <button 
                    onMouseDown={(event) => { event.preventDefault(); event.stopPropagation(); onEdit(e); }}
                    className="w-8 h-8 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] active:bg-orange-500 active:text-white transition-all"
                >
                    <Edit2 size={14} />
                </button>
            </div>
        </motion.div>
    );
});

// --- 🏛️ MAIN TRANSACTION TABLE COMPONENT ---
export const TransactionTable = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { t, language } = useTranslation();
    const { isInteractionBlocked } = useInteractionGuard();
    const { openModal } = useModal();
    const { deleteEntry, userId } = useVaultStore();
    
    const deferredEntries = useDeferredValue(items);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: any } | null>(null);

    const formatDate = useCallback((dateStr: any) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
        });
    }, [language]);

    const handleContextMenu = useCallback((e: React.MouseEvent, entry: any) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entry });
    }, []);

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    React.useEffect(() => {
        document.addEventListener('click', closeContextMenu);
        return () => document.removeEventListener('click', closeContextMenu);
    }, [closeContextMenu]);

    return (
        <div className="w-full">
            {/* 🌑 CONTEXT MENU */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-[3000] apple-glass rounded-2xl border border-[var(--border)] shadow-2xl py-2 min-w-[180px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button onMouseDown={(e) => { e.preventDefault(); onEdit(contextMenu.entry); closeContextMenu(); }} className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-orange-500/10 transition-colors">
                            <Edit2 size={16} className="text-orange-500" />
                            <span className="text-[11px] font-black    ">{t('edit_entry')}</span>
                        </button>
                        <button onClick={() => { 
                            openModal('deleteConfirm', { targetName: contextMenu.entry.title, onConfirm: () => deleteEntry(contextMenu.entry) }); 
                            closeContextMenu(); 
                        }} className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-red-500/10 transition-colors border-t border-[var(--border)]/50">
                            <Trash2 size={16} className="text-red-500" />
                            <span className="text-[11px] font-black     text-red-500">{t('delete_entry')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 📱 MOBILE VIEW (Visible on Small Screens) */}
            <div className="xl:hidden grid grid-cols-1 gap-4 p-4">
                {deferredEntries.map((e: any, idx: number) => (
                    <TransactionCard 
                        key={e.cid || e.localId || idx}
                        e={e} idx={idx} onEdit={onEdit} onDelete={onDelete} 
                        onContextMenu={handleContextMenu} language={language}
                        formatDate={formatDate} t={t} currencySymbol={currencySymbol}
                    />
                ))}
            </div>

            {/* 🖥️ DESKTOP VIEW (Visible on Large Screens Only) */}
            <div className="hidden xl:block w-full overflow-hidden apple-glass rounded-[40px] border border-[var(--border)] shadow-2xl">
                <div className="grid-header px-8 py-5 bg-[var(--bg-app)]/30 border-b border-[var(--border)]">
                    <div className="grid grid-cols-11 gap-4 text-[10px] font-black      text-[var(--text-muted)] opacity-50">
                        <div className="text-left">#</div>
                        <div className="text-left">{t('label_date')}</div>
                        <div className="text-left">{t('label_time')}</div>
                        <div className="text-left">{t('label_ref_id')}</div>
                        <div className="text-left">{t('label_protocol')}</div>
                        <div className="text-left">{t('label_memo')}</div>
                        <div className="text-left">{t('label_tag')}</div>
                        <div className="text-left">{t('label_via')}</div>
                        <div className="text-right">{t('label_amount')}</div>
                        <div className="text-center">{t('label_status')}</div>
                        <div className="text-right">{t('label_options')}</div>
                    </div>
                </div>

                <div className="divide-y divide-[var(--border)]/10">
                    {deferredEntries.map((e: any, idx: number) => {
                        const rowKey = String(e.localId || e._id || e.cid || `idx-${idx}`);
                        return (
                            <motion.div
                                key={rowKey}
                                onContextMenu={(event) => handleContextMenu(event, e)}
                                className="group grid grid-cols-11 gap-4 px-8 py-5 items-center hover:bg-white/[0.02] transition-all cursor-pointer"
                            >
                                <h1 className="text-2xl font-black font-mono-finance opacity-20">{toBn(String(idx + 1).padStart(2, '0'), language)}</h1>
                                <div className="text-[11px] font-black   text-[var(--text-main)]">{formatDate(e.date)}</div>
                                <div className="text-[10px] font-bold text-[var(--text-muted)]">{toBn(e.time || '00:00', language)}</div>
                                <div className="flex items-center gap-1 text-[8px] font-black text-orange-500/40">
                                    <ShieldCheck size={10} /> {toBn(String(e.localId || e._id).slice(-6), language)}
                                </div>
                                <div className="text-[13px] font-black   text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate">{e.title}</div>
                                <div className="text-[10px] font-medium text-[var(--text-muted)] opacity-30 truncate">{e.note || "—"}</div>
                                <div className="px-3 py-1 rounded-lg bg-orange-500/5 border border-orange-500/10 text-orange-500 text-[8px] font-black  ">{e.category || 'General'}</div>
                                <div className="text-[9px] font-black   text-[var(--text-muted)] bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border)]">{t((e.paymentMethod || e.via || 'cash').toLowerCase())}</div>
                                <div className={cn("text-[18px] font-mono-finance font-black text-right", e.type === 'income' ? "text-green-500" : "text-red-500")}>
                                    {e.type === 'income' ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount).toLocaleString(), language)}
                                </div>
                                <div className="flex justify-center">
                                    <div className={cn("px-3 py-1.5 rounded-xl border text-[8px] font-black  ", e.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20")}>
                                        {t(e.status?.toLowerCase())}
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onMouseDown={(ev) => { ev.preventDefault(); onEdit(e); }} className="w-8 h-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-orange-500"><Edit2 size={14} /></button>
                                    <button onClick={() => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => deleteEntry(e) })} className="w-8 h-8 rounded-lg bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* END SIGNAL */}
            <div className="py-16 flex flex-col items-center opacity-10">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--text-main)] to-transparent mb-4" />
                <div className="flex items-center gap-3">
                    <GitCommit size={14} strokeWidth={3} />
                    <span className="text-[10px] font-black     ">{t('ledger_end')}</span>
                    <GitCommit size={14} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
};