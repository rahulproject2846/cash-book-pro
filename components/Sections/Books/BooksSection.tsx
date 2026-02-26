"use client";
import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layout, FileUp, CloudSync, RefreshCw, AlertTriangle, X, GitCommit, Zap
} from 'lucide-react';
import { BookCardSkeleton } from './BookCardSkeleton';

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
import { useVaultStore } from '@/lib/vault/store';
import { getVaultStore } from '@/lib/vault/store/storeHelper'; 
import { identityManager } from '@/lib/vault/core/IdentityManager'; 
import { useRouter, useSearchParams } from 'next/navigation'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (V14.0 - ATOMIC READINESS)
 * --------------------------------------------------------
 * Status: Refactored for Zero-Flicker & Native iOS Fluidity.
 * 🛡️ Guarded by Master Architect DNA.
 */
const BooksSection = memo(({ currentUser }: any) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { openModal } = useModal();
    const { t, language } = useTranslation();

    // 🎯 STABLE STATE INITIALIZATION
    const [mounted, setMounted] = useState(false);
    const [dashPage, setDashPage] = useState(1);
    const [showConflictList, setShowConflictList] = useState(false); 
    const fileInputRef = useRef<HTMLInputElement>(null);
    const refreshLock = useRef(false);

    // 🎯 BOOT STATUS & STORE SELECTORS
    const {
        books, bootStatus, activeBook, setActiveBook, 
        filteredBooks, isLoading, isRefreshing,
        saveBook, saveEntry, deleteBook, toggleEntryStatus, togglePin, 
        conflictedCount, hasConflicts, unsyncedCount,
        searchQuery, setSearchQuery, userId, refreshBooks, fetchPageChunk,
        globalStats, entries, setLastScrollPosition, lastScrollPosition
    } = useVaultStore();

    // 🛡️ SKELETON GATE: Only show if system isn't READY
    const [showSkeleton, setShowSkeleton] = useState(bootStatus !== 'READY');

    useEffect(() => { setMounted(true); }, []);

    // 🚀 IDENTITY & DATA FETCHING WITH REFRESH LOCK
    useEffect(() => {
        const activeUserId = currentUser?._id || userId || identityManager.getUserId();
        if (!activeUserId || !mounted || refreshLock.current) return;

        // If we already have books in RAM, skip the initial skeleton/refresh loop
        if (books.length > 0 && bootStatus === 'READY') {
            setShowSkeleton(false);
            return;
        }

        refreshLock.current = true;
        refreshBooks().finally(() => {
            // Unlock after delay to prevent rapid re-triggers
            setTimeout(() => { refreshLock.current = false; }, 5000);
        });
    }, [currentUser?._id, userId, mounted, bootStatus]);

    // 🛡️ NATIVE UX DELAY: Keep skeleton until boot sequence and processing are complete
    useEffect(() => {
        if (bootStatus === 'READY' && mounted) {
            const timer = setTimeout(() => {
                setShowSkeleton(false);
            }, 350); // Royal Glide Delay
            return () => clearTimeout(timer);
        }
    }, [bootStatus, mounted]);

    // 🎯 SCROLL RESTORATION WITH DOUBLE FRAME BUFFER
    useEffect(() => {
        if (lastScrollPosition > 0 && mounted && !showSkeleton) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const scrollEl = document.querySelector('main');
                    if (scrollEl) {
                        scrollEl.scrollTo({ top: lastScrollPosition, behavior: 'auto' });
                        setLastScrollPosition(0);
                    }
                });
            });
        }
    }, [mounted, showSkeleton]);

    // 🚀 CHUNK FETCH ON PAGE CHANGE
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
    useEffect(() => {
        if (bootStatus === 'READY') {
            fetchPageChunk(dashPage, isMobile);
        }
    }, [dashPage, bootStatus, isMobile]);

    // 🛡️ STABLE CALLBACKS: Fixed Reference Inconsistency
    const onEdit = useCallback((book: any) => {
        openModal('addBook', { editTarget: book, onSubmit: (data: any) => saveBook(data, book), currentUser });
    }, [openModal, saveBook, currentUser]);

    const onDelete = useCallback((book: any) => {
        openModal('deleteConfirm', { targetName: book.name, onConfirm: () => deleteBook(book, router) });
    }, [openModal, deleteBook, router]);

    const handleEntryEdit = useCallback((e: any) => {
        openModal('addEntry', { 
            entry: e, 
            currentBook: activeBook, 
            currentUser: currentUser || { _id: userId }, 
            onSubmit: (data: any) => saveEntry(data) 
        });
    }, [activeBook, currentUser, userId, openModal, saveEntry]);

    const getBookBalance = useCallback((id: any) => {
        return getVaultStore().getBookBalance(String(id));
    }, []);

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleSoftRefresh = useCallback(() => {
        if (hasConflicts) {
            setShowConflictList(true);
        } else {
            getVaultStore().refreshData(); // Soft refresh instead of window.reload
        }
    }, [hasConflicts]);

    const currencySymbol = useMemo(() => {
        return currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    }, [currentUser?.currency]);

    // 🎨 MOTION PHYSICS
    const royalGlide: any = { type: "spring", stiffness: 300, damping: 35, mass: 1 };

    return (
        <div className="w-full relative transition-all duration-500">
            <AnimatePresence mode="wait">
                {showSkeleton ? (
                    <motion.div
                        key="skeleton-gate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        <BookCardSkeleton count={isMobile ? 8 : 12} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="content-gate"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={royalGlide}
                    >
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
                            {(unsyncedCount > 0 || hasConflicts) && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                                    <div className={cn(
                                        "rounded-[28px] p-4 flex items-center justify-between shadow-lg backdrop-blur-md",
                                        hasConflicts ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg",
                                                hasConflicts ? "bg-red-500 shadow-red-500/20" : "bg-orange-500 shadow-orange-500/20"
                                            )}>
                                                {hasConflicts ? <AlertTriangle size={20} /> : <CloudSync size={20} />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className={cn("text-[10px] font-black     ", hasConflicts ? "text-red-500" : "text-orange-500")}>
                                                    {hasConflicts 
                                                        ? `${toBn(conflictedCount, language)} conflicts found${unsyncedCount > 0 ? `, ${toBn(unsyncedCount, language)} pending` : ''}` 
                                                        : `${toBn(unsyncedCount, language)} ${t('unsynced_units') || "UNITS SECURED"}`
                                                    }
                                                </p>
                                                <p className={cn("text-[9px] font-bold     ", hasConflicts ? "text-red-500/60" : "text-orange-500/60")}>
                                                    {hasConflicts ? "Vault Conflicts Detected" : "Vault Buffer Active"}
                                                </p>
                                            </div>
                                        </div>
                                        <Tooltip text={hasConflicts ? "Manage all data version mismatches." : (t('tt_force_sync') || "Force protocol refresh")}>
                                            <button 
                                                onClick={handleSoftRefresh} 
                                                className={cn(
                                                    "p-3 rounded-xl transition-all active:scale-90 shadow-inner flex items-center gap-2 text-[10px] font-bold  ",
                                                    hasConflicts ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" : "bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white"
                                                )}
                                            >
                                                {hasConflicts ? 'Manage Conflicts' : 'Force Sync'}
                                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- 🚨 CONFLICT MANAGEMENT CENTER --- */}
                        <AnimatePresence>
                            {showConflictList && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-4xl max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                                        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-gradient-to-r from-red-500/10 to-transparent">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle className="text-red-500" size={24} />
                                                <h2 className="text-xl font-bold">{t('conflict_center') || "Conflict Management Center"}</h2>
                                            </div>
                                            <button onClick={() => setShowConflictList(false)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"><X size={20} /></button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6"><ConflictManagementList currentUser={currentUser} /></div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- 📚 MAIN VIEW SWITCHER --- */}
                        <div className="relative w-full">
                            <AnimatePresence mode="wait">
                                {!activeBook ? (
                                    <motion.div 
                                        key="books-list-view"
                                        layoutId="main-vault-view"
                                        initial={{ opacity: 0, x: -20 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        exit={{ opacity: 0, x: -20 }} 
                                        transition={royalGlide}
                                    >
                                        <BooksList 
                                            onAddClick={() => openModal('addBook', { onSubmit: (data: any) => saveBook(data), currentUser })}
                                            onBookClick={(b: any) => { setActiveBook(b); }} 
                                            onQuickAdd={(b: any) => { 
                                                setActiveBook(b); 
                                                setTimeout(() => openModal('addEntry', { currentUser: currentUser || { _id: userId }, currentBook: b, onSubmit: (data: any) => saveEntry(data) }), 300); 
                                            }}
                                            getBookBalance={getBookBalance}
                                            currencySymbol={currencySymbol}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="book-details-view"
                                        layoutId="main-vault-view"
                                        initial={{ opacity: 0, x: 20 }} 
                                        animate={{ opacity: 1, x: 0 }} 
                                        exit={{ opacity: 0, x: 20 }} 
                                        transition={royalGlide}
                                    >
                                        <BookDetails 
                                            currentBook={activeBook} 
                                            bookStats={globalStats} 
                                            currentUser={currentUser || { _id: userId }} 
                                            onBack={() => {
                                                const scrollEl = document.querySelector('main');
                                                if (scrollEl) setLastScrollPosition(scrollEl.scrollTop);
                                                router.push('?tab=books');
                                                requestAnimationFrame(() => setActiveBook(null));
                                            }}
                                            onAdd={() => openModal('addEntry', { currentUser: currentUser || { _id: userId }, currentBook: activeBook, onSubmit: (data: any) => saveEntry(data) })}
                                            onEdit={handleEntryEdit}
                                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => getVaultStore().deleteEntry(e) })}
                                            onToggleStatus={toggleEntryStatus}
                                            onTogglePin={togglePin}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

BooksSection.displayName = 'BooksSection';
export default BooksSection;