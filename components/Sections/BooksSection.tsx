"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Loader2, X, BookOpen 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Sub-components
import { BooksList } from './Books/BooksList';
import { BookDetails } from './Books/BookDetails';
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';

export const BooksSection = ({ currentUser, currentBook, setCurrentBook }: any) => {
    // --- ১. সকল স্টেট (All States) ---
    const [books, setBooks] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook'>('none');
    
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showChart, setShowChart] = useState(false);
    
    const [bookForm, setBookForm] = useState({ name: '', description: '' });
    const [entryForm, setEntryForm] = useState({ 
        title: '', amount: '', type: 'expense', category: 'General', 
        paymentMethod: 'Cash', note: '', status: 'Completed', 
        date: new Date().toISOString().split('T')[0] 
    });

    // --- ২. ডাটা ফেচিং (API Calls) ---
    const fetchData = async () => {
        if (!currentUser?._id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/books?userId=${currentUser._id}`);
            if (res.ok) setBooks(await res.json());
        } catch (err) {
            console.error("Fetch Error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEntries = async (id: string) => {
        const res = await fetch(`/api/entries?bookId=${id}`);
        if (res.ok) setEntries(await res.json());
    };

    useEffect(() => { if (currentUser) fetchData(); }, [currentUser]);
    useEffect(() => { if (currentBook) fetchEntries(currentBook._id); }, [currentBook]);

    // --- ৩. সকল ফাংশন (All Handlers) ---

    // লেজার বুক সেভ/আপডেট
    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = modalType === 'editBook';
        const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
        const res = await fetch(url, { 
            method: isEdit ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...bookForm, userId: currentUser._id }) 
        });
        if (res.ok) {
            const data = await res.json();
            if (isEdit) setCurrentBook(data);
            setModalType('none'); fetchData(); 
            toast.success(isEdit ? 'Ledger Updated' : 'Ledger Created');
        }
    };

    // এন্ট্রি সেভ/আপডেট
    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editTarget ? `/api/entries/${editTarget._id}` : '/api/entries';
        const res = await fetch(url, { 
            method: editTarget ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...entryForm, bookId: currentBook._id }) 
        });
        if (res.ok) { setModalType('none'); fetchEntries(currentBook._id); toast.success('Synced'); }
    };

    // স্ট্যাটাস টগল
    const handleToggleStatus = async (entry: any) => {
        const newStatus = entry.status === 'Pending' ? 'Completed' : 'Pending';
        await fetch(`/api/entries/status/${entry._id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: newStatus }) });
        fetchEntries(currentBook._id);
    };

    // ডিলিট এন্ট্রি
    const handleDeleteEntry = async () => {
        if (confirmName !== deleteTarget.title) return toast.error("Title mismatch");
        await fetch(`/api/entries/${deleteTarget._id}`, { method: 'DELETE' });
        setModalType('none'); fetchEntries(currentBook._id); toast.success('Removed');
    };

    // ডিলিট বুক
    const handleDeleteBook = async () => {
        if (confirmName !== currentBook.name) return toast.error("Ledger mismatch");
        await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
        setModalType('none'); setCurrentBook(null); fetchData(); toast.success('Deleted');
    };

    const filteredEntries = entries.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // ==========================================
    // RENDER UI
    // ==========================================

    return (
        <div className="space-y-8">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        {/* Header Area (No Stats Cards here) */}
                        <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)]">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Ledger Hub</h2>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1">Total {books.length} Active Records</p>
                            </div>
                            <button onClick={() => {setBookForm({name:'', description:''}); setModalType('addBook');}} className="app-btn app-btn-primary px-8">
                                <Plus size={18} /> New Ledger
                            </button>
                        </div>

                        {/* List View */}
                        <div className="mt-8">
                            <BooksList books={books} isLoading={isLoading} onAddClick={() => {setBookForm({name:'', description:''}); setModalType('addBook');}} onBookClick={setCurrentBook} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="mt-2">
                            <BookDetails 
                                currentBook={currentBook} items={filteredEntries} 
                                onBack={() => setCurrentBook(null)}
                                onAdd={() => {setEditTarget(null); setEntryForm({title:'', amount:'', type:'expense', category:'General', paymentMethod:'Cash', note:'', status: 'Completed', date: new Date().toISOString().split('T')[0]}); setModalType('addEntry');}}
                                onEdit={(e: any) => {setEditTarget(e); setEntryForm({...e, amount: e.amount.toString(), date: new Date(e.date).toISOString().split('T')[0]}); setModalType('addEntry');}}
                                onDelete={(e: any) => {setDeleteTarget(e); setConfirmName(''); setModalType('deleteConfirm');}}
                                onToggleStatus={handleToggleStatus}
                                onEditBook={() => {setBookForm({name: currentBook.name, description: currentBook.description}); setModalType('editBook');}}
                                onDeleteBook={() => {setConfirmName(''); setModalType('deleteBookConfirm');}}
                                searchQuery={searchQuery} setSearchQuery={setSearchQuery} showChart={showChart} setShowChart={setShowChart}
                                pagination={{ currentPage, totalPages: Math.ceil(filteredEntries.length / 10), setPage: setCurrentPage }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODALS (Always rendered for access from both views) --- */}
            <AnimatePresence>
                {(modalType === 'addBook' || modalType === 'editBook') && (
                    <ModalLayout title={modalType === 'editBook' ? "Update Ledger" : "New Ledger"} onClose={() => setModalType('none')}>
                        <form onSubmit={handleSaveBook} className="space-y-4">
                            <input required placeholder="BOOK NAME" className="app-input font-bold uppercase" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
                            <input placeholder="DESCRIPTION" className="app-input text-xs" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
                            <button className="app-btn-primary w-full py-4 uppercase font-black text-xs tracking-widest shadow-xl">Confirm</button>
                        </form>
                    </ModalLayout>
                )}

                {modalType === 'addEntry' && (
                    <ModalLayout title={editTarget ? "Modify Record" : "New Record"} onClose={() => setModalType('none')}>
                        <form onSubmit={handleSaveEntry} className="space-y-4">
                            <input required placeholder="TITLE" className="app-input font-bold uppercase" value={entryForm.title} onChange={e => setEntryForm({...entryForm, title: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="number" placeholder="0.00" className="app-input font-mono-finance text-lg font-bold" value={entryForm.amount} onChange={e => setEntryForm({...entryForm, amount: e.target.value})} />
                                <input type="date" className="app-input text-xs font-bold uppercase" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="app-input text-[10px] font-black" value={entryForm.paymentMethod} onChange={e => setEntryForm({...entryForm, paymentMethod: e.target.value})}><option value="Cash">CASH</option><option value="Bank">BANK</option><option value="bKash">BKASH</option><option value="Nagad">NAGAD</option></select>
                                <select className="app-input text-[10px] font-black" value={entryForm.category} onChange={e => setEntryForm({...entryForm, category: e.target.value})}><option value="General">GENERAL</option><option value="Salary">SALARY</option><option value="Food">FOOD</option><option value="Rent">RENT</option></select>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setEntryForm({...entryForm, type: 'income'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] ${entryForm.type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'app-card text-slate-500'}`}>INCOME</button>
                                <button type="button" onClick={() => setEntryForm({...entryForm, type: 'expense'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] ${entryForm.type === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'app-card text-slate-500'}`}>EXPENSE</button>
                            </div>
                            <button className="app-btn-primary w-full py-4 text-xs font-black tracking-widest uppercase shadow-xl">Sync to Ledger</button>
                        </form>
                    </ModalLayout>
                )}

                {modalType === 'deleteConfirm' && <DeleteConfirmModal targetName={deleteTarget.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={() => setModalType('none')} />}
                {modalType === 'deleteBookConfirm' && <DeleteConfirmModal targetName={currentBook.name} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteBook} onClose={() => setModalType('none')} />}
            </AnimatePresence>
        </div>
    );
};