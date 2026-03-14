"use client";
import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
    Edit2, Trash2, Zap, Clock, ShieldCheck, 
    ArrowUpRight, ArrowDownLeft, GitCommit 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers';
import { useModal } from '@/context/ModalContext';
import toast from 'react-hot-toast';

// 🚀 PERFORMANCE OPTIMIZED: Memoized row component to prevent unnecessary re-renders
const LedgerRow = memo(({ e, onEdit, onDelete, onToggleStatus, activeId, setActiveId, currencySymbol, lang, t, deleteEntry }: any) => {
    const controls = useAnimation();
    const { openModal } = useModal();
    const isIncome = e.type === 'income';
    const isCompleted = e.status?.toLowerCase() === 'completed';
    const rowId = e.localId || e._id;
    const isOpen = activeId === rowId;

    // ১. ⚡ সলিফ অ্যাকশন হ্যান্ডলার (Framer Tap Protocol)
    const handleAction = async (actionFn: any, action: 'edit' | 'delete', entry: any) => {
        if (!actionFn && action !== 'delete') return;
        
        // ১. প্যানেল রিসেট অ্যানিমেশন
        await controls.start({ x: 0, transition: { type: "spring", stiffness: 600, damping: 45 } });
        setActiveId(null);
        
        // ২. মডাল কল (Direct invocation for zero lag)
        if (action === 'delete') {
            // Unified Delete Law: Always go through confirmation modal
            if (entry.conflicted === 1) {
                toast.error("Please resolve conflict before deleting");
                return;
            }
            openModal('deleteConfirm', { 
                targetName: entry.title, 
                onConfirm: () => {
                    if (deleteEntry) {
                        deleteEntry(entry);
                    } else if (actionFn) {
                        actionFn(entry);
                    }
                }
            });
        } else if (actionFn) {
            actionFn(entry);
        }
    };

    // ২. জেসচার সপ লজিক (Extended distance for better UI)
    const onDragEnd = (_: any, info: any) => {
        const threshold = 50;
        if (info.offset.x > threshold) {
            setActiveId(rowId);
            controls.start({ x: 110 }); // বাটনকে পর্যাপ্ত জায়াগা দেওয়া হলো
        } else if (info.offset.x < -threshold) {
            setActiveId(rowId);
            controls.start({ x: -110 }); // বাটনকে পর্যাপ্ত জায়াগা দেওয়া হলো
        } else {
            setActiveId(null);
            controls.start({ x: 0 });
        }
    };

    useEffect(() => {
        if (activeId !== rowId) {
            controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 50 } });
        }
    }, [activeId, rowId, controls]);

    // 🚀 PERFORMANCE: Memoized styles to prevent recalculation
    const rowStyles = useMemo(() => cn(
        "relative overflow-hidden border-t border-[var(--border)] first:border-t-0 bg-[var(--bg-card)] h-[92px] touch-pan-y",
        isOpen && "z-10"
    ), [isOpen]);

    const amountStyles = useMemo(() => cn(
        "text-[16px] font-black tabular-nums",
        isIncome ? "text-green-500" : "text-red-500"
    ), [isIncome]);

    return (
        <div className={rowStyles}>
            
            {/* --- নীচের লেয়ার: অ্যাকশন বাটনসমূহ (Elite Spacing) --- */}
            <div className="absolute inset-0 flex items-center justify-between px-6 bg-[var(--bg-app)]/60 z-0">
                <motion.button 
                    whileTap={{ scale: 0.85 }}
                    onTap={() => handleAction(onEdit, 'edit', e)} 
                    className="w-14 h-14 rounded-[22px] bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 active:bg-blue-600 transition-colors"
                >
                    <Edit2 size={22} strokeWidth={2.5} />
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.85 }}
                    onTap={() => handleAction(onDelete, 'delete', e)} 
                    className="w-14 h-14 rounded-[22px] bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 active:bg-red-600 transition-colors"
                >
                    <Trash2 size={22} strokeWidth={2.5} />
                </motion.button>
            </div>

            {/* --- ওপরের লেয়ার: মেইন কন্টেন্ট (The Apple Layer) --- */}
            <motion.div 
                drag="x"
                animate={controls}
                dragConstraints={{ left: -120, right: 120 }}
                dragElastic={0.15}
                onDragEnd={onDragEnd}
                className={cn(
                    "absolute inset-0 bg-[var(--dropdown-main)] px-6 py-4 flex items-center justify-between gap-4 z-10",
                    "cursor-grab active:cursor-grabbing select-none transition-all duration-300",
                    isOpen ? "shadow-2xl brightness-105" : "shadow-none"
                )}
            >
                <div className="flex items-center gap-4 min-w-0 pointer-events-none">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border",
                        isIncome ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                    )}>
                        {isIncome ? <ArrowDownLeft size={24} strokeWidth={3} /> : <ArrowUpRight size={24} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 space-y-1">
                        <h4 className="text-[15px] font-black text-[var(--text-main)] truncate">{(e.title || 'Untitled Entry')}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-orange-500   bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                                {e.category?.toUpperCase()}
                            </span>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] opacity-30">
                                {toBn(String(rowId).slice(-4), lang)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <div className={cn(
                        "text-[20px] font-mono-finance font-black leading-none mb-2",
                        isIncome ? 'text-green-500' : 'text-red-500'
                    )}>
                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(Math.abs(e.amount || 0).toLocaleString(), lang)}
                    </div>
                    <button 
                        onClick={(event) => { event.stopPropagation(); onToggleStatus(e); }}
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black transition-all active:scale-90 ml-auto",
                            isCompleted ? "text-orange-500 border-orange-500/20 bg-orange-500/5" : "text-[var(--text-muted)] opacity-40 border-transparent"
                        )}
                    >
                        {isCompleted ? <Zap size={9} fill="currentColor" /> : <Clock size={9} strokeWidth={3} />}
                        {toBn(e.time || '00:00', lang)}
                    </button>
                </div>
            </motion.div>
        </div>
    );
});

