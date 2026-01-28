"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowUpRight, ArrowDownLeft, Trash2, Edit3, 
    Clock, CheckCircle, Calendar, CreditCard 
} from 'lucide-react';

export const EntryRow = ({ entry, onDelete, onEdit, onToggleStatus, currencySymbol = "৳" }: any) => {
    
    const truncate = (text: string, limit: number) => 
        text?.length > limit ? text.slice(0, limit) + "..." : text;

    // ১. ক্যাটাগরি অনুযায়ী ডাইনামিক কালার প্রোটোকল
    const getCategoryStyles = (category: string) => {
        const name = category.toLowerCase();
        const colors: any = {
            salary: 'bg-green-500/10 text-green-500 border-green-500/20',
            food: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            rent: 'bg-red-500/10 text-red-500 border-red-500/20',
            shopping: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            loan: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            investment: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            general: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
        };
        return colors[name] || 'bg-orange-500/5 text-orange-500 border-orange-500/10';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`app-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group border-[var(--border-color)] transition-all duration-300 hover:border-orange-500/30 ${
                entry.status === 'Pending' ? 'opacity-60 bg-slate-500/5' : 'bg-[var(--bg-card)]'
            }`}
        >
            <div className="flex items-center gap-5 min-w-0 flex-1 w-full">
                {/* আইকন: ইনকাম হলে সবুজ অ্যারো, এক্সপেন্স হলে লাল */}
                <div className={`p-3.5 rounded-2xl flex-shrink-0 shadow-sm border ${
                    entry.type === 'income' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {entry.type === 'income' ? <ArrowDownLeft size={22} strokeWidth={2.5} /> : <ArrowUpRight size={22} strokeWidth={2.5} />}
                </div>
                
                <div className="min-w-0 flex-1">
                    {/* টাইটেল ও স্ট্যাটাস ব্যাজ */}
                    <div className="flex items-center gap-3">
                        <h4 className="font-black text-[var(--text-main)] text-lg truncate tracking-tight uppercase italic">
                            {truncate(entry.title, 30)}
                        </h4>
                        {entry.status === 'Pending' && (
                            <span className="flex items-center gap-1 text-[8px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-yellow-500/20 animate-pulse">
                                <Clock size={8} /> Pending
                            </span>
                        )}
                    </div>
                    
                    {/* মেটাডাটা: পেমেন্ট মেথড, ডেট এবং ক্যাটাগরি */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[9px] bg-[var(--bg-app)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg font-black uppercase border border-[var(--border-color)] flex items-center gap-1.5 shadow-inner">
                            <CreditCard size={10} /> {entry.paymentMethod}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter opacity-70">
                            <Calendar size={12} /> {new Date(entry.date).toLocaleDateString('en-GB')}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${getCategoryStyles(entry.category)}`}>
                            {entry.category}
                        </span>
                    </div>

                    {/* শর্ট নোট */}
                    {entry.note && (
                        <p className="text-[11px] text-[var(--text-muted)] italic mt-2.5 opacity-60 truncate border-l-2 border-orange-500/20 pl-3">
                            "{truncate(entry.note, 60)}"
                        </p>
                    )}
                </div>
            </div>
            
            {/* রাইট সেকশন: অ্যামাউন্ট এবং অ্যাকশন বাটন */}
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 border-t md:border-none border-[var(--border-color)] pt-4 md:pt-0">
                <p className={`font-mono-finance font-bold text-xl md:text-2xl tracking-tighter ${
                    entry.type === 'income' ? 'text-green-500' : 'text-red-500'
                }`}>
                    {entry.type === 'income' ? '+' : '-'}{currencySymbol}{entry.amount.toLocaleString()}
                </p>
                
                {/* অ্যাকশন বাটনস: হোভার করলে বা মোবাইলে ফোকাসড হবে */}
                <div className="flex gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                    <button 
                        onClick={onToggleStatus} 
                        className={`p-2.5 rounded-xl transition-all border shadow-sm ${
                            entry.status === 'Pending' 
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500 hover:text-white' 
                            : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white'
                        }`}
                        title={entry.status === 'Pending' ? 'Finalize Protocol' : 'Set as Pending'}
                    >
                        {entry.status === 'Pending' ? <CheckCircle size={18} /> : <Clock size={18} />}
                    </button>
                    
                    <button 
                        onClick={onEdit} 
                        className="text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-app)] border border-[var(--border-color)] p-2.5 rounded-xl hover:border-blue-500 transition-all shadow-sm active:scale-90"
                    >
                        <Edit3 size={18} />
                    </button>
                    
                    <button 
                        onClick={onDelete} 
                        className="text-[var(--text-muted)] hover:text-red-500 bg-[var(--bg-app)] border border-[var(--border-color)] p-2.5 rounded-xl hover:border-red-500 transition-all shadow-sm active:scale-90"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};