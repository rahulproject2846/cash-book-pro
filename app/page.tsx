"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, ArrowLeft, Loader2, Search, X, LogOut, Trash2, Edit2
} from 'lucide-react';

// Importing modular components
import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';
import { BookCard } from '@/components/BookCard';
import { EntryRow } from '@/components/EntryRow';

export default function CashBookApp() {
  // --- 1. Core States ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentBook, setCurrentBook] = useState<any>(null); 
  const [books, setBooks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 2. Modal & Control States ---
  const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook'>('none');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [confirmName, setConfirmName] = useState('');

  // --- 3. Filter & Search States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // --- 4. Form States ---
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [entryForm, setEntryForm] = useState({ 
    title: '', amount: '', type: 'expense', category: 'General', paymentMethod: 'Cash', note: '' 
  });
  const [password, setPassword] = useState('');

  // --- 5. Initial Load & Auth ---
  useEffect(() => {
    const saved = localStorage.getItem('isLoggedIn');
    if (saved === 'true') {
      setIsLoggedIn(true);
      fetchBooks();
    }
    setIsLoading(false);
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      setBooks([]);
    }
  };

  const fetchEntries = async (bookId: string) => {
    try {
      const res = await fetch(`/api/entries?bookId=${bookId}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setEntries([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setCurrentBook(null);
  };

  // --- 6. Book Action Handlers ---
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety Check for Edit Mode
    if (modalType === 'editBook' && !currentBook?._id) {
      alert("Error: No book selected to update.");
      return;
    }

    const isEdit = modalType === 'editBook';
    const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookForm),
    });

    if (res.ok) {
      const savedBook = await res.json();
      setBookForm({ name: '', description: '' });
      setModalType('none');
      if (isEdit) {
          setCurrentBook(savedBook); // Update current book view
      }
      fetchBooks();
    }
  };

  const handleDeleteBook = async () => {
    if (!currentBook?._id) return;
    if (confirmName !== currentBook.name) return alert("Book name doesn't match!");
    
    const res = await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
    if (res.ok) {
      setModalType('none');
      setConfirmName('');
      setCurrentBook(null);
      fetchBooks();
    }
  };

  // --- 7. Entry Action Handlers ---
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBook?._id) return;

    const url = editTarget ? `/api/entries/${editTarget._id}` : '/api/entries';
    const method = editTarget ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entryForm, bookId: currentBook._id }),
    });

    if (res.ok) {
      setEntryForm({ title: '', amount: '', type: 'expense', category: 'General', paymentMethod: 'Cash', note: '' });
      setEditTarget(null);
      setModalType('none');
      fetchEntries(currentBook._id);
    }
  };

  const openEditModal = (entry: any) => {
    setEditTarget(entry);
    setEntryForm({
      title: entry.title, amount: entry.amount.toString(), type: entry.type,
      category: entry.category, paymentMethod: entry.paymentMethod || 'Cash', note: entry.note || ''
    });
    setModalType('addEntry');
  };

  const handleDeleteEntry = async () => {
    if (confirmName !== deleteTarget.title) return alert("Name doesn't match!");
    const res = await fetch(`/api/entries/${deleteTarget._id}`, { method: 'DELETE' });
    if (res.ok) {
      setModalType('none');
      setConfirmName('');
      fetchEntries(currentBook._id);
    }
  };

  // --- 8. Filter & Analytics ---
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    const entryDate = new Date(entry.date);
    const now = new Date();
    let matchesDate = true;
    if (dateFilter === 'today') matchesDate = entryDate.toDateString() === now.toDateString();
    else if (dateFilter === 'week') {
      const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
      matchesDate = entryDate >= oneWeekAgo;
    } else if (dateFilter === 'month') matchesDate = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    return matchesSearch && matchesDate;
  });

  const totalIncome = filteredEntries.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredEntries.filter(e => e.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  // --- AUTH UI ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
        <div className="glass-card w-full max-w-md p-8 text-center border border-white/10">
          <h2 className="text-4xl font-black mb-10 text-white italic tracking-tighter uppercase underline decoration-blue-500">Cashbook<span className="text-blue-500">.</span></h2>
          <input type="password" placeholder="Admin PIN (1234)" className="glass-input w-full text-center mb-4" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={() => { if(password==='1234'){setIsLoggedIn(true); localStorage.setItem('isLoggedIn', 'true'); fetchBooks();} else {alert("Wrong Password");} }} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white shadow-lg transition-all">Enter Dashboard</button>
        </div>
      </div>
    );
  }

  // --- HOME VIEW (Book List) ---
  if (!currentBook) {
    return (
      <div className="min-h-screen bg-[#020617] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">My Ledger</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-[2px] uppercase mt-1">Status: Active Account</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="bg-white/5 p-4 rounded-2xl text-slate-400 hover:text-red-500 transition-all border border-white/5" title="Sign Out">
                <LogOut size={20} />
              </button>
              <button onClick={() => {setBookForm({name:'', description:''}); setModalType('addBook');}} className="bg-blue-600 p-4 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-500 shadow-xl transition-all">
                <Plus size={20} /> New Book
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {books.length === 0 ? (
              <div className="col-span-full py-20 text-center glass-card opacity-30 border-dashed">No ledger books found. Click 'New Book' to start.</div>
            ) : (
              books.map(book => (
                <BookCard key={book._id} book={book} onClick={() => { setCurrentBook(book); fetchEntries(book._id); }} />
              ))
            )}
          </div>
        </div>

        {/* Modal: Add Book */}
        {modalType === 'addBook' && (
          <ModalLayout title="New Book" onClose={() => setModalType('none')}>
            <form onSubmit={handleSaveBook} className="space-y-4">
              <input required placeholder="Book Name" className="glass-input w-full uppercase font-bold text-sm tracking-widest" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
              <input placeholder="Short Description" className="glass-input w-full text-sm" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
              <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs tracking-[2px] uppercase shadow-lg">Confirm & Create</button>
            </form>
          </ModalLayout>
        )}
      </div>
    );
  }

  // --- BOOK DETAILS VIEW ---
  return (
    <div className="min-h-screen bg-[#020617] text-white pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => { setCurrentBook(null); setDateFilter('all'); setSearchQuery(''); }} className="flex items-center gap-2 text-slate-500 font-bold hover:text-white transition-all text-xs uppercase tracking-widest">
              <ArrowLeft size={16} /> Back to Library
            </button>
            <div className="flex gap-2">
                <button onClick={() => {setBookForm({name: currentBook.name, description: currentBook.description}); setModalType('editBook');}} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-blue-400 transition-all border border-white/5">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => {setConfirmName(''); setModalType('deleteBookConfirm');}} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-red-500 transition-all border border-white/5">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        <div className="mb-10 border-b border-white/5 pb-8">
          <h1 className="text-5xl font-black tracking-tighter mb-1 uppercase">{currentBook.name}</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] opacity-60 italic">{currentBook.description}</p>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 border-green-500/20 bg-green-500/5">
            <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest mb-1 italic">Total Inflow</p>
            <h3 className="text-xl font-mono font-bold text-green-400">+{totalIncome.toLocaleString()}</h3>
          </div>
          <div className="glass-card p-4 border-red-500/20 bg-red-500/5">
            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mb-1 italic">Total Outflow</p>
            <h3 className="text-xl font-mono font-bold text-red-400">-{totalExpense.toLocaleString()}</h3>
          </div>
          <div className="glass-card p-4 border-blue-500/20 bg-blue-500/5">
            <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mb-1 italic">Net Available</p>
            <h3 className="text-xl font-mono font-bold text-blue-400">{totalBalance.toLocaleString()}</h3>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="Quick Search Entries..." className="glass-input w-full pl-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[{ label: 'All', value: 'all' }, { label: 'Today', value: 'today' }, { label: '7 Days', value: 'week' }, { label: 'Monthly', value: 'month' }].map((f) => (
              <button key={f.value} onClick={() => setDateFilter(f.value)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === f.value ? 'bg-blue-600 text-white shadow-lg' : 'glass-card text-slate-500 border-white/5'}`}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-20 glass-card opacity-20 border-dashed">Empty database for selected criteria.</div>
          ) : (
            filteredEntries.map(entry => (
              <EntryRow key={entry._id} entry={entry} onDelete={() => { setDeleteTarget(entry); setConfirmName(''); setModalType('deleteConfirm'); }} onEdit={() => openEditModal(entry)} />
            ))
          )}
        </div>
      </div>

      <button onClick={() => { setEditTarget(null); setEntryForm({ title: '', amount: '', type: 'expense', category: 'General', paymentMethod: 'Cash', note: '' }); setModalType('addEntry'); }} className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-all z-40 active:scale-90">
        <Plus size={32} />
      </button>

      {/* Modal: Add/Edit Entry */}
      {modalType === 'addEntry' && (
        <ModalLayout title={editTarget ? "Modify Entry" : "New Entry"} onClose={() => setModalType('none')}>
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <input required placeholder="Transaction Title" className="glass-input w-full" value={entryForm.title} onChange={e => setEntryForm({...entryForm, title: e.target.value})} />
            <input required type="number" placeholder="0.00" className="glass-input w-full font-mono text-2xl text-blue-400" value={entryForm.amount} onChange={e => setEntryForm({...entryForm, amount: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <select className="glass-input w-full text-xs font-bold" value={entryForm.paymentMethod} onChange={e => setEntryForm({...entryForm, paymentMethod: e.target.value})}>
                <option value="Cash">CASH</option><option value="bKash">BKASH</option><option value="Nagad">NAGAD</option><option value="Bank">BANK</option>
              </select>
              <select className="glass-input w-full text-xs font-bold" value={entryForm.category} onChange={e => setEntryForm({...entryForm, category: e.target.value})}>
                <option value="General">GENERAL</option><option value="Salary">SALARY</option><option value="Food">FOOD</option><option value="Rent">RENT</option>
              </select>
            </div>
            <input placeholder="Internal Note (Optional)" className="glass-input w-full text-sm italic" value={entryForm.note} onChange={e => setEntryForm({...entryForm, note: e.target.value})} />
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEntryForm({...entryForm, type: 'income'})} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${entryForm.type === 'income' ? 'bg-green-600 shadow-lg shadow-green-900/40' : 'bg-white/5 text-slate-500'}`}>INCOME</button>
              <button type="button" onClick={() => setEntryForm({...entryForm, type: 'expense'})} className={`flex-1 py-4 rounded-2xl font-bold transition-all ${entryForm.type === 'expense' ? 'bg-red-600 shadow-lg shadow-red-900/40' : 'bg-white/5 text-slate-500'}`}>EXPENSE</button>
            </div>
            <button className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white mt-4 uppercase tracking-widest shadow-xl">Push to Database</button>
          </form>
        </ModalLayout>
      )}

      {/* Modal: Edit Book */}
      {modalType === 'editBook' && (
        <ModalLayout title="Update Book" onClose={() => setModalType('none')}>
          <form onSubmit={handleSaveBook} className="space-y-4">
            <input required placeholder="Book Name" className="glass-input w-full uppercase font-bold text-sm tracking-widest" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
            <input placeholder="Short Description" className="glass-input w-full text-sm" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
            <button className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs tracking-[2px] uppercase shadow-lg">Confirm Update</button>
          </form>
        </ModalLayout>
      )}

      {/* Delete Modals */}
      {modalType === 'deleteConfirm' && (
        <DeleteConfirmModal targetName={deleteTarget.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={() => setModalType('none')} />
      )}

      {modalType === 'deleteBookConfirm' && (
        <DeleteConfirmModal targetName={currentBook.name} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteBook} onClose={() => setModalType('none')} />
      )}
    </div>
  );
}