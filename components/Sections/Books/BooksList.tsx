"use client";
import React from 'react';
import { Plus, BookOpen, Loader2 } from 'lucide-react';
import { BookCard } from '@/components/BookCard';

export const BooksList = ({ books, isLoading, onAddClick, onBookClick }: any) => {
    if (isLoading) return <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-orange-500 mb-4" size={32} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Data...</span></div>;

    if (books.length === 0) return (
        <div className="app-card p-20 flex flex-col items-center text-center border-dashed">
            <BookOpen size={48} className="text-slate-200 mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No Ledgers Created</h3>
            <button onClick={onAddClick} className="text-orange-500 font-black uppercase text-[10px] mt-4 tracking-widest underline underline-offset-4">Create your first one</button>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
            {books.map((b: any) => (
                <BookCard key={b._id} book={b} onClick={() => onBookClick(b)} />
            ))}
            <div onClick={onAddClick} className="app-card border-dashed border-2 border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/50 cursor-pointer h-44 transition-all">
                <Plus size={32} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Ledger</span>
            </div>
        </div>
    );
};