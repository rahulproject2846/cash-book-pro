"use client";
import React from 'react';
import { Plus, BookOpen, Loader2, MoreHorizontal, ChevronRight, Layout, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// --- ১. একক লেজার কার্ড (Individual Book Card) ---
const BookListItem = ({ book, onClick, balance, currencySymbol }: any) => (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        onClick={() => onClick(book)} 
        className="app-card p-6 rounded-[32px] border border-[var(--border-color)] cursor-pointer relative group transition-all duration-300 hover:shadow-2xl hover:border-orange-500/30 h-[200px] flex flex-col justify-between overflow-hidden"
    >
        {/* Background Decor */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <BookOpen size={150} className="text-orange-500" />
        </div>

        <div className="flex justify-between items-start z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                <BookOpen size={24} />
            </div>
            <button className="text-[var(--text-muted)] hover:text-orange-500 p-2 transition-colors">
                <MoreHorizontal size={20} />
            </button>
        </div>

        <div className="z-10">
            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none group-hover:text-orange-500 transition-colors truncate">
                {book.name}
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[2px] opacity-60 line-clamp-1">
                {book.description || "SECURE FINANCIAL VAULT"}
            </p>
        </div>

        {/* ব্যালেন্স এবং অ্যাকশন সেকশন */}
        <div className="flex justify-between items-center z-10 pt-4 border-t border-[var(--border-color)] mt-2">
            <div>
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Net Balance</p>
                <div className={`text-lg font-mono-finance font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {balance >= 0 ? '+' : ''}{currencySymbol}{Math.abs(balance).toLocaleString()}
                </div>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/5 px-3 py-1.5 rounded-full border border-orange-500/10 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <span>OPEN VAULT</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
        
        {/* প্রগ্রেস বার ডেকোরেশন */}
        <div className="absolute bottom-0 left-0 h-[4px] bg-orange-500 w-0 group-hover:w-full transition-all duration-700 ease-in-out"></div>
    </motion.div>
);

// --- ২. মেইন লিস্ট কম্পোনেন্ট ---
export const BooksList = ({ books, isLoading, onAddClick, onBookClick, getBookBalance, currencySymbol }: any) => {
    
    // লোডিং স্টেট: প্রফেশনাল স্কেলিটন ফিল
    if (isLoading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Synchronizing Intelligence</span>
        </div>
    );

    // এম্পটি স্টেট: ইউজারকে উৎসাহিত করার জন্য সুন্দর মেসেজ (UX Recommendation)
    if (books.length === 0) return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="app-card p-16 flex flex-col items-center text-center border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-app)]/50"
        >
            <div className="w-20 h-20 bg-orange-500/10 rounded-[30px] flex items-center justify-center text-orange-500 mb-6">
                <Layout size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">Your Financial Vault is Empty</h3>
            <p className="text-[11px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest max-w-sm leading-relaxed">
                Start your secure financial journey by initializing your first digital ledger.
            </p>
            <button 
                onClick={onAddClick} 
                className="app-btn-primary px-10 py-4 mt-8 shadow-2xl shadow-orange-500/20 active:scale-95 transition-all"
            >
                <Plus size={20} strokeWidth={3} /> INITIALIZE FIRST VAULT
            </button>
        </motion.div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* ১. নতুন লেজার তৈরির কার্ড (সবার আগে থাকবে) */}
            <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAddClick} 
                className="app-card border-2 border-dashed border-orange-500/30 flex flex-col items-center justify-center text-orange-500 cursor-pointer h-[200px] transition-all hover:bg-orange-500/5 hover:border-orange-500 group relative"
            >
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                    <Plus size={36} strokeWidth={3} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[3px]">ADD NEW LEDGER</span>
                <div className="absolute top-4 right-4 opacity-20">
                    <ShieldCheck size={20} />
                </div>
            </motion.div>

            {/* ২. বইয়ের তালিকা রেন্ডার করা */}
            {books.map((b: any) => (
                <BookListItem 
                    key={b._id} 
                    book={b} 
                    onClick={onBookClick} 
                    balance={getBookBalance ? getBookBalance(b._id) : 0} 
                    currencySymbol={currencySymbol || "৳"}
                />
            ))}
        </div>
    );
};