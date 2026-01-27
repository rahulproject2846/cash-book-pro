"use client";
import React from 'react';
import { Book, ChevronRight, MoreHorizontal, Wallet } from 'lucide-react';

export const BookCard = ({ book, onClick, balance = 0 }: any) => {
  const truncate = (text: string, limit: number) => 
    text?.length > limit ? text.slice(0, limit) + "..." : text;

  return (
    <div 
      onClick={onClick} 
      className="app-card p-6 cursor-pointer relative group flex flex-col justify-between overflow-hidden h-[200px] hover:border-orange-500/30 hover:shadow-xl transition-all duration-300"
    >
      {/* Background Decor */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Book size={140} className="text-orange-500" />
      </div>

      {/* Top: Icon & Menu */}
      <div className="flex justify-between items-start z-10">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
          <Book size={20} />
        </div>
        {/* অপশন মেনু ফিউচারে এখানে আসবে */}
      </div>

      {/* Middle: Info */}
      <div className="z-10 mt-2">
        <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-tight group-hover:text-orange-500 transition-colors">
          {truncate(book.name, 15)}
        </h3>
        <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-wider opacity-70">
          {book.description ? truncate(book.description, 30) : "Digital Ledger"}
        </p>
      </div>

      {/* Bottom: Balance & Action */}
      <div className="z-10 mt-4 pt-3 border-t border-[var(--border-color)] flex justify-between items-end">
        <div>
           <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Net Balance</p>
           <div className={`text-xl font-mono-finance font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}
           </div>
        </div>
        
        <div className="w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
             <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};