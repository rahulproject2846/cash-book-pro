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
import { SortDropdown } from '@/components/UI/SortDropdown';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { cn, toBn } from '@/lib/utils/helpers';

// Domain-Driven Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 
import ConflictManagementList from '@/components/UI/ConflictManagementList'; 

// Core Logic Engine
import { useVaultStore } from '@/lib/vault/store/index'; 
import { identityManager } from '@/lib/vault/core/IdentityManager'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (V13.0 - PINNED & ACTIVITY SORTED)
 * --------------------------------------------------------
 * Status: Final Polish, Enterprise Grade Reactivity.
 * 🚀 Performance Optimized with React.memo and useMemo
 */
const BooksSection = memo(({ 
    currentUser, onGlobalSaveBook ,
    onSaveEntry, onDeleteEntry
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
    
    // 🎯 GET ACTIVE BOOK FROM ZUSTAND STORE
    const { activeBook, setActiveBook } = useVaultStore();
    
    // ১. রিঅ্যাক্টিভ লজিক ইঞ্জিন (Direct Connection to Zustand Store)
    const {
        books, globalStats, isLoading,
        saveEntry, deleteEntry, toggleEntryStatus, togglePin, 
        conflictedCount,    // CONFLICT TRACKING: Total conflicted items count
        hasConflicts,       // CONFLICT TRACKING: Boolean flag for any conflicts
        searchQuery, sortOption, filteredBooks, setSearchQuery, setSortOption, 
        isLoading: isStoreLoading, entries, allEntries
    } = useVaultStore();

    // ৪. UNSYNCED COUNT QUERY
    const unsyncedCount = useLiveQuery(
        () => db.entries
            .where('synced').equals(0)
            .and((e: any) => e.isDeleted === 0) 
            .count(),
        []
    ) || 0;

    // ৪. PAGINATION LOGIC
    const ITEMS_PER_PAGE = 15;
    const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = useMemo(() => {
        return filteredBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);
    }, [filteredBooks, dashPage]);

    // Helper function to get currency symbol from user preferences
    const getCurrencySymbol = () => {
        return currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    };

    const getBookBalance = useCallback((id: any) => {
        // Calculate balance from Zustand store
        const { getBookBalance } = useVaultStore.getState();
        return getBookBalance(String(id));
    }, []);
    
    // 🚀 IDENTITY & STORE TRIGGER
    useEffect(() => {
        const userId = currentUser?._id || identityManager.getUserId();
        if (userId && mounted) {
            console.log('🚀 [BOOKS SECTION] Triggering store refresh for user:', userId);
            useVaultStore.getState().refreshData();
        }
    }, [currentUser?._id, mounted]);
    
    // 🎯 SYNC ACTIVE BOOK WITH STORE
    useEffect(() => {
        if (activeBook) {
            console.log('🎯 [BOOKS SECTION] Setting active book in store:', activeBook._id || activeBook.localId);
            useVaultStore.getState().setActiveBook(activeBook);
        }
    }, [activeBook]);
    
    // 🎯 MOUNT EFFECT
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // 🎯 CALCULATIONS AFTER ALL HOOKS
    const combinedLoading = isLoading || isStoreLoading;
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

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
                    {/* --- ১. HUB HEADER --- */}
                    {!activeBook && (
                        <HubHeader 
                            title={t('ledger_hub') || "LEDGER HUB"} 
                            subtitle={`${toBn(filteredBooks.length, language)} ${t('active_protocols') || "PROTOCOLS ACTIVE"}`}
                            icon={Layout}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                        >
                            <SortDropdown 
                                current={sortOption} 
                                options={[t('sort_activity'), t('sort_name'), t('sort_balance_high'), t('sort_balance_low')]} 
                                onChange={setSortOption} 
                            />
                            <Tooltip text={t('tt_import_ledger') || "Import Registry Backup"}>
                                <button onClick={handleImportClick} className="h-11 w-11 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90 shadow-sm outline-none">
                                    <FileUp size={20} />
                                </button>
                            </Tooltip>
                        </HubHeader>
                    )}

                    {/* --- ২. SYNC WATCHMAN BAR --- */}
                    <AnimatePresence>
                        {(unsyncedCount > 0 || hasConflicts) && (
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
                                                {hasConflicts ? "Vault Conflicts Detected" : "Vault Buffer Active"}
                                            </p>
                                            <p className={cn(
                                                "text-[9px] font-bold uppercase tracking-[1px]",
                                                hasConflicts ? "text-red-500/60" : "text-orange-500/60"
                                            )}>
                                                {hasConflicts 
                                                    ? `${toBn(conflictedCount, language)} conflicts found${unsyncedCount > 0 ? `, ${toBn(unsyncedCount, language)} items pending` : ''}`
                                                    : `${toBn(unsyncedCount, language)} ${t('unsynced_units') || "UNITS SECURED IN LOCAL NODE"}`
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

                    {/* --- BOOKS LIST VIEW --- */}
                    {!activeBook && (
                        <BooksList 
                            onAddClick={() => openModal('addBook', { onSubmit: onGlobalSaveBook, currentUser })}
                            onBookClick={(b: any) => { setActiveBook(b); setDetailsPage(1); }} 
                            onQuickAdd={(b: any) => { 
                                setActiveBook(b); 
                                setTimeout(() => openModal('addEntry', { currentUser, currentBook: b, onSubmit: onSaveEntry }), 300); 
                            }}
                            getBookBalance={getBookBalance}
                            currencySymbol={getCurrencySymbol()}
                        />
                    )}

                    {/* --- BOOK DETAILS VIEW --- */}
                    {activeBook && (
                        <motion.div key="details" initial={{ opacity: 0, scale: 0.98, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 30, stiffness: 350 }}>
                            <BookDetails 
                                currentBook={activeBook} 
                                items={entries} 
                                stats={globalStats} 
                                currentUser={currentUser} 
                                onBack={() => setActiveBook(null)}
                                onAdd={() => openModal('addEntry', { currentUser, currentBook: activeBook, onSubmit: onSaveEntry })}
                                onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook: activeBook, currentUser, onSubmit: onSaveEntry })}
                                onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => onDeleteEntry(e) })}
                                onToggleStatus={toggleEntryStatus}
                                
                                // 🔥 পিন ফাংশন পাস করা হলো (এন্ট্রির জন্য)
                                onTogglePin={togglePin}

                                searchQuery={detailsSearchQuery} 
                                setSearchQuery={setDetailsSearchQuery}
                                pagination={{ currentPage: detailsPage, totalPages: Math.ceil(entries.length / 10) || 1, setPage: setDetailsPage }}
                            />
                        </motion.div>
                    )}

                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
                </>
            )}
        </div>
    );
});

BooksSection.displayName = 'BooksSection';

export default BooksSection;
