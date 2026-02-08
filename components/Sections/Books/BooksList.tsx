"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, BookOpen, Loader2, Layout, Search, FileUp, 
    ArrowUpRight, ArrowDownUp, Zap, Check, Wallet, Clock, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { toBn, getTimeAgo } from '@/lib/utils/helpers'; 

// --- 🔘 COMPONENT: SORT DROPDOWN ---

// --- 📦 COMPONENT: ELITE VAULT CARD ---
const BookListItem = ({ book, onClick, onQuickAdd, balance, currencySymbol, lang }: any) => {
    const { T } = useTranslation();
    const bookId = book._id || book.id || book.cid;
    const isPositive = balance >= 0;

    return (
        <motion.div layout whileHover={{ y: -5 }} className="group relative bg-[var(--bg-card)] rounded-[32px] p-6 border border-[var(--border)] cursor-pointer overflow-hidden flex flex-col h-[200px] md:h-[260px] transition-all duration-500" onClick={() => onClick(book)}>
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} strokeWidth={1} className="text-orange-500" />
            </div>

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

            <div className="mt-auto relative z-10">
                <p className="text-[7px] md:text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] mb-1 opacity-40">{T('net_asset')}</p>
                <div className={`text-xl md:text-3xl font-mono-finance font-bold tracking-tighter ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="text-xs md:text-base mr-1">{currencySymbol}</span>
                    {toBn(Math.abs(balance).toLocaleString(), lang)}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center relative z-10">
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
    const { T, language, t } = useTranslation();

    if (isLoading) return <div className="py-40 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

    return (
        <div className="w-full">
            
            

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 mt-4 md:px-8 lg:px-10">
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

                {books?.map((b: any) => (
                     <BookListItem 
        // 🔥 ফিক্স: _id এর বদলে localId অথবা reactKey ব্যবহার করুন যা সবসময় ইউনিক
        key={b.localId || b.reactKey || b._id} 
        book={b} 
        onClick={onBookClick} 
        onQuickAdd={onQuickAdd} 
        // ব্যালেন্স চেক করার সময়ও একই ইউনিক আইডি ব্যবহার করুন
        balance={getBookBalance(b.reactKey || b._id || b.localId)} 
        currencySymbol={currencySymbol} 
        lang={language} 
    />
                    ))}
            </div>
        </div>
    );
};