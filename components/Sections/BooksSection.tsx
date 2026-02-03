"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

// Global Modal Hook
import { useModal } from '@/context/ModalContext';

// Components
import { BookDetails } from './Books/BookDetails';
import { BooksList } from './Books/BooksList'; 

// Core Logic & Engines
import { useVault } from '@/hooks/useVault'; 

export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType
}: any) => {
    
    // ১. গ্লোবাল মডাল ইঞ্জিন
    const { openModal, closeModal } = useModal();

    // ২. লজিক ইঞ্জিন
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

    // --- ৪. অ্যাকশন হ্যান্ডলার্স ---

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
                toast.success(isEdit ? "Protocol Updated" : "Ledger Initialized");
            }
        } catch (err) { toast.error("Sync protocol failure"); }
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
        if (!currentBook || confirmName !== currentBook.name) return toast.error("Identity mismatch");
        try {
            const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
            if (res.ok) {
                await db.books.delete(bookId);
                closeModal();
                setCurrentBook(null);
                fetchData();
                toast.success('Vault Terminated');
            }
        } catch (err) { toast.error("Termination error"); }
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
        <div className="flex justify-center py-40"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
    );

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
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
                            getBookBalance={(id: any) => processedBooks.find(pb => (pb._id || pb.id) === id)?.stats.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* 🔥 RESTORED: BooksList Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center py-4 px-2">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">Protocol Index</p>
                                <div className="flex gap-2 items-center">
                                    <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 active:scale-95 transition-all">
                                        <ChevronLeft size={20}/>
                                    </button>
                                    <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">
                                        {dashPage} / {totalPages}
                                    </div>
                                    <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 active:scale-95 transition-all">
                                        <ChevronRight size={20}/>
                                    </button>
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