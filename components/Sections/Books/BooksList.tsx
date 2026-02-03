"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, BookOpen, Loader2, ArrowUpRight, ArrowDownRight, 
    Layout, ShieldCheck, ArrowDownUp, Globe, Zap, Search, 
    FileUp, Check, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ১. টাইপ ডেফিনিশন (Strict Local-First Protocol) ---
interface Book {
    _id?: string;
    id?: number | string;
    cid?: string;
    name: string;
    description?: string;
    updatedAt?: string | Date;
    synced?: number;
    image?: string; // নতুন ইমেজ সাপোর্ট
}

interface BooksListProps {
    books: Book[];
    isLoading: boolean;
    onAddClick: () => void;
    onBookClick: (book: Book) => void;
    onQuickAdd: (book: Book) => void;
    getBookBalance: (bookId: string | number) => number;
    currencySymbol?: string;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    sortOption: string;
    onSortChange: (val: string) => void;
    onImportClick: () => void;
}

const getTimeAgo = (date?: string | Date) => {
    if (!date) return "JUST NOW";
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diff < 60) return "JUST NOW";
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
};

// --- ২. কাস্টম ড্রপডাউন (Elite Studio Style) ---
const SortDropdown = ({ current, options, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="h-10 w-10 md:h-11 md:w-11 md:w-auto md:px-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center gap-3 text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-95 shadow-lg"
            >
                <ArrowDownUp size={18} className={isOpen ? 'text-orange-500' : 'text-[var(--text-main)]'} />
                <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{current}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-[24px] p-2 z-[1000] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`w-full flex items-center justify-between px-5 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0
                                    ${current === opt ? 'bg-[var(--bg-card)] text-orange-500' : 'text-[#555] hover:bg-[var(--bg-app)] hover:text-orange-400'}`}
                            >
                                {opt}
                                {current === opt && <Check size={14} className="text-orange-500" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- ৩. বুক আইটেম কার্ড (Master UX) ---
const BookListItem = ({ book, onClick, onQuickAdd, balance, currencySymbol }: any) => {
    const bookId = book._id || book.id || book.cid;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            className="group relative bg-[var(--bg-card)] rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-[var(--border-color)] cursor-pointer hover:border-orange-500/30 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-auto min-h-[170px] md:h-[245px]"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] pointer-events-none transition-opacity">
                <BookOpen className="w-20 h-20 md:w-32 md:h-32 -rotate-12 text-orange-500" />
            </div>

            {/* Quick Add Button (+) - Triggers upgraded EntryModal */}
            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onQuickAdd(book); }}
                className="absolute right-3 md:right-6 bottom-[55px] md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 bg-orange-500 text-white rounded-xl md:rounded-2xl shadow-xl shadow-orange-500/30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex items-center justify-center border-[3px] md:border-4 border-[var(--bg-card)]"
            >
                <Plus className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
            </motion.button>

            {/* Top Row: Meta Info */}
            <div className="flex justify-between items-start" onClick={() => onClick(book)}>
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <div className="flex items-center gap-1 md:gap-2">
                        <span className="text-[8px] md:text-[9px] font-black text-green-500 flex items-center gap-1 uppercase tracking-tighter">
                            <Zap className="w-2.5 h-2.5" fill="currentColor" /> {getTimeAgo(book.updatedAt)}
                        </span>
                    </div>
                    <p className="text-[7px] md:text-[8px] font-bold text-[var(--text-muted)] opacity-70 uppercase tracking-[1px] md:tracking-[2px]">
                        ID: {String(bookId).slice(-6).toUpperCase()}
                    </p>
                </div>
                <div className="w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-2xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center text-orange-500 group-hover:text-white transition-all duration-500 overflow-hidden">
                    {book.image ? (
                        <img src={book.image} alt="book" className="w-full h-full object-cover" />
                    ) : (
                        <BookOpen className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                    )}
                </div>
            </div>

            {/* Middle Section: Title & Description */}
            <div className="mt-3 md:mt-4 flex-1" onClick={() => onClick(book)}>
                <h3 className="text-sm md:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-tight group-hover:text-orange-500 transition-colors truncate">
                    {book.name}
                </h3>
                <p className="text-[8px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1 opacity-50 line-clamp-1">
                    {book.description || "ACTIVE FINANCIAL PROTOCOL"}
                </p>
            </div>

            {/* Bottom Section: Asset Value */}
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-[var(--border-color)]/20 flex justify-between items-end" onClick={() => onClick(book)}>
                <div className="max-w-[60%]">
                    <p className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2px] mb-0.5 md:mb-1.5 opacity-40">Net Asset</p>
                    <div className={`text-sm md:text-2xl font-mono-finance font-bold tracking-tighter truncate ${balance >= 0 ? 'text-[var(--text-main)]' : 'text-red-500'}`}>
                        {currencySymbol}{Math.abs(balance).toLocaleString()}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 md:gap-1 opacity-70 scale-90 md:scale-100 origin-right">
                    <div className="flex items-center gap-0.5 md:gap-1 text-[8px] md:text-[9px] font-bold text-green-500"><ArrowUpRight className="w-2.5 h-2.5" /> <span>0.7K</span></div>
                    <div className="flex items-center gap-0.5 md:gap-1 text-[8px] md:text-[9px] font-bold text-red-500"><ArrowDownRight className="w-2.5 h-2.5" /> <span>0.0K</span></div>
                </div>
            </div>
        </motion.div>
    );
};

