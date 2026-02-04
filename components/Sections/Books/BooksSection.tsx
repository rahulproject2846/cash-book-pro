"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

// Global UI Components & Hooks
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Components
import { BookDetails } from './BookDetails';
import { BooksList } from './BooksList'; 

// Core Logic & Engines
import { useVault } from '@/hooks/useVault'; 

export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType
}: any) => {
    
    // ১. গ্লোবাল ইঞ্জিন ইমপ্লিমেন্টেশন
    const { openModal, closeModal } = useModal();
    const { T, t } = useTranslation();

    // ২. লজিক ইঞ্জিন (অপরিবর্তিত)
    const {
        books, entries, allEntries, isLoading, stats,
        fetchData, fetchBookEntries, saveEntry, toggleEntryStatus, deleteEntry
    } = useVault(currentUser, currentBook, setCurrentBook);

    // ৩. লোকাল ইউআই স্টেট (অপরিবর্তিত)
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('Activity');
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ৪. অ্যাকশন হ্যান্ডলার্স (লজিক অপরিবর্তিত, শুধু ট্রান্সলেশন ইনজেক্টেড) ---

    const handleSaveBook = async (formData: any, type: 'add' | 'edit') => {
        const isEdit = type === 'edit';
        const bookId = currentBook?._id || currentBook?.id;
        const url = isEdit ? `/api/books/${bookId}` : '/api/books';

        try {
            const res = await fetch(url, { 
                method: isEdit ? 'PUT' : 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ...formData, userId: currentUser._id }), 
            });
            if (res.ok) {
                const result = await res.json();
                await db.books.put({ ...result.book || result.data, updatedAt: Date.now() });
                closeModal(); 
                fetchData();
                toast.success(isEdit ? t('protocol_updated') : t('ledger_initialized'));
            }
        } catch (err) { toast.error(t('sync_failure')); }
    };

    const handleSaveEntryLogic = async (data: any, editTarget?: any) => { 
        const success = await saveEntry(data, editTarget);
        if (success) { 
            await fetchData();
            window.dispatchEvent(new Event('vault-updated'));
            closeModal(); 
        }
    };

    const handleDeleteBook = async (confirmName: string) => {
        const bookId = currentBook?._id || currentBook?.id;
        if (!currentBook || confirmName !== currentBook.name) return toast.error(t('identity_mismatch'));
        try {
            const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
            if (res.ok) {
                await db.books.delete(bookId);
                closeModal();
                setCurrentBook(null);
                fetchData();
                toast.success(t('vault_terminated'));
            }
        } catch (err) { toast.error(t('termination_error')); }
    };

    // --- ৫. স্মার্ট প্রসেসিং ইঞ্জিন (অপরিবর্তিত) ---
    const processedBooks = useMemo(() => {
        const booksWithStats = books.map(book => {
            const bookId = book._id || book.id || book.cid;
            const bookEntries = allEntries.filter(e => e.bookId === bookId && e.isDeleted === 0);
            const inflow = bookEntries.filter(e => e.type === 'income' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            const outflow = bookEntries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            const bookTime = new Date(book.updatedAt || book.createdAt || 0).getTime();
            let lastEntryTime = 0;
            if (bookEntries.length > 0) {
                const sortedEntries = [...bookEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                lastEntryTime = new Date(sortedEntries[0].createdAt).getTime();
            }
            return { ...book, stats: { balance: inflow - outflow, inflow, outflow, lastUpdated: Math.max(bookTime, lastEntryTime) } };
        });

        let filtered = booksWithStats.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (sortOption === 'Activity') filtered.sort((a, b) => (b.stats.lastUpdated || 0) - (a.stats.lastUpdated || 0));
        if (sortOption === 'Name (A-Z)') filtered.sort((a, b) => a.name.localeCompare(b.name));
        return filtered;
    }, [books, allEntries, searchQuery, sortOption]);

    const ITEMS_PER_PAGE = 15; 
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = processedBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);

    // --- ৬. সিনক্রোনাইজেশন ইফেক্টস (অপরিবর্তিত) ---
    useEffect(() => {
        if (externalModalType && externalModalType !== 'none') {
            if (externalModalType === 'addBook') {
                openModal('addBook', { onSubmit: (data: any) => handleSaveBook(data, 'add'), currentUser });
            }
            if (externalModalType === 'shortcut') {
                openModal('shortcut', { onInitialize: () => { setCurrentBook(null); openModal('addBook', { onSubmit: (data: any) => handleSaveBook(data, 'add'), currentUser }); } });
            }
            setExternalModalType('none'); 
        }
    }, [externalModalType, setExternalModalType]);

    useEffect(() => {
        if (!triggerFab) return;
        if (currentBook) {
            openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic });
        } else {
            openModal('addBook', { onSubmit: (data: any) => handleSaveBook(data, 'add'), currentUser });
        }
        setTriggerFab(false); 
    }, [triggerFab, currentBook]);

    useEffect(() => { if (currentUser) fetchData(); }, [currentUser, fetchData]); 
    useEffect(() => { if (currentBook?._id) fetchBookEntries(currentBook._id); }, [currentBook, fetchBookEntries]);

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    if (isLoading && books.length === 0) return (
        <div className="flex justify-center py-[var(--app-gap,10rem)]">
            <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
    );

    return (
        <div className="space-y-[var(--app-gap,1.5rem)] transition-all duration-300">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-[var(--app-gap,2rem)]">
                        <BooksList 
                            books={currentBooks} 
                            isLoading={isLoading} 
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            onImportClick={() => fileInputRef.current?.click()}
                            onAddClick={() => openModal('addBook', { onSubmit: (data: any) => handleSaveBook(data, 'add'), currentUser })} 
                            onBookClick={(b: any) => { setCurrentBook(b); setDetailsPage(1); }} 
                            onQuickAdd={(b: any) => { setCurrentBook(b); openModal('addEntry', { currentUser, currentBook: b, onSubmit: handleSaveEntryLogic }); }}
                            getBookBalance={(id: any) => processedBooks.find(pb => (pb._id || pb.id || pb.cid) === id)?.stats.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* Pagination with Compact & Language Support */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center py-[var(--card-padding,1rem)] px-2 transition-all">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">
                                    {T('protocol_index')}
                                </p>
                                <div className="flex gap-2 items-center">
                                    <Tooltip text={t('tt_prev_page') || "Previous"}>
                                        <button 
                                            disabled={dashPage === 1} 
                                            onClick={() => setDashPage(p => p - 1)} 
                                            className="p-[var(--card-padding,0.75rem)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
                                        >
                                            <ChevronLeft size={20}/>
                                        </button>
                                    </Tooltip>

                                    <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">
                                        {dashPage} / {totalPages}
                                    </div>

                                    <Tooltip text={t('tt_next_page') || "Next"}>
                                        <button 
                                            disabled={dashPage === totalPages} 
                                            onClick={() => setDashPage(p => p + 1)} 
                                            className="p-[var(--card-padding,0.75rem)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 active:scale-95 transition-all"
                                        >
                                            <ChevronRight size={20}/>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key={currentBook._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <BookDetails 
                            currentBook={currentBook} items={entries} stats={stats} currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic })}
                            onEdit={(e: any) => openModal('addEntry', { currentUser, currentBook, entry: e, onSubmit: (data: any) => handleSaveEntryLogic(data, e) })}
                            onDelete={(e: any) => openModal('deleteConfirm', { targetName: e.title, onConfirm: () => deleteEntry(e) })}
                            onToggleStatus={toggleEntryStatus}
                            onDeleteBook={() => openModal('deleteBookConfirm', { targetName: currentBook.name, onConfirm: (name: string) => handleDeleteBook(name) })}
                            searchQuery={detailsSearchQuery} 
                            setSearchQuery={setDetailsSearchQuery}
                            pagination={{ currentPage: detailsPage, totalPages: 1, setPage: setDetailsPage }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
        </div>
    );
};