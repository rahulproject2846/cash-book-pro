"use client";
import { ArrowUpRight, ArrowDownLeft, Trash2, Edit3 } from 'lucide-react';

export const EntryRow = ({ entry, onDelete, onEdit }: any) => (
  <div className="glass-card p-5 flex justify-between items-center group border-white/5 hover:border-white/20 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${entry.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {entry.type === 'income' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
      </div>
      <div>
        <h4 className="font-bold text-white text-lg">{entry.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-md font-black uppercase">{entry.paymentMethod}</span>
          <p className="text-[10px] text-slate-500 font-bold">{new Date(entry.date).toLocaleDateString()} • {entry.category}</p>
        </div>
        {entry.note && <p className="text-[11px] text-slate-500 italic mt-2 opacity-70">Note: {entry.note}</p>}
      </div>
    </div>
    <div className="flex items-center gap-6">
      <p className={`font-mono font-bold text-xl ${entry.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
        {entry.type === 'income' ? '+' : '-'} {entry.amount.toLocaleString()}
      </p>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={onEdit} className="text-slate-400 hover:text-blue-400 bg-white/5 p-2 rounded-lg">
          <Edit3 size={18} />
        </button>
        <button onClick={onDelete} className="text-slate-600 hover:text-red-500 bg-white/5 p-2 rounded-lg">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </div>
);