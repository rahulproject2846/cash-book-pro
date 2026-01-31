"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Loader2, FileUp, Filter, 
    LayoutGrid, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { db, saveEntryToLocal } from '@/lib/offlineDB';

// Components & Modals
import { BookDetails } from './Books/BookDetails';
import { BookCard } from '@/components/BookCard';
import { EntryModal } from '@/components/Modals/EntryModal'; 
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';
import CustomSelect from '@/components/CustomSelect';

// Core Logic & Engines
import { useVault } from '@/hooks/useVault'; 

export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType, bookForm, setBookForm // page/setPage removed as we use local state
}: any) => {
    
    // --- ১. লজিক ইঞ্জিন ইনজেকশন ---
    const {
        books, entries, allEntries, isLoading, stats,
        fetchData, fetchBookEntries, saveEntry, toggleEntryStatus, deleteEntry
    } = useVault(currentUser, currentBook, setCurrentBook);

    // --- ২. লোকাল ইউআই স্টেট ---
    const [searchQuery, setSearchQuery] = useState(''); 
    const [sortOption, setSortOption] = useState('Activity');
    
    // 🔥 Dashboard Pagination State
    const [dashPage, setDashPage] = useState(1);

    // Details View States
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);

    const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook' | 'analytics' | 'export' | 'share'>('none');
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ৩. বুক প্রসেসিং ইঞ্জিন (Sorting & Pagination) ---
    // BooksSection.tsx এর ভেতর (লাইন 250 এর আশেপাশে)

    const handleQuickAdd = (book: any) => { 
    // Quick Add লজিককে এক জায়গায় নিয়ে আসা
    setCurrentBook(book); 
    setTimeout(() => {
        setTriggerFab(true); 
    }, 100);
};

// BooksSection.tsx এর ভেতর (Line 250 এর আশেপাশে)

