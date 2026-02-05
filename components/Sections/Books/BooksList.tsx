"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, BookOpen, Loader2, Layout, Search, FileUp, 
    ArrowUpRight, ArrowDownUp, Zap, Check, Wallet, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBengaliNumber = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

// --- 🕒 HELPER: TRANSLATED TIME AGO ---
const getTimeAgo = (date: any, lang: string, T: any) => {
    if (!date) return lang === 'bn' ? 'এখনই' : 'JUST NOW';
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return toBengaliNumber(Math.floor(interval), lang) + (lang === 'bn' ? ' বছর আগে' : 'Y AGO');
    interval = seconds / 2592000;
    if (interval > 1) return toBengaliNumber(Math.floor(interval), lang) + (lang === 'bn' ? ' মাস আগে' : 'MO AGO');
    interval = seconds / 86400;
    if (interval > 1) return toBengaliNumber(Math.floor(interval), lang) + (lang === 'bn' ? ' দিন আগে' : 'D AGO');
    interval = seconds / 3600;
    if (interval > 1) return toBengaliNumber(Math.floor(interval), lang) + (lang === 'bn' ? ' ঘণ্টা আগে' : 'H AGO');
    interval = seconds / 60;
    if (interval > 1) return toBengaliNumber(Math.floor(interval), lang) + (lang === 'bn' ? ' মিনিট আগে' : 'M AGO');
    return lang === 'bn' ? 'এখনই' : 'JUST NOW';
};

// --- 🔘 COMPONENT: SORT DROPDOWN (Point 2 Re-added) ---
const SortDropdown = ({ current, options, onChange }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="h-11 w-11 flex items-center justify-center rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90">
                <ArrowDownUp size={18} strokeWidth={2.5} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-[24px] p-2 z-[1000] shadow-2xl backdrop-blur-2xl">
                        {options.map((opt: string) => (
                            <button key={opt} onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest mb-1 last:mb-0 ${current === opt ? 'bg-orange-500/10 text-orange-500' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}>
                                {opt} {current === opt && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- 📦 COMPONENT: ELITE VAULT CARD (Point 4 & 5 Fix) ---
const BookListItem = ({ book, onClick, onQuickAdd, balance, currencySymbol, lang }: any) => {
    const { T } = useTranslation();
    const bookId = book._id || book.id || book.cid;
    const isPositive = balance >= 0;

    return (
        <motion.div layout whileHover={{ y: -5 }} className="group relative bg-[var(--bg-card)] rounded-[32px] p-6 border border-[var(--border)] cursor-pointer overflow-hidden flex flex-col h-[200px] md:h-[260px] transition-all duration-500" onClick={() => onClick(book)}>
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} strokeWidth={1} className="text-orange-500" />
            </div>

            {/* Top Row: ID & Image (Point 4) */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-tighter flex items-center gap-1.5">
                        <Zap size={11} fill="currentColor" strokeWidth={0} /> 
                        ID: {String(bookId).slice(-6).toUpperCase()}
                    </span>
                    <h3 className="text-sm md:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter truncate max-w-[130px] md:max-w-full group-hover:text-orange-500 transition-colors mt-0.5">
                        {book.name}
                    </h3>
                </div>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-[18px] md:rounded-[22px] bg-[var(--bg-card)]/60 border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-orange-500/40 transition-all">
                    {book.image ? <img src={book.image} alt="V" className="w-full h-full object-cover" /> : <Wallet size={20} className="text-orange-500 opacity-40" />}
                </div>
            </div>

            {/* Middle: Net Assets (Point 5 Bengali Conversion) */}
            <div className="mt-auto relative z-10">
                <p className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] mb-1 opacity-40">{T('net_asset')}</p>
                <div className={`text-xl md:text-3xl font-mono-finance font-bold tracking-tighter ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="text-xs md:text-base mr-1">{currencySymbol}</span>
                    {toBengaliNumber(Math.abs(balance).toLocaleString(), lang)}
                </div>
            </div>

            {/* Footer: Dynamic Update Info (Point 5 Last Updated) */}
            <div className="mt-4 md:mt-6 pt-4 border-t border-[var(--border)] flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 mb-0.5">{T('label_last_updated') || 'LAST UPDATED'}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={10} className="text-orange-500" /> 
                        {getTimeAgo(book.updatedAt, lang, T)}
                    </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onQuickAdd(book); }} className="w-8 h-8 md:w-11 md:h-11 bg-[var(--bg-card)] hover:bg-orange-500 border border-[var(--border)] hover:border-orange-500 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-sm">
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>
        </motion.div>
    );
};

// --- 🛠️ COMPONENT: MASTER LIST (Points 1, 2, 3 Logic) ---
export const BooksList = ({ 
    books, isLoading, onAddClick, onBookClick, onQuickAdd, getBookBalance, 
    currencySymbol = "৳", searchQuery, onSearchChange, sortOption, onSortChange, onImportClick
}: any) => {
    const { T, t, language } = useTranslation();

    if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

    return (
        <div className="space-y-8">
            
            {/* --- POINT 1 & 2: ELITE BG-LESS HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-orange-500/20 shrink-0">
                        <Layout size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">{T('ledger_hub')}</h2>
                        <div className="flex items-center gap-2 mt-2.5">
                            <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-orange-500/20">{books.length} {T('active_protocols')}</span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-[3px]">VAULT V5.2</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Field (Expands to fill) */}
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-all opacity-40 group-focus-within:opacity-100" size={18} />
                        <input 
                            placeholder={t('search_placeholder')} value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full h-11 bg-transparent border border-[var(--border)] rounded-[22px] pl-12 pr-6 text-[11px] font-bold uppercase tracking-widest focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all placeholder:opacity-20 text-[var(--text-main)]"
                        />
                    </div>
                    
                    {/* Sort Tool (Point 2) */}
                    <SortDropdown 
                        current={sortOption} 
                        options={[t('sort_activity'), t('sort_name'), t('sort_balance_high'), t('sort_balance_low')]} 
                        onChange={onSortChange} 
                    />

                    <Tooltip text={t('tt_import_data')}>
                        <button onClick={onImportClick} className="h-11 w-11 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90"><FileUp size={20} /></button>
                    </Tooltip>
                </div>
            </div>

            {/* --- POINT 3: DYNAMIC GRID --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {/* Initialize Card (Mobile Logic: Hide if books exist) */}
                <AnimatePresence>
                    {(books.length === 0 || window.innerWidth >= 768) && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={onAddClick} className="h-[200px] md:h-[260px] rounded-[32px] border-2 border-dashed border-orange-500/20 hover:border-orange-500 flex flex-col items-center justify-center text-orange-500 cursor-pointer hover:bg-orange-500/5 transition-all group shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[22px] bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-lg">
                                <Plus size={36} strokeWidth={3.5} />
                            </div>
                            <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[4px] text-center px-4 leading-relaxed">{T('initialize_ledger')}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vault Render (Compact Layout) */}
                {books.map((b: any) => (
                    <BookListItem key={b._id || b.id} book={b} onClick={onBookClick} onQuickAdd={onQuickAdd} balance={getBookBalance(b._id || b.id || b.cid)} currencySymbol={currencySymbol} lang={language} />
                ))}
            </div>
        </div>
    );
};