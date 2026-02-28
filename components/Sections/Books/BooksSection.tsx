"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layout, FileUp, CloudSync, RefreshCw, AlertTriangle, X, Zap 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- 🛡️ HOLLY GRILL CORE ENGINE ---
import { useVaultStore } from '@/lib/vault/store';
import { identityManager } from '@/lib/vault/core/IdentityManager';
import { useTranslation } from '@/hooks/useTranslation';
import { useModal } from '@/context/ModalContext';
import { cn, toBn } from '@/lib/utils/helpers';

// --- 🧩 DOMAIN-DRIVEN COMPONENTS ---
import { HubHeader } from '@/components/Layout/HubHeader';
import { BooksList } from './BooksList';
import { BookDetails } from './BookDetails';
import { BookCardSkeleton } from './BookCardSkeleton';
import ConflictManagementList from '@/components/UI/ConflictManagementList';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * 🏆 MASTER BOOKS SECTION V15.0 (HOLLY GRILL DEFINITIVE)
 * -------------------------------------------------------
 * Logic: Triple-Link Identity Protocol | SSOT Architecture.
 * Physics: Royal Glide Spring (300/35/1).
 * Features: Morphic Transition, Predictive Prefetching, Double-Buffer Scroll.
 */
export const BooksSection = ({ currentUser }: any) => {
    const router = useRouter();
    const { openModal } = useModal();
    const { t, language } = useTranslation();

    // 🎯 RECONSTRUCTION STATE
    const [mounted, setMounted] = useState(false);
    const [dashPage, setDashPage] = useState(1);
    const [showConflictList, setShowConflictList] = useState(false);
    const refreshLock = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🚀 SINGLE SOURCE OF TRUTH SELECTORS
    const {
        books, filteredBooks, activeBook, bootStatus, isLoading, isRefreshing,
        searchQuery, setSearchQuery, conflictedCount, hasConflicts, unsyncedCount,
        lastScrollPosition, setLastScrollPosition, globalStats,
        setActiveBook, refreshBooks, fetchPageChunk, saveBook, deleteBook,
        saveEntry, toggleEntryStatus, togglePin, userId, getBookBalance
    } = useVaultStore();

    // 🛡️ SKELETON PROTECTION GATE
    const [showSkeleton, setShowSkeleton] = useState(bootStatus !== 'READY');

    useEffect(() => { setMounted(true); }, []);

    // 🌊 NATIVE FLUIDITY DELAY
    useEffect(() => {
        if (bootStatus === 'READY' && mounted) {
            const timer = setTimeout(() => setShowSkeleton(false), 350);
            return () => clearTimeout(timer);
        }
    }, [bootStatus, mounted]);

    // 🎯 SMART SCROLL RESTORATION (Double Buffer)
    useEffect(() => {
        if (lastScrollPosition > 0 && mounted && !showSkeleton && !activeBook) {
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
    }, [mounted, showSkeleton, activeBook, lastScrollPosition, setLastScrollPosition]);

    // 📱 RESPONSIVE CHUNK FETCHING
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
    useEffect(() => {
        // 🆕 GHOST RACE CONDITION FIX: Only fetch if NOT searching
        if (bootStatus === 'READY' && !activeBook && !searchQuery) {
            fetchPageChunk(dashPage, isMobile);
        }
    }, [dashPage, bootStatus, isMobile, activeBook, fetchPageChunk, searchQuery]);

    // 🛡️ STABLE ACTION HANDLERS
    const onEdit = useCallback((book: any) => {
        openModal('addBook', { editTarget: book, onSubmit: (data: any) => saveBook(data, book), currentUser });
    }, [openModal, saveBook, currentUser]);

    const onDelete = useCallback((book: any) => {
        openModal('deleteConfirm', { 
            targetName: book.name, 
            onConfirm: () => deleteBook(book, router) 
        });
    }, [openModal, deleteBook, router]);

    const handleEntryEdit = useCallback((entry: any) => {
        openModal('addEntry', { 
            entry, 
            currentBook: activeBook, 
            currentUser: currentUser || { _id: userId }, 
            onSubmit: (data: any) => saveEntry(data) 
        });
    }, [activeBook, currentUser, userId, openModal, saveEntry]);

    const handleSoftRefresh = useCallback(() => {
        if (hasConflicts) setShowConflictList(true);
        else useVaultStore.getState().refreshData();
    }, [hasConflicts]);

    const currencySymbol = useMemo(() => {
        return currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    }, [currentUser?.currency]);

    // 🎨 ROYAL GLIDE PHYSICS
    const royalGlide = { type: "spring", stiffness: 300, damping: 35, mass: 1 };

    if (!mounted) return null;

    return (
        <div className="w-full relative min-h-screen">
            <AnimatePresence mode="wait">
                {showSkeleton ? (
                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                        <BookCardSkeleton count={isMobile ? 8 : 12} />
                    </motion.div>
                ) : (
                    <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={royalGlide as any}>
                        
                        {/* --- 🧠 MASTER HUB HEADER --- */}
                        <AnimatePresence>
                            {!activeBook && (
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                    <HubHeader 
                                        title={t('ledger_hub') || "LEDGER HUB"} 
                                        subtitle={`${toBn(filteredBooks.length, language)} ${t('active_protocols') || "PROTOCOLS ACTIVE"}`}
                                        icon={Layout}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                    >
                                        <Tooltip text={t('tt_import_ledger')}>
                                            <button onClick={() => fileInputRef.current?.click()} className="h-11 w-11 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90 shadow-sm outline-none">
                                                <FileUp size={20} />
                                            </button>
                                        </Tooltip>
                                    </HubHeader>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- 🌩 SYNC WATCHMAN BAR --- */}
                        <AnimatePresence>
                            {(unsyncedCount > 0 || hasConflicts) && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8 px-1">
                                    <div className={cn(
                                        "rounded-[32px] p-5 flex items-center justify-between shadow-xl border backdrop-blur-xl",
                                        hasConflicts ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"
                                    )}>
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg",
                                                hasConflicts ? "bg-red-500" : "bg-orange-500"
                                            )}>
                                                {hasConflicts ? <AlertTriangle size={24} /> : <CloudSync size={24} />}
                                            </div>
                                            <div>
                                                <p className={cn("text-[11px] font-black uppercase tracking-wider", hasConflicts ? "text-red-500" : "text-orange-500")}>
                                                    {hasConflicts ? `${toBn(conflictedCount, language)} Conflicts Identified` : `${toBn(unsyncedCount, language)} Units Pending`}
                                                </p>
                                                <p className="text-[9px] font-bold opacity-60 text-[var(--text-main)]">System Integrity Check Active</p>
                                            </div>
                                        </div>
                                        <button onClick={handleSoftRefresh} className={cn("px-5 py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-95 shadow-sm", hasConflicts ? "bg-red-500 text-white" : "bg-orange-500 text-white")}>
                                            {hasConflicts ? 'Resolve Mismatch' : 'Sync DNA'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- 🚨 CONFLICT RESOLUTION OVERLAY --- */}
                        <AnimatePresence>
                            {showConflictList && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-5xl h-[85vh] bg-[var(--bg-app)] border border-[var(--border)] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                                        <div className="flex items-center justify-between p-8 border-b border-[var(--border)]">
                                            <h2 className="text-2xl font-black text-[var(--text-main)]">INTEGRITY COMMAND</h2>
                                            <button onClick={() => setShowConflictList(false)} className="p-3 bg-[var(--bg-card)] rounded-2xl hover:text-red-500 transition-colors"><X size={24}/></button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-8"><ConflictManagementList currentUser={currentUser} /></div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- 📚 SWITCHABLE CONTENT AREA --- */}
                        <div className="relative w-full">
                            <AnimatePresence mode="wait">
                                {!activeBook ? (
                                    /* --- VAULT LIST VIEW --- */
                                    <motion.div key="list" layoutId="main-vault-view" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={royalGlide as any}>
                                        <BooksList 
                                            onAddClick={() => openModal('addBook', { onSubmit: (data: any) => saveBook(data), currentUser })}
                                            onBookClick={(b: any) => {
                                                const scrollEl = document.querySelector('main');
                                                if (scrollEl) setLastScrollPosition(scrollEl.scrollTop);
                                                setActiveBook(b);
                                            }} 
                                            onQuickAdd={(b: any) => {
                                                setActiveBook(b);
                                                setTimeout(() => openModal('addEntry', { currentUser: currentUser || { _id: userId }, currentBook: b, onSubmit: (data: any) => saveEntry(data) }), 300);
                                            }}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            getBookBalance={getBookBalance}
                                            currencySymbol={currencySymbol}
                                        />
                                    </motion.div>
                                ) : (
                                    /* --- BOOK DATA-INTEL VIEW --- */
                                    <motion.div key="details" layoutId="main-vault-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={royalGlide as any}>
                                        <BookDetails 
                                            currentBook={activeBook} 
                                            bookStats={globalStats} 
                                            currentUser={currentUser || { _id: userId }} 
                                            onBack={() => {
                                                router.push('?tab=books');
                                                requestAnimationFrame(() => setActiveBook(null));
                                            }}
                                            onAdd={() => openModal('addEntry', { currentUser: currentUser || { _id: userId }, currentBook: activeBook, onSubmit: (data: any) => saveEntry(data) })}
                                            onEdit={handleEntryEdit}
                                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => useVaultStore.getState().deleteEntry(e) })}
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
};

BooksSection.displayName = 'BooksSection';
export default BooksSection;