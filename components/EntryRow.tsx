"use client";
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Trash2, Edit3, Clock, CheckCircle } from 'lucide-react';

export const EntryRow = ({ entry, onDelete, onEdit, onToggleStatus }: any) => {
  const truncate = (text: string, limit: number) => {
    return text?.length > limit ? text.slice(0, limit) + "..." : text;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      // Group: Main container for design and opacity control
      className={`glass-card p-5 flex justify-between items-center group border-white/5 hover:border-blue-500/20 transition-all ${entry.status === 'Pending' ? 'opacity-60' : 'opacity-100'}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Left Icon (Income/Expense) */}
        <div className={`p-3 rounded-2xl flex-shrink-0 ${entry.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {entry.type === 'income' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
        </div>
        
        <div className="min-w-0 flex-1">
          {/* Title and Status Badge */}
          <div className="flex items-center gap-3">
              <h4 className="font-bold text-white text-lg truncate tracking-tight">{truncate(entry.title, 25)}</h4>
              {entry.status === 'Pending' && (
                  <span className="flex items-center gap-1 text-[7px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex-shrink-0">
                    <Clock size={8} /> Pending
                  </span>
              )}
          </div>
          
          {/* Metadata: Method, Date & Time, Category */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-md font-black uppercase">{entry.paymentMethod}</span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                {new Date(entry.date).toLocaleDateString()} {entry.time && `• ${entry.time}`} • {entry.category}
            </p>
          </div>

          {/* Note */}
          {entry.note && <p className="text-[11px] text-slate-500 italic mt-2 opacity-70 truncate">{truncate(entry.note, 50)}</p>}
        </div>
      </div>
      
      {/* Right Section: Amount and Actions */}
      <div className="flex items-center gap-6 ml-4 flex-shrink-0">
        <p className={`font-mono font-bold text-xl ${entry.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
          {entry.type === 'income' ? '+' : '-'} {entry.amount.toLocaleString()}
        </p>
        
        {/* Action Buttons (Hover to show) */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {/* Toggle Status Button */}
          <button 
            onClick={onToggleStatus} 
            className={`p-2 rounded-lg transition-colors border border-white/5 ${entry.status === 'Pending' ? 'bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/50' : 'bg-green-600/20 text-green-500 hover:bg-green-600/50'}`}
            title={entry.status === 'Pending' ? 'Mark as Completed' : 'Mark as Pending'}
          >
              {entry.status === 'Pending' ? <CheckCircle size={18} /> : <Clock size={18} />}
          </button>
          
          <button onClick={onEdit} className="text-slate-400 hover:text-blue-400 bg-white/5 p-2 rounded-lg"><Edit3 size={18} /></button>
          <button onClick={onDelete} className="text-slate-600 hover:text-red-500 bg-white/5 p-2 rounded-lg"><Trash2 size={18} /></button>
        </div>
      </div>
    </motion.div>
  );
};