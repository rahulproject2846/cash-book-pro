"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, ChevronLeft, ChevronRight, LayoutGrid, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

// Global Engine Hooks & Components
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

    // ২. লজিক ইঞ্জিন (Strict Preservation)
    const {
        books, entries, allEntries, isLoading, stats,
        fetchData, fetchBookEntries, saveEntry, toggleEntryStatus, deleteEntry
    } = useVault(currentUser, currentBook, setCurrentBook);

    // ৩. লোকাল ইউআই স্টেট
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('Activity');
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ৪. একশন কলব্যাকস (Logic 100% Intact) ---
    const handleSaveBook = async (formData: any, type: 'add' | 'edit') => {
        const bookId = currentBook?._id || currentBook?.id || formData?._id;
        const isEdit = type === 'edit' && bookId;

        try {
            const res = await fetch(isEdit ? `/api/books/${bookId}` : '/api/books', { 
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ ...formData, _id: bookId, userId: currentUser._id }), 
            });

            if (res.ok) {
                const result = await res.json();
                const savedData = result.book || result.data;
                await db.books.put({ ...savedData, updatedAt: Date.now() });
                closeModal(); 
                fetchData();
                window.dispatchEvent(new Event('vault-updated'));
                toast.success(isEdit ? t('protocol_updated') : t('ledger_initialized'));
            }
        } catch (err) { toast.error(t('sync_failure')); }
    };

    const handleSaveEntryLogic = async (data: any, editTarget?: any) => { 
        const success = await saveEntry(data, editTarget);
        if (success) { 
            closeModal();
            window.dispatchEvent(new Event('vault-updated'));
            fetchData();
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
                window.dispatchEvent(new Event('vault-updated'));
                toast.success(t('vault_terminated'));
            }
        } catch (err) { toast.error(t('termination_error')); }
    };

    // --- ৫. স্মার্ট প্রসেসিং ইঞ্জিন ---
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

    const ITEMS_PER_PAGE = 12; 
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = processedBooks.slice((dashPage - 1) * ITEMS_PER_PAGE, dashPage * ITEMS_PER_PAGE);

    // --- ৬. সিনক্রোনাইজেশন ইফেক্টস ---
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
    }, [externalModalType]);

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
    
    // ৭. প্রিমিয়াম লোডিং স্টেট
    if (isLoading && books.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-[3px] text-orange-500/50">{t('syncing_ledger') || "Syncing Vaults..."}</p>
        </div>
    );

    return (
        <div className="w-full relative overflow-visible transition-all duration-500">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div 
                        key="dashboard-list" 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-[var(--app-gap,2rem)]"
                    >
                        {/* --- ৮. ভল্ট লিস্ট সেকশন --- */}
                        <BooksList 
                            books={currentBooks} 
                            isLoading={isLoading} 
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            onImportClick={() => fileInputRef.current?.click()}
                            onAddClick={() => {
                                setCurrentBook(null);
                                openModal('addBook', { onSubmit: (data: any) => handleSaveBook(data, 'add'), currentUser });
                            }} 
                            onBookClick={(b: any) => { setCurrentBook(b); setDetailsPage(1); }} 
                            onQuickAdd={(b: any) => { 
                                setCurrentBook(b); 
                                setTimeout(() => {
                                    openModal('addEntry', { currentUser, currentBook: b, onSubmit: handleSaveEntryLogic });
                                }, 350); // স্মুথ ট্রানজিশনের জন্য ডিলে
                            }}
                            getBookBalance={(id: any) => processedBooks.find(pb => (pb._id || pb.id || pb.cid) === id)?.stats.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* --- ৯. প্রিমিয়াম প্যানিনেশন --- */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row md:px-8 lg:px-10 justify-between items-center py-6 gap-6 border border-[var(--border-color)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                                        <LayoutGrid size={14}/>
                                    </div>
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{T('protocol_index')}</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <Tooltip text={t('tt_prev_page')}>
                                        <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30">
                                            <ChevronLeft size={20} strokeWidth={3}/>
                                        </button>
                                    </Tooltip>
                                    <div className="px-8 py-3.5 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[3px] shadow-xl shadow-orange-500/20">
                                        {dashPage} <span className="opacity-50 mx-2">/</span> {totalPages}
                                    </div>
                                    <Tooltip text={t('tt_next_page')}>
                                        <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 active:scale-90 transition-all hover:border-orange-500/30">
                                            <ChevronRight size={20} strokeWidth={3}/>
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div 
                        key={`details-${currentBook._id}`} 
                        initial={{ opacity: 0, scale: 0.98, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    >
                        {/* --- ১০. ভল্ট ডিটেইলস সেকশন --- */}
                        <BookDetails 
                            currentBook={currentBook} items={entries} stats={stats} currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => openModal('addEntry', { currentUser, currentBook, onSubmit: handleSaveEntryLogic })}
                            onEdit={(e: any) => openModal('addEntry', { currentUser, currentBook, entry: e, onSubmit: (data: any) => handleSaveEntryLogic(data, e) })}
                            onDelete={(e: any) => openModal('deleteConfirm', { 
                                targetName: e.title, 
                                onConfirm: () => { deleteEntry(e); closeModal(); window.dispatchEvent(new Event('vault-updated')); }
                            })}
                            onToggleStatus={toggleEntryStatus}
                            onDeleteBook={() => openModal('deleteBookConfirm', { targetName: currentBook.name, onConfirm: (name: string) => handleDeleteBook(name) })}
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