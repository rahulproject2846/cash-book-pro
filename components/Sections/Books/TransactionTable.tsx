"use client";
import React, { useState, useDeferredValue, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Edit2, Trash2, ShieldCheck, GitCommit, Search, ArrowUp, ArrowDown, ArrowUpDown,
    MoreVertical, Info, CheckCircle2, Clock
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { useVaultStore } from '@/lib/vault/store/index';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { cn, toBn } from '@/lib/utils/helpers';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🏛️ MASTER GRID STYLE ---
const GRID_STYLE = "40px minmax(130px, 1fr)minmax(80px, 1fr) minmax(120px, 1fr) minmax(90px, 1fr) minmax(90px, 1fr) minmax(90px, 1fr)minmax(90px, 1fr) 140px 40px";

export const TransactionTable = ({ items, onEdit, onToggleStatus, currencySymbol }: any) => {
    const { t, language } = useTranslation();
    const { openModal } = useModal();
    const { deleteEntry } = useVaultStore();
    const { entrySearchQuery, setEntrySearchQuery, entrySortConfig, setEntrySortConfig } = useVaultState();
    
    // 🧠 1. COMMAND PALETTE LOGIC (Omni-Search)
    const filteredEntries = useMemo(() => {
        if (!entrySearchQuery) return items;
        const query = entrySearchQuery.toLowerCase().trim();
        
        return items.filter((e: any) => {
            const amount = Math.abs(e.amount || 0);
            // Smart Commands: >500, <100, =200
            if (query.startsWith('>')) return amount > parseFloat(query.slice(1));
            if (query.startsWith('<')) return amount < parseFloat(query.slice(1));
            if (query.startsWith('=')) return amount === parseFloat(query.slice(1));
            
            return e.title?.toLowerCase().includes(query) || 
                   e.category?.toLowerCase().includes(query) ||
                   e.note?.toLowerCase().includes(query);
        });
    }, [items, entrySearchQuery]);

    const deferredEntries = useDeferredValue(filteredEntries);
    const visibleEntries = useMemo(() => deferredEntries.filter((e: any) => e.conflicted !== 1), [deferredEntries]);

    // 🎯 2. TRIPLE-STATE SORTING ENGINE
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | 'none' = 'asc';
        if (entrySortConfig.key === key) {
            if (entrySortConfig.direction === 'asc') direction = 'desc';
            else if (entrySortConfig.direction === 'desc') direction = 'none';
        }
        
        if (direction === 'none') {
            setEntrySortConfig({ key: 'createdAt', direction: 'desc' }); // Reset to default
        } else {
            setEntrySortConfig({ key, direction });
        }
    };

    const renderSortIcon = (key: string) => {
        if (entrySortConfig.key !== key) return <div className="w-3 h-3 opacity-10"><ArrowUp size={12} /></div>;
        if (entrySortConfig.direction === 'asc') return <ArrowUp size={12} className="text-orange-500" />;
        if (entrySortConfig.direction === 'desc') return <ArrowDown size={12} className="text-orange-500" />;
        return null;
    };

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    return (
        <div className="w-full relative select-none pb-12">
                {/* --- UNIFIED SOVEREIGN TABLE BLOCK --- */}
                <div className="w-full overflow-hidden bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] shadow-2xl">
                
                {/* 🛠️ 3. ABSOLUTE STICKY TOP BAR */}
                <div className="sticky top-0 z-[100] bg-[var(--bg-card)]/90 backdrop-blur-3xl border-b border-[var(--border)]/10">
                    <div className="flex justify-between items-center px-8 py-6">
                        <h3 className="text-lg font-black text-[var(--text-main)] tracking-tight">Latest Transaction</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Type to search..." 
                                    value={entrySearchQuery || ''} 
                                    onChange={(e) => setEntrySearchQuery(e.target.value)}
                                    className="h-10 w-72 rounded-full bg-[var(--bg-app)] border border-[var(--border)] pl-10 pr-4 text-[11px] font-bold text-[var(--text-main)] outline-none focus:border-orange-500/40 transition-all shadow-inner" 
                                />
                            </div>
                            
                            {/* Sort By Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setActiveMenuId(activeMenuId === 'sort' ? null : 'sort')}
                                    className="h-10 px-4 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center gap-2 text-[11px] font-bold text-[var(--text-main)] hover:border-orange-500/40 transition-all"
                                >
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">Sort By :</span>
                                    <span className="uppercase">{entrySortConfig.key}</span>
                                    <ArrowUpDown size={12} className="text-[var(--text-muted)]" />
                                </button>
                                
                                <AnimatePresence>
                                    {activeMenuId === 'sort' && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 top-12 z-50 bg-[var(--bg-card)]/95 backdrop-blur-2xl rounded-2xl border border-[var(--border)] shadow-2xl py-2 min-w-[140px] overflow-hidden"
                                            >
                                                {['date', 'amount', 'title', 'status'].map((key) => (
                                                    <button 
                                                        key={key}
                                                        onClick={() => { handleSort(key); setActiveMenuId(null); }}
                                                        className={cn(
                                                            "w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-orange-500/10 transition-colors group",
                                                            entrySortConfig.key === key ? "bg-orange-500/5" : ""
                                                        )}
                                                    >
                                                        <span className={cn("text-[10px] font-black uppercase", entrySortConfig.key === key ? "text-orange-500" : "text-[var(--text-muted)]")}>
                                                            {key}
                                                        </span>
                                                        {entrySortConfig.key === key && (
                                                            entrySortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-orange-500" /> : <ArrowDown size={12} className="text-orange-500" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* 🏁 4. STICKY GRID HEADER */}
                    <div className="px-8 py-4 bg-[var(--bg-app)]/20">
                        <div className="grid gap-6 text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]" style={{ gridTemplateColumns: GRID_STYLE }}>
                            <div className="flex items-center">#</div>
                            <button onClick={() => handleSort('date')} className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                                Date {renderSortIcon('date')}
                            </button>
                            <div>Invoice</div>
                            <button onClick={() => handleSort('title')} className="flex items-center gap-2 hover:text-orange-500 transition-colors">
                                Title {renderSortIcon('title')}
                            </button>
                            <div>Note</div>
                            <div>Category</div>
                            <div>Method</div>
                            <button onClick={() => handleSort('amount')} className="flex items-center gap-2 justify-center hover:text-orange-500 transition-colors">
                                {renderSortIcon('amount')} Amount
                            </button>
                            <button onClick={() => handleSort('status')} className="flex items-center gap-2 justify-center hover:text-orange-500 transition-colors">
                                Status {renderSortIcon('status')}
                            </button>
                            <div className="text-right">Tool</div>
                        </div>
                    </div>
                </div>

                {/* 🧬 TABLE BODY */}
                <div className="bg-[var(--bg-card)] overflow-x-auto custom-scrollbar">
                    <div className="min-w-[1100px] divide-y divide-[var(--border)]/5">
                        {visibleEntries.length > 0 ? (
                            visibleEntries.map((e: any, idx: number) => {
                                const isIncome = e.type?.toLowerCase() === 'income';
                                const rowId = e.localId || e._id || e.cid;
                                
                                return (
                                    <motion.div 
                                        layout
                                        key={rowId} 
                                        className="group grid px-8 py-5 items-center hover:bg-[var(--bg-app)]/40 transition-all border-transparent hover:border-orange-500/40 cursor-pointer"
                                        style={{ gridTemplateColumns: GRID_STYLE, gap: '1.5rem' }}
                                    >
                                        <div className="text-[10px] font-mono opacity-20">{toBn(idx + 1, language)}</div>
                                        <div className="text-left leading-tight">
                                            <div className="text-[14px] font-bold text-[var(--text-main)]">{new Date(e.date).toLocaleDateString()}</div>
                                            <div className="text-[12px] font-black opacity-30 uppercase">{toBn(e.time || '00:00', language)}</div>
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-orange-500/40 flex items-center gap-1">
                                            <GitCommit size={10} /> {String(rowId).slice(-4).toUpperCase()}
                                        </div>
                                        <div className="text-[13px] font-black text-[var(--text-main)] truncate pr-2 group-hover:text-orange-500 transition-colors">{e.title || 'Untitled'}</div>
                                        
                                        {/* 5. HOVER DETAIL PREVIEW (Peek) */}
                                        <Tooltip text={e.note || "No notes available"} className="w-full block" >
                                            <div className="text-left text-[10px] font-medium text-[var(--text-muted)] opacity-30 truncate pr-2 cursor-help italic">
                                                {e.note || "—"}
                                            </div>
                                        </Tooltip>
                                        
                                        <div className="h-7 text-left w-24 flex items-center justify-center rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[9px] font-black uppercase text-[var(--text-muted)]">{e.category || 'General'}</div>
                                        <div className="h-7 text-left w-24 flex items-center justify-center rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[9px] font-black uppercase text-[var(--text-muted)]">{e.paymentMethod || 'cash'}</div>
                                        <div className={cn("text-center text-[13px] font-black", isIncome ? "text-green-500" : "text-red-500")}>
                                            {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount || 0).toLocaleString(), language)}
                                        </div>

                                        {/* 6. 1-CLICK INLINE STATUS PULSE */}
                                        <div className="flex justify-center">
                                            <motion.button 
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => onToggleStatus(e)}
                                                className={cn(
                                                    "h-7 w-24 flex items-center justify-center rounded-full border text-[9px] font-black uppercase transition-all shadow-sm",
                                                    e.status === 'completed' ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-orange-500/10 border-orange-500/30 text-orange-500"
                                                )}
                                            >
                                                {e.status === 'completed' ? <CheckCircle2 size={10} className="mr-1.5" /> : <Clock size={10} className="mr-1.5" />}
                                                {t(e.status || 'completed')}
                                            </motion.button>
                                        </div>

                                        {/* 7. RELATIVE-ABSOLUTE ACTION MENU */}
                                        <div className="relative flex justify-end">
                                            <button 
                                                onClick={(ev) => { ev.stopPropagation(); setActiveMenuId(activeMenuId === rowId ? null : rowId); }}
                                                className="w-8 h-8 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            
                                            <AnimatePresence>
                                                {activeMenuId === rowId && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute right-0 top-10 z-50 bg-[var(--bg-card)]/95 backdrop-blur-2xl rounded-2xl border border-[var(--border)] shadow-2xl py-2 min-w-[160px] overflow-hidden"
                                                        >
                                                            <button onClick={() => { onEdit(e); setActiveMenuId(null); }} className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-orange-500/10 transition-colors group">
                                                                <Edit2 size={14} className="text-[var(--text-muted)] group-hover:text-orange-500" />
                                                                <span className="text-[10px] font-black uppercase">{t('edit_entry')}</span>
                                                            </button>
                                                            <button onClick={() => { openModal('deleteConfirm', { targetName: e.title, onConfirm: () => deleteEntry(e) }); setActiveMenuId(null); }} 
                                                                    className="w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-red-500/10 transition-colors border-t border-[var(--border)]/30 group">
                                                                <Trash2 size={14} className="text-red-500/60 group-hover:text-red-500" />
                                                                <span className="text-[10px] font-black text-red-500 uppercase">{t('delete_entry')}</span>
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40">
                                <Search size={32} className="text-[var(--text-muted)] opacity-20 mb-4 animate-pulse" />
                                <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Vault Cleared</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* 🏁 END SIGNAL */}
            <div className="py-12 flex flex-col items-center opacity-20">
                <div className="flex items-center gap-4">
                    <div className="h-px w-20 bg-gradient-to-r from-transparent to-[var(--text-muted)]" />
                    <GitCommit size={14} strokeWidth={3} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t('ledger_end')}</span>
                    <GitCommit size={14} strokeWidth={3} />
                    <div className="h-px w-20 bg-gradient-to-l from-transparent to-[var(--text-muted)]" />
                </div>
            </div>
        </div>
    );
};