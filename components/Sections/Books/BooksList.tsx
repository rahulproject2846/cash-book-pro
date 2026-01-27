// src/components/Sections/Books/BooksList.tsx (Full Code with Final Fixes)
"use client";
import React from 'react';
import { Plus, BookOpen, Loader2, MoreHorizontal, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Component
const BookListItem = ({ book, onClick, balance }: any) => (
    <motion.div 
        key={book._id} 
        onClick={onClick} 
        className="app-card p-5 rounded-2xl border border-[var(--border)] cursor-pointer relative group transition-all duration-300 hover:shadow-xl hover:border-orange-500/30 hover:-translate-y-1 h-40 flex flex-col justify-between overflow-hidden"
    >
        <div className="flex justify-between items-start z-10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm">
                <BookOpen size={20} />
            </div>
            <button className="text-[var(--text-muted)] hover:text-orange-500 p-1"><MoreHorizontal size={20} /></button>
        </div>

        <div className="z-10 mt-2">
            <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-tight group-hover:text-orange-500 transition-colors truncate">
                {book.name}
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider line-clamp-1">
                {book.description || "Digital Ledger Active"}
            </p>
        </div>

        {/* NEW: Net Balance and View Action */}
        <div className="flex justify-between items-center z-10 pt-3 border-t border-[var(--border)] mt-2">
            <div className={`text-sm font-black font-finance ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                <span>OPEN VAULT</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
        <div className="absolute bottom-0 left-0 h-[3px] bg-orange-500 w-full transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
    </motion.div>
);

export const BooksList = ({ books, isLoading, onAddClick, onBookClick }: any) => {
    // Note: Book List now needs balance data to be passed (we will fix this in BooksSection)
    
    if (isLoading) return <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-orange-500 mb-4" size={32} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Data...</span></div>;

    if (books.length === 0) return (
        <div className="app-card p-20 flex flex-col items-center text-center border-2 border-dashed border-[var(--border-color)]">
            <BookOpen size={48} className="text-orange-500/50 mb-4" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">No Ledgers Created</h3>
            <button onClick={onAddClick} className="text-orange-500 font-black uppercase text-[10px] mt-4 tracking-widest underline underline-offset-4">Create your first one</button>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {books.map((b: any) => (
                // Temporarily setting balance to 0 until we calculate it in BooksSection
                <BookListItem key={b._id} book={b} onClick={onBookClick} balance={0} />
            ))}
            
            {/* FIX: Add Ledger Card (Height Fixed to match other cards) */}
            <div onClick={onAddClick} className="app-card border-2 border-dashed border-orange-500/30 flex flex-col items-center justify-center text-orange-500 cursor-pointer h-40 transition-all hover:bg-orange-500/5 active:scale-98">
                <Plus size={36} className="mb-2" strokeWidth={3} />
                <span className="text-sm font-black uppercase tracking-widest">ADD NEW LEDGER</span>
            </div>
        </div>
    );
};