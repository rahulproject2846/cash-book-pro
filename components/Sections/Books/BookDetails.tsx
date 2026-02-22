"use client";
import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ChevronLeft, ChevronRight, Inbox, Zap, GitCommit, ShieldCheck, Activity } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

// Sub Components
import { StatsGrid } from '@/components/UI/StatsGrid'; 
import { TransactionTable } from './TransactionTable';
import { useVaultState, useBootStatus, getVaultStore } from '@/lib/vault/store/storeHelper';

// 🚀 MEMOIZED TRANSACTION TABLE FOR 100k PERFORMANCE
const MemoizedTransactionTable = React.memo(TransactionTable);

import { Pagination } from '@/components/UI/Pagination';
import { DetailsToolbar } from './DetailsToolbar';
import { MobileFilterSheet } from './MobileFilterSheet';

// Global UI Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers
import { Tooltip } from '@/components/UI/Tooltip';

// Interface for BookDetails props
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

export const BookDetails = ({ 
    bookId, currentBook, onBack, onAdd, onEdit, onDelete, onToggleStatus, onTogglePin,
    currentUser, bookStats
}: BookDetailsProps) => {
    // ALL HOOKS AT THE TOP - NO CONDITIONALS BEFORE HOOKS
    const { t, language } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookIdFromUrl = params.id as string;
    
    // 🚀 REACTIVE STORE CONNECTION & BOOT STATUS
    const {
        books, entrySortConfig, entryCategoryFilter, entrySearchQuery,
        processedEntries, entryPagination, setEntryPage, setActiveBook,
        entries
    } = useVaultState();
    
    const { isSystemReady } = useBootStatus();
    
    // ID-CENTRIC: Calculate effective book ID from multiple sources
    const effectiveBookId = bookId || bookIdFromUrl || searchParams.get('id') || (currentBook?._id || currentBook?.localId);
    
    // Derive the book object locally from store or prop
    const book = currentBook || books?.find(b => String(b._id || b.localId) === String(effectiveBookId));
    
    // 🔄 STORE SYNC: When book is found via ID, sync with global store
    useEffect(() => {
        if (book && effectiveBookId) {
            setActiveBook(book);
        }
    }, [book, effectiveBookId, setActiveBook]);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // 🚀 SMART CACHE LOGIC: Direct DB access with pagination
    const currentItems = entries;
    
    // Background sync trigger when local data is insufficient
    const isDataInsufficient = currentItems.length < (isSystemReady ? (window.innerWidth < 768 ? 16 : 15) : 10);
    
    // 🛡️ CIRCUIT BREAKER: Prevent infinite refresh loop
    const hasInitialRefreshed = useRef(false);
    
    useEffect(() => {
        console.log('🔄 [BOOK DETAILS] Effect Triggered:', { isDataInsufficient, isSystemReady, effectiveBookId });
        
        // 🛡️ FALLBACK: Ensure data flows even if boot status is delayed
        if (isDataInsufficient && (isSystemReady || effectiveBookId) && !hasInitialRefreshed.current) {
            // Trigger background sync for more data
            const { refreshEntries } = getVaultStore();
            console.log('🔗 Action Check:', typeof refreshEntries);
            refreshEntries?.();
            hasInitialRefreshed.current = true;
        }
    }, [isDataInsufficient, isSystemReady, effectiveBookId]);

    // 🛡️ GUARD CLAUSE: Check for effective book ID
    if (!effectiveBookId) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 animate-spin">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-[var(--text-muted)]">No book selected</p>
                </div>
            </div>
        );
    }

    // 🍎 APPLE-STYLE LOADING: Show loading while book data is being fetched
    if (!book) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 animate-spin">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-[var(--text-muted)]">Loading book details...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            layoutId={`book-hero-${book._id || book.localId}`}
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] pb-36 transition-all duration-500"
        >
            <div className="md:px-8 lg:px-10 space-y-10 mt-2">

                {/* --- ১. DYNAMIC STATS GRID --- */}
                <StatsGrid 
                    income={bookStats?.stats?.inflow || 0} 
                    expense={bookStats?.stats?.outflow || 0} 
                    pending={bookStats?.stats?.pending || 0}
                    surplus={(bookStats?.stats?.inflow || 0) - (bookStats?.stats?.outflow || 0)}
                    currency={currentUser?.currency} 
                />

                {/* --- ২. CONTROL HUB (Search & Filter) --- */}
                <div className="space-y-6">
                    <DetailsToolbar />
                    <MobileFilterSheet />
                </div>

                {/* --- ৩. MAIN LEDGER VIEW (The Apple Metal Container) --- */}
                <div className={cn(
                    "relative min-h-[500px] transition-all duration-500",
                    "md:bg-[var(--bg-card)] md:backdrop-blur-3xl md:rounded-[40px] md:border md:border-[var(--border)] md:shadow-2xl overflow-hidden"
                )}>
                    {/* Feed Header */}
                    <div className="hidden md:flex items-center justify-between p-7 border-b border-[var(--border)] bg-[var(--bg-app)]/30">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-500/10 rounded-xl">
                                <Zap size={16} className="text-orange-500 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-[var(--text-main)]">{t('ledger_live_feed')}</span>
                        </div>
                    </div>

                    {/* Table View (Desktop) */}
                    <MemoizedTransactionTable />
                    
                    {/* Card View (Mobile) - Using TransactionTable for mobile */}
                    <div className="md:hidden">
                        <MemoizedTransactionTable />
                    </div>
                    
                    {/* Debug State Verification */}
                    {processedEntries.length === 0 && (
                        <div className="text-red-500 text-xs p-2 border border-red-500/20 bg-red-500/10 rounded">
                            Debug: State is Empty (processedEntries.length = {processedEntries.length})
                        </div>
                    )}
                    
                    {/* Empty State Overlay */}
                    <AnimatePresence>
                        {currentItems.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6 py-20">
                                <div className="w-24 h-24 bg-[var(--bg-app)] rounded-[40px] flex items-center justify-center border border-[var(--border)] shadow-inner opacity-20">
                                    <Inbox size={48} strokeWidth={1} />
                                </div>
                                <p className="font-black uppercase text-[11px] tracking-[5px] opacity-40">{t('empty_ledger')}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- ৪. MASTER ARCHIVE FOOTER & PAGINATION --- */}
                <div className="flex flex-col md:flex-row justify-between items-center py-10 gap-8 opacity-90 border-t border-[var(--border)]/20 mt-6">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                             <GitCommit size={20} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{t('protocol_archive')}</p>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1.5 opacity-60">Sequence Verified</p>
                        </div>
                    </div>

                    {/* 🎯 APPLE NATIVE PAGINATION */}
                    <Pagination 
                        currentPage={entryPagination?.currentPage || 1}
                        totalPages={entryPagination?.totalPages || 1}
                        onPageChange={setEntryPage}
                        itemsPerPage={window.innerWidth < 768 ? 16 : 15}
                    />
                </div>
            </div>
        </motion.div>
    );
};