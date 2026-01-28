"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Loader2, FileUp, Filter, 
    ArrowDownAZ, LayoutGrid, ChevronDown, ChevronLeft, ChevronRight, 
    Share2, Copy, Trash2, Edit2, Wallet, BarChart3, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Sub-components
import { BookDetails } from './Books/BookDetails';
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';
import { BookCard } from '@/components/BookCard';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';
import { AnalyticsChart } from '@/components/AnalyticsChart';

export const BooksSection = ({ currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab }: any) => {
    // --- ১. সকল স্টেট (States) ---
    const [books, setBooks] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]); 
    const [allEntries, setAllEntries] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // ড্যাশবোর্ড ও ডিটেইলস কন্ট্রোলস
    const [searchQuery, setSearchQuery] = useState(''); 
    const [bookSortOrder, setBookSortOrder] = useState<'recent' | 'az'>('recent');
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);

    // গ্লোবাল মডাল ম্যানেজমেন্ট
    const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook' | 'analytics' | 'export' | 'share'>('none');
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');

    const [bookForm, setBookForm] = useState({ name: '', description: '' });
    const [entryForm, setEntryForm] = useState({ 
        title: '', amount: '', type: 'expense', 
        category: currentUser?.categories?.[0] || 'General', 
        paymentMethod: 'Cash', note: '', status: 'Completed', 
        date: new Date().toISOString().split('T')[0] 
    });

    // শেয়ারিং স্টেট
    const [shareToken, setShareToken] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);

    // --- ২. হেল্পার ও ডাটা লজিক ---

    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // ✅ সমাধান: স্মার্ট স্ক্রল ফিক্স (বই পরিবর্তন করলে একদম উপরে যাবে)
    useEffect(() => {
        if (currentBook) {
            window.scrollTo(0, 0); 
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 50);
        }
    }, [currentBook]);

    const fetchData = async () => {
    if (!currentUser?._id) return;
    setIsLoading(true);
    try {
        const booksRes = await fetch(`/api/books?userId=${currentUser._id}`);
        if (booksRes.ok) {
            const responseData = await booksRes.json();
            
            // 🔥 গুরুত্বপূর্ণ ফিক্স: ডাটা অ্যারো কি না তা চেক করা
            // যদি responseData.books থাকে তবে সেটা নেবে, না হলে সরাসরি responseData নেবে
            const booksArray = Array.isArray(responseData) ? responseData : (responseData.books || []);
            
            setBooks(booksArray);
            
            // ড্যাশবোর্ড ব্যালেন্স ক্যালকুলেশন লজিক ফিক্স
            let tempAllEntries: any[] = [];
            await Promise.all(booksArray.map(async (book: any) => {
                const res = await fetch(`/api/entries?bookId=${book._id}`);
                const entryData = await res.json();
                // এখানেও অ্যারো চেক
                const entries = Array.isArray(entryData) ? entryData : (entryData.entries || []);
                tempAllEntries = [...tempAllEntries, ...entries];
                    }));
                    setAllEntries(tempAllEntries);
                }
            } catch (err) { 
                console.error("Fetch Error:", err); 
            } finally { 
                setIsLoading(false); 
            }
        };

    const fetchBookEntries = async (id: string) => {
        try {
            const res = await fetch(`/api/entries?bookId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || data);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (currentUser) fetchData(); }, [currentUser]);
    useEffect(() => { 
        if (currentBook?._id) {
            fetchBookEntries(currentBook._id);
            setIsSharing(currentBook.isPublic || false);
            setShareToken(currentBook.shareToken || '');
        } 
    }, [currentBook]);

    // FAB Trigger
    useEffect(() => {
        if (!triggerFab) return;
        if (currentBook) openNewEntryModal(); 
        else { setBookForm({ name: '', description: '' }); setModalType('addBook'); }
        setTriggerFab(false); 
    }, [triggerFab]);

    // --- ৩. অ্যাকশন হ্যান্ডলার্স ---

    const handleSaveBook = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = modalType === 'editBook';
        const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
        const res = await fetch(url, { 
            method: isEdit ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...bookForm, userId: currentUser._id }) 
        });
        if (res.ok) { setModalType('none'); fetchData(); if(isEdit) setCurrentBook(null); toast.success("Ledger Synchronized"); }
    };

    const handleSaveEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBook?._id) return;

        // ✅ ডুপ্লিকেট চেক লজিক (Security Protocol)
        const isDuplicate = entries.some(prev => 
            prev.title.toLowerCase() === entryForm.title.toLowerCase() && 
            prev.amount === Number(entryForm.amount) && 
            new Date(prev.date).toDateString() === new Date(entryForm.date).toDateString()
        );

        if (!editTarget && isDuplicate) {
            return toast.error("Matching record found in vault. Duplicate entry blocked.");
        }

        const url = editTarget ? `/api/entries/${editTarget._id}` : '/api/entries';
        const res = await fetch(url, { 
            method: editTarget ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...entryForm, bookId: currentBook._id }) 
        });
        if (res.ok) { 
            setModalType('none'); setEditTarget(null);
            await fetchBookEntries(currentBook._id); 
            await fetchData(); 
            toast.success("Transaction Secured");
        }
    };

    const handleToggleStatus = async (entry: any) => {
        const newStatus = entry.status === 'Pending' ? 'Completed' : 'Pending';
        const res = await fetch(`/api/entries/status/${entry._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        if (res.ok) { fetchBookEntries(currentBook._id); fetchData(); }
    };

    const handleShareToggle = async () => {
        setShareLoading(true);
        try {
            const res = await fetch('/api/books/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: currentBook._id, enable: !isSharing }) });
            const data = await res.json();
            if (res.ok) { setIsSharing(data.data.isPublic); setShareToken(data.data.shareToken); toast.success("Link Protocol Updated"); }
        } catch (err) { toast.error("Protocol Error"); } finally { setShareLoading(false); }
    };

    const handleDeleteEntry = async () => {
        if (confirmName !== deleteTarget.title) return toast.error("Identity mismatch");
        await fetch(`/api/entries/${deleteTarget._id}`, { method: 'DELETE' });
        setModalType('none'); fetchBookEntries(currentBook._id); fetchData(); toast.success('Record Cleared');
    };

    const handleDeleteBook = async () => {
        if (confirmName !== currentBook.name) return toast.error("Identity mismatch");
        await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
        setModalType('none'); setCurrentBook(null); fetchData(); toast.success('Vault Terminated');
    };

    const openEditEntry = (entry: any) => {
        setEditTarget(entry);
        setEntryForm({ ...entry, amount: entry.amount.toString(), date: new Date(entry.date).toISOString().split('T')[0] });
        setModalType('addEntry');
    };

    const openNewEntryModal = () => { 
        setEditTarget(null);
        setEntryForm({ title:'', amount:'', type:'expense', category: currentUser?.categories?.[0] || 'General', paymentMethod:'Cash', note:'', status: 'Completed', date: new Date().toISOString().split('T')[0] }); 
        setModalType('addEntry'); 
    };

    // --- ৪. এক্সেল ইমপোর্ট ---
    const handleImportClick = () => fileInputRef.current?.click();
    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const loadingToast = toast.loading("Verifying Vault Signature...");
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            if (worksheet['A1']?.v !== "SOURCE: CASHBOOK PRO DIGITAL LEDGER") {
                toast.dismiss(loadingToast);
                return toast.error("Invalid Source: File signature missing!");
            }
            const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 4 });
            const importedBookName = file.name.replace("_Report.xlsx", "").replace(".xlsx", "");
            let targetBookId;
            const existingBook = books.find(b => b.name.toLowerCase() === importedBookName.toLowerCase());
            if (existingBook) targetBookId = existingBook._id;
            else {
                const res = await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: importedBookName, description: "Secure Import", userId: currentUser._id }) });
                const json = await res.json();
                targetBookId = json.book._id;
            }
            const importPromises = rawData.map(row => fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: targetBookId, title: row.Title, amount: Number(row.Amount), type: row.Type.toLowerCase(), category: row.Category, paymentMethod: row.Method || "Cash", note: row.Note, date: new Date(row.Date) }) }));
            await Promise.all(importPromises);
            await fetchData();
            toast.dismiss(loadingToast);
            toast.success("Vault Synchronized Successfully");
        } catch (error) { toast.dismiss(loadingToast); toast.error("Import Protocol Failed"); }
    };

    // --- ৫. রেন্ডার লজিক ---
    const filteredBooks = books
        .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => bookSortOrder === 'az' ? a.name.localeCompare(b.name) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const getBookBalance = (id: string) => {
        const d = allEntries.filter(e => e.bookId === id && e.status === 'Completed');
        return d.filter(e => e.type === 'income').reduce((a,b)=>a+b.amount,0) - d.filter(e => e.type === 'expense').reduce((a,b)=>a+b.amount,0);
    };

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    /* --- DASHBOARD --- */
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="bg-[var(--bg-card)] p-5 md:p-6 rounded-[32px] border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto text-center md:text-left">
                                <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 shadow-inner"><LayoutGrid size={24} /></div>
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase italic leading-none">Ledger Hub</h3>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[3px] mt-1.5">{books.length} ACTIVE VAULTS</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="relative flex-1 md:w-64 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                        <input type="text" placeholder="SEARCH LEDGERS..." className="app-input pl-12 py-4 bg-[var(--bg-app)] border-2 rounded-2xl text-xs font-black uppercase outline-none w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setBookSortOrder(bookSortOrder === 'recent' ? 'az' : 'recent')} className="p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 transition-all"><Filter size={20}/></button>
                                        <button onClick={handleImportClick} className="p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-green-500 transition-all"><FileUp size={20} /></button>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls" className="hidden" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                            {/* ADD NEW LEDGER CARD */}
