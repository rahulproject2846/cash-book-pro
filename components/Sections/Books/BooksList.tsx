"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, BookOpen, Loader2, Layout, Search, FileUp, 
    ArrowUpRight, ArrowDownUp, Zap, Check, Wallet, Clock, X,ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
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
    if (interval > 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' বছর আগে' : 'Y AGO');
    interval = seconds / 2592000;
    if (interval > 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' মাস আগে' : 'MO AGO');
    interval = seconds / 86400;
    if (interval > 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' দিন আগে' : 'D AGO');
    interval = seconds / 3600;
    if (interval > 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' ঘণ্টা আগে' : 'H AGO');
    interval = seconds / 60;
    if (interval > 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' মিনিট আগে' : 'M AGO');
    return lang === 'bn' ? 'এখনই' : 'JUST NOW';
};

// --- 🔘 COMPONENT: SORT DROPDOWN (DetailsToolbar Style) ---
const SortDropdown = ({ current, options, onChange }: any) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handler = (e: any) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`h-11 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isOpen ? 'border-orange-500 shadow-lg ring-4 ring-orange-500/5' : 'hover:border-orange-500/30'}`}
            >
                <ArrowDownUp size={16} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-100'} />
                {/* ডেক্সটপে টেক্সট দেখাবে, মোবাইলে হাইড থাকবে */}
                <span className="hidden lg:block text-[var(--text-main)] truncate max-w-[100px]">
                    {current}
                </span>
                <ChevronDown size={12} className={`hidden lg:block  opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                        className="absolute right-0 mt-3 w-52 bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl"
                    >
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'text-orange-500 bg-orange-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                    >
                                        {opt} {isSelected && <Check size={14} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- 🏷️ COMPONENT: HUB HEADER (Point 1 & 2 Fully Balanced) ---
const HubHeader = ({ title, count, searchQuery, onSearchChange, sortOption, onSortChange, onImportClick }: any) => {
    const { T, t, language } = useTranslation();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    return (
        <div className="sticky top-[4.5rem] md:top-20 sm:top-5 mt-4 md:px-8 lg:px-10 z-[300] bg-[var(--bg-app)]/80 backdrop-blur-xl px-1 py-4 mb-4 border-b border-transparent hover:border-[var(--border)] transition-all duration-500">
            <div className="flex items-center justify-between gap-3 h-12 relative w-full">
                
                {/* ১. লেফট সাইড: আইডেন্টিটি */}
                <motion.div 
                    initial={false}
                    animate={{ 
                        opacity: isSearchExpanded ? 0 : 1,
                        display: isSearchExpanded ? 'none' : 'flex' 
                    }}
                    transition={{ duration: 0.1 }}
                    className="items-center gap-4 min-w-0"
                >
                    <div className="hidden md:flex w-12 h-12 bg-orange-500 rounded-[20px] items-center justify-center text-white shadow-lg shrink-0">
                        <Layout size={24} strokeWidth={2.5} />
                    </div>
                    <div className="truncate">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-[var(--text-main)] leading-none">{title}</h2>
                        <p className="text-[8px] md:text-[9px] font-black text-orange-500 uppercase tracking-[2px] mt-1">
                            {toBn(count, language)} {T('active_protocols')}
                        </p>
                    </div>
                </motion.div>

                {/* ২. রাইট সাইড: কমান্ড এরিয়া */}
                <div className={`flex items-center gap-2 ${isSearchExpanded ? 'flex-1' : 'flex-1 justify-end'}`}>
                    
                    {/* ডেক্সটপ সার্চ (টুলবার স্টাইলে বাটনগুলোর পাশে রাখা হয়েছে) */}
                    <div className="hidden md:block relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                        <input 
                            placeholder={t('search_placeholder')} value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full h-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] pl-12 pr-4 text-[10px] font-bold uppercase outline-none focus:border-orange-500/40 shadow-inner text-[var(--text-main)] placeholder:opacity-20"
                        />
                    </div>

                    {/* মোবাইল এক্সপ্যান্ডেবল সার্চ */}
                    <AnimatePresence>
                        {isSearchExpanded && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0 }} 
                                animate={{ width: "100%", opacity: 1 }} 
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
                                className="md:hidden relative flex-1"
                            >
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                <input 
                                    autoFocus
                                    placeholder={t('search_placeholder')} value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full h-12 bg-[var(--bg-card)] border border-orange-500/40 rounded-[22px] pl-12 pr-12 text-[11px] font-bold uppercase outline-none shadow-2xl text-[var(--text-main)]"
                                />
                                <button onClick={() => { setIsSearchExpanded(false); onSearchChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--bg-app)] rounded-full text-red-500 active:scale-90">
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ৩. বাটন গ্রুপ */}
                    <div className={`flex items-center gap-2 shrink-0 ${isSearchExpanded && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
                        {/* মোবাইল সার্চ বাটন */}
                        <button 
                            onClick={() => setIsSearchExpanded(true)}
                            className="md:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 active:scale-90"
                        >
                            <Search size={20} strokeWidth={2.5} />
                        </button>

                        <SortDropdown current={sortOption} options={[t('sort_activity'), t('sort_name'), t('sort_balance_high'), t('sort_balance_low')]} onChange={onSortChange} />
                        
                        <button onClick={onImportClick} className="h-11 w-11 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-green-500 transition-all active:scale-90 shadow-sm">
                            <FileUp size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 📦 COMPONENT: ELITE VAULT CARD (Meta Info Fix) ---
const BookListItem = ({ book, onClick, onQuickAdd, balance, currencySymbol, lang }: any) => {
    const { T } = useTranslation();
    const bookId = book._id || book.id || book.cid;
    const isPositive = balance >= 0;

    return (
        <motion.div layout whileHover={{ y: -5 }} className="group relative bg-[var(--bg-card)] rounded-[32px] p-6 border border-[var(--border)] cursor-pointer overflow-hidden flex flex-col h-[210px] md:h-[260px] transition-all duration-500" onClick={() => onClick(book)}>
            {/* Background Aura Icon */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} strokeWidth={1} className="text-orange-500" />
            </div>

            {/* Top Row: ID & Visual Icon */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] md:text-[9px] font-black text-green-500 uppercase tracking-tighter flex items-center gap-1.5">
                        <Zap size={11} fill="currentColor" strokeWidth={0} /> 
                        ID: {toBn(String(bookId).slice(-6).toUpperCase(), lang)}
                    </span>
                    <h3 className="text-sm md:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter truncate max-w-[130px] md:max-w-full group-hover:text-orange-500 transition-colors mt-0.5">
                        {book.name}
                    </h3>
                </div>
                <div className="w-8 h-8 md:w-14 md:h-14 rounded-[12px] md:rounded-[22px] bg-[var(--bg-card)]/60 border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-orange-500/40 transition-all shadow-inner">
                    {book.image ? <img src={book.image} alt="V" className="w-full h-full object-cover" /> : <Wallet size={20} className="text-orange-500 opacity-40" />}
                </div>
            </div>

            {/* Middle: Asset Value */}
            <div className="mt-auto relative z-10">
                <p className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] mb-1 opacity-40">{T('net_asset')}</p>
                <div className={`text-xl md:text-3xl font-mono-finance font-bold tracking-tighter ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="text-xs md:text-base mr-1">{currencySymbol}</span>
                    {toBn(Math.abs(balance).toLocaleString(), lang)}
                </div>
            </div>

            {/* Footer: Update Sync */}
            <div className="mt-4 md:mt-6 md:px-8 lg:px-10 pt-4 border-t border-[var(--border)] flex justify-between items-center relative z-10">
                <div className="flex flex-col">
                    <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40 mb-0.5">{T('label_last_updated')}</span>
                    <span className="text-[8px] md:text-[10px] font-black text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={10} className="text-orange-500" /> 
                        {getTimeAgo(book.updatedAt, lang, T)}
                    </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onQuickAdd(book); }} className="w-9 h-9 md:w-11 md:h-11 bg-[var(--bg-app)] hover:bg-orange-500 border border-[var(--border)] hover:border-orange-500 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-sm">
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>
        </motion.div>
    );
};

// --- 🛰️ MASTER COMPONENT: BOOKS LIST ---
export const BooksList = ({ 
    books = [], isLoading, onAddClick, onBookClick, onQuickAdd, getBookBalance, 
    currencySymbol = "৳", searchQuery, onSearchChange, sortOption, onSortChange, onImportClick
}: any) => {
    const { T, language } = useTranslation();

    if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

    return (
        <div className="w-full">
            <HubHeader 
                title={T('ledger_hub')} count={books?.length || 0}
                searchQuery={searchQuery} onSearchChange={onSearchChange}
                sortOption={sortOption} onSortChange={onSortChange} onImportClick={onImportClick}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-4 md:px-8 lg:px-10">
                <AnimatePresence>
                    {(books.length === 0 || window.innerWidth >= 768) && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={onAddClick} className="h-[210px] md:h-[260px] rounded-[32px] border-2 border-dashed border-orange-500/20 hover:border-orange-500 flex flex-col items-center justify-center text-orange-500 cursor-pointer hover:bg-orange-500/5 transition-all group shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[22px] bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-lg">
                                <Plus size={36} strokeWidth={3.5} />
                            </div>
                            <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[4px] text-center px-4 leading-relaxed">{T('initialize_ledger')}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {books?.map((b: any) => (
                    <BookListItem key={b._id || b.id} book={b} onClick={onBookClick} onQuickAdd={onQuickAdd} balance={getBookBalance(b._id || b.id || b.cid)} currencySymbol={currencySymbol} lang={language} />
                ))}
            </div>
        </div>
    );
};