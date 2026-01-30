"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Loader2, FileUp, Filter, 
    LayoutGrid, ChevronDown, ChevronLeft, ChevronRight, 
    Share2, Copy, Trash2, Edit2, Wallet, BarChart3, Download, Check, CreditCard, Layers, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { db, saveEntryToLocal } from '@/lib/offlineDB';

// Sub-components
import { BookDetails } from './Books/BookDetails';
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';
import { BookCard } from '@/components/BookCard';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';
import { AnalyticsChart } from '@/components/AnalyticsChart';

// --- CUSTOM DROPDOWN ---
const CustomSelect = ({ label, value, options, onChange, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500" />} {label}
            </label>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between h-14 px-5 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl focus:border-orange-500 transition-all text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]"
            >
                <span className="truncate">{value}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} className="absolute z-[200] left-0 right-0 top-full mt-2 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto no-scrollbar p-1">
                            {options.map((opt: string) => (
                                <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 hover:text-orange-500 transition-colors flex items-center justify-between rounded-xl mb-1 ${value === opt ? 'text-orange-500 bg-orange-500/5' : 'text-[var(--text-muted)]'}`}>
                                    {opt}
                                    {value === opt && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const BooksSection = ({ 
    currentUser, currentBook, setCurrentBook, triggerFab, setTriggerFab, 
    externalModalType, setExternalModalType, bookForm, setBookForm  
}: any) => {
    
    // --- ১. সকল স্টেট (States) ---
    const [books, setBooks] = useState<any[]>([]);
    const [entries, setEntries] = useState<any[]>([]); 
    const [allEntries, setAllEntries] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [searchQuery, setSearchQuery] = useState(''); 
    const [bookSortOrder, setBookSortOrder] = useState<'recent' | 'az'>('recent');
    const [detailsSearchQuery, setDetailsSearchQuery] = useState(''); 
    const [detailsPage, setDetailsPage] = useState(1);

    const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook' | 'analytics' | 'export' | 'share'>('none');
    
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [editTarget, setEditTarget] = useState<any>(null);
    const [confirmName, setConfirmName] = useState('');

  // স্ট্যান্ডার্ডাইজড এন্ট্রি ফর্ম (status: completed lowercase fixed)
    const [entryForm, setEntryForm] = useState({ 
        title: '', amount: '', type: 'expense', 
        category: currentUser?.categories?.[0] || 'GENERAL', 
        paymentMethod: 'CASH', note: '', status: 'completed', 
        date: new Date().toISOString().split('T')[0],
        // 🔥 ফিক্সড টাইম: নিশ্চিতভাবে 'HH:mm' ফরম্যাট
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
    });

    const [shareToken, setShareToken] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);

    // --- ২. হেল্পার এবং ডাটা লজিক ---
    const getCurrencySymbol = () => currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // A. ডেটা লোড (Local-First)
    const fetchData = async () => {
        if (!currentUser?._id) return;
        try {
            if (!db.isOpen()) await db.open();
            const localBooks = await db.books.toArray();
            // শুধুমাত্র অ্যাকটিভ এন্ট্রিগুলো লোড হবে
            const localEntries = await db.entries.where('isDeleted').equals(0).toArray();
            
            setBooks(localBooks);
            setAllEntries(localEntries);
        } catch (err) { console.error("Dexie Load Error:", err); }
        finally { setIsLoading(false); }
    };

 const fetchBookEntries = async (id: string) => {
    try {
        // 🔥 ফিক্স: ডিলিট হওয়া ডেটা বাদ দিয়ে শুধু ওই বইয়ের ডেটা আনুন
        const data = await db.entries
            .where('bookId').equals(id)
            .and(item => item.isDeleted === 0) 
            .toArray();
            
        const sortedData = data.sort((a, b) => {
            const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateCompare !== 0) return dateCompare;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
        
        // 🔥🔥🔥 চূড়ান্ত ফিক্স: নতুন অ্যারে তৈরি করে React-কে আপডেট করতে বাধ্য করা
        setEntries([...sortedData]); 

    } catch (err) { console.error("Fetch Entries Error:", err); }
};

    // Stats Calculation
    const stats = useMemo(() => {
        const targetEntries = currentBook ? entries : allEntries;
        const inflow = targetEntries.filter(e => e.type === 'income' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
        const outflow = targetEntries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((s, e) => s + Number(e.amount), 0);
        return { inflow, outflow, balance: inflow - outflow };
    }, [entries, allEntries, currentBook]);

    // 🔥 FIX: getBookBalance Function Added Here
    const getBookBalance = (id: string) => {
        const d = allEntries.filter(e => e.bookId === id && e.status === 'completed');
        const inflow = d.filter(e => e.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
        const outflow = d.filter(e => e.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
        return inflow - outflow;
    };

    // Listeners & Effects
    useEffect(() => {
        if (currentUser) fetchData();
    }, [currentUser]);

    useEffect(() => { 
        if (currentBook?._id) {
            fetchBookEntries(currentBook._id);
        }
        
        const handleUpdate = () => {
            fetchData();
            if (currentBook?._id) fetchBookEntries(currentBook._id);
        };

        window.addEventListener('vault-updated', handleUpdate);
        return () => window.removeEventListener('vault-updated', handleUpdate);
    }, [currentBook, currentUser]);

    // External Modal Sync
    useEffect(() => {
        if (externalModalType && externalModalType !== 'none') {
            setModalType(externalModalType);
            setExternalModalType('none');
        }
    }, [externalModalType, setExternalModalType]);

    // FAB Trigger
    useEffect(() => {
        if (!triggerFab) return;
        if (currentBook) {
            setEditTarget(null);
            setEntryForm({ 
                title: '', amount: '', type: 'expense', 
                category: currentUser?.categories?.[0] || 'GENERAL', 
                paymentMethod: 'CASH', note: '', status: 'completed', 
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
            });
            setModalType('addEntry'); 
        } else { setBookForm({ name: '', description: '' }); setModalType('addBook'); }
        setTriggerFab(false); 
    }, [triggerFab, currentBook, currentUser]);

    // --- ৩. অ্যাকশন হ্যান্ডলার্স ---

const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook?._id) return;

    const isOnline = navigator.onLine;

    // ১. ডাটা অবজেক্ট তৈরি (স্ট্যাটাসকে Title Case এ রাখা হলো)
    const dbData = {
        title: entryForm.title.trim(),
        amount: Number(entryForm.amount),
        type: entryForm.type.toLowerCase() as 'income' | 'expense',
        category: entryForm.category,
        paymentMethod: entryForm.paymentMethod || 'CASH',
        note: entryForm.note || "",
        date: entryForm.date,
        time: entryForm.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        // 🔥 FIX: স্ট্যাটাস সবসময় Title Case হবে (Pending/Completed)
        status: (entryForm.status.toLowerCase() === 'completed' ? 'Completed' : 'Pending'), 
        bookId: currentBook._id,
        userId: currentUser._id,
        synced: 0 as 0 | 1,
        isDeleted: 0 as 0 | 1,
        createdAt: editTarget ? editTarget.createdAt : Date.now(),
        updatedAt: Date.now()
    };

    try {
        // ২. ডেক্সিতে সেভ করা
        if (editTarget) {
            const pk = editTarget.localId || editTarget._id;
            await db.entries.put({ ...editTarget, ...dbData, synced: 0 });
        } else {
            await saveEntryToLocal(dbData);
        }

        // ৩. UI রিফ্রেশ এবং মডাল বন্ধ
        setModalType('none');
        setEditTarget(null);
        await fetchBookEntries(currentBook._id);
        await fetchData();
        window.dispatchEvent(new Event('vault-updated'));

        // 🔥 FIX: অফলাইন এবং অনলাইন এর জন্য আলাদা মেসেজ এবং লজিক
        if (isOnline) {
            toast.success("Entry Synced with Cloud");
            // নেট থাকলে ব্যাকগ্রাউন্ড সিঙ্ক ট্রিগার হবে
            window.dispatchEvent(new Event('online')); 
        } else {
            // নেট না থাকলে শুধু অফলাইন মেসেজ, কোনো লোডিং স্পিনার আসবে না
            toast("Saved to Device (Offline)", { icon: '💾' });
        }

    } catch (err) {
        console.error(err);
        toast.error("Save Failed");
    }
};

    const handleToggleStatus = async (entry: any) => {
    // ১. বর্তমান স্ট্যাটাস চেক (Case Insensitive)
    const currentStatus = entry.status ? entry.status.toLowerCase() : 'completed';
    // ২. নতুন স্ট্যাটাস সেট করা (Title Case এ)
    const newStatus = currentStatus === 'pending' ? 'Completed' : 'Pending';

    try {
        // ৩. Dexie তে আপডেট করা (synced: 0 করে দেওয়া যাতে পরে সিঙ্ক হয়)
        // localId কে অগ্রাধিকার দেওয়া হচ্ছে কারণ অফলাইন ডাটায় _id থাকে না
        const targetKey = entry.localId ? entry.localId : entry._id;
        
        // এখানে সরাসরি put ব্যবহার না করে update ব্যবহার করা হলো এবং পুরো অবজেক্ট মার্জ করা হলো
        const entryToUpdate = await db.entries.get(targetKey);
        
        if (entryToUpdate) {
            await db.entries.put({
                ...entryToUpdate,
                status: newStatus,
                synced: 0,
                updatedAt: Date.now()
            });

            // ৪. UI রিফ্রেশ
            await fetchBookEntries(currentBook._id);
            await fetchData();
            window.dispatchEvent(new Event('vault-updated'));

            // ৫. ফিডব্যাক
            toast.success(`Marked as ${newStatus}`);

            // ৬. যদি নেট থাকে, তবে সিঙ্ক ট্রিগার করো
            if (navigator.onLine) {
                window.dispatchEvent(new Event('online'));
            }
        }
    } catch (err) {
        console.error("Status Update Error:", err);
        toast.error("Could not update status");
    }
};

    const handleShareToggle = async () => {
    setShareLoading(true);
    try {
        const res = await fetch('/api/books/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId: currentBook._id, enable: !isSharing }) });
        const data = await res.json();
        if (res.ok) { 
            setIsSharing(data.data.isPublic); // নিশ্চিত করুন API 'isPublic' দিচ্ছে
            setShareToken(data.data.shareToken); 
            toast.success("Share Protocol Updated"); 
        }
    } catch (err) { toast.error("Sync error"); } 
    finally { setShareLoading(false); }
};

const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = modalType === 'editBook';
    const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
    
    try {
        const res = await fetch(url, { 
            method: isEdit ? 'PUT' : 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ...bookForm, userId: currentUser._id }) // 🔥 userId যোগ করা হয়েছে
        });
        
        if (res.ok) {
            const result = await res.json();
            const savedBook = result.book || result.data;
            
            // লোকাল ডাটাবেসে সেভ করা (synced: 0 সহ)
            await db.books.put({ 
                ...savedBook, 
                synced: 0 as 0 | 1, 
                updatedAt: new Date().getTime() 
            }); 

            setModalType('none'); 
            await fetchData(); // UI রিফ্রেশ
            if(isEdit) setCurrentBook(null); 
            toast.success("Ledger Scheduled for Sync");
        } else {
            const errorData = await res.json();
            toast.error(errorData.message || "Book creation failed");
        }
    } catch (err) { toast.error("Book protocol error"); }
};

    const handleDeleteEntry = async () => {
        if (confirmName !== deleteTarget.title) return toast.error("Mismatch");
        try {
            // Soft delete locally
            await db.entries.update(deleteTarget.localId || deleteTarget._id, { isDeleted: 1, synced: 0 as any });
            setModalType('none'); 
            fetchBookEntries(currentBook._id); 
            fetchData(); 
            window.dispatchEvent(new Event('vault-updated'));
            toast.success('Removed');
        } catch (err) { toast.error("Delete Failed"); }
    };

    const handleDeleteBook = async () => {
        if (confirmName !== currentBook.name) return toast.error("Mismatch");
        try {
            // Server delete first for books (safer)
            const res = await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
            if(res.ok) {
                await db.books.delete(currentBook._id);
                await db.entries.where('bookId').equals(currentBook._id).delete();
                setModalType('none'); 
                setCurrentBook(null); 
                fetchData(); 
                toast.success('Terminated');
            }
        } catch (err) { toast.error("Termination Failed"); }
    };

const openEditEntry = (entry: any) => {
        setEditTarget(entry);
        setEntryForm({ 
            ...entry, 
            amount: entry.amount.toString(), 
            date: new Date(entry.date).toISOString().split('T')[0],
            // 🔥 ফিক্সড টাইম: ডেটাবেসে থাকা টাইমটিকে নিশ্চিতভাবে 'HH:mm' ফরম্যাটে আনা
            time: entry.time && entry.time.includes(':') ? entry.time : "00:00",
            status: entry.status || 'completed'
        });
        setModalType('addEntry');
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const loadingToast = toast.loading("Processing Import...");
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            if (worksheet['A1']?.v !== "SOURCE: CASHBOOK PRO DIGITAL LEDGER") {
                toast.dismiss(loadingToast);
                return toast.error("Invalid File Format");
            }

            const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { range: 5 });
            if (!rawData.length) {
                toast.dismiss(loadingToast);
                return toast.error("No data found");
            }

            let targetBookId = currentBook?._id;
            
            // If not inside a book, find or create based on file name
            if (!targetBookId) {
                const importedBookName = file.name.split('_')[0];
                const existingBook = books.find(b => b.name.toLowerCase() === importedBookName.toLowerCase());
                
                if (existingBook) {
                    targetBookId = existingBook._id;
                } else {
                    const res = await fetch('/api/books', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: importedBookName, description: "Imported", userId: currentUser._id })
                    });
                    const json = await res.json();
                    targetBookId = json.book._id;
                    await db.books.put(json.book); // Save local
                }
            }

            // Save entries locally first
            for (const row of rawData) {
                const entryData = {
                    bookId: targetBookId,
                    title: row.Title,
                    amount: Number(row.Amount),
                    type: String(row.Type).toLowerCase() as 'income'|'expense',
                    category: row.Category || "GENERAL",
                    paymentMethod: row.Method || "CASH",
                    note: (row.Note === "-" || !row.Note) ? "" : row.Note,
                    date: new Date(row.Date).toISOString(),
                    time: row.Time || "12:00",
                    status: (row.Status || "completed").toLowerCase(),
                    userId: currentUser._id,
                    synced: 0 as any,
                    isDeleted: 0,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await saveEntryToLocal(entryData);
            }

            await fetchData();
            window.dispatchEvent(new Event('vault-updated'));
            toast.dismiss(loadingToast);
            toast.success(`Imported ${rawData.length} records`);

        } catch (error) {
            console.error(error);
            toast.dismiss(loadingToast);
            toast.error("Import failed");
        } finally {
            if (e.target) e.target.value = ''; 
        }
    };

    // --- ৪. রেন্ডারিং ---
    const filteredBooks = books
        .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => bookSortOrder === 'az' ? a.name.localeCompare(b.name) : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (isLoading && books.length === 0) return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[5px] text-white/20">Scanning Vaults</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {!currentBook ? (
                    /* DASHBOARD VIEW */
                    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="bg-[var(--bg-card)] p-5 md:p-6 rounded-[32px] border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500 shadow-inner"><LayoutGrid size={24} /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">Ledger Hub</h3>
                                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[3px] mt-1.5">{books.length} ACTIVE VAULTS</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                    <input type="text" placeholder="SEARCH LEDGERS..." className="app-input pl-12 py-4 bg-[var(--bg-app)] border-2 rounded-2xl text-xs font-black uppercase tracking-widest outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setBookSortOrder(bookSortOrder === 'recent' ? 'az' : 'recent')} className="p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 transition-all"><Filter size={20}/></button>
                                    <button onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-green-500 transition-all"><FileUp size={20} /></button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".xlsx, .xls" className="hidden" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                            <div onClick={() => { setBookForm({name:'', description:''}); setModalType('addBook'); }} className={`app-card h-[210px] border-2 border-dashed border-orange-500/30 flex-col items-center justify-center text-orange-500 cursor-pointer transition-all hover:bg-orange-500/5 group ${books.length > 0 ? 'hidden md:flex' : 'flex'}`}>
                                <Plus size={36} strokeWidth={3} className="mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Create Ledger</span>
                            </div>
                            {filteredBooks.map((b: any) => (
                                <BookCard key={b._id} book={b} onClick={() => setCurrentBook(b)} balance={getBookBalance(b._id)} currencySymbol={getCurrencySymbol()} />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    /* DETAILS VIEW */
                    <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="min-h-[650px] overflow-hidden vault-content-padding">
                            <BookDetails 
                                currentBook={currentBook} items={entries} currentUser={currentUser} onBack={() => setCurrentBook(null)}
                                stats={stats} // Passing pre-calculated stats
                                onAdd={() => { 
                                    setEditTarget(null); 
                                    setEntryForm({ 
                                        ...entryForm, 
                                        date: new Date().toISOString().split('T')[0], 
                                        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
                                    });
                                    setModalType('addEntry'); 
                                }} 
                                onEdit={openEditEntry} 
                                onDelete={(e: any) => {setDeleteTarget(e); setConfirmName(''); setModalType('deleteConfirm');}}
                                onToggleStatus={handleToggleStatus} 
                                onEditBook={() => {setBookForm({name: currentBook.name, description: currentBook.description}); setModalType('editBook');}}
                                onDeleteBook={() => {setConfirmName(''); setModalType('deleteBookConfirm');}}
                                onOpenAnalytics={() => setModalType('analytics')} 
                                onOpenExport={() => setModalType('export')} 
                                onOpenShare={() => setModalType('share')}
                                searchQuery={detailsSearchQuery} setSearchQuery={setDetailsSearchQuery} pagination={{ currentPage: detailsPage, totalPages: Math.ceil(entries.length / 10), setPage: setDetailsPage }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODALS */}
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
                                <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType('none')} className="fixed inset-0 bg-black/60 backdrop-blur-md" />
                                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[var(--bg-card)] w-full md:max-w-lg md:rounded-[32px] rounded-t-[32px] border-t md:border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                                        <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 shrink-0">
                                            <div>
                                                <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] italic">{editTarget ? "PROTOCOL: MODIFY" : "PROTOCOL: NEW ENTRY"}</h2>
                                                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">Secure Transaction</p>
                                            </div>
                                            <button onClick={() => setModalType('none')} className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"><X size={20} /></button>
                                        </div>

                                        <div className="p-6 overflow-y-auto no-scrollbar">
                                            <form onSubmit={handleSaveEntry} className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Identity</label>
                                                    <input required placeholder="E.G. SERVER MAINTENANCE" className="app-input h-14 text-sm font-extrabold uppercase tracking-widest border-2 focus:border-orange-500 transition-all bg-[var(--bg-app)]" value={entryForm.title} onChange={e => setEntryForm({...entryForm, title: e.target.value})} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Capital</label>
                                                        <div className="flex items-center h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-4 gap-3 focus-within:border-orange-500 transition-all">
                                                            <span className="text-lg font-black text-orange-500 select-none">{getCurrencySymbol()}</span>
                                                            <input required type="number" placeholder="0.00" className="flex-1 bg-transparent border-none p-0 text-lg font-mono font-bold text-[var(--text-main)] outline-none" value={entryForm.amount} onChange={e => setEntryForm({...entryForm, amount: e.target.value})} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Date</label>
                                                            <input type="date" className="app-input h-14 uppercase text-xs font-black tracking-widest border-2 cursor-pointer focus:border-orange-500 bg-[var(--bg-app)]" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Time</label>
                                                            <input type="time" className="app-input h-14 uppercase text-xs font-black tracking-widest border-2 cursor-pointer focus:border-orange-500 bg-[var(--bg-app)]" value={entryForm.time} onChange={e => setEntryForm({...entryForm, time: e.target.value})} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <CustomSelect label="Classification" value={entryForm.category} icon={Layers} options={currentUser?.categories || ['GENERAL']} onChange={(val: string) => setEntryForm({...entryForm, category: val})} />
                                                    <CustomSelect label="Channel" value={entryForm.paymentMethod} icon={CreditCard} options={['CASH', 'BANK', 'BKASH', 'NAGAD']} onChange={(val: string) => setEntryForm({...entryForm, paymentMethod: val})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Note</label>
                                                    <input placeholder="OPTIONAL MEMO..." className="app-input h-12 text-[10px] font-bold uppercase tracking-widest border-2 focus:border-orange-500 bg-[var(--bg-app)]" value={entryForm.note} onChange={e => setEntryForm({...entryForm, note: e.target.value})} />
                                                </div>
                                                <div className="flex gap-4 pt-2">
                                                    <button type="button" onClick={() => setEntryForm({...entryForm, type: 'income'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${entryForm.type === 'income' ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}>INCOME</button>
                                                    <button type="button" onClick={() => setEntryForm({...entryForm, type: 'expense'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${entryForm.type === 'expense' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}>EXPENSE</button>
                                                </div>
                                                <button className="app-btn-primary w-full h-16 text-sm font-black tracking-[4px] shadow-2xl mt-4 bg-orange-500 hover:bg-orange-600 transition-all active:scale-[0.98]">CONFIRM PROTOCOL</button>
                                                <div className="h-4 md:hidden"></div>
                                            </form>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {modalType === 'analytics' && <ModalLayout title="Vault Analytics" onClose={() => setModalType('none')}><div className="h-[350px] py-4"><AnalyticsChart entries={entries} /></div></ModalLayout>}
                            {modalType === 'export' && <AdvancedExportModal isOpen={true} onClose={() => setModalType('none')} entries={entries} bookName={currentBook.name} />}
                            {modalType === 'share' && (
                                <ModalLayout title="Vault Share" onClose={() => setModalType('none')}>
                                    <div className="space-y-6 py-2">
                                        <div className={`p-6 rounded-2xl border flex justify-between items-center ${isSharing ? 'bg-green-500/5 border-green-500/20' : ' border-slate-200'}`}>
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