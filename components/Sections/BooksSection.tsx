"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

// Components & Modals
import { BookDetails } from './Books/BookDetails';
import { BooksList } from './Books/BooksList'; // 🔥 নতুন কম্পোনেন্ট ইম্পোর্ট
import { EntryModal } from '@/components/Modals/EntryModal'; 
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';

// Core Logic & Engines
import { useVault } from '@/hooks/useVault'; 

export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType, bookForm, setBookForm, page, setPage
}: any) => {
    
    // --- ১. লজিক ইঞ্জিন (No Changes) ---
    const {
        books, entries, allEntries, isLoading, stats,
        fetchData, fetchBookEntries, saveEntry, toggleEntryStatus, deleteEntry
    } = useVault(currentUser, currentBook, setCurrentBook);

    // --- ২. লোকাল ইউআই স্টেট (No Changes) ---
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('Activity');
    
    const [dashPage, setDashPage] = useState(1);
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);

    const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook' | 'analytics' | 'export' | 'share'>('none');
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ৩. ফোর্স ক্লোজ মডাল ---
    const forceCloseModal = () => {
        setModalType('none');
        setExternalModalType('none'); 
        setBookForm({ name: '', description: '' });
        setEditTarget(null);
    };

    // --- ৪. বুক প্রসেসিং ইঞ্জিন (No Changes) ---
    const processedBooks = useMemo(() => {
        const booksWithStats = books.map(book => {
            const bookEntries = allEntries.filter(e => e.bookId === book._id && e.isDeleted === 0);
            const inflow = bookEntries.filter(e => e.type === 'income' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            const outflow = bookEntries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
            const bookTime = new Date(book.updatedAt || book.createdAt || 0).getTime();
            let lastEntryTime = 0;
            if (bookEntries.length > 0) {
                const sortedEntries = [...bookEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                lastEntryTime = new Date(sortedEntries[0].createdAt).getTime();
            }
            const lastUpdated = Math.max(bookTime, lastEntryTime);
            return {
                ...book,
                stats: { balance: inflow - outflow, inflow, outflow, lastUpdated }
            };
        });

        let filtered = booksWithStats.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

        filtered.sort((a, b) => {
            if (sortOption === 'Activity') return (b.stats.lastUpdated || 0) - (a.stats.lastUpdated || 0);
            if (sortOption === 'Name (A-Z)') return a.name.localeCompare(b.name);
            if (sortOption === 'Balance (High)') return b.stats.balance - a.stats.balance;
            if (sortOption === 'Balance (Low)') return a.stats.balance - b.stats.balance;
            return 0;
        });

        return filtered;
    }, [books, allEntries, searchQuery, sortOption]);

    // ৫. পেজিনেশন
    const ITEMS_PER_PAGE = 11; 
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = processedBooks.slice(((dashPage || 1) - 1) * ITEMS_PER_PAGE, (dashPage || 1) * ITEMS_PER_PAGE);

    // --- ৬. ইফেক্টস (No Changes) ---
    useEffect(() => {
        if (externalModalType && externalModalType !== 'none') {
            if (['addBook', 'addEntry', 'editBook', 'deleteBookConfirm'].includes(externalModalType)) {
                setModalType(externalModalType);
                setExternalModalType('none'); 
            }
        }
    }, [externalModalType, setExternalModalType]);

    useEffect(() => {
        if (currentUser) fetchData(); 
        const handleVaultRefresh = () => fetchData();
        window.addEventListener('vault-updated', handleVaultRefresh);
        return () => window.removeEventListener('vault-updated', handleVaultRefresh);
    }, [currentUser, fetchData]); 

    useEffect(() => {
        if (currentBook?._id) fetchBookEntries(currentBook._id);
    }, [currentBook, fetchBookEntries]);

    useEffect(() => {
        if (!triggerFab) return;
        if (currentBook) { setEditTarget(null); setModalType('addEntry'); }
        else { setBookForm({ name: '', description: '' }); setModalType('addBook'); }
        setTriggerFab(false); 
    }, [triggerFab, currentBook, setTriggerFab, setBookForm]);

    // --- ৭. অ্যাকশন হ্যান্ডলার্স (No Changes) ---
    const handleQuickAdd = (book: any) => { 
        setCurrentBook(book); 
        setTimeout(() => {
            setTriggerFab(true); 
        }, 100);
    };

    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = modalType === 'editBook';
        const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
        if (!bookForm.name.trim()) return toast.error("Ledger name is mandatory");
        try {
            const res = await fetch(url, { 
                method: isEdit ? 'PUT' : 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ name: bookForm.name, description: bookForm.description, userId: currentUser._id }), 
            });
            if (res.ok) {
                const result = await res.json();
                await db.books.put({ ...result.book || result.data, updatedAt: Date.now() });
                forceCloseModal(); 
                fetchData();
                if(isEdit) setCurrentBook(null);
                toast.success("Ledger Synchronized");
            }
        } catch (err) { toast.error("Ledger protocol error"); }
    };

    const handleSaveEntryLogic = async (data: any) => { 
        const success = await saveEntry(data, editTarget);
        if (success) { 
            await fetchBookEntries(currentBook._id);
            await fetchData();
            window.dispatchEvent(new Event('vault-updated'));
            forceCloseModal(); 
        }
    };

    const handleDeleteBook = async () => {
        if (!currentBook || confirmName !== currentBook.name) return toast.error("Identity mismatch");
        try {
            const res = await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
            if (res.ok) {
                await db.books.delete(currentBook._id);
                await db.entries.where('bookId').equals(currentBook._id).delete();
                forceCloseModal();
                setCurrentBook(null);
                fetchData();
                toast.success('Vault Permanently Terminated');
            }
        } catch (err) { toast.error("Vault termination failed"); }
    };

    const handleDeleteEntry = async () => {
        const success = await deleteEntry(deleteTarget);
        if (success) setModalType('none');
    };

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    
    if (isLoading && books.length === 0) return (
        <div className="flex justify-center py-40"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
    );

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        
                        {/* 🔥 এখানে আমরা BooksList ব্যবহার করছি যা নিজের হেডার এবং গ্রিড কন্ট্রোল করবে 🔥 */}
                        <BooksList 
                            books={currentBooks} 
                            isLoading={isLoading} 
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortOption={sortOption}
                            onSortChange={setSortOption}
                            onImportClick={() => fileInputRef.current?.click()}
                            onAddClick={() => { setBookForm({name:'', description:''}); setModalType('addBook'); }} 
                            onBookClick={(b: any) => { setCurrentBook(b); setDetailsPage(1); }} 
                            onQuickAdd={handleQuickAdd}
                            getBookBalance={(id: any) => processedBooks.find(pb => pb._id === id)?.stats.balance || 0}
                            currencySymbol={getCurrencySymbol()}
                        />

                        {/* Pagination (Keeping it here to control dashPage state) */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center py-4 px-2">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">Protocol Archive</p>
                                <div className="flex gap-2 items-center">
                                    <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 hover:border-orange-500 transition-all"><ChevronLeft size={20}/></button>
                                    <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{dashPage} / {totalPages}</div>
                                    <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 hover:border-orange-500 transition-all"><ChevronRight size={20}/></button>
                                </div>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" />
                    </motion.div>
                ) : (
                    <motion.div key={currentBook._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <BookDetails 
                            currentBook={currentBook} items={entries} stats={stats} currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => { setEditTarget(null); setModalType('addEntry'); }}
                            onEdit={(e: any) => { setEditTarget(e); setModalType('addEntry'); }}
                            onDelete={(e: any) => { setDeleteTarget(e); setConfirmName(''); setModalType('deleteConfirm');}}
                            onToggleStatus={toggleEntryStatus}
                            onDeleteBook={() => { setConfirmName(''); setModalType('deleteBookConfirm'); }}
                            searchQuery={detailsSearchQuery} 
                            setSearchQuery={setDetailsSearchQuery}
                            pagination={{ 
                                currentPage: detailsPage, 
                                totalPages: Math.ceil(entries.length / 10) || 1, 
                                setPage: setDetailsPage 
                            }}
                            onOpenAnalytics={() => setModalType('analytics')} 
                            onOpenExport={() => setModalType('export')}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals Logic (No Changes) */}
            <EntryModal isOpen={modalType === 'addEntry'} onClose={forceCloseModal} currentUser={currentUser} initialData={editTarget} onSubmit={handleSaveEntryLogic} />
            <AnimatePresence>
                {(modalType === 'addBook' || modalType === 'editBook') && (
                    <ModalLayout title={modalType === 'editBook' ? "Protocol: Update" : "Protocol: Initialize"} onClose={forceCloseModal}>
                        <form onSubmit={handleSaveBook} className="space-y-4">
                            <input required placeholder="LEDGER IDENTITY" className="app-input font-bold uppercase" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
                            <input placeholder="DESCRIPTION" className="app-input text-xs uppercase" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
                            <button className="app-btn-primary w-full py-5 uppercase font-black tracking-widest mt-2">Execute</button>
                        </form>
                    </ModalLayout>
                )}
                {modalType === 'deleteConfirm' && <DeleteConfirmModal targetName={deleteTarget?.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={forceCloseModal} />}
                {modalType === 'deleteBookConfirm' && <DeleteConfirmModal targetName={currentBook?.name} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteBook} onClose={forceCloseModal} />}
            </AnimatePresence>
        </div>
    );
};