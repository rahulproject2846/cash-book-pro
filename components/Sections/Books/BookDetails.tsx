"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, BarChart3, Download, ArrowUpDown, LayoutGrid, 
    SlidersHorizontal, ChevronLeft, ChevronRight, X 
} from 'lucide-react';

// Sub-components
import { StatsGrid } from './StatsGrid';
import { TransactionTable } from './TransactionTable';
import { MobileTransactionCards } from './MobileTransactionCards';
import CustomSelect from '@/components/CustomSelect';

// 🔥 ১. সিগন্যাল ফাংশন (গ্লোবাল ইভেন্ট ট্রিগার)
const triggerModal = (type: string) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-vault-modal', { detail: type }));
    }
};

export const BookDetails = ({ 
    currentBook, items, onBack, onEdit, onDelete, onToggleStatus, 
    searchQuery, setSearchQuery, pagination, currentUser, stats
}: any) => {
    
    // 🔥 FIX: হুকগুলো সবার আগে কল করতে হবে (Return এর আগে)
    
    // --- ১. গ্লোবাল স্টেট ---
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ২. ফিল্টারিং এবং স্মার্ট সর্টিং ---
    // (নোট: items না থাকলে এরর এড়াতে ডিফল্ট অ্যারে ব্যবহার করা হয়েছে)
    let processedItems = [...(items || [])].filter(i => (i.title || "").toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (categoryFilter !== 'all') {
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

    const currentItems = processedItems.slice(((pagination?.currentPage || 1) - 1) * 10, (pagination?.currentPage || 1) * 10);

    // 🔥 FIX: হুক কল শেষ হওয়ার পর এখন আমরা চেক করব বই আছে কি না
    if (!currentBook) return null;

    return (
        <div className="w-full pb-32" onClick={() => { setShowSortMenu(false); setShowMobileSettings(false); }}>
            
            <div className="px-4 md:px-10 space-y-8">
                
                {/* ১. স্ট্যাটাস গ্রিড (StatsGrid) */}
                <StatsGrid 
                    income={stats?.inflow || 0} 
                    expense={stats?.outflow || 0} 
                    labelPrefix="Vault" 
                    currency={currentUser?.currency} 
                />

                {/* ২. রেসপন্সিভ টুলবার */}
                <div className="flex gap-3 items-center w-full relative z-[100]">
                    
                    {/* সার্চ বার */}
                    <div className="relative flex-1 group h-14">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors pointer-events-none">
                            <Search size={20} />
                        </div>
                        <input 
                            value={searchQuery}
                            onChange={e => {setSearchQuery(e.target.value); if(pagination?.setPage) pagination.setPage(1);}}
                            placeholder="FILTER..." 
                            aria-label="Filter transactions"
                            className="w-full h-full pl-14 pr-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-orange-500 text-[var(--text-main)] shadow-sm transition-all"
                        />
                    </div>

                    {/* ডেস্কটপ বাটন সেট */}
                    <div className="hidden xl:flex items-center gap-3">
                        
                        {/* ১. সর্ট বাটন */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); }} 
                                className={`flex items-center gap-3 px-6 h-14 rounded-2xl border-2 transition-all active:scale-95 font-black text-[11px] tracking-widest uppercase ${showSortMenu ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-card)] hover:border-orange-500 hover:text-orange-500'}`}
                            >
                                <ArrowUpDown size={18} /> <span>SORT</span>
                            </button>
                            <AnimatePresence>
                                {showSortMenu && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-16 w-44 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl shadow-2xl p-1.5 overflow-hidden z-[200]">
                                        {['date', 'amount', 'title'].map(key => (
                                            <button 
                                                key={key} 
                                                onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} 
                                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors ${sortConfig.key === key ? 'text-orange-500 bg-orange-500/5' : 'text-[var(--text-muted)] hover:bg-orange-500/10'}`}
                                            >
                                                {key} {sortConfig.key === key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ২. ক্যাটাগরি সিলেক্ট */}
                        <div className="min-w-[180px]">
                            <CustomSelect 
                                value={categoryFilter} 
                                options={userCategories} 
                                onChange={setCategoryFilter} 
                                icon={LayoutGrid} 
                            />
                        </div>

                        {/* ৩. স্ট্যাটস বাটন */}
                        <button 
                            onClick={() => triggerModal('analytics')} 
                            className="flex items-center gap-3 px-6 h-14 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] font-black text-[11px] tracking-widest uppercase hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95"
                        >
                            <BarChart3 size={18} /> <span>STATS</span>
                        </button>

                        {/* ৪. এক্সপোর্ট বাটন */}
                        <button 
                            onClick={() => triggerModal('export')} 
                            className="flex items-center gap-3 px-6 h-14 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] font-black text-[11px] tracking-widest uppercase hover:border-green-500 hover:text-green-500 transition-all active:scale-95"
                        >
                            <Download size={18} /> <span>EXPORT</span>
                        </button>
                    </div>

                    {/* মোবাইল সেটিংস বাটন */}
                    <div className="xl:hidden shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMobileSettings(!showMobileSettings); }} 
                            className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-90 ${showMobileSettings ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                            aria-label="Open filter menu"
                        >
                            <SlidersHorizontal size={22} />
                        </button>
                    </div>
                </div>

                {/* ৩. মোবাইল সেটিংস প্যানেল */}
                <AnimatePresence>
                    {showMobileSettings && (
                        <div className="fixed inset-0 z-[150] flex items-end justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileSettings(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md" />
                            <motion.div 
                                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                                className="bg-[var(--bg-card)] w-full max-w-lg rounded-t-[32px] border-t border-[var(--border-color)] shadow-2xl relative z-10 p-8 space-y-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-orange-500">Vault Configuration</h3>
                                    <button onClick={() => setShowMobileSettings(false)} className="p-2 bg-[var(--bg-app)] rounded-xl text-[var(--text-muted)]"><X size={20}/></button>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    <CustomSelect label="Filter View" value={categoryFilter} options={userCategories} onChange={setCategoryFilter} icon={LayoutGrid} />
                                    
                                    <button onClick={() => { setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }); setShowMobileSettings(false); }} className="w-full flex items-center justify-between px-6 h-16 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">
                                        <span>Toggle Sort Direction</span> <ArrowUpDown size={16} className={`text-orange-500 transition-transform ${sortConfig.direction === 'asc' ? '' : 'rotate-180'}`} />
                                    </button>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button 
                                            onClick={() => { triggerModal('analytics'); setShowMobileSettings(false); }} 
                                            className="h-20 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col items-center justify-center gap-2 text-orange-500 active:bg-orange-500 active:text-white transition-all"
                                        >
                                            <BarChart3 size={24}/><span className="text-[9px] font-black uppercase">Analysis</span>
                                        </button>
                                        <button 
                                            onClick={() => { triggerModal('export'); setShowMobileSettings(false); }} 
                                            className="h-20 rounded-2xl bg-green-500/5 border border-green-500/20 flex flex-col items-center justify-center gap-2 text-green-500 active:bg-green-500 active:text-white transition-all"
                                        >
                                            <Download size={24}/><span className="text-[9px] font-black uppercase">Export</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* ৪. ডেটা ভিউ (Table & Cards) */}
                <div className="bg-[var(--bg-card)] rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-sm min-h-[550px] relative">
                    <TransactionTable 
                        items={currentItems} 
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                        onToggleStatus={onToggleStatus} 
                        currencySymbol={currencySymbol} 
                    />
                    <MobileTransactionCards 
                        items={currentItems} 
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                        onToggleStatus={onToggleStatus} 
                        currencySymbol={currencySymbol} 
                    />
                    
                    {currentItems.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30 gap-4">
                            <LayoutGrid size={48} strokeWidth={1} />
                            <p className="font-black uppercase text-[10px] tracking-[4px]">No Protocol Records Found</p>
                        </div>
                    )}
                </div>

                {/* ৫. স্মার্ট পেজিনেশন */}
                <div className="flex justify-between items-center py-4 px-2">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase hidden md:block tracking-[3px]">Protocol Archive</p>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end items-center">
                        <button disabled={pagination?.currentPage === 1} onClick={() => pagination?.setPage(pagination.currentPage - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronLeft size={20}/></button>
                        <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{pagination?.currentPage} / {pagination?.totalPages}</div>
                        <button disabled={pagination?.currentPage === pagination?.totalPages} onClick={() => pagination?.setPage(pagination.currentPage + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};