LedgerRow.displayName = 'LedgerRow';

// --- 📦 MAIN UNIFIED COMPONENT ---
const MobileLedgerCards = memo(({ items, groupedEntries, isGrouped = false, onEdit, onDelete, onToggleStatus, currencySymbol, deleteEntry }: any) => {
    const { language, t } = useTranslation();
    const { openModal } = useModal();
    const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

    // বাইরে ক্লিক করলে সোয়াইপ বন্ধ হবে
    useEffect(() => {
        const handleGlobalClick = () => { if (activeSwipeId) setActiveSwipeId(null); };
        window.addEventListener('mousedown', handleGlobalClick);
        window.addEventListener('touchstart', handleGlobalClick);
        return () => {
            window.removeEventListener('mousedown', handleGlobalClick);
            window.removeEventListener('touchstart', handleGlobalClick);
        };
    }, [activeSwipeId]);

    // 🚀 PERFORMANCE: Memoized render function to prevent unnecessary re-renders
    const renderRows = useMemo(() => (list: any[]) => (
        <div className="bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] shadow-xl overflow-hidden relative">
            {list.map((e, idx) => (
                <LedgerRow 
                    key={e.localId || e._id || idx} e={e} onEdit={onEdit} onDelete={onDelete}
                    onToggleStatus={onToggleStatus} activeId={activeSwipeId} setActiveId={setActiveSwipeId}
                    currencySymbol={currencySymbol} lang={language} t={t} deleteEntry={deleteEntry}
                />
            ))}
        </div>
    ), [currencySymbol, language, t, activeSwipeId, setActiveSwipeId, onEdit, onDelete, deleteEntry]);

    return (
        <div className="space-y-10 relative pb-10">
            {isGrouped && groupedEntries ? (
                Object.keys(groupedEntries).map((date) => (
                    <div key={date} className="relative">
                        <div className="flex items-center gap-4 mb-5 px-3">
                            <div className="px-4 py-1.5 bg-orange-500 text-white rounded-full text-[9px] font-black    shadow-lg flex items-center gap-2">
                                <GitCommit size={12} strokeWidth={3} />
                                {date}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent opacity-20" />
                        </div>
                        {renderRows(groupedEntries[date])}
                    </div>
                ))
            ) : (
                renderRows(items || [])
            )}
        </div>
    );
});

MobileLedgerCards.displayName = 'MobileLedgerCards';

export default MobileLedgerCards;