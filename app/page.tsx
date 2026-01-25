"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ArrowLeft, Loader2, Search, X, LogOut, Trash2, Edit2, Wallet, TrendingUp, TrendingDown, Clock, BarChart3, Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ModalLayout, DeleteConfirmModal } from '@/components/Modals';
import { BookCard } from '@/components/BookCard';
import { EntryRow } from '@/components/EntryRow';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { ExportTools } from '@/components/ExportTools';

// --- AUTH State Type ---
interface UserState {
  _id: string;
  username: string;
  email: string;
}

export default function CashBookApp() {
  // Security: Disable Copy & Right Click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // --- STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserState | null>(null);
  const [currentBook, setCurrentBook] = useState<any>(null); 
  const [books, setBooks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [modalType, setModalType] = useState<'none' | 'addBook' | 'addEntry' | 'deleteConfirm' | 'deleteBookConfirm' | 'editBook' | 'register'>('none');
  
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [confirmName, setConfirmName] = useState('');
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showChart, setShowChart] = useState(false);

  // Forms
  const [bookForm, setBookForm] = useState({ name: '', description: '' });
  const [entryForm, setEntryForm] = useState({ 
    title: '', amount: '', type: 'expense', category: 'General', 
    paymentMethod: 'Cash', note: '', status: 'Completed',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
  });
  
  // Auth Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });

  // --- EFFECTS ---
  useEffect(() => {
    const savedUser = localStorage.getItem('cashbookUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // Fetch books only when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchBooks();
    }
  }, [currentUser]);

  // --- API HANDLERS ---

  const fetchBooks = async () => {
    if (!currentUser) return; 
    const res = await fetch(`/api/books?userId=${currentUser._id}`); 
    const data = await res.json();
    setBooks(Array.isArray(data) ? data : []);
  };

  const fetchEntries = async (bookId: string) => {
    const res = await fetch(`/api/entries?bookId=${bookId}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm),
      });
      if (res.ok) {
          const user = await res.json();
          localStorage.setItem('cashbookUser', JSON.stringify(user));
          setCurrentUser(user);
          setIsLoggedIn(true);
          setLoginForm({ email: '', password: '' });
          toast.success(`Welcome back, ${user.username}!`);
      } else {
          toast.error('Invalid Email or Password');
      }
    } catch (error) {
      toast.error('Login Error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerForm),
      });
      if (res.ok) {
          toast.success('Registration successful! Please login.');
          setModalType('none');
          setRegisterForm({ username: '', email: '', password: '' });
          setLoginForm({ email: registerForm.email, password: '' }); 
      } else {
          toast.error('Registration failed. Email might be in use.');
      }
    } catch (error) {
      toast.error('Registration Error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cashbookUser');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentBook(null);
    setBooks([]);
    toast.success('System Locked');
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return toast.error("Please login first.");

    const isEdit = modalType === 'editBook';
    const url = isEdit ? `/api/books/${currentBook._id}` : '/api/books';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...bookForm, userId: currentUser._id }), 
    });

    if (res.ok) {
      if (isEdit) setCurrentBook(await res.json());
      setModalType('none');
      fetchBooks();
      toast.success(isEdit ? 'Ledger Updated' : 'Ledger Created');
    } else {
      toast.error('Failed to save book');
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editTarget ? `/api/entries/${editTarget._id}` : '/api/entries';
    const res = await fetch(url, {
      method: editTarget ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entryForm, bookId: currentBook._id }),
    });
    if (res.ok) {
      toast.success('Record Synced');
      setModalType('none');
      fetchEntries(currentBook._id);
    }
  };

  const handleToggleStatus = async (entry: any) => {
    const newStatus = entry.status === 'Pending' ? 'Completed' : 'Pending';
    const res = await fetch(`/api/entries/status/${entry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
        toast.success(`Status set to ${newStatus}`);
        fetchEntries(entry.bookId);
    } else {
        toast.error('Failed to update status');
    }
  };

  const handleDeleteBook = async () => {
    if (confirmName !== currentBook.name) return toast.error("Name mismatch!");
    await fetch(`/api/books/${currentBook._id}`, { method: 'DELETE' });
    toast.success('Book Deleted');
    setModalType('none');
    setCurrentBook(null);
    fetchBooks();
  };

  const handleDeleteEntry = async () => {
    if (confirmName !== deleteTarget.title) return toast.error("Name mismatch!");
    await fetch(`/api/entries/${deleteTarget._id}`, { method: 'DELETE' });
    toast.success('Record Deleted');
    setModalType('none');
    fetchEntries(currentBook._id);
  };

  const openEditModal = (entry: any) => {
    setEditTarget(entry);
    setEntryForm({
        title: entry.title, amount: entry.amount.toString(), type: entry.type,
        category: entry.category, paymentMethod: entry.paymentMethod || 'Cash', note: entry.note || '',
        status: entry.status || 'Completed',
        date: new Date(entry.date).toISOString().split('T')[0],
        time: entry.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    });
    setModalType('addEntry');
  };

  // --- CALCULATIONS & FILTERING ---
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    let matchesDate = true;

    // Search Filter
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date Range Filter Logic
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Make it inclusive
        matchesDate = entryDate >= start && entryDate < end;
    } else if (dateFilter === 'today') {
        matchesDate = entryDate.toDateString() === new Date().toDateString();
    } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(new Date().getDate() - 7);
        matchesDate = entryDate >= oneWeekAgo;
    } else if (dateFilter === 'month') {
        matchesDate = entryDate.getMonth() === new Date().getMonth() && entryDate.getFullYear() === new Date().getFullYear();
    }

    return matchesSearch && matchesDate;
  });

  const totalIncome = filteredEntries.filter(e => e.type === 'income' && e.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredEntries.filter(e => e.type === 'expense' && e.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0);

  if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {/* --- LOGIN SCREEN --- */}
        {!isLoggedIn ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md p-10 text-center border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-600 animate-pulse"></div>
              <h2 className="text-5xl font-black mb-10 text-white italic tracking-tighter uppercase leading-none">CASH<span className="text-blue-500">BOOK.</span></h2>
              
              <form onSubmit={handleLogin} className="space-y-4">
                  <input type="email" placeholder="EMAIL ADDRESS" className="glass-input w-full font-bold" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required/>
                  <input type="password" placeholder="PASSWORD" className="glass-input w-full font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required/>
                  <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all">Login to Vault</button>
              </form>

              <p onClick={() => setModalType('register')} className="text-slate-500 text-xs mt-6 hover:text-white cursor-pointer transition-colors">
                  New User? <span className="text-blue-400 font-bold">Create Account</span>
              </p>
            </div>
          </motion.div>
        ) : 
        /* --- HOME SCREEN (Book List) --- */
        !currentBook ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto p-6 lg:p-12">
            <div className="flex justify-between items-end mb-16">
              <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <p className="text-blue-500 font-bold text-[10px] tracking-[4px] uppercase mb-2 italic">User: {currentUser?.username}</p>
                <h1 className="text-6xl font-black tracking-tighter text-white uppercase leading-none">All Books</h1>
              </motion.div>
              <div className="flex gap-4">
                <button onClick={handleLogout} className="glass-card p-5 text-slate-400 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
                <button onClick={() => {setBookForm({name:'', description:''}); setModalType('addBook');}} className="bg-blue-600 p-5 rounded-[24px] flex items-center gap-3 font-black text-white shadow-2xl hover:scale-105 transition-all">
                  <Plus size={24} /> <span className="hidden md:inline text-[10px] tracking-widest font-black uppercase">New Ledger</span>
                </button>
              </div>
            </div>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, i) => (
                <motion.div key={book._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}>
                  <BookCard book={book} onClick={() => { setCurrentBook(book); fetchEntries(book._id); }} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : 
        /* --- BOOK DETAILS VIEW --- */
        (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto p-6 pb-32">
            <header className="flex justify-between items-center mb-12">
              <button onClick={() => {setCurrentBook(null); setDateFilter('all'); setSearchQuery(''); setStartDate(''); setEndDate(''); setShowChart(false);}} className="glass-card p-3 px-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                <ArrowLeft size={16} /> Dashboard
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowChart(!showChart)} className={`p-3 glass-card transition-all ${showChart ? 'text-blue-400 border-blue-500/30' : 'text-slate-400'}`}><BarChart3 size={18} /></button>
                <button onClick={() => {setBookForm({name: currentBook.name, description: currentBook.description}); setModalType('editBook');}} className="glass-card p-3 text-slate-400 hover:text-blue-500 transition-all"><Edit2 size={18}/></button>
                <button onClick={() => {setConfirmName(''); setModalType('deleteBookConfirm');}} className="glass-card p-3 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
              </div>
            </header>

            <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10">
              <h1 className="text-6xl font-black tracking-tighter text-white mb-2 uppercase italic leading-none">{currentBook.name}</h1>
              <p className="text-slate-500 font-bold text-[10px] tracking-[4px] uppercase italic">{currentBook.description}</p>
            </motion.div>

            <ExportTools entries={filteredEntries} bookName={currentBook.name} />

            {/* Filter & Search Bar */}
            <div className="space-y-4 mb-8">
                {/* NEW: Date Range UI */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Calendar size={18} className="text-slate-500 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"/>
                        <input type="date" className="glass-input w-full pl-10 text-[10px] font-black tracking-widest" value={startDate} onChange={e => {setStartDate(e.target.value); setDateFilter('custom');}}/>
                    </div>
                    <div className="relative flex-1">
                        <Calendar size={18} className="text-slate-500 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"/>
                        <input type="date" className="glass-input w-full pl-10 text-[10px] font-black tracking-widest" value={endDate} onChange={e => {setEndDate(e.target.value); setDateFilter('custom');}}/>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                    <input type="text" placeholder="Quick Search Entries..." className="glass-input w-full pl-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { label: 'All', value: 'all' }, 
                        { label: 'Today', value: 'today' }, 
                        { label: '7 Days', value: 'week' }, 
                        { label: 'Monthly', value: 'month' }
                    ].map((f) => (
                        <button key={f.value} onClick={() => {setDateFilter(f.value); setStartDate(''); setEndDate('');}} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === f.value ? 'bg-blue-600 text-white shadow-lg' : 'glass-card text-slate-500 border-white/5'}`}>{f.label}</button>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {showChart && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12">
                        <div className="glass-card p-6 border-blue-500/10"><AnalyticsChart entries={filteredEntries} /></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-l-4 border-green-500 bg-green-500/5">
                <TrendingUp className="text-green-500 mb-4" size={20} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Inflow</p>
                <h3 className="text-3xl font-mono font-bold text-green-400">+{totalIncome.toLocaleString()}</h3>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-l-4 border-red-500 bg-red-500/5">
                <TrendingDown className="text-red-500 mb-4" size={20} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Outflow</p>
                <h3 className="text-3xl font-mono font-bold text-red-400">-{totalExpense.toLocaleString()}</h3>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-8 border-l-4 border-blue-500 bg-blue-500/10">
                <Wallet className="text-blue-500 mb-4" size={20} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Net Cash</p>
                <h3 className="text-3xl font-mono font-bold text-blue-400">{(totalIncome - totalExpense).toLocaleString()}</h3>
              </motion.div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {filteredEntries.map((entry) => (
                    <EntryRow 
                        key={entry._id} 
                        entry={entry} 
                        onDelete={() => {setDeleteTarget(entry); setConfirmName(''); setModalType('deleteConfirm');}} 
                        onEdit={() => openEditModal(entry)} 
                        onToggleStatus={() => handleToggleStatus(entry)}
                    />
                ))}
              </AnimatePresence>
            </div>

            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => {setEditTarget(null); setEntryForm({title:'', amount:'', type:'expense', category:'General', paymentMethod:'Cash', note:'', status: 'Completed', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}); setModalType('addEntry');}} className="fixed bottom-10 right-10 w-20 h-20 bg-blue-600 rounded-[30px] flex items-center justify-center text-white shadow-2xl z-50">
              <Plus size={40} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      {modalType === 'register' && (
         <ModalLayout title="Create Account" onClose={() => setModalType('none')}>
            <form onSubmit={handleRegister} className="space-y-4">
                <input type="text" placeholder="FULL NAME" className="glass-input w-full font-bold" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required/>
                <input type="email" placeholder="EMAIL" className="glass-input w-full font-bold" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                <input type="password" placeholder="PASSWORD" className="glass-input w-full font-bold" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                <button type="submit" className="w-full bg-green-600 py-4 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl">Register</button>
            </form>
         </ModalLayout>
      )}

      {modalType === 'addEntry' && (
        <ModalLayout title={editTarget ? "Modify Record" : "New Record"} onClose={() => setModalType('none')}>
          <form onSubmit={handleSaveEntry} className="space-y-6">
            <div className="space-y-4">
                <input required placeholder="TITLE" className="glass-input w-full font-bold uppercase tracking-widest text-xs" value={entryForm.title} onChange={e => setEntryForm({...entryForm, title: e.target.value})} />
                <input required type="number" placeholder="0.00" className="glass-input w-full font-mono text-4xl text-blue-500" value={entryForm.amount} onChange={e => setEntryForm({...entryForm, amount: e.target.value})} />
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                        <select className="glass-input w-full text-[10px] font-black" value={entryForm.paymentMethod} onChange={e => setEntryForm({...entryForm, paymentMethod: e.target.value})}>
                            <option value="Cash">CASH</option><option value="bKash">BKASH</option><option value="Nagad">NAGAD</option><option value="Bank">BANK</option>
                        </select>
                        <input type="text" placeholder="TIME (E.G. 10:30 AM)" className="glass-input w-full text-[10px] font-black" value={entryForm.time} onChange={e => setEntryForm({...entryForm, time: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                        <input type="date" className="glass-input w-full text-[10px] font-black" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} />
                        <select className="glass-input w-full text-[10px] font-black" value={entryForm.status} onChange={e => setEntryForm({...entryForm, status: e.target.value})}>
                            <option value="Completed">COMPLETED</option><option value="Pending">PENDING</option>
                        </select>
                    </div>
                </div>
                <textarea placeholder="ADDITIONAL NOTES..." className="glass-input w-full text-xs italic h-20 resize-none" value={entryForm.note} onChange={e => setEntryForm({...entryForm, note: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setEntryForm({...entryForm, type: 'income'})} className={`flex-1 py-5 rounded-[20px] font-black text-xs tracking-widest ${entryForm.type === 'income' ? 'bg-green-600 shadow-lg text-white' : 'bg-white/5 text-slate-500'}`}>INCOME</button>
              <button type="button" onClick={() => setEntryForm({...entryForm, type: 'expense'})} className={`flex-1 py-5 rounded-[20px] font-black text-xs tracking-widest ${entryForm.type === 'expense' ? 'bg-red-600 shadow-lg text-white' : 'bg-white/5 text-slate-500'}`}>EXPENSE</button>
            </div>
            <button className="w-full bg-blue-600 py-6 rounded-[24px] font-black text-white uppercase tracking-[4px] text-xs shadow-2xl">Confirm Log</button>
          </form>
        </ModalLayout>
      )}

      {modalType === 'deleteConfirm' && <DeleteConfirmModal targetName={deleteTarget.title} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteEntry} onClose={() => setModalType('none')} />}
      {modalType === 'deleteBookConfirm' && <DeleteConfirmModal targetName={currentBook.name} confirmName={confirmName} setConfirmName={setConfirmName} onConfirm={handleDeleteBook} onClose={() => setModalType('none')} />}
      {(modalType === 'addBook' || modalType === 'editBook') && (
        <ModalLayout title={modalType === 'editBook' ? "Edit Ledger" : "New Ledger"} onClose={() => setModalType('none')}>
          <form onSubmit={handleSaveBook} className="space-y-4">
            <input required placeholder="LEDGER NAME" className="glass-input w-full font-black text-xs tracking-widest" value={bookForm.name} onChange={e => setBookForm({...bookForm, name: e.target.value})} />
            <input placeholder="DESCRIPTION" className="glass-input w-full text-[10px] font-bold" value={bookForm.description} onChange={e => setBookForm({...bookForm, description: e.target.value})} />
            <button className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs tracking-[3px] uppercase">Commit Changes</button>
          </form>
        </ModalLayout>
      )}
    </div>
  );
}