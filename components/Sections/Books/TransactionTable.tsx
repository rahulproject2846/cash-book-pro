"use client";
import React, { useState, useDeferredValue, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Edit2, Trash2, Zap, Clock, ShieldCheck, GitCommit, Copy, MoreHorizontal 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { useVaultStore } from '@/lib/vault/store/index';
import { useVaultState, useInteractionGuard } from '@/lib/vault/store/storeHelper';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';

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

export const TransactionTable = () => {
    const { t, language } = useTranslation();
    const { isInteractionBlocked } = useInteractionGuard();
    const { openModal } = useModal();
    const { deleteEntry } = useVaultStore();
    
    // AUTONOMOUS STORE ACCESS - NO PROPS
    const {
        processedEntries,
        activeBook
    } = useVaultState();
    
    // PERFORMANCE: useDeferredValue for 100k data
    const deferredEntries = useDeferredValue(processedEntries);
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: any } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    
    // Get currency symbol from active book or default
    const currencySymbol = activeBook?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // তারিখ ফরম্যাটিং প্রোটোকল
    const formatDate = useCallback((dateStr: any) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric' 
        });
    }, [language]);

    // Context Menu Handler
    const handleContextMenu = useCallback((e: React.MouseEvent, entry: any) => {
        e.preventDefault();
        if (isInteractionBlocked) return;
        
        setContextMenu({ x: e.clientX, y: e.clientY, entry });
    }, [isInteractionBlocked]);

    // Close Context Menu
    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Copy CID Handler
    const copyToClipboard = useCallback(async (cid: string) => {
        try {
            await navigator.clipboard.writeText(cid);
            // Visual feedback could be added here
        } catch (error) {
            console.error('Failed to copy CID:', error);
        }
        closeContextMenu();
    }, [closeContextMenu]);

    // Toggle Row Expansion
    const toggleRowExpansion = useCallback((entryId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    }, []);

    // Global click handler for context menu
    React.useEffect(() => {
        const handleClick = () => closeContextMenu();
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [closeContextMenu]);

    // Memoized grid columns for responsive design
    const gridColumns = useMemo(() => ({
        desktop: '60px 120px 80px 100px 1fr 200px 120px 100px 140px 100px 120px',
        tablet: '50px 100px 70px 90px 1fr 150px 100px 80px 120px 90px 100px'
    }), []);

    return (
        <>
            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed z-50 apple-glass rounded-xl border border-[var(--border)] shadow-2xl py-2 min-w-[160px]"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button
                            onClick={() => {
                                // TODO: Connect to store action
                                console.log('Edit entry:', contextMenu.entry);
                                closeContextMenu();
                            }}
                            className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-[var(--bg-app)]/50 transition-colors"
                        >
                            <Edit2 size={16} className="text-[var(--text-muted)]" />
                            <span className="text-sm font-medium">{t('edit_entry')}</span>
                        </button>
                        <button
                            onClick={() => {
                                // TODO: Connect to store action
                                console.log('Delete entry:', contextMenu.entry);
                                closeContextMenu();
                            }}
                            className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-[var(--bg-app)]/50 transition-colors"
                        >
                            <Trash2 size={16} className="text-red-500" />
                            <span className="text-sm font-medium text-red-500">{t('delete_entry')}</span>
                        </button>
                        <button
                            onClick={() => copyToClipboard(contextMenu.entry.cid || contextMenu.entry._id)}
                            className="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-[var(--bg-app)]/50 transition-colors"
                        >
                            <Copy size={16} className="text-[var(--text-muted)]" />
                            <span className="text-sm font-medium">{t('copy_cid')}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Container */}
            <div className={cn(
                "hidden xl:block w-full overflow-hidden transition-all duration-500",
                "apple-glass rounded-[40px] border border-[var(--border)] shadow-2xl"
            )}>
                {/* Grid Header */}
                <div className="grid-header px-6 py-4 bg-[var(--bg-app)]/30 border-b border-[var(--border)]">
                    <div className="grid grid-cols-11 gap-4 text-[10px] font-medium text-[var(--text-muted)]">
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

                {/* Grid Body */}
                <div className="divide-y divide-[var(--border)]/10">
                    {isLoading ? (
                        // Skeleton Loader
                        Array.from({ length: 10 }).map((_, index) => (
                            <div key={`skeleton-${index}`} className="grid grid-cols-11 gap-4 px-6 py-4">
                                {Array.from({ length: 11 }).map((_, cellIndex) => (
                                    <div
                                        key={cellIndex}
                                        className="h-4 bg-[var(--bg-app)]/30 rounded animate-pulse"
                                        style={{
                                            animationDelay: `${cellIndex * 0.1}s`,
                                            background: 'linear-gradient(90deg, var(--bg-app)/30 0%, var(--bg-card) 50%, var(--bg-app)/30 100%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 1.5s infinite'
                                        }}
                                    />
                                ))}
                            </div>
                        ))
                    ) : (
                        deferredEntries.map((e, idx) => {
                            const isIncome = e.type === 'income';
                            const isCompleted = e.status.toLowerCase() === 'completed';
                            const rowKey = e.localId || e._id || idx;
                            const isExpanded = expandedRows.has(rowKey);

                            return (
                                <React.Fragment key={rowKey}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 400, 
                                            damping: 30,
                                            delay: idx * 0.05
                                        }}
                                        whileHover={{ 
                                            scale: 0.98,
                                            boxShadow: "0 8px 24px rgba(251, 146, 60, 0.15)"
                                        }}
                                        onContextMenu={(event) => handleContextMenu(event, e)}
                                        className="group grid grid-cols-11 gap-4 px-6 py-4 items-center transition-all duration-200 cursor-pointer"
                                        onClick={() => toggleRowExpansion(rowKey)}
                                    >
                                        {/* 1. Index */}
                                        <h1 className="text-2xl md:text-3xl font-variant-numeric: tabular-nums leading-none text-[var(--text-main)] truncate">
                                            {toBn(String(idx + 1).padStart(2, '0'), language)}
                                        </h1>

                                        {/* 2. Date */}
                                        <div className="text-[12px] font-medium text-[var(--text-main)]">
                                            {formatDate(e.date)}
                                        </div>

                                        {/* 3. Time */}
                                        <div className="text-[11px] font-medium text-[var(--text-muted)] opacity-60">
                                            {toBn(e.time || '00:00', language)}
                                        </div>
                                       
                                        {/* 4. Ref ID */}
                                        <Tooltip text={t('tt_verified_node')}>
                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-orange-500/30 cursor-pointer">
                                                <ShieldCheck size={11} strokeWidth={3} />
                                                {toBn(String(e.localId || e._id).slice(-6), language)}
                                            </div>
                                        </Tooltip>

                                        {/* 5. Protocol (Title) */}
                                        <div className="text-[13px] font-medium text-[var(--text-main)] group-hover:text-orange-500 transition-colors truncate">
                                            {e.title}
                                        </div>

                                        {/* 6. Memo (Note) */}
                                        <div className="text-[10px] font-medium text-[var(--text-muted)] opacity-30 truncate">
                                            {e.note || "—"}
                                        </div>

                                        {/* 7. Category (Tag) */}
                                        <div className="px-3 py-1 rounded-lg bg-orange-500/5 border border-orange-500/10 text-orange-500 text-[8px] font-medium">
                                            {e.category || 'General'}
                                        </div>

                                        {/* 8. Via (Payment Method) */}
                                        <div className="text-[9px] font-medium text-[var(--text-muted)] bg-[var(--bg-app)] px-3 py-1 rounded-lg border border-[var(--border)]">
                                            {t((e.paymentMethod || e.via || 'cash').toLowerCase())}
                                        </div>

                                        {/* 9. Amount (Fintech Tabular) */}
                                        <div className={cn(
                                            "text-[18px] font-mono-finance font-bold text-right",
                                            isIncome ? "text-green-500" : "text-red-500"
                                        )}>
                                            {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount).toLocaleString(), language)}
                                        </div>

                                        {/* 10. Status Toggle */}
                                        <div className="flex justify-center">
                                            <Tooltip text={t('tt_toggle_status')}>
                                                <button 
                                                    onClick={(event) => { 
                                                        event.stopPropagation(); 
                                                        // TODO: Connect to store action
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[8px] font-medium transition-all active:scale-95",
                                                        isCompleted 
                                                            ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-lg shadow-green-500/20" 
                                                            : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-lg shadow-yellow-500/20"
                                                    )}
                                                >
                                                    {isCompleted ? <Zap size={10} fill="currentColor" strokeWidth={0} /> : <Clock size={10} strokeWidth={3} />}
                                                    {t(e.status.toLowerCase())}
                                                </button>
                                            </Tooltip>
                                        </div>

                                        {/* 11. Command Options */}
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <Tooltip text={t('tt_edit_record')}>
                                                <button 
                                                    onClick={(event) => { 
                                                        event.stopPropagation(); 
                                                        // TODO: Connect to store action
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-90"
                                                >
                                                    <Edit2 size={14} strokeWidth={2.5} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip text={t('tt_delete_record')}>
                                                <button 
                                                    onClick={(event) => { 
                                                        event.stopPropagation(); 
                                                        openModal('deleteConfirm', { 
                                                            targetName: e.title, 
                                                            title: "modal_terminate_entry_title",
                                                            desc: "modal_terminate_entry_desc",
                                                            onConfirm: () => deleteEntry(e) 
                                                        });
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-all active:scale-90"
                                                >
                                                    <Trash2 size={14} strokeWidth={2.5} />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </motion.div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 py-4 bg-[var(--bg-app)]/30 border-t border-[var(--border)]/10">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-[var(--text-muted)]">{t('note')}: </span>
                                                            <span className="text-[var(--text-main)]">{e.note || t('no_note')}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[var(--text-muted)]">CID: </span>
                                                            <span className="text-[var(--text-main)] font-mono-finance">{e.cid || e._id}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            );
                        })
                    )}
                </div>

                {/* End Ledger Signal */}
                {deferredEntries.length > 0 && !isLoading && (
                    <div className="py-16 flex flex-col items-center opacity-10 group-hover:opacity-30 transition-opacity duration-1000">
                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--text-main)] to-transparent mb-4" />
                        <div className="flex items-center gap-3">
                            <GitCommit size={14} strokeWidth={3} />
                            <span className="text-[10px] font-medium tracking-[4px]">{t('ledger_end')}</span>
                            <GitCommit size={14} strokeWidth={3} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};