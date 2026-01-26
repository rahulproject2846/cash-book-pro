"use client";
import React from 'react';
import { Book, ChevronRight, MoreHorizontal } from 'lucide-react';

export const BookCard = ({ book, onClick }: any) => {
  const truncate = (text: string, limit: number) => {
    return text?.length > limit ? text.slice(0, limit) + "..." : text;
  };

  return (
    <div 
      onClick={onClick} 
      className="app-card p-6 cursor-pointer relative group flex flex-col justify-between overflow-hidden h-[190px]"
    >
      {/* Background Decor - Theme Responsive */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Book size={150} className="text-orange-500" />
      </div>

      {/* Top Section */}
      <div className="flex justify-between items-start z-10">
        <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <Book size={22} />
        </div>
        <button className="text-[var(--text-muted)]  transition-colors p-1">
            <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Middle Section: Title & Description */}
      <div className="z-10 mt-3">
        <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-tight group-hover:text-orange-500 transition-colors">
          {truncate(book.name, 18)}
        </h3>
        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[2px] leading-relaxed line-clamp-2">
          {book.description ? truncate(book.description, 45) : "SECURE DIGITAL LEDGER"}
        </p>
      </div>

      {/* Bottom Section: Action */}
      <div className="flex items-center justify-between z-10 mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-500 uppercase tracking-widest">
            <span>Open Vault</span>
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-50 italic">
            Private Access
        </span>
      </div>

      {/* Bottom Glow Line */}
      <div className="absolute bottom-0 left-0 h-[3px] bg-orange-500 w-0 group-hover:w-full transition-all duration-500"></div>
    </div>
  );
};