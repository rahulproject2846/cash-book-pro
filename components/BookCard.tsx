"use client";
import React from 'react';
import { Book as BookIcon, ChevronRight } from 'lucide-react';

export const BookCard = ({ book, onClick }: any) => {
  // টেক্সট লিমিট করার লজিক
  const truncate = (text: string, limit: number) => {
    return text?.length > limit ? text.slice(0, limit) + "..." : text;
  };

  return (
    <div 
      onClick={onClick} 
      className="glass-card p-6 cursor-pointer flex flex-col justify-between h-[160px] relative group overflow-hidden"
    >
      {/* Background Subtle Icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <BookIcon size={120} />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <div className="bg-blue-600/10 p-2.5 rounded-xl text-blue-500">
          <BookIcon size={20} />
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold text-white uppercase tracking-tighter leading-tight">
          {truncate(book.name, 22)}
        </h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[2px] mt-1">
          {book.description ? truncate(book.description, 40) : "No Description"}
        </p>
      </div>

      {/* নিচের নীল চিকন লাইনটি হোভারে আসবে (Premium touch) */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-blue-600 w-0 group-hover:w-full transition-all duration-500"></div>
    </div>
  );
};