// --- ৪. মেইন লিস্ট কম্পোনেন্ট (Layout Orchestrator) ---
export const BooksList = ({ 
    books, isLoading, onAddClick, onBookClick, onQuickAdd, getBookBalance, 
    currencySymbol = "৳", searchQuery, onSearchChange, sortOption, onSortChange, onImportClick
}: BooksListProps) => {
    
    if (isLoading) return (
        <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)]">Synchronizing Protocols</span>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-10">
            {/* --- SLICK STUDIO HEADER --- */}
            <div className="bg-[var(--bg-card)] rounded-[24px] md:rounded-[32px] p-4 md:p-6 border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-xl">
                <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                        <Layout className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">Ledger Hub</h2>
                        <p className="text-[8px] md:text-[10px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 md:mt-2">{books.length} Active Protocol{books.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Search Field */}
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-orange-500 transition-colors" size={16} />
                        <input 
                            placeholder="SEARCH VAULTS..." 
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full h-10 md:h-11 border border-[var(--border-color)] rounded-xl py-2 pl-9 md:pl-12 pr-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest focus:border-orange-500/50 outline-none transition-all placeholder:text-[var(--text-muted)] bg-[var(--bg-app)] shadow-inner"
                        />
                    </div>

                    <SortDropdown current={sortOption} options={['Activity', 'Name (A-Z)', 'Balance (High)', 'Balance (Low)']} onChange={onSortChange} />

                    <button onClick={onImportClick} className="h-10 w-10 md:h-11 md:w-11 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90 shadow-lg">
                        <FileUp size={18} />
                    </button>
                </div>
            </div>

            {/* --- GRID AREA (2 Columns on Mobile) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Initialize Ledger Card - Triggers Upgraded BookModal */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddClick} 
                    className={`
                        ${books.length > 0 ? 'hidden md:flex' : 'flex'} 
                        h-auto min-h-[170px] md:h-[245px] rounded-[24px] md:rounded-[32px] border-2 border-dashed border-[var(--border-color)] 
                        flex-col items-center justify-center text-orange-500 cursor-pointer 
                        hover:bg-orange-500/5 hover:border-orange-500 transition-all group
                    `}
                >
                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[24px] bg-orange-500/10 flex items-center justify-center mb-2 md:mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-lg">
                        <Plus className="w-6 h-6 md:w-9 md:h-9" strokeWidth={3} />
                    </div>
                    <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[2px] md:tracking-[4px] text-center px-2">Initialize Ledger</span>
                    <ShieldCheck className="absolute bottom-4 opacity-10 hidden md:block" size={16} />
                </motion.div>

                {/* Books List Rendering */}
                <AnimatePresence mode="popLayout">
                    {books.map((b) => (
                        <BookListItem 
                            key={b._id || b.id || b.cid} 
                            book={b} 
                            onClick={onBookClick} 
                            onQuickAdd={onQuickAdd}
                            balance={getBookBalance ? getBookBalance(b._id || b.id || b.cid || "") : 0} 
                            currencySymbol={currencySymbol}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};