// ৩. বুক প্রসেসিং ইঞ্জিন (Sorting & Stats)
const processedBooks = useMemo(() => {
    const booksWithStats = books.map(book => {
        // 🔥 FIX 1: e.bookId === book._id ব্যবহার করা হলো
        const bookEntries = allEntries.filter(e => e.bookId === book._id && e.isDeleted === 0); 
        
        // ১. এন্ট্রিগুলোকে সঠিকভাবে সর্ট করে লেটেস্টটি বের করা (Sorting Entries)
        const lastEntry = bookEntries.sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tB - tA; // ডেট Descending
        })[0];

        // ২. টাইম নরমালইজেশন (LastUpdated)
        const lastUpdated = lastEntry 
            ? new Date(lastEntry.createdAt).getTime() 
            : new Date(book.updatedAt || 0).getTime();

        // Stats Calculation
        const inflow = bookEntries.filter(e => e.type === 'income' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
        const outflow = bookEntries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);

        return {
            ...book,
            stats: { balance: inflow - outflow, inflow, outflow, lastUpdated }
        };
    });

    // ৩. সার্চ ফিল্টার
    let filtered = booksWithStats.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // ৪. সর্টিং ইঞ্জিন (Dropdown Based)
    filtered.sort((a, b) => {
        if (sortOption === 'Activity') {
            // বড় থেকে ছোট (নতুন থেকে পুরনো)
            return (b.stats.lastUpdated || 0) - (a.stats.lastUpdated || 0);
        }
        if (sortOption === 'Name (A-Z)') return a.name.localeCompare(b.name);
        if (sortOption === 'Balance (High)') return b.stats.balance - a.stats.balance;
        if (sortOption === 'Balance (Low)') return a.stats.balance - b.stats.balance;
        return 0;
    });

    return filtered;
}, [books, allEntries, searchQuery, sortOption]); // সব ডেটা নির্ভরতা ঠিক আছে

    // ৪. পেজিনেশন স্লাইসিং
    const ITEMS_PER_PAGE = 11; 
    const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE) || 1;
    const currentBooks = processedBooks.slice(((dashPage || 1) - 1) * ITEMS_PER_PAGE, (dashPage || 1) * ITEMS_PER_PAGE);

    // --- ৫. ইফেক্টস ---
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
        if (externalModalType && externalModalType !== 'none') {
            setModalType(externalModalType);
        }
    }, [externalModalType, setExternalModalType]);

    useEffect(() => {
        if (!triggerFab) return;
        if (currentBook) { setEditTarget(null); setModalType('addEntry'); }
        else { setBookForm({ name: '', description: '' }); setModalType('addBook'); }
        setTriggerFab(false); 
    }, [triggerFab, currentBook, setTriggerFab, setBookForm]);

    // --- ৬. অ্যাকশন হ্যান্ডলার্স ---
    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = modalType === 'editBook';
        const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';

        if (!bookForm.name.trim()) return toast.error("Ledger name is mandatory");

        try {
            const res = await fetch(url, { 
                method: isEdit ? 'PUT' : 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    name: bookForm.name, 
                    description: bookForm.description, 
                    userId: currentUser._id 
                }), 
            });
            if (res.ok) {
                const result = await res.json();
                await db.books.put({ ...result.book || result.data, updatedAt: Date.now() });
                setModalType('none');
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
            setModalType('none'); 
            setEditTarget(null); 
        }
    };

    const handleDeleteEntry = async () => {
        const success = await deleteEntry(deleteTarget);
        if (success) setModalType('none');
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        toast.success("Import logic placeholder");
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
                        
                        {/* Control Bar */}
                        <div className="bg-[var(--bg-card)] p-6 rounded-[32px] border border-[var(--border-color)] flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><LayoutGrid size={24} /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black uppercase italic leading-none">Ledger Hub</h3>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[3px] mt-1">{books.length} Active Vaults</p>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto items-center">
                                <div className="relative flex-1 md:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500" size={18} />
                                    <input placeholder="Search Ledgers..." className="app-input pl-12 py-4 text-xs font-black uppercase tracking-widest" value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setDashPage(1);}} />
                                </div>
                                <div className="w-48">
                                    <CustomSelect 
                                        label="Sort By" 
                                        value={sortOption} 
                                        options={['Activity', 'Name (A-Z)', 'Balance (High)', 'Balance (Low)']} 
                                        onChange={setSortOption} 
                                        icon={ArrowUpDown} 
                                    />
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl border-2 bg-[var(--bg-card)] hover:text-green-500 transition-all"><FileUp size={20} /></button>
                                <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls" className="hidden" />
                            </div>
                        </div>

                        {/* Ledger Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Create Card */}
                            {(dashPage === 1) && (
                                <div onClick={() => { setBookForm({name:'', description:''}); setModalType('addBook'); }} className="app-card h-[220px] border-2 border-dashed border-orange-500/30 flex flex-col items-center justify-center text-orange-500 cursor-pointer hover:bg-orange-500/5 transition-all group">
                                    <Plus size={36} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-black uppercase tracking-widest mt-2">Initialize Ledger</span>
                                </div>
                            )}

                            {/* Book Cards */}
                            {currentBooks.map((b: any) => (
                                <BookCard 
                                    key={b._id} 
                                    book={b} 
                                    stats={b.stats}
                                    currencySymbol={getCurrencySymbol()}
                                    onClick={() => {
                                         setCurrentBook(b); 
                                         setDetailsPage(1); // Reset details pagination
                                    }} 
                                    onQuickAdd={() => handleQuickAdd(b)} 
                                />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center py-4 px-2">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">Protocol Archive</p>
                                <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end items-center">
                                    <button disabled={dashPage === 1} onClick={() => setDashPage(p => p - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 hover:border-orange-500"><ChevronLeft size={20}/></button>
                                    <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{dashPage} / {totalPages}</div>
                                    <button disabled={dashPage === totalPages} onClick={() => setDashPage(p => p + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-30 hover:border-orange-500"><ChevronRight size={20}/></button>
                                </div>
                            </div>
                        )}

                    </motion.div>
                ) : (
                    /* ডিটেইলস ভিউ */
                    <motion.div key={currentBook._id + ((currentBook as any).__uiKey || '')} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <BookDetails 
                            currentBook={currentBook} items={entries} stats={stats} currentUser={currentUser} 
                            onBack={() => setCurrentBook(null)}
                            onAdd={() => { setEditTarget(null); setModalType('addEntry'); }}
                            onEdit={(e: any) => { setEditTarget(e); setModalType('addEntry'); }}
                            onDelete={(e: any) => { setDeleteTarget(e); setConfirmName(''); setModalType('deleteConfirm');}}
                            onToggleStatus={toggleEntryStatus}
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

            {/* ৫. মডাল ইঞ্জিন */}
            <EntryModal 
                isOpen={modalType === 'addEntry'} 
                onClose={() => setModalType('none')} 
                currentUser={currentUser}
                initialData={editTarget}
                onSubmit={handleSaveEntryLogic} 
            />

            <AnimatePresence>
                {(modalType === 'addBook' || modalType === 'editBook') && (
                    <ModalLayout title={modalType === 'editBook' ? "Protocol: Update" : "Protocol: Initialize"} onClose={() => setModalType('none')}>
                        <form onSubmit={handleSaveBook} className="space-y-4">
                            <input required placeholder="LEDGER IDENTITY" className="app-input font-bold uppercase" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
                            <input placeholder="DESCRIPTION" className="app-input text-xs uppercase" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
                            <button className="app-btn-primary w-full py-5 uppercase font-black tracking-widest mt-2">Execute</button>
                        </form>
                    </ModalLayout>
                )}
                {modalType === 'deleteConfirm' && <DeleteConfirmModal targetName={deleteTarget?.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={() => setModalType('none')} />}
            </AnimatePresence>
        </div>
    );
};