"use client";
import { Book as BookIcon } from 'lucide-react';

export const BookCard = ({ book, onClick }: any) => (
  <div onClick={onClick} className="glass-card p-6 cursor-pointer hover:border-blue-500/50 transition-all group relative overflow-hidden">
    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-all">
      <BookIcon size={120} />
    </div>
    <BookIcon className="text-blue-500 mb-4" />
    <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{book.name}</h3>
    <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">{book.description || 'No description'}</p>
  </div>
);