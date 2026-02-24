"use client";
import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, LayoutGrid, 
    CloudSync, RefreshCw, Layout, FileUp,
    AlertTriangle, X 
} from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { cn, toBn } from '@/lib/utils/helpers';

// Domain-Driven Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 
import ConflictManagementList from '@/components/UI/ConflictManagementList'; 

// Core Logic Engine
import { getVaultStore } from '@/lib/vault/store/storeHelper'; 
import { useVaultStore } from '@/lib/vault/store';
import { identityManager } from '@/lib/vault/core/IdentityManager'; 
import { useRouter, useSearchParams } from 'next/navigation'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (V13.0 - PINNED & ACTIVITY SORTED)
 * --------------------------------------------------------
 * Status: Final Polish, Enterprise Grade Reactivity.
 * 🚀 Performance Optimized with React.memo and useMemo
 */
const BooksSection = memo(({ 
    currentUser,
    router
}: any) => {
    
    // 🎯 ALL HOOKS AT THE TOP - NO CONDITIONALS BEFORE HOOKS
    const { openModal } = useModal();
    const { t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const [showConflictList, setShowConflictList] = useState(false); 
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastRefreshedUserRef = useRef<string | null>(null);
    const refreshLock = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const bootStatus = useVaultStore((s) => s.bootStatus);
    
    // 🎯 GET ACTIVE BOOK FROM ZUSTAND STORE
    const { activeBook, setActiveBook } = getVaultStore();
    
    // 🎯 GET CURRENT SECTION FROM URL
    const searchParams = useSearchParams();
    const currentSection = searchParams.get('tab') || 'books';
    
    // 🎯 CONDITIONAL RENDERING LOGIC - AFTER ALL HOOKS
    const isBookActive = !!activeBook;
    const isGlobalView = !isBookActive;



    // 🚀 IDENTITY & STORE TRIGGER - ATOMIC LOCK GUARD
    useEffect(() => {
        console.log('🔄 [BOOKS SECTION] Current State:', { booksCount: getVaultStore().books.length, isLoading: getVaultStore().isLoading, isRefreshing: getVaultStore().isRefreshing });
        const userId = currentUser?._id || identityManager.getUserId();
        if (!userId || !mounted || refreshLock.current) return;

        console.log('🚀 [BOOKS SECTION] Atomic Trigger: One-time refresh for user:', userId);
        refreshLock.current = true; // Lock it immediately
        
        getVaultStore().refreshBooks().finally(() => {
            // Unlock after delay to prevent rapid re-triggers
            setTimeout(() => { refreshLock.current = false; }, 5000);
        });
    }, [currentUser?._id, mounted]); // ONLY these two dependencies

    // 🎯 SYNC ACTIVE BOOK WITH STORE
    useEffect(() => {
        if (activeBook) {
            console.log('🎯 [BOOKS SECTION] Setting active book in store:', activeBook._id || activeBook.localId);
            getVaultStore().setActiveBook(activeBook);
        }
    }, [activeBook]);
    
    // 🎯 SCROLL RESTORATION EFFECT
    useEffect(() => {
        const { lastScrollPosition } = getVaultStore();
        if (lastScrollPosition > 0 && mounted) {
            // Use a double requestAnimationFrame to ensure that grid has rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const scrollEl = document.querySelector('main');
                    if (scrollEl) {
                        scrollEl.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
                        console.log('⚓ [SCROLL] Restored to:', lastScrollPosition);
                        getVaultStore().setLastScrollPosition(0); // Clear after restore
                    }
                });
            });
        }
    }, [mounted]); // Only run when activeBook changes

    // 🚀 CHUNK FETCH ON PAGE CHANGE
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        getVaultStore().fetchPageChunk(dashPage, isMobile);
    }, [dashPage]);

    // 🎯 CALCULATIONS AFTER ALL HOOKS
    const {
        books, globalStats, isLoading,
        saveBook, saveEntry, deleteBook, toggleEntryStatus, togglePin, 
        conflictedCount,    // CONFLICT TRACKING: Total conflicted items count
        hasConflicts,       // CONFLICT TRACKING: Boolean flag for any conflicts
        searchQuery, sortOption, filteredBooks, setSearchQuery, setSortOption, 
        isLoading: isStoreLoading, entries, allEntries
    } = useVaultStore();

    useEffect(() => {
        if (bootStatus === 'READY') {
            setShowConflictList(false);
        }
    }, [bootStatus]);
    
    // 🚀 SMART CACHE LOGIC: Direct DB access with pagination
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const ITEMS_PER_PAGE = isMobile ? 16 : 15; // Mobile: 16 real, Desktop: 15 real + 1 dummy
    const totalPages = Math.ceil(getVaultStore().totalBookCount / ITEMS_PER_PAGE) || 1;
    const currentBooks = useMemo(() => {
        const books = getVaultStore().books || [];
        return books.length > 0 ? books.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE) : [];
    }, [getVaultStore().books, dashPage]);

    // Helper function to get currency symbol from user preferences
    const getCurrencySymbol = () => {
        return currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    };

    const getBookBalance = useCallback((id: any) => {
        // Calculate balance from Zustand store
        const { getBookBalance } = getVaultStore();
        return getBookBalance(String(id));
    }, []);

    const onEdit = useCallback((book: any) => {
        openModal('addBook', { editTarget: book, onSubmit: (data: any) => saveBook(data, book), currentUser });
    }, [openModal, saveBook, currentUser]);

    const onDelete = useCallback((book: any) => {
        openModal('deleteConfirm', { targetName: book.name, onConfirm: () => deleteBook(book, router) });
    }, [openModal, deleteBook, router]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const combinedLoading = isLoading || isStoreLoading;

    return (
        <div className="w-full relative transition-all duration-500">
            {/* 🎯 INTEGRATED LOADING STATE - NO EARLY RETURN */}
            {(!mounted || combinedLoading) ? (
                <div className="w-full py-40 flex flex-col items-center justify-center gap-6 opacity-20">
                    <RefreshCw className="animate-spin text-orange-500" size={48} />
                    <span className="text-[10px] font-black uppercase tracking-[5px]">{t('synchronizing_hub')}</span>
                </div>
            ) : (
                <>
                    {/* --- 🧠 HUB HEADER --- */}
                    {!activeBook && (
                        <HubHeader 
                            title={t('ledger_hub') || "LEDGER HUB"} 
                            subtitle={`${toBn(filteredBooks.length, language)} ${t('active_protocols') || "PROTOCOLS ACTIVE"}`}
                            icon={Layout}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        >
                            <Tooltip text={t('tt_import_ledger') || "Import Registry Backup"}>
                                <button onClick={handleImportClick} className="h-11 w-11 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90 shadow-sm outline-none">
                                    <FileUp size={20} />
                                </button>
                            </Tooltip>
                        </HubHeader>
                    )}

                    {/* --- 🌩 SYNC WATCHMAN BAR --- */}
                    <AnimatePresence>
                        {(getVaultStore().unsyncedCount > 0 || hasConflicts) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                                <div className={cn(
                                    "rounded-[28px] p-4 flex items-center justify-between shadow-lg backdrop-blur-md",
                                    hasConflicts 
                                        ? "bg-red-500/10 border-red-500/20"  // 🚨 Conflict: Red tint for urgency
                                        : "bg-orange-500/10 border-orange-500/20"  // ⏳ Pending: Orange tint
                                )}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg",
                                            hasConflicts 
                                                ? "bg-red-500 shadow-red-500/20"  // 🚨 Conflict: Red icon
                                                : "bg-orange-500 shadow-orange-500/20"  // ⏳ Pending: Orange icon
                                        )}>
                                            {hasConflicts ? <AlertTriangle size={20} /> : <CloudSync size={20} />}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className={cn(
                                                "text-[10px] font-black uppercase tracking-[2px]",
                                                hasConflicts ? "text-red-500" : "text-orange-500"
                                            )}>
                                                {hasConflicts 
                                                    ? `${toBn(conflictedCount, language)} conflicts found${getVaultStore().unsyncedCount > 0 ? `, ${toBn(getVaultStore().unsyncedCount, language)} items pending` : ''}` 
                                                    : `${toBn(getVaultStore().unsyncedCount, language)} ${t('unsynced_units') || "UNITS SECURED IN LOCAL NODE"}`
                                                }
                                            </p>
                                            <p className={cn(
                                                "text-[9px] font-bold uppercase tracking-[1px]",
                                                hasConflicts ? "text-red-500/60" : "text-orange-500/60"
                                            )}>
                                                {hasConflicts 
                                                    ? "Vault Conflicts Detected" : "Vault Buffer Active"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Tooltip text={hasConflicts 
                                        ? "Red indicates data version mismatch. Orange indicates pending local encryption. Click to manage all conflicts." 
                                        : (t('tt_force_sync') || "Force protocol refresh")
                                    }>
                                        <button 
                                            onClick={() => hasConflicts ? setShowConflictList(!showConflictList) : window.location.reload()} 
                                            className={cn(
                                                "p-3 rounded-xl transition-all active:scale-90 shadow-inner",
                                                hasConflicts 
                                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"  // 🚨 Conflict: Red button
                                                    : "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white"  // ⏳ Pending: Orange button
                                            )}
                                        >
                                            {hasConflicts ? 'Manage Conflicts' : 'Force Sync'}
                                            <RefreshCw size={16} />
                                        </button>
                                    </Tooltip>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- 🚨 CONFLICT MANAGEMENT CENTER --- */}
                    <AnimatePresence>
                        {showConflictList && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            >
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConflictList(false)} />
                                
                                {/* Modal Container */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="relative w-full max-w-4xl max-h-[80vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-red-500/20 overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-transparent">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">Conflict Management Center</h2>
                                                <p className="text-sm text-white/60">Resolve all data conflicts in one place</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowConflictList(false)}
                                            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <ConflictManagementList currentUser={currentUser} />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- 📚 BOOKS LIST & DETAILS VIEW WITH HYBRID PERSISTENCE --- */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        {!activeBook ? (
                            <motion.div 
                                key="list-view"
                                layoutId="main-vault-view"
                                initial={{ opacity: 0, scale: 0.98, x: -30 }} 
                                animate={{ opacity: 1, scale: 1, x: 0 }} 
                                exit={{ opacity: 0, scale: 0.98, x: -30 }} 
                                transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
                            >
                                <BooksList 
                                    onAddClick={() => openModal('addBook', { onSubmit: (data: any) => saveBook(data), currentUser })}
                                    onBookClick={(b: any) => { setActiveBook(b); setDetailsPage(1); }} 
                                    onQuickAdd={(b: any) => { 
                                        setActiveBook(b); 
                                        setTimeout(() => openModal('addEntry', { currentUser, currentBook: b, onSubmit: (data: any) => saveEntry(data) }), 300); 
                                    }}
                                    getBookBalance={getBookBalance}
                                    currencySymbol={getCurrencySymbol()}
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="details-view"
                                layoutId="main-vault-view"
                                initial={{ opacity: 0, scale: 0.98, x: 30 }} 
                                animate={{ opacity: 1, scale: 1, x: 0 }} 
                                exit={{ opacity: 0, scale: 0.98, x: 30 }} 
                                transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
                            >
                                <BookDetails 
                                    currentBook={activeBook} 
                                    bookStats={globalStats} 
                                    currentUser={currentUser} 
                                    onBack={() => {
                                        router.push('?tab=books'); // Move to Dashboard URL first
                                        requestAnimationFrame(() => getVaultStore().setActiveBook(null)); // Clear store at next frame
                                    }}
                                    onAdd={() => openModal('addEntry', { currentUser, currentBook: activeBook, onSubmit: (data: any) => saveEntry(data) })}
                                    onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook: activeBook, currentUser, onSubmit: (data: any) => saveEntry(data) })}
                                    onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => getVaultStore().deleteEntry(e) })}
                                    onToggleStatus={toggleEntryStatus}
                                    
                                    // 🔥 পিন ফাংশন পাস করা হলো (এন্ট্রির জন্য)
                                    onTogglePin={togglePin}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
                </>
            )}
        </div>
    );
});

BooksSection.displayName = 'BooksSection';

export default BooksSection;
