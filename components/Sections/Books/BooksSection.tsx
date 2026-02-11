"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, LayoutGrid, 
    CloudSync, RefreshCw, Layout, FileUp 
} from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';

// Global Engine Hooks & Components
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { SortDropdown } from '@/components/UI/SortDropdown';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

// Domain-Driven Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 

// Core Logic Engine
import { useVault } from '@/hooks/useVault'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (SOLID ROCK V11.5)
 * --------------------------------------------------------
 * Status: Final Polish, Enterprise Grade Reactivity.
 */
export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, onGlobalSaveBook ,
    onSaveEntry, onDeleteEntry
}: any) => {
    
    const { openModal } = useModal();
    const { T, t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    
    // ১. রিঅ্যাক্টিভ লজিক ইঞ্জিন (Direct Connection to V11 Engine)
    const {
        books, allEntries, entries, stats, isLoading,
        saveEntry, deleteEntry, toggleEntryStatus
    } = useVault(currentUser, currentBook);

    // ২. রিয়েক্টিভ দারোয়ান (Unsynced Units Counter)
        const unsyncedCount = useLiveQuery(
            () => db.entries
                .where('synced').equals(0)
                .and(e => e.isDeleted === 0) // 🔥 ফিক্স: ডিলিট মার্ক করা ডাটা এখানে গুনবে না
                .count(),
            []
        ) || 0;

    // ৩. লোকাল ইউআই স্টেট
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('');
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setSortOption(t('sort_activity') || 'Activity');
    }, [t]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // ৪. ⚡ MASTER PROCESSING ENGINE (Filtering, Stats & Sorting)
    const processedBooks = useMemo(() => {
        if (!books) return [];

        // ক. ডুপ্লিকেট রিমুভ ও আইডি ম্যাপিং
        const uniqueMap = new Map();
        books.forEach((b: any) => {
            const id = String(b.localId || b._id);
            if (!uniqueMap.has(id)) uniqueMap.set(id, b);
        });

        let list = Array.from(uniqueMap.values());

        // খ. 🔍 স্মার্ট সার্চ ফিল্টার
        const q = (searchQuery || "").toLowerCase().trim();
        if (q) {
            list = list.filter((book: any) => 
                (book.name || "").toLowerCase().includes(q)
            );
        }

        // গ. 📊 লাইভ স্ট্যাটাস ক্যালকুলেশন
        let processedList = list.map((book: any) => {
            const bId = String(book._id || book.localId);
            const bEntries = allEntries.filter((e: any) => String(e.bookId) === bId);
            
            const inF = bEntries
                .filter((e: any) => e.type === 'income' && String(e.status).toLowerCase() === 'completed')
                .reduce((s, e) => s + Number(e.amount), 0);
            
            const outF = bEntries
                .filter((e: any) => e.type === 'expense' && String(e.status).toLowerCase() === 'completed')
                .reduce((s, e) => s + Number(e.amount), 0);
            
            return { 
                ...book, 
                reactKey: bId, 
                stats: { balance: inF - outF, inflow: inF, outflow: outF } 
            };
        });

        // ঘ. ⏳ সর্টিং প্রোটোকল (V11.5 Standard)
        processedList.sort((a, b) => {
            const currentSort = (sortOption || "").toLowerCase();
            if (currentSort === (t('sort_name') || "").toLowerCase()) {
                return (a.name || "").localeCompare(b.name || "");
            }
            if (currentSort === (t('sort_balance_high') || "").toLowerCase()) {
                return (b.stats?.balance || 0) - (a.stats?.balance || 0);
            }
            if (currentSort === (t('sort_balance_low') || "").toLowerCase()) {
                return (a.stats?.balance || 0) - (b.stats?.balance || 0);
            }
            return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
        });

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
            
            {/* --- ১. HUB HEADER (Unified OS Style) --- */}
            {!currentBook && (
                <HubHeader 
                    title={T('ledger_hub') || "LEDGER HUB"} 
                    subtitle={`${toBn(processedBooks.length, language)} ${T('active_protocols') || "PROTOCOLS ACTIVE"}`}
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
                {unsyncedCount > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[28px] p-4 flex items-center justify-between shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white animate-pulse shadow-lg shadow-orange-500/20">
                                    <CloudSync size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-orange-500">Vault Buffer Active</p>
                                    <p className="text-[9px] font-bold text-orange-500/60 uppercase tracking-[1px]">
                                        {toBn(unsyncedCount, language)} {t('unsynced_units') || "UNITS SECURED IN LOCAL NODE"}
                                    </p>
                                </div>
                            </div>
                            <Tooltip text={t('tt_force_sync') || "Force protocol refresh"}>
                                <button onClick={() => window.location.reload()} className="p-3 bg-orange-500/10 rounded-xl text-orange-500 hover:bg-orange-500 hover:text-white transition-all active:scale-90 shadow-inner">
                                    <RefreshCw size={16} />
                                </button>
                            </Tooltip>
                        </div>
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
                            onQuickAdd={(b: any) => { 
                                setCurrentBook(b); 
                                setTimeout(() => openModal('addEntry', { currentUser, currentBook: b, onSubmit: saveEntry }), 300); 
                            }}
                            getBookBalance={(id: any) => processedBooks.find((pb: any) => pb.reactKey === String(id))?.stats?.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* --- ELITE OS PAGINATION --- */}
                        {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row justify-between items-center py-12 gap-8 border-t border-[var(--border)]/30 mt-16">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-orange-500/10 rounded-[22px] flex items-center justify-center text-orange-500 shadow-inner">
                                        <LayoutGrid size={24}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{T('protocol_index')}</p>
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
                            stats={stats} 
                            currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            // 🔥 নিচের এই ৩টি লাইন একদম হুবহু রিপ্লেস কর:
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: onSaveEntry })}
                            onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook, currentUser, onSubmit: onSaveEntry })}
                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => onDeleteEntry(e) })}
                            
                            onToggleStatus={toggleEntryStatus}
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
};