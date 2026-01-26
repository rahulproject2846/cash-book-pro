"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, BarChart3, Edit2, Trash2, ChevronLeft, ChevronRight, 
    ArrowLeft, Plus, LayoutGrid, ListFilter, CheckCircle, Clock, 
    Calendar, Download, SlidersHorizontal, ArrowUpDown, FileText
} from 'lucide-react';
import { ExportTools } from '@/components/ExportTools';
import { AnalyticsChart } from '@/components/AnalyticsChart';

export const BookDetails = ({ 
    currentBook, items, onBack, onAdd, onEdit, onDelete, onToggleStatus, 
    onEditBook, // <--- এটি আছে কিনা চেক করুন
    onDeleteBook, searchQuery, setSearchQuery, pagination, showChart, setShowChart 
}: any) => {
    
    // ১. Persistent States
    const [viewMode, setViewMode] = useState('table'); 
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [activeTool, setActiveTool] = useState<'none' | 'sort' | 'export'>('none');

    useEffect(() => {
        const savedView = localStorage.getItem(`viewMode_${currentBook._id}`);
        if (savedView) setViewMode(savedView);
    }, [currentBook._id]);

    const handleViewToggle = () => {
        const newMode = viewMode === 'table' ? 'list' : 'table';
        setViewMode(newMode);
        localStorage.setItem(`viewMode_${currentBook._id}`, newMode);
    };

    // ২. Sorting & Filtering Logic
    const sortedItems = [...items].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentItems = sortedItems.slice((pagination.currentPage - 1) * 10, pagination.currentPage * 10);

    const totalIn = items.filter((e: any) => e.type === 'income' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const totalOut = items.filter((e: any) => e.type === 'expense' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);

    return (
        <div className="space-y-6 anim-fade-up pb-10">
            
            {/* --- ১. IDENTITY HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={onBack} 
                        className="p-4 app-card rounded-2xl text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all shadow-sm active:scale-90"
                    >
                        <ArrowLeft size={24} strokeWidth={3}/>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                                {currentBook.name}
                            </h1>
                            <div className="flex gap-1 translate-y-1">
                                {/* FIX: Updated Edit Button logic */}
                                <button 
    onClick={(e) => { 
        e.preventDefault();
        e.stopPropagation(); 
        onEditBook(); // এই ফাংশনটি এখন কাজ করবে
    }} 
    className="p-2 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
>
    <Edit2 size={18}/>
</button>
                                <button onClick={onDeleteBook} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[4px] mt-2 italic flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                             {currentBook.description || "Digital Financial Ledger"}
                        </p>
                    </div>
                </div>
                <button onClick={onAdd} className="app-btn app-btn-primary px-10 py-5 shadow-orange-500/20 w-full md:w-auto">
                    <Plus size={20} strokeWidth={3} /> <span className="tracking-[2px]">New Entry</span>
                </button>
            </div>

            {/* --- ২. STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="app-card p-6 border-l-4 border-green-500 bg-green-500/[0.02]">
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest italic font-bold">Book Inflow</p>
                    <h3 className="text-3xl font-mono-finance font-bold mt-1 text-[var(--text-main)]">+{totalIn.toLocaleString()}</h3>
                </div>
                <div className="app-card p-6 border-l-4 border-red-500 bg-red-500/[0.02]">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic font-bold">Book Outflow</p>
                    <h3 className="text-3xl font-mono-finance font-bold mt-1 text-[var(--text-main)]">-{totalOut.toLocaleString()}</h3>
                </div>
                <div className="app-card p-6 border-l-4 border-blue-500 bg-blue-500/[0.02]">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic font-bold">Net Balance</p>
                    <h3 className={`text-3xl font-mono-finance font-bold mt-1 ${totalIn - totalOut >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {(totalIn - totalOut).toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* --- ৩. COMPACT TOOLBAR --- */}
            <div className="app-card p-4 flex flex-col xl:flex-row gap-4 items-center justify-between bg-[var(--bg-app)]/40 shadow-sm border-[var(--border)]">
                {/* Search Bar */}
                <div className="relative w-full xl:max-w-lg">
                    <input 
                        value={searchQuery} 
                        placeholder="FILTER BY TITLE..." 
                        className="app-input pr-12 pl-5 py-4 text-[11px] font-black tracking-widest uppercase" 
                        onChange={e => {setSearchQuery(e.target.value); pagination.setPage(1);}} 
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                </div>
                
                {/* Control Buttons Group */}
                <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                    
                    {/* Sort Button */}
                    <div className="flex items-center bg-[var(--bg-app)] p-1 rounded-2xl border border-[var(--border)]">
                        <button 
                            onClick={() => setActiveTool(activeTool === 'sort' ? 'none' : 'sort')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeTool === 'sort' ? 'bg-orange-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                        >
                            <SlidersHorizontal size={16}/>
                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Sort</span>
                        </button>
                    </div>

                    {/* View Toggle Button */}
                    <div className="flex items-center bg-[var(--bg-app)] p-1 rounded-2xl border border-[var(--border)]">
                        <button 
                            onClick={handleViewToggle}
                            className="flex items-center gap-2 px-3 py-2 text-[var(--text-muted)] hover:text-orange-500 transition-all"
                        >
                            {viewMode === 'table' ? <LayoutGrid size={16}/> : <ListFilter size={16}/>}
                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">View</span>
                        </button>
                    </div>

                    {/* Analytics Button */}
                    <div className="flex items-center bg-[var(--bg-app)] p-1 rounded-2xl border border-[var(--border)]">
                        <button 
                            onClick={() => setShowChart(!showChart)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${showChart ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-blue-500'}`}
                        >
                            <BarChart3 size={16}/>
                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Analytics</span>
                        </button>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-center bg-[var(--bg-app)] p-1 rounded-2xl border border-[var(--border)]">
                        <button 
                            onClick={() => setActiveTool(activeTool === 'export' ? 'none' : 'export')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeTool === 'export' ? 'bg-red-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-red-500'}`}
                        >
                            <Download size={16}/>
                            <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ৪. TOOLBAR SUB-MENUS --- */}
            <AnimatePresence>
                {activeTool === 'sort' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="app-card p-4 flex gap-2 bg-[var(--bg-card)]/50 border-orange-500/20">
                            {['date', 'title', 'amount'].map((key) => (
                                <button 
                                    key={key}
                                    onClick={() => setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${sortConfig.key === key ? 'bg-orange-500 text-white border-orange-500' : 'border-[var(--border)] text-slate-400'}`}
                                >
                                    {key} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTool === 'export' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="app-card p-4 flex gap-4 bg-[var(--bg-card)]/50 border-red-500/20">
                            <ExportTools entries={items} bookName={currentBook.name} />
                        </div>
                    </motion.div>
                )}

                {showChart && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="app-card p-8 border-blue-500/20 bg-blue-500/[0.02]">
                             <AnalyticsChart entries={items} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- ৫. MAIN DATA AREA (FIXED RESPONSIVE LOGIC) --- */}
            <div className="app-card overflow-hidden min-h-[400px]">
                
                {/* A. TABLE VIEW: Hidden on Mobile, Visible on Desktop if viewMode is 'table' */}
                <div className={`hidden ${viewMode === 'table' ? 'md:block' : ''} overflow-x-auto no-scrollbar`}>
                    <table className="finance-table w-full text-left">
                        <thead>
                            <tr>
                                <th className="w-16 text-center">#</th>
                                <th className="w-32">Date</th>
                                <th>Transaction Detail</th>
                                <th>Category</th>
                                <th>Method</th>
                                <th className="text-right pr-4">Amount</th>
                                <th className="text-center">Status</th>
                                <th className="text-right pr-10">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {currentItems.map((e: any, i: number) => (
                                <tr key={e._id} className="hover:bg-[var(--accent-soft)] group transition-all">
                                    <td className="p-5 text-center text-[10px] font-black text-[var(--text-muted)] opacity-30">
                                        {(pagination.currentPage-1)*10 + i + 1}
                                    </td>
                                    <td className="p-5 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                        {new Date(e.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-5">
                                        <div className="font-black text-sm uppercase italic text-[var(--text-main)] tracking-tight group-hover:text-orange-500 transition-colors">{e.title}</div>
                                        {e.note && <div className="text-[10px] text-[var(--text-muted)] font-bold italic line-clamp-1 mt-1 opacity-60">“{e.note}”</div>}
                                    </td>
                                    <td className="p-5"><span className="px-2.5 py-1 bg-orange-500/5 text-orange-500 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-500/10">{e.category}</span></td>
                                    <td className="p-5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-80">{e.paymentMethod}</td>
                                    <td className={`p-5 text-right font-mono-finance font-bold text-base ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                    </td>
                                    <td className="p-5 text-center">
                                        <button onClick={() => onToggleStatus(e)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${e.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-sm shadow-green-500/10' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-sm shadow-yellow-500/10'}`}>{e.status}</button>
                                    </td>
                                    <td className="p-5 text-right pr-10">
                                        <div className="flex justify-end gap-2.5">
                                            <button onClick={() => onEdit(e)} className="p-2.5 text-blue-500 bg-blue-500/5 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"><Edit2 size={14}/></button>
                                            <button onClick={() => onDelete(e)} className="p-2.5 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* B. GRID/LIST VIEW: Visible on Mobile always, Visible on Desktop if viewMode is 'list' */}
                <div className={`${viewMode === 'list' ? 'grid' : 'grid md:hidden'} grid-cols-1 md:grid-cols-2 p-5 gap-4`}>
                    {currentItems.map((e: any, i: number) => (
                        <div key={e._id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-app)]/50 space-y-4 hover:border-orange-500/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <span className="text-[10px] font-black text-slate-300 mt-1">#{(pagination.currentPage-1)*10 + i + 1}</span>
                                    <div>
                                        <h4 className="font-black text-sm uppercase italic text-[var(--text-main)] leading-none">{e.title}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(e.date).toLocaleDateString()} • {e.paymentMethod}</p>
                                    </div>
                                </div>
                                <div className={`text-right font-mono-finance font-bold text-lg ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-[9px] font-black rounded uppercase">{e.category}</span>
                                <div className="flex gap-1.5 border-l border-[var(--border)] pl-3">
                                    <button onClick={() => onEdit(e)} className="p-2 text-blue-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Edit2 size={14}/></button>
                                    <button onClick={() => onDelete(e)} className="p-2 text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- ৬. FLOATING PLUS (Mobile FAB) --- */}
            <motion.button 
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onAdd} 
                className="fixed bottom-24 md:bottom-10 right-8 w-16 h-16 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-orange-500/40 z-50 border-4 border-white/10"
            >
                <Plus size={32} strokeWidth={3} />
            </motion.button>

            {/* --- ৭. PAGINATION BAR --- */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4">
                    <button disabled={pagination.currentPage === 1} onClick={() => pagination.setPage(pagination.currentPage - 1)} className="p-3 app-card rounded-xl disabled:opacity-20 text-[var(--text-dim)]"><ChevronLeft size={18}/></button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(num => (
                        <button key={num} onClick={() => pagination.setPage(num)} className={`w-11 h-11 rounded-xl font-black text-[11px] transition-all border ${pagination.currentPage === num ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/50'}`}>{num}</button>
                    ))}
                    <button disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.setPage(pagination.currentPage + 1)} className="p-3 app-card rounded-xl disabled:opacity-20 text-[var(--text-dim)]"><ChevronRight size={18}/></button>
                </div>
            )}
        </div>
    );
};