<div 
    onClick={() => { setBookForm({name:'', description:''}); setModalType('addBook'); }} 
    
    // 🔥 FIX: এই লাইনটি দেখুন। books.length > 0 হলে মোবাইলে hidden, কিন্তু ডেস্কটপে (md) flex থাকবে।
    // আর যদি বই না থাকে, তবে সবসময় flex থাকবে।
    className={`app-card h-[210px] border-2 border-dashed border-orange-500/30 flex-col items-center justify-center text-orange-500 cursor-pointer transition-all hover:bg-orange-500/5 group 
    ${books.length > 0 ? 'hidden md:flex' : 'flex'}`}
>
    <Plus size={36} strokeWidth={3} className="mb-2 group-hover:scale-110 transition-transform" />
    <span className="text-[11px] font-black uppercase tracking-widest">Create Ledger</span>
</div>
                            {filteredBooks.map((b: any) => (
                                <BookCard key={b._id} book={b} onClick={() => setCurrentBook(b)} balance={getBookBalance(b._id)} currencySymbol={getCurrencySymbol()} />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    /* --- DETAILS --- */
                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="min-h-[650px] overflow-hidden">
                            <BookDetails 
                                currentBook={currentBook} items={entries} currentUser={currentUser} onBack={() => setCurrentBook(null)}
                                onAdd={() => setModalType('addEntry')} 
                                onEdit={openEditEntry} 
                                onDelete={(e: any) => {setDeleteTarget(e); setConfirmName(''); setModalType('deleteConfirm');}}
                                onToggleStatus={handleToggleStatus} 
                                onEditBook={() => {setBookForm({name: currentBook.name, description: currentBook.description}); setModalType('editBook');}}
                                onDeleteBook={() => {setConfirmName(''); setModalType('deleteBookConfirm');}}
                                onOpenAnalytics={() => setModalType('analytics')} onOpenExport={() => setModalType('export')} onOpenShare={() => setModalType('share')}
                                searchQuery={detailsSearchQuery} setSearchQuery={setDetailsSearchQuery} pagination={{ currentPage: detailsPage, totalPages: Math.ceil(entries.length / 10), setPage: setDetailsPage }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ গ্লোবাল মডাল লেয়ার - এবার একদম রুট লেভেলে রাখা হয়েছে যাতে পুরো স্ক্রিন ব্লার হয় */}
            <AnimatePresence>
                {modalType !== 'none' && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('none')} className="fixed inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[var(--bg-card)] w-full max-w-md rounded-[32px] border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden">
                            
                            {(modalType === 'addBook' || modalType === 'editBook') && (
                                <ModalLayout title={modalType === 'editBook' ? "Protocol: Update" : "Protocol: Initialize"} onClose={() => setModalType('none')}>
                                    <form onSubmit={handleSaveBook} className="space-y-4">
                                        <input required placeholder="NAME" className="app-input font-bold uppercase" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
                                        <input placeholder="DESCRIPTION" className="app-input text-xs uppercase" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
                                        <button className="app-btn-primary w-full py-4 uppercase font-black tracking-widest mt-2">Execute</button>
                                    </form>
                                </ModalLayout>
                            )}

                            {modalType === 'addEntry' && (
                                <ModalLayout title={editTarget ? "Modify Protocol" : "New Entry Protocol"} onClose={() => setModalType('none')}>
                                    <div className="max-h-[80vh] overflow-y-auto no-scrollbar px-1">
                                        <form onSubmit={handleSaveEntry} className="space-y-6 pb-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[2px] ml-1">Identity</label>
                                                <input required placeholder="E.G. SERVER RENT" className="app-input h-14 text-sm font-extrabold uppercase border-2 focus:border-orange-500 transition-all" value={entryForm.title} onChange={e => setEntryForm({...entryForm, title: e.target.value})} />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[2px] ml-1">Capital</label>
                                                    <div className="flex items-center h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-4 gap-3 focus-within:border-orange-500">
                                                        <span className="text-xl font-black text-orange-500">{getCurrencySymbol()}</span>
                                                        <input required type="number" placeholder="0.00" className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-xl font-mono-finance font-bold" value={entryForm.amount} onChange={e => setEntryForm({...entryForm, amount: e.target.value})} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[2px] ml-1">Timestamp</label>
                                                    <input type="date" className="app-input h-14 font-bold uppercase text-xs" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="relative">
                                                    <select className="app-input h-14 px-5 text-[10px] font-black uppercase appearance-none cursor-pointer" value={entryForm.category} onChange={e => setEntryForm({...entryForm, category: e.target.value})}>
                                                        {currentUser?.categories?.map((cat: string) => <option key={cat} value={cat} className='bg-slate-900'>{cat.toUpperCase()}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" size={16}/>
                                                </div>
                                                <div className="relative">
                                                    <select className="app-input h-14 px-5 text-[10px] font-black uppercase appearance-none cursor-pointer" value={entryForm.paymentMethod} onChange={e => setEntryForm({...entryForm, paymentMethod: e.target.value})}>
                                                        <option value="Cash" className='bg-slate-900'>CASH</option><option value="Bank" className='bg-slate-900'>BANK</option><option value="bKash" className='bg-slate-900'>BKASH</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" size={16}/>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <button type="button" onClick={() => setEntryForm({...entryForm, type: 'income'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] border-2 transition-all ${entryForm.type === 'income' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'border-[var(--border-color)] text-slate-500 opacity-50'}`}>INCOME</button>
                                                <button type="button" onClick={() => setEntryForm({...entryForm, type: 'expense'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] border-2 transition-all ${entryForm.type === 'expense' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'border-[var(--border-color)] text-slate-500 opacity-50'}`}>EXPENSE</button>
                                            </div>
                                            <button className="app-btn-primary w-full h-16 text-sm font-black tracking-[4px] shadow-2xl mt-2">CONFIRM</button>
                                        </form>
                                    </div>
                                </ModalLayout>
                            )}

                            {modalType === 'analytics' && <ModalLayout title="Vault Analytics" onClose={() => setModalType('none')}><div className="h-[350px] py-4"><AnalyticsChart entries={entries} /></div></ModalLayout>}
                            {modalType === 'export' && <AdvancedExportModal isOpen={true} onClose={() => setModalType('none')} entries={entries} bookName={currentBook.name} />}
                            {modalType === 'share' && (
                                <ModalLayout title="Vault Share" onClose={() => setModalType('none')}>
                                    <div className="space-y-6 py-2">
                                        <div className={`p-6 rounded-2xl border flex justify-between items-center ${isSharing ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-50/50 border-slate-200'}`}>
                                            <div><h4 className={`text-xs font-black uppercase ${isSharing ? 'text-green-600' : 'text-slate-400'}`}>{isSharing ? 'Protocol: Live' : 'Protocol: Off'}</h4></div>
                                            <button onClick={handleShareToggle} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg ${isSharing ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{shareLoading ? '...' : (isSharing ? 'Disable' : 'Enable')}</button>
                                        </div>
                                        {isSharing && <div className="relative"><input readOnly value={`${window.location.origin}/share/${shareToken}`} className="app-input pr-12 text-[10px] font-mono text-orange-500" /><button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`); toast.success("Copied"); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:text-green-500"><Copy size={16} /></button></div>}
                                    </div>
                                </ModalLayout>
                            )}

                            {modalType === 'deleteConfirm' && <DeleteConfirmModal targetName={deleteTarget?.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={() => setModalType('none')} />}
                            {modalType === 'deleteBookConfirm' && <DeleteConfirmModal targetName={currentBook?.name} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteBook} onClose={() => setModalType('none')} />}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};