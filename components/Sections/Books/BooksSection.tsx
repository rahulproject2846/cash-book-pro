"use client";
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
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
import { useVault } from '@/hooks/useVault'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (V13.0 - PINNED & ACTIVITY SORTED)
 * --------------------------------------------------------
 * Status: Final Polish, Enterprise Grade Reactivity.
 * 🚀 Performance Optimized with React.memo and useMemo
 */
const BooksSection = memo(({ 
    currentUser, currentBook, setCurrentBook, onGlobalSaveBook ,
    onSaveEntry, onDeleteEntry
}: any) => {
    
    const { openModal } = useModal();
    const { t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    
    // ১. রিঅ্যাক্টিভ লজিক ইঞ্জিন (Direct Connection to V13 Engine)
    const {
        books, allEntries, entries, globalStats, isLoading,
        saveEntry, deleteEntry, toggleEntryStatus, togglePin, 
        conflictedCount,    // � CONFLICT TRACKING: Total conflicted items count
        hasConflicts       // 🚨 CONFLICT TRACKING: Boolean flag for any conflicts
    } = useVault(currentUser, currentBook);

    // ২. রিয়েক্টিভ দারোয়ান (Unsynced Units Counter)
    const unsyncedCount = useLiveQuery(
        () => db.entries
            .where('synced').equals(0)
            .and((e: any) => e.isDeleted === 0) 
            .count(),
        []
    ) || 0;

    // ৩. লোকাল ইউআই স্টেট
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('');
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const [showConflictList, setShowConflictList] = useState(false); 
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ৪. CONFLICT LIST QUERIES
    const conflictedBooksItems = useLiveQuery(() => db.books.where('conflicted').equals(1).toArray()) || [];
    const conflictedEntriesItems = useLiveQuery(() => db.entries.where('conflicted').equals(1).toArray()) || [];

    useEffect(() => {
        setMounted(true);
        setSortOption(t('sort_activity') || 'Activity');
    }, [t]);

    // 🚨 SMART EJECTION: Listen for remote book deletions
    useEffect(() => {
        const handleRemoteDelete = (e: any) => {
            const deletedIdStr = String(e.detail.bookId);
            console.log(`� Ejection Signal Received for:`, deletedIdStr);
            console.log(`🔔 Current viewing:`, {
                currentBook: currentBook ? {
                    _id: currentBook._id,
                    localId: currentBook.localId,
                    name: currentBook.name
                } : null,
                currentBookExists: !!currentBook
            });
            
            // Check if user is currently viewing THIS deleted book (Type-Safe)
            if (currentBook && (
                String(currentBook._id) === deletedIdStr || 
                String(currentBook.localId) === deletedIdStr
            )) {
                console.log(`🚨 [SMART EJECTION] User was viewing deleted book, ejecting to dashboard`);
                
                // Show modal before ejecting to dashboard
                console.log(`🚨 [SMART EJECTION] Opening modal with data:`, {
                    targetName: 'this ledger',
                    title: 'Ledger Deleted',
                    desc: 'This ledger has been deleted remotely.'
                });
                openModal('deleteConfirm', { 
                    targetName: 'this ledger',
                    title: 'Ledger Deleted', 
                    desc: 'This ledger has been deleted remotely.', 
                    onConfirm: () => setCurrentBook(null) 
                });
            } else {
                console.log(`🚨 [SMART EJECTION] ID mismatch - no action needed. Comparison:`, {
                    deletedIdStr,
                    currentBookId: currentBook?._id,
                    currentBookLocalId: currentBook?.localId,
                    currentBookIdStr: currentBook ? String(currentBook._id) : 'null',
                    currentBookLocalIdStr: currentBook ? String(currentBook.localId) : 'null'
                });
            }
        };
        
        if (typeof window !== 'undefined') {
            window.addEventListener('VAULT_BOOK_DELETED', handleRemoteDelete);
        }
        
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('VAULT_BOOK_DELETED', handleRemoteDelete);
            }
        };
    }, [currentBook, setCurrentBook, openModal]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // ৪. MASTER PROCESSING ENGINE (Filtering, Stats & Sorting)
    const processedBooks = useMemo(() => {
        if (!books) return [];

        // ক. ডুপ্লিকেট রিমুভ ও আইডি ম্যাপিং
        const uniqueMap = new Map();
        books.forEach((b: any) => {
            // CRITICAL: Use fallback ID chain to prevent books from collapsing
            const id = String(b.localId || b._id || b.cid);
            if (!uniqueMap.has(id)) uniqueMap.set(id, b);
        });

        let list = Array.from(uniqueMap.values());

        // DELETE FILTER: Strictly filter out deleted books
        list = list.filter((book: any) => {
            return Number(book.isDeleted || 0) === 0;
        });

        // খ. স্মার্ট সার্চ ফিল্টার
        const q = (searchQuery || "").toLowerCase().trim();
        if (q) {
            list = list.filter((book: any) => 
                (book.name || "").toLowerCase().includes(q)
            );
        }

        // গ. লাইভ স্ট্যাটাস ক্যালকুলেশন
        let processedList = list.map((book: any) => {
            const bId = String(book._id || book.localId);
            const bEntries = allEntries.filter((e: any) => String(e.bookId) === bId);
            
            const inF = bEntries
                .filter((e: any) => e.type === 'income' && String(e.status).toLowerCase() === 'completed')
                .reduce((s: number, e: any) => s + Number(e.amount), 0);
            
            const outF = bEntries
                .filter((e: any) => e.type === 'expense' && String(e.status).toLowerCase() === 'completed')
                .reduce((s: number, e: any) => s + Number(e.amount), 0);
            
            return { 
                ...book, 
                reactKey: bId, 
                stats: { balance: inF - outF, inflow: inF, outflow: outF } 
            };
        });

        // DEBUG: Log sample to debug filtering issues
        if (processedList.length > 0) {
            console.log('Processed Sample:', processedList[0]);
        } else if (books && books.length > 0) {
            console.log('DEBUG: No processed books but raw books exist:', {
                totalRaw: books.length,
                rawSample: books[0],
                filteredOut: books.filter((b: any) => Number(b.isDeleted || 0) === 1).length
            });
        }

        // ঘ. সর্টিং প্রোটোকল (V13.0 Standard - Rely on pre-sorted books)
        // Books are already sorted in useVault by isPinned desc, then updatedAt desc
        // No additional sorting needed here to prevent conflicts

        return processedList;
    }, [books, allEntries, searchQuery, sortOption, t]);

    // ৫. প্যাজিনেশন লজিক
    const ITEMS_PER_PAGE = 15;
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = useMemo(() => {
        return processedBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);
    }, [processedBooks, dashPage]);

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    if (!mounted) return null;

    return (
        <div className="w-full relative transition-all duration-500">
            
            {/* --- ১. HUB HEADER --- */}
            {!currentBook && (
                <HubHeader 
                    title={t('ledger_hub') || "LEDGER HUB"} 
                    subtitle={`${toBn(processedBooks.length, language)} ${t('active_protocols') || "PROTOCOLS ACTIVE"}`}
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

            {/* --- ৩. MAIN VIEW CONTENT --- */}
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="list" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                        <BooksList 
                            books={currentBooks} 
                            isLoading={isLoading && books.length === 0} 
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            onImportClick={handleImportClick}
                            onAddClick={() => openModal('addBook', { onSubmit: onGlobalSaveBook, currentUser })}
                            onBookClick={(b: any) => { setCurrentBook(b); setDetailsPage(1); }} 
                            
                            // 🔥 পিন ফাংশন পাস করা হলো
                            onTogglePin={togglePin}

                            onQuickAdd={(b: any) => { 
                                setCurrentBook(b); 
                                setTimeout(() => openModal('addEntry', { currentUser, currentBook: b, onSubmit: saveEntry }), 300); 
                            }}
                            getBookBalance={(id: any) => processedBooks.find((pb: any) => pb.reactKey === String(id))?.stats?.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* --- PAGINATION (Same as before) --- */}
                        {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row justify-between items-center py-12 gap-8 border-t border-[var(--border)]/30 mt-16">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-orange-500/10 rounded-[22px] flex items-center justify-center text-orange-500 shadow-inner">
                                        <LayoutGrid size={24}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{t('protocol_index')}</p>
                                        <p className="text-[14px] font-black text-[var(--text-main)] uppercase tracking-[2px] mt-2">
                                            {toBn(dashPage, language)} <span className="opacity-20 mx-2">/</span> {toBn(totalPages, language)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <Tooltip text={t('tt_prev_page')} position="bottom">
                                        <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="w-16 h-16 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[25px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500 shadow-xl"><ChevronLeft size={32} strokeWidth={3}/></button>
                                    </Tooltip>
                                    <div className="px-10 h-16 flex items-center justify-center bg-orange-500 text-white rounded-[28px] text-[14px] font-black uppercase tracking-[5px] shadow-2xl shadow-orange-500/40">{toBn(dashPage, language)}</div>
                                    <Tooltip text={t('tt_next_page')} position="bottom">
                                        <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="w-16 h-16 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[25px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500 shadow-xl"><ChevronRight size={32} strokeWidth={3}/></button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="details" initial={{ opacity: 0, scale: 0.98, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ type: "spring", damping: 30, stiffness: 350 }}>
                        <BookDetails 
                            currentBook={currentBook} 
                            items={entries} 
                            stats={globalStats} 
                            currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: onSaveEntry })}
                            onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook, currentUser, onSubmit: onSaveEntry })}
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
            </AnimatePresence>

            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
        </div>
    );
});

BooksSection.displayName = 'BooksSection';

export default BooksSection;