"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, LayoutGrid, 
    CloudSync, RefreshCw, Layout, FileUp,ChevronDown,ArrowDownUp,Check
} from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';

// Global Engine Hooks & Components
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { SortDropdown } from '@/components/UI/SortDropdown';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { toBn } from '@/lib/utils/helpers';

// Domain-Driven Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 

// Core Logic Engine
import { useVault } from '@/hooks/useVault'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (SOLID ROCK V11.5)
 * --------------------------------------------------------
 * Features: Zero-Latency Sync, Crash-Safe Sorting, Reactive Engine.
 */
export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, 
    onGlobalSaveBook 
}: any) => {
    
    const { openModal } = useModal();
    const { T, t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    
    // ১. রিঅ্যাক্টিভ লজিক ইঞ্জিন (Direct Connection)
    const {
        books, allEntries, entries, stats, isLoading,
        saveEntry, deleteEntry, toggleEntryStatus
    } = useVault(currentUser, currentBook);

    // ২. রিয়েক্টিভ দারোয়ান (Sync Counter)
    const unsyncedCount = useLiveQuery(
        () => db.entries.where('synced').equals(0).count(),
        []
    ) || 0;

    // ৩. লোকাল ইউআই স্টেট
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState(''); // শুরুতে খালি থাকবে
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ৪. মাউন্ট হ্যান্ডলার ও ডিফল্ট সর্ট সেটআপ
    useEffect(() => {
        setMounted(true);
        // ট্রান্সলেশন লোড হওয়ার পর ডিফল্ট সর্ট সেট করা
        setSortOption(t('sort_activity') || 'Activity');
    }, [t]);

    // ৫. ইমপোর্ট হ্যান্ডলার
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };







    // ৬. ⚡ MASTER PROCESSING ENGINE
    const processedBooks = useMemo(() => {
        if (!books) return [];

        const uniqueMap = new Map();
        books.forEach((b: any) => {
            const id = String(b.localId || b._id);
            if (!uniqueMap.has(id)) uniqueMap.set(id, b);
        });

        let list = Array.from(uniqueMap.values());

        const q = (searchQuery || "").toLowerCase().trim();
        if (q) {
            list = list.filter((book: any) => 
                (book.name || "").toLowerCase().includes(q)
            );
        }

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

    // ৭. পেজিনেশন লজিক
    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;

    // 🔥 Update 2: currentBooks useMemo আপডেট করা হয়েছে
    const currentBooks = useMemo(() => {
        return processedBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);
    }, [processedBooks, dashPage, ITEMS_PER_PAGE]);

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    if (!mounted) return null;

    return (
        <div className="w-full relative transition-all duration-300">
            
            {/* 🔥 Update 1: HubHeader কে BooksSection এর ভেতরে নিয়ে আসা হলো */}
            {!currentBook && (
                <HubHeader 
                    title={T('ledger_hub')} 
                    subtitle={`${toBn(processedBooks.length, language)} ${T('active_protocols')}`}
                    icon={Layout}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                >
                    {/* সর্ট ও ইমপোর্ট বাটন */}
                    <SortDropdown current={sortOption} options={[t('sort_activity'), t('sort_name'), t('sort_balance_high'), t('sort_balance_low')]} onChange={setSortOption} />
                    <button onClick={handleImportClick} className="h-11 w-11 flex items-center justify-center bg-[var(--dropdown-main)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90 shadow-sm">
                        <FileUp size={20} />
                    </button>
                </HubHeader>
            )}

            {/* --- INTEGRITY WATCHMAN BAR --- */}
            <AnimatePresence>
                {unsyncedCount > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[20px] p-4 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white animate-pulse">
                                    <CloudSync size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-orange-500">Local Cache Active</p>
                                    <p className="text-[9px] font-bold text-orange-500/60 uppercase tracking-[1px]">
                                        {unsyncedCount} {t('unsynced_units') || "UNITS SECURED IN LOCAL NODE"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => window.location.reload()} className="p-2 bg-orange-500/10 rounded-lg text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="list" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-[var(--app-gap,2rem)]">
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

                        {/* --- পেজিনেশন --- */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row md:px-8 lg:px-10 justify-between items-center py-10 gap-8 border-t border-[var(--border-color)]/30 mt-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                        <LayoutGrid size={14}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{T('protocol_index')}</p>
                                        <p className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[2px] mt-1.5 opacity-60">{dashPage} / {totalPages}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <Tooltip text={t('tt_prev_page')}>
                                        <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30"><ChevronLeft size={24} strokeWidth={3}/></button>
                                    </Tooltip>
                                    <div className="px-10 py-4 bg-orange-500 text-white rounded-[24px] text-[13px] font-black uppercase tracking-[4px] shadow-2xl">{dashPage}</div>
                                    <Tooltip text={t('tt_next_page')}>
                                        <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30"><ChevronRight size={24} strokeWidth={3}/></button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="details" initial={{ opacity: 0, scale: 0.98, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                        <BookDetails 
                            currentBook={currentBook} 
                            items={entries} 
                            stats={stats} 
                            currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: saveEntry })}
                            onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook, currentUser, onSubmit: saveEntry })}
                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => deleteEntry(e) })}
                            onToggleStatus={toggleEntryStatus}
                            searchQuery={detailsSearchQuery} 
                            setSearchQuery={setDetailsSearchQuery}
                            pagination={{ 
                                currentPage: detailsPage, 
                                totalPages: Math.ceil(entries.length / 10) || 1, 
                                setPage: setDetailsPage 
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
        </div>
    );
};