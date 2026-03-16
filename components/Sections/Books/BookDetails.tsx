"use client";
import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, GitCommit } from 'lucide-react';

// Sub Components
import { StatsGrid } from '@/components/Sovereign/Shared/StatsGrid'; 
import { TransactionTable } from './TransactionTable';
import MobileLedgerCards from '@/components/UI/MobileLedgerCards';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { Pagination } from '@/components/UI/Pagination';

// Global UI Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers';
import { Tooltip } from '@/components/UI/Tooltip';

// 🚀 MEMOIZED TRANSACTION TABLE FOR PERFORMANCE
const MemoizedTransactionTable = React.memo(TransactionTable);

interface BookDetailsProps {
    bookId?: string;
    currentBook?: any;
    onBack?: () => void;
    onAdd?: (data: any) => void;
    onEdit?: (data: any) => void;
    onDelete?: (data: any) => void;
    onToggleStatus?: (data: any) => void;
    onTogglePin?: (data: any) => void;
    currentUser?: any;
    bookStats?: any;
}

/**
 * 🏆 MASTER BOOK DETAILS (V15.0 - CLEAN & ATOMIC)
 * ----------------------------------------------------
 * Layout: Apple Metal Glass
 * Pagination: Simple 10-item limit (>=11 entries to show)
 * State: Zero-Log, Single Source of Truth
 */
export const BookDetails = ({ 
    onBack, onEdit, onDelete, onToggleStatus, onTogglePin,
    currentUser, bookStats
}: BookDetailsProps) => {
    // 🚀 HOOKS SECTION - ALL HOOKS DECLARED FIRST (Rule of Hooks)
    const { t, language } = useTranslation();
    const { saveEntry, deleteEntry } = getVaultStore();
    
    // 🚀 REACTIVE STORE CONNECTION
    const {
        processedEntries, entryPagination, setEntryPage,
        pendingDeletion, isInteractionLocked, activeBook
    } = useVaultState();
    
    // 📱 MOBILE DETECTION
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // 📱 MOBILE GROUPING LOGIC (Mirrors TimelineSection) - useMemo after all hooks
    const ITEMS_PER_PAGE = 10;
    const { groupedEntries } = useMemo(() => {
        // Sort by date descending with optional chaining safety
        const sorted = [...(processedEntries || [])].sort((a: any, b: any) => 
            new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime()
        );
        
        // Group by date with optional chaining safety
        const groupedData: { [key: string]: any[] } = {};
        sorted.forEach((entry: any) => {
            if (!entry?.date) return; // Skip entries without valid date
            const dateStr = new Date(entry.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });
            if (!groupedData[dateStr]) groupedData[dateStr] = [];
            groupedData[dateStr].push(entry);
        });
        
        return { groupedEntries: groupedData };
    }, [processedEntries, language]);
    
    // 🛡️ IRON GATE: Safety wall - AFTER ALL HOOKS
    if (!activeBook) {
      console.log('🛡️ [IRON GATE] No active book, preventing render');
      return null; 
    }
    
    const bookId = String(activeBook._id || activeBook.localId);
    const currencySymbol = activeBook?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    // 🗑️ FADE-OUT LOGIC FOR DELETION
    const isThisBookBeingDeleted = pendingDeletion?.bookId === bookId;
    const timeRemaining = pendingDeletion ? Math.max(0, Math.ceil((pendingDeletion.expiresAt - Date.now()) / 1000)) : 0;
    const shouldFadeOut = isThisBookBeingDeleted && timeRemaining <= 1;

    return (
        <Fragment>
            {/* GLOBAL LOCKDOWN OVERLAY */}
            <AnimatePresence>
                {isInteractionLocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/10 z-[9999] pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <motion.div 
                layoutId={`book-hero-${bookId}`}
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ 
                    opacity: shouldFadeOut ? 0.2 : 1, 
                    scale: shouldFadeOut ? 0.98 : 1,
                    filter: shouldFadeOut ? 'blur(2px)' : 'none'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
                className="w-full pb-36 transition-all duration-500 will-change-transform"
                style={{ transform: 'translateZ(0)' }}
            >
                <div className="space-y-8">

                    {/* --- ১. DYNAMIC STATS GRID --- */}
                    <StatsGrid 
                        income={bookStats?.stats?.inflow || 0} 
                        expense={bookStats?.stats?.outflow || 0} 
                        pending={bookStats?.stats?.pending || 0}
                        surplus={(bookStats?.stats?.inflow || 0) - (bookStats?.stats?.outflow || 0)}
                        currency={currentUser?.currency} 
                    />

                    {/* --- ২. MAIN LEDGER VIEW --- */}
                    <div className={cn(
                        "relative overflow-hidden duration-500"
                    )}>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <MemoizedTransactionTable 
                                items={processedEntries}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                currencySymbol={currencySymbol}
                            />
                        </div>
                        
                        {/* Mobile View */}
                        <div className="block md:hidden">
                            <MobileLedgerCards 
                                isGrouped={true}
                                groupedEntries={groupedEntries}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                currencySymbol={currencySymbol}
                                deleteEntry={deleteEntry}
                            />
                        </div>
                        
                        {/* Empty State Overlay */}
                        <AnimatePresence>
                            {processedEntries.length === 0 && !isInteractionLocked && (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6 py-20"
                                >
                                    <div className="w-24 h-24 bg-[var(--bg-app)] rounded-[40px] flex items-center justify-center border border-[var(--border)] shadow-inner opacity-20">
                                        <Inbox size={48} strokeWidth={1} />
                                    </div>
                                    <p className="font-black   text-[11px]    opacity-40">{t('empty_ledger')}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- ৪. MASTER ARCHIVE FOOTER & SIMPLE PAGINATION --- */}
                    {/* Only show pagination if total entries >= 11 (more than 1 page) */}
                    {entryPagination && entryPagination.totalItems > 10 && (
                        <div className="flex flex-col md:flex-row justify-between items-center py-10 gap-8 opacity-90 border-t border-[var(--border)]/20 mt-6">
                            <div className="hidden md:flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                                    <GitCommit size={20} strokeWidth={3} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-[var(--text-muted)]      leading-none">{t('protocol_archive')}</p>
                                    <p className="text-[8px] font-bold text-orange-500      mt-1.5 opacity-60">Sequence Verified</p>
                                </div>
                            </div>

                            <Pagination 
                                currentPage={entryPagination?.currentPage || 1}
                                totalPages={entryPagination?.totalPages || 1}
                                onPageChange={setEntryPage}
                                itemsPerPage={10}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </Fragment>
    );
};

export default BookDetails;