"use client";
import React from 'react';
import { Book, ChevronRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const BookCard = ({ book, onClick, balance = 0, currencySymbol = "৳" }: any) => {
    const truncate = (text: string, limit: number) => 
        text?.length > limit ? text.slice(0, limit) + "..." : text;

    return (
        <motion.div 
            layout
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick} 
            className="app-card p-6 cursor-pointer relative group flex flex-col justify-between overflow-hidden h-[210px] hover:border-orange-500/40 transition-all duration-300 shadow-sm"
        >
            {/* Background Ghost Icon */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12">
                <Book size={160} strokeWidth={1.5} className="text-orange-500" />
            </div>

            {/* TOP SECTION */}
            <div className="flex justify-between items-start z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                    <Book size={20} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-app)] border border-[var(--border-color)] opacity-60">
                    <Activity size={10} className="text-blue-500 animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)]">Live</span>
                </div>
            </div>

            {/* MIDDLE SECTION */}
            <div className="z-10 mt-2">
                <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-tight group-hover:text-orange-500 transition-colors truncate">
                    {truncate(book.name, 20)}
                </h3>
                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-[1.5px] opacity-60 truncate">
                    {book.description ? truncate(book.description, 35) : "FINANCIAL VAULT"}
                </p>
            </div>

            {/* BOTTOM SECTION - FIXED OVERLAP */}
            <div className="z-10 mt-auto pt-4 border-t border-[var(--border-color)] flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50">Net Balance</p>
                    <h4 className={`text-xl font-mono-finance font-bold leading-none ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {balance < 0 ? '-' : '+'}{currencySymbol}{Math.abs(balance).toLocaleString()}
                    </h4>
                </div>
                
                <div className="w-9 h-9 rounded-xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-300">
                    <ChevronRight size={16} />
                </div>
            </div>

            {/* Bottom Glow Line */}
            <div className="absolute bottom-0 left-0 h-[3px] bg-orange-500 w-0 group-hover:w-full transition-all duration-500"></div>
        </motion.div>
    );
};