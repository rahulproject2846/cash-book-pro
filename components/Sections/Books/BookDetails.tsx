"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, BarChart3, Edit2, Trash2, ArrowLeft, Plus, 
    MoreVertical, Share2, LayoutGrid, CheckCircle, Clock, 
    Download, ArrowUpDown, Copy, Loader2, Calendar, Wallet,
    ChevronLeft, ChevronRight, Settings, ChevronDown, Check,
    SlidersHorizontal, X
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- ১. ইউনিফাইড কাস্টম ড্রপডাউন (Theme & UI Optimized) ---
const CustomDropdown = ({ value, options, onChange, icon: Icon, label }: any) => {
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
        <div className="relative w-full md:w-auto" ref={dropdownRef}>
            {label && <p className="text-[9px] font-black text-[var(--text-muted)] mb-2 uppercase tracking-widest pl-1">{label}</p>}
            <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[20px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95 whitespace-nowrap"
            >
                {Icon && <Icon size={18} className="shrink-0" />}
                <span className="truncate">{value === 'all' || value === 'All' ? 'VIEW ALL' : value.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-[300] left-0 right-0 md:left-auto md:right-0 top-16 w-full md:w-48 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden py-1.5"
                    >
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onChange(opt.toLowerCase()); setIsOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 hover:text-orange-500 transition-colors flex items-center justify-between ${value.toLowerCase() === opt.toLowerCase() ? 'text-orange-500 bg-orange-500/5' : 'text-[var(--text-muted)]'}`}
                            >
                                {opt}
                                {value.toLowerCase() === opt.toLowerCase() && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const BookDetails = ({ 
    currentBook, items, onBack, onAdd, onEdit, onDelete, onToggleStatus, 
    onEditBook, onDeleteBook, searchQuery, setSearchQuery, pagination,
    currentUser, onOpenAnalytics, onOpenExport, 
    stats = { balance: 0, inflow: 0, outflow: 0 } 
}: any) => {
    
    if (!currentBook) return null;

    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- Filtering & Precision Sorting (Date + CreatedAt) ---
    // --- Filtering & Robust Sorting ---
    let processedItems = [...items].filter(i => (i.title || "").toLowerCase().includes(searchQuery.toLowerCase()));
    
    // 🔥 ক্যাটাগরি ফিল্টার ফিক্স (all হলে ফিল্টার করবে না)
    if (categoryFilter.toLowerCase() !== 'all') {
        processedItems = processedItems.filter(item => (item.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }

    processedItems.sort((a, b) => {
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
        
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentItems = processedItems.slice((pagination.currentPage - 1) * 10, pagination.currentPage * 10);

    return (
        <div className="w-full pb-32" onClick={() => { setShowSortMenu(false); setShowMobileSettings(false); }}>
            
           {/* ২. স্ট্যাটাস বার (Real-time Stats) */}
            <div className="px-4 md:px-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[var(--bg-card)] p-7 rounded-[32px] border border-[var(--border-color)] border-l-4 border-l-blue-500 flex justify-between items-center shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[3px]">Vault Balance</p>
                            <h3 className={`text-3xl md:text-4xl font-mono-finance font-bold mt-2 ${stats.balance >= 0 ? 'text-[var(--text-main)]' : 'text-red-500'}`}>
                                {stats.balance < 0 ? '-' : '+'}{currencySymbol}{Math.abs(stats.balance).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-3xl text-blue-500 md:hidden"><Wallet size={32} /></div>
                    </div>
                    <div className="hidden md:block bg-[var(--bg-card)] p-7 rounded-[32px] border border-[var(--border-color)] border-l-4 border-l-green-500 shadow-sm">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-[3px]">Total Inflow</p>
                        <h3 className="text-3xl font-mono-finance font-bold mt-2 text-[var(--text-main)]">+{currencySymbol}{stats.inflow.toLocaleString()}</h3>
                    </div>
                    <div className="hidden md:block bg-[var(--bg-card)] p-7 rounded-[32px] border border-[var(--border-color)] border-l-4 border-l-red-500 shadow-sm">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[3px]">Total Outflow</p>
                        <h3 className="text-3xl font-mono-finance font-bold mt-2 text-[var(--text-main)]">-{currencySymbol}{stats.outflow.toLocaleString()}</h3>
                    </div>
                </div>

                {/* ৩. রেসপন্সিভ টুলবার */}
                <div className="flex gap-3 items-center w-full relative z-[50]">
                    <div className="relative flex-1 group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none group-focus-within:text-orange-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            value={searchQuery}
                            onChange={e => {setSearchQuery(e.target.value); pagination.setPage(1);}}
                            placeholder="SEARCH PROTOCOL RECORDS..." 
                            className="w-full pl-14 pr-6 py-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[22px] text-xs font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 text-[var(--text-main)] shadow-sm transition-all"
                        />
                    </div>

                    {/* ডেস্কটপ বাটনসমূহ */}
                    <div className="hidden xl:flex gap-3">
                        <CustomDropdown value={categoryFilter} options={userCategories} onChange={setCategoryFilter} icon={LayoutGrid} />
                        
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }} className="relative w-full flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[22px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95">
                                <ArrowUpDown size={18} className="shrink-0" /> <span>SORT</span>
                            </button>
                            <AnimatePresence>
                                {showSortMenu && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-16 w-44 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl shadow-2xl z-[150] p-1.5 overflow-hidden">
                                        {['date', 'amount', 'title'].map(key => (
                                            <button key={key} onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-orange-500/10 hover:text-orange-500 transition-colors rounded-lg">
                                                {key.toUpperCase()} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={onOpenAnalytics} className="relative flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[22px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95">
                            <BarChart3 size={18} className="shrink-0" /> <span>STATS</span>
                        </button>
                        <button onClick={onOpenExport} className="relative flex cursor-pointer items-center justify-center gap-3 px-6 py-4 rounded-[22px] border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] text-[11px] font-black uppercase tracking-widest hover:border-green-500 hover:text-green-500 transition-all active:scale-95">
                            <Download size={18} className="shrink-0" /> <span>EXPORT</span>
                        </button>
                    </div>

                    {/* মোবাইল মেনু */}
                    <div className="xl:hidden relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowMobileSettings(!showMobileSettings); }} className="p-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[20px] text-[var(--text-muted)] hover:border-orange-500 transition-all shadow-sm">
                            <SlidersHorizontal size={20} />
                        </button>
                        <AnimatePresence>
                            {showMobileSettings && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-16 w-64 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[32px] shadow-2xl z-[200] p-6 space-y-6">
                                    <CustomDropdown label="Sort Protocol" value={sortConfig.key} options={['date', 'amount', 'title']} onChange={(val:any) => setSortConfig({...sortConfig, key: val})} icon={ArrowUpDown} />
                                    <CustomDropdown label="Filter View" value={categoryFilter} options={userCategories} onChange={setCategoryFilter} icon={LayoutGrid} />
                                    <div className="border-t border-[var(--border-color)] pt-5 flex gap-4">
                                        <button onClick={() => {onOpenAnalytics(); setShowMobileSettings(false);}} className="flex-1 aspect-square rounded-2xl border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] active:bg-orange-500 active:text-white transition-all"><BarChart3 size={24}/></button>
                                        <button onClick={() => {onOpenExport(); setShowMobileSettings(false);}} className="flex-1 aspect-square rounded-2xl border-2 border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] active:bg-green-500 active:text-white transition-all"><Download size={24}/></button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ৪. ডেটা টেবিল (Polished UX) */}
                <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-sm min-h-[550px] relative transition-all">
                    
                    <div className="hidden xl:block overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-[var(--bg-app)]/50 border-b border-[var(--border-color)] sticky top-0 z-10 backdrop-blur-md">
                                <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">
                                    <th className="py-6 px-6 w-14 text-center">#</th>
                                    <th className="py-6 px-4 w-32">Date</th>
                                    <th className="py-6 px-4 w-24">Time</th>
                                    <th className="py-6 px-4 w-48">Description</th>
                                    <th className="py-6 px-4">Note / Memo</th>
                                    <th className="py-6 px-4 w-32">Category</th>
                                    <th className="py-6 px-4 w-24 text-center">Via</th>
                                    <th className="py-6 px-4 w-40 text-right">Amount</th>
                                    <th className="py-6 px-4 w-28 text-center">Status</th>
                                    <th className="py-6 px-6 w-28 text-right">Option</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {currentItems.map((e: any, i: number) => (
                                    <tr key={e.localId || e._id} className="hover:bg-[var(--bg-app)]/80 transition-all group">
                                        <td className="py-6 px-6 text-center text-xs font-bold text-[var(--text-muted)] opacity-30">
                                            {(pagination.currentPage - 1) * 10 + i + 1}
                                        </td>
                                        <td className="py-6 px-4 text-sm font-bold text-[var(--text-muted)] font-mono">
                                            {new Date(e.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-6 px-4 text-xs font-bold text-[var(--text-muted)] font-mono opacity-60">
                                            {e.time || "--:--"}
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight truncate max-w-[180px]" title={e.title}>{e.title}</div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="text-[11px] text-[var(--text-muted)] font-medium italic opacity-60 truncate max-w-[250px]" title={e.note}>{e.note ? `"${e.note}"` : "---"}</div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="px-3 py-1.5 rounded-lg bg-orange-500/5 text-orange-500 text-[9px] font-black uppercase border border-orange-500/10 tracking-widest">{e.category}</span>
                                        </td>
                                        <td className="py-6 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase opacity-70">{e.paymentMethod}</td>
                                        <td className={`py-6 px-4 text-right font-mono-finance font-bold text-lg ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <button 
                                                onClick={() => onToggleStatus(e)} 
                                                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all 
                                                ${String(e.status).toLowerCase() === 'completed' 
                                                    ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]'}`}
                                            >
                                                {e.status || 'pending'}
                                            </button>
                                        </td>
                                        <td className="py-6 px-6 text-right">
                                            <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button onClick={() => onEdit(e)} className="p-2 text-blue-500 bg-blue-500/5 rounded-xl border border-blue-500/10 hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={14}/></button>
                                                <button onClick={() => onDelete(e)} className="p-2 text-red-500 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* মোবাইল কার্ড ভিউ */}
                    <div className="xl:hidden p-4 space-y-4">
                        {currentItems.map((e: any) => (
                             <div key={e.localId || e._id} className="app-card p-6 flex flex-col gap-4 border-[var(--border-color)] active:scale-[0.98] transition-transform">
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0 flex-1 pr-4">
                                        <h4 className="text-base font-black uppercase text-[var(--text-main)] tracking-tight truncate">{e.title}</h4>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 flex flex-wrap gap-2 items-center">
                                            <span className="font-mono">{new Date(e.date).toLocaleDateString()}</span>
                                            {e.time && <span>• {e.time}</span>}
                                            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)]">{e.category}</span>
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-xl font-mono-finance font-bold ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {e.note && <p className="text-[11px] text-[var(--text-muted)] italic opacity-60 line-clamp-1">"{e.note}"</p>}
                                <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                                    <button onClick={() => onToggleStatus(e)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${String(e.status).toLowerCase() === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                        {e.status || 'pending'}
                                    </button>
                                    <div className="flex gap-5">
                                        <Edit2 size={20} className="text-blue-500 cursor-pointer active:scale-90 transition-transform" onClick={() => onEdit(e)} />
                                        <Trash2 size={20} className="text-red-500 cursor-pointer active:scale-90 transition-transform" onClick={() => onDelete(e)} />
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>

                {/* ৫. স্মার্ট পেজিনেশন */}
                <div className="flex justify-between items-center py-4 px-2">
                    <p className="text-[11px] font-black text-[var(--text-muted)] uppercase hidden md:block tracking-widest">Protocol Archive</p>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end items-center">
                        <button disabled={pagination.currentPage === 1} onClick={() => pagination.setPage(pagination.currentPage - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronLeft size={20}/></button>
                        <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{pagination.currentPage} / {pagination.totalPages}</div>
                        <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setPage(pagination.currentPage + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};