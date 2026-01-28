"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, BarChart3, Edit2, Trash2, ArrowLeft, Plus, 
    MoreVertical, Share2, LayoutGrid, CheckCircle, Clock, 
    Download, ArrowUpDown, Copy, Loader2, Calendar, Wallet,
    ChevronLeft, ChevronRight, Settings, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';
import { ModalLayout } from '@/components/Modals';
import { AnalyticsChart } from '@/components/AnalyticsChart';

export const BookDetails = ({ 
    currentBook, items, onBack, onAdd, onEdit, onDelete, onToggleStatus, 
    onEditBook, onDeleteBook, searchQuery, setSearchQuery, pagination,
    currentUser, onOpenAnalytics, onOpenExport 
}: any) => {
    
    if (!currentBook) return null;

    // --- STATES ---
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    // UI Toggles
    const [showMenu, setShowMenu] = useState(false); // Header Menu
    const [showSortMenu, setShowSortMenu] = useState(false); // Desktop Sort
    const [showMobileSettings, setShowMobileSettings] = useState(false); // Mobile Toolbar Menu (New)
    
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Share Logic States
    const [isSharing, setIsSharing] = useState(currentBook.isPublic || false);
    const [shareToken, setShareToken] = useState(currentBook.shareToken || '');
    const [shareLoading, setShareLoading] = useState(false);

    // Dynamic Data
    const userCategories = ['All', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- LOGIC ENGINE ---
    const handleShareToggle = async () => {
        setShareLoading(true);
        try {
            const newStatus = !isSharing;
            const res = await fetch('/api/books/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: currentBook._id, enable: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                setIsSharing(data.isPublic);
                if (data.shareToken) setShareToken(data.shareToken);
                toast.success(newStatus ? "Public link activated" : "Public link disabled");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setShareLoading(false);
        }
    };

    let processedItems = [...items].filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (categoryFilter !== 'All') {
        processedItems = processedItems.filter(item => item.category === categoryFilter);
    }
    processedItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentItems = processedItems.slice((pagination.currentPage - 1) * 10, pagination.currentPage * 10);
    const totalIn = items.filter((e: any) => e.type === 'income' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const totalOut = items.filter((e: any) => e.type === 'expense' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const netBalance = totalIn - totalOut;

    return (
        <div className="w-full pb-32" onClick={() => { setShowMenu(false); setShowSortMenu(false); setShowMobileSettings(false); }}>
            
            {/* 1. STICKY HEADER */}
            <div className="sticky top-0 z-[100] z-[30] bg-[var(--bg-app)]/90 backdrop-blur-xl border-b border-[var(--border-color)] px-4 md:px-10 py-5 mb-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 transition-all shadow-sm active:scale-90">
                        <ArrowLeft size={22} strokeWidth={3}/>
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none truncate">{currentBook.name}</h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-80 truncate">Report Protocol Active</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={onAdd} className="hidden md:flex items-center gap-2 bg-orange-500 text-white px-6 py-3.5 rounded-xl shadow-lg shadow-orange-500/20 text-xs font-black tracking-widest hover:bg-orange-600 transition-all active:scale-95">
                        <Plus size={16} strokeWidth={3} /> NEW ENTRY
                    </button>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500 active:bg-orange-500 active:text-white transition-all shadow-sm">
                            <MoreVertical size={22} />
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[200] overflow-hidden py-1">
                                    <button onClick={onAdd} className="md:hidden w-full text-left px-5 py-4 text-xs font-black uppercase hover:bg-[var(--bg-app)] flex gap-3 text-orange-500"><Plus size={18}/> New Entry</button>
                                    <button onClick={() => {onEditBook(); setShowMenu(false);}} className="w-full text-left px-5 py-4 text-xs font-black uppercase hover:bg-[var(--bg-app)] flex gap-3 text-[var(--text-muted)] border-t md:border-none border-[var(--border-color)]"><Edit2 size={18}/> Edit Ledger</button>
                                    <button onClick={() => {setShowShareModal(true); setShowMenu(false);}} className="w-full text-left px-5 py-4 text-xs font-black uppercase hover:bg-[var(--bg-app)] flex gap-3 text-[var(--text-muted)] border-t border-[var(--border-color)]"><Share2 size={18}/> Share Access</button>
                                    <button onClick={() => {onDeleteBook(); setShowMenu(false);}} className="w-full text-left px-5 py-4 text-xs font-black uppercase hover:bg-red-500/5 text-red-500 flex gap-3 border-t border-[var(--border-color)]"><Trash2 size={18}/> Terminate</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="px-4 md:px-10 space-y-8">
                
                {/* 2. STATS BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[var(--bg-card)] p-7 rounded-[28px] border border-[var(--border-color)] border-l-4 border-l-blue-500 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[3px]">Vault Balance</p>
                            <h3 className={`text-3xl md:text-4xl font-mono-finance font-bold mt-2 ${netBalance >= 0 ? 'text-[var(--text-main)]' : 'text-red-500'}`}>
                                {netBalance < 0 ? '-' : '+'}{currencySymbol}{Math.abs(netBalance).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-3xl text-blue-500 md:hidden"><Wallet size={32} /></div>
                    </div>
                    <div className="hidden md:block bg-[var(--bg-card)] p-7 rounded-[28px] border border-[var(--border-color)] border-l-4 border-l-green-500 shadow-sm">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-[3px]">Total Inflow</p>
                        <h3 className="text-3xl font-mono-finance font-bold mt-2 text-[var(--text-main)]">+{currencySymbol}{totalIn.toLocaleString()}</h3>
                    </div>
                    <div className="hidden md:block bg-[var(--bg-card)] p-7 rounded-[28px] border border-[var(--border-color)] border-l-4 border-l-red-500 shadow-sm">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[3px]">Total Outflow</p>
                        <h3 className="text-3xl font-mono-finance font-bold mt-2 text-[var(--text-main)]">-{currencySymbol}{totalOut.toLocaleString()}</h3>
                    </div>
                </div>

                {/* 3. RESPONSIVE TOOLBAR (Mobile Menu + Desktop Buttons) */}
                <div className="flex gap-3 items-center w-full relative z-[50]">
                    
                    {/* SEARCH BAR (Flexible Width) */}
                    <div className="relative flex-1 group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none group-focus-within:text-orange-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            value={searchQuery}
                            onChange={e => {setSearchQuery(e.target.value); pagination.setPage(1);}}
                            placeholder="FILTER BY TRANSACTION TITLE..." 
                            className="w-full pl-14 pr-6 py-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[20px] text-xs font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 shadow-sm transition-all"
                        />
                    </div>

                    {/* --- DESKTOP VIEW: 4 BUTTONS --- */}
                    <div className="hidden xl:flex gap-3">
                        {/* Sort */}
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }} className=" relative w-full flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                                <ArrowUpDown size={18} className="shrink-0" /> <span>SORT</span>
                            </button>
                            <AnimatePresence>
                                {showSortMenu && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-16 w-44 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[150] p-2">
                                        {['date', 'amount', 'title'].map(key => (
                                            <button key={key} onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="menu-option">
                                                {key} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View/Category */}
                        <div className="relative w-full flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                            <LayoutGrid size={18} className="shrink-0" />
                            <span className="truncate">{categoryFilter === 'All' ? 'VIEW' : categoryFilter.toUpperCase()}</span>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                                {userCategories.map((c: string) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {/* Stats & Export */}
                        <button onClick={onOpenAnalytics} className="relative w-full flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                            <BarChart3 size={18} className="shrink-0" /> <span>STATS</span>
                        </button>
                        <button onClick={onOpenExport} className="relative w-full flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                            <Download size={18} className="shrink-0" /> <span>EXPORT</span>
                        </button>
                    </div>

                    {/* --- MOBILE VIEW: SETTINGS DROPDOWN --- */}
                    <div className="xl:hidden relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMobileSettings(!showMobileSettings); }} 
                            className="p-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[20px] text-[var(--text-muted)] hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95"
                        >
                            <Settings size={20} />
                        </button>

                        <AnimatePresence>
                            {showMobileSettings && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 top-16 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[200] overflow-hidden p-2"
                                >
                                    <div className="flex flex-col gap-1">
                                        {/* Mobile Sort */}
                                        <div className="p-2">
                                            <p className="text-[9px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest pl-2">Sort Order</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {['date', 'amount'].map(key => (
                                                    <button key={key} onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className={`text-[10px] px-3 py-1.5 rounded-lg border ${sortConfig.key === key ? 'bg-orange-500 text-white border-orange-500' : 'border-[var(--border-color)]'}`}>
                                                        {key.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mobile Category */}
                                        <div className="p-2 border-t border-[var(--border-color)]">
                                            <p className="text-[9px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest pl-2">Filter View</p>
                                            <div className="relative w-full">
                                                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-app)]">
                                                    <span className="text-[10px] font-bold uppercase">{categoryFilter}</span>
                                                    <ChevronDown size={14} className="opacity-50"/>
                                                </div>
                                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                                                    {userCategories.map((c: string) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="border-t border-[var(--border-color)] mt-1 p-4 flex  items-center justify-center gap-8">
                                            <button onClick={() => {onOpenAnalytics(); setShowMobileSettings(false);}} className=" menu-item flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap"><BarChart3 size={16}/> </button>
                                            <button onClick={() => {onOpenExport(); setShowMobileSettings(false);}} className=" menu-item flex cursor-pointer  rounded-[20px]  gap-3 px-6 py-4  border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 hover:shadow-lg transition-all active:scale-95 whitespace-nowrap text-green-500 hover:bg-green-500/10"><Download size={16}/> </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 4. DATA TABLE */}
                <div className="bg-[var(--bg-card)] rounded-[28px] border border-[var(--border-color)] overflow-hidden shadow-sm min-h-[500px]">
                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="border-b border-[var(--border-color)] bg-[var(--bg-app)]/30">
                                <tr>
                                    <th className="py-6 px-8 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] w-16 text-center">#</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] w-36">Timestamp</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">Transaction Detail</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] w-36">Category</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] w-28">Method</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] text-right w-40">Amount</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] text-center w-32">Status</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] text-right w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {currentItems.map((e: any, i: number) => (
                                    <tr key={e._id} className="hover:bg-[var(--accent-soft)] transition-all group">
                                        <td className="py-7 px-8 text-center text-xs font-bold text-[var(--text-muted)] opacity-30">{(pagination.currentPage-1)*10 + i + 1}</td>
                                        <td className="py-7 px-6 text-xs font-bold text-[var(--text-muted)] font-mono uppercase tracking-tighter">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                                        <td className="py-7 px-6">
                                            <div className="text-base font-black text-[var(--text-main)] uppercase tracking-tight leading-none">{e.title}</div>
                                            {e.note && <div className="text-[11px] text-[var(--text-muted)] italic mt-2 font-bold opacity-50 truncate max-w-xs">"{e.note}"</div>}
                                        </td>
                                        <td className="py-7 px-6"><span className="px-4 py-1.5 rounded-xl bg-orange-500/5 text-orange-500 text-[10px] font-black uppercase border border-orange-500/10 tracking-widest">{e.category}</span></td>
                                        <td className="py-7 px-6 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-80">{e.paymentMethod}</td>
                                        <td className={`py-7 px-6 text-right font-mono-finance font-bold text-lg ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                                        </td>
                                        <td className="py-7 px-6 text-center">
                                            <button onClick={() => onToggleStatus(e)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${e.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-sm' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-sm'}`}>
                                                {e.status}
                                            </button>
                                        </td>
                                        <td className="py-7 px-8 text-right flex justify-end gap-3 mt-1">
                                            <button onClick={() => onEdit(e)} className="p-2.5 text-blue-500 bg-blue-500/5 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit2 size={16}/></button>
                                            <button onClick={() => onDelete(e)} className="p-2.5 text-red-500 bg-red-500/5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View Cards */}
                    <div className="md:hidden p-5 space-y-5">
                        {currentItems.map((e: any) => (
                             <div key={e._id} className="app-card p-6 flex flex-col gap-5 border-[var(--border-color)]">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-base font-black uppercase text-[var(--text-main)] tracking-tight leading-none">{e.title}</h4>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{new Date(e.date).toLocaleDateString()} • {e.category}</p>
                                    </div>
                                    <span className={`text-xl font-mono-finance font-bold ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-5 border-t border-[var(--border-color)]">
                                    <button onClick={() => onToggleStatus(e)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase border tracking-widest ${e.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                        {e.status}
                                    </button>
                                    <div className="flex gap-4">
                                        <button onClick={() => onEdit(e)} className="text-blue-500 active:scale-90 transition-transform"><Edit2 size={20}/></button>
                                        <button onClick={() => onDelete(e)} className="text-red-500 active:scale-90 transition-transform"><Trash2 size={20}/></button>
                                    </div>
                                </div>
                             </div>
                        ))}
                        {currentItems.length === 0 && <div className="p-10 text-center text-slate-400 font-bold uppercase text-xs">No records found protocol.</div>}
                    </div>
                </div>

                {/* 5. SMART PAGINATION */}
                <div className="flex justify-between items-center py-4 px-2">
                    <p className="text-[11px] font-black text-[var(--text-muted)] uppercase hidden md:block tracking-widest">Protocol Archive</p>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end items-center">
                        <button disabled={pagination.currentPage === 1} onClick={() => pagination.setPage(pagination.currentPage - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronLeft size={20}/></button>
                        <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{pagination.currentPage} / {pagination.totalPages}</div>
                        <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setPage(pagination.currentPage + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>

                {/* Modals */}
                <AnimatePresence>
                    {showAnalyticsModal && <ModalLayout title="Analytics" onClose={() => setShowAnalyticsModal(false)}><div className="h-[300px]"><AnalyticsChart entries={items} /></div></ModalLayout>}
                    {showExportModal && <AdvancedExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} entries={items} bookName={currentBook.name} />}
                    {showShareModal && (
                        <ModalLayout title="Public Access" onClose={() => setShowShareModal(false)}>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]">
                                    <span className="text-xs font-bold uppercase text-[var(--text-muted)]">{isSharing ? 'Sharing Active' : 'Sharing Off'}</span>
                                    <button onClick={handleShareToggle} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${isSharing ? 'bg-red-500/10 text-red-500' : 'bg-green-500 text-white'}`}>{shareLoading ? <Loader2 className="animate-spin" size={14}/> : (isSharing ? 'Disable' : 'Enable')}</button>
                                </div>
                                {isSharing && (
                                    <div className="relative">
                                        <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`} className="app-input pr-12 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-app)]" />
                                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${shareToken}`); toast.success("Copied"); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:text-green-500"><React.Fragment><Copy size={14} /></React.Fragment></button>
                                    </div>
                                )}
                            </div>
                        </ModalLayout>
                    )}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .bordered-icon-btn {
                    @apply flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95 whitespace-nowrap select-none;
                }
                .menu-option {
                    @apply w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-[var(--bg-app)] rounded-xl transition-all text-left;
                }
            `}</style>
        </div>
    );
};