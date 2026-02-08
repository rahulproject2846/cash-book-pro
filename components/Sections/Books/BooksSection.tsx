"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, ChevronLeft, ChevronRight, LayoutGrid, 
    ShieldCheck, CloudOff, CloudSync, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

// Global Engine Hooks & Components
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Domain-Driven Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 

// Core Logic Engine
import { useVault } from '@/hooks/useVault'; 

/**
 * VAULT PRO: MASTER BOOKS SECTION (HOLY-GRAIL V8.5)
 * -----------------------------------------------
 * Features: Absolute Zero-Latency Sync, Multi-tab Broadcast,
 * and Persistent Data Integrity Watchman.
 */
export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType, onGlobalSaveBook, onSaveEntry, onDeleteEntry
}: any) => {
    
    const { openModal, closeModal } = useModal();
    const { T, t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    
    // ২. রিঅ্যাক্টিভ লজিক ইঞ্জিন (LiveQuery powered useVault)
    const {
        books, allEntries, isLoading, entries, stats
    } = useVault(currentUser, currentBook);

    // ৩. লোকাল ইউআই স্টেট
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('Activity');
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const [unsyncedCount, setUnsyncedCount] = useState(0); // "দারোয়ান" কাউন্টার
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ৪. প্রোটোকল: ডাটাবেজ অবজার্ভার (The Watchman)
    useEffect(() => { 
        setMounted(true); 
        
        // চেক করো কয়টি ডাটা এখনো সিঙ্ক হয়নি
        const watchSyncStatus = async () => {
            const count = await db.entries.where('synced').equals(0).count();
            setUnsyncedCount(count);
        };

        const interval = setInterval(watchSyncStatus, 2000); // প্রতি ২ সেকেন্ডে একবার চেক
        window.addEventListener('vault-updated', watchSyncStatus);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('vault-updated', watchSyncStatus);
        };
    }, []);

useEffect(() => {
    console.log("COMPONENT_MOUNTED: BooksSection");
    return () => console.log("COMPONENT_UNMOUNTED: BooksSection");
}, []);



    

    // --- ৫. মাস্টার প্রসেসিং ইঞ্জিন (Reactive Performance) ---
    const processedBooks = useMemo(() => {
        if (!books) return [];
        
        const booksWithStats = (books as any[]).map((book: any) => {
            const bookId = book._id || book.id || book.cid;
            const bookEntries = (allEntries as any[]).filter(e => String(e.bookId) === String(bookId) && e.isDeleted === 0);
            
            const inflow = bookEntries.filter(e => e.type === 'income' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            const outflow = bookEntries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            
            return {
                ...book,
                stats: { balance: inflow - outflow, inflow, outflow, lastUpdated: book.updatedAt || 0 }
            };
        });

        let filtered = booksWithStats.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (sortOption === 'Activity') filtered.sort((a, b) => (b.stats.lastUpdated || 0) - (a.stats.lastUpdated || 0));
        if (sortOption === 'Name (A-Z)') filtered.sort((a, b) => a.name.localeCompare(b.name));
        if (sortOption === 'Balance (High)') filtered.sort((a, b) => b.stats.balance - a.stats.balance);

        return filtered;
    }, [books, allEntries, searchQuery, sortOption]);

    const ITEMS_PER_PAGE = 12; 
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = processedBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    if (!mounted) return null;
console.log("DEBUG [BooksSection]: Rendering Entries:", entries.length);
console.log("DEBUG [BooksSection]: IsLoading:", isLoading);
    return (
        <div className="w-full relative transition-all duration-300">
            {/* --- ৬. THE INTEGRITY WATCHMAN BAR (দারোয়ান) --- */}
            <AnimatePresence>
                {unsyncedCount > 0 && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[20px] p-4 flex items-center justify-between shadow-lg shadow-orange-500/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white animate-pulse">
                                    <CloudSync size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-orange-500">
                                        {t('sync_pending_title') || "Vault Buffer Active"}
                                    </p>
                                    <p className="text-[9px] font-bold text-orange-500/60 uppercase tracking-[1px] mt-0.5">
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
                    <motion.div 
                        key="dashboard-view" 
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                        className="space-y-[var(--app-gap,2rem)]"
                    >
                        {/* --- ৭. ভল্ট গ্রিড সেকশন --- */}
                        <BooksList 
                            books={currentBooks} 
                            isLoading={isLoading && books.length === 0} 
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            onImportClick={() => fileInputRef.current?.click()}
                            onAddClick={() => {
                                setCurrentBook(null);
                                openModal('addBook', { onSubmit: onGlobalSaveBook, currentUser });
                            }} 
                            onBookClick={(b: any) => { setCurrentBook(b); setDetailsPage(1); }} 
                            onQuickAdd={(b: any) => { 
                                setCurrentBook(b); 
                                setTimeout(() => openModal('addEntry', { currentUser, currentBook: b, onSubmit: onSaveEntry }), 350); 
                            }}
                            getBookBalance={(id: any) => processedBooks.find((pb: any) => (pb._id || pb.id || pb.cid) === id)?.stats?.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* --- ৮. প্রিমিয়াম পেজিনেশন --- */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row md:px-8 lg:px-10 justify-between items-center py-10 gap-8 border-t border-[var(--border-color)]/30 mt-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shadow-inner">
                                        <LayoutGrid size={18}/>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{T('protocol_index')}</p>
                                        <p className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[2px] mt-1.5 opacity-60">
                                            {dashPage} / {totalPages}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <Tooltip text={t('tt_prev_page')}>
                                        <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30">
                                            <ChevronLeft size={24} strokeWidth={3}/>
                                        </button>
                                    </Tooltip>
                                    <div className="px-10 py-4 bg-orange-500 text-white rounded-[24px] text-[13px] font-black uppercase tracking-[4px] shadow-2xl">
                                        {dashPage}
                                    </div>
                                    <Tooltip text={t('tt_next_page')}>
                                        <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[22px] disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30">
                                            <ChevronRight size={24} strokeWidth={3}/>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key={`details-${currentBook._id || currentBook.cid}`} 
                        initial={{ opacity: 0, scale: 0.98, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    >
                        {/* --- ৯. ভল্ট ডিটেইলস সেকশন --- */}
                        <BookDetails 
                            currentBook={currentBook} 
                            items={entries} 
                            stats={stats} 
                            currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: onSaveEntry })}
                            onEdit={(e: any) => openModal('addEntry', { entry: e, currentBook, currentUser, onSubmit: onSaveEntry })}
                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => onDeleteEntry(e) })}
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