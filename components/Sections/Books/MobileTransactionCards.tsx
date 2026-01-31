"use client";
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export const MobileTransactionCards = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    return (
        <div className="xl:hidden p-4 space-y-4">
            {items.map((e: any) => (
                <div key={e.localId || e._id} className="app-card p-6 flex flex-col gap-4 border-[var(--border-color)] active:scale-[0.98] transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-4">
                            <h4 className="text-base font-black uppercase text-[var(--text-main)] tracking-tight truncate">{e.title}</h4>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 flex flex-wrap gap-2 items-center">
                                <span className="font-mono">{new Date(e.date).toLocaleDateString()}</span>
                                {e.time && <span>• {e.time}</span>}
                                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-app)] border border-[var(--border-color)]">{e.category}</span>
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`text-xl font-mono-finance font-bold ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    {e.note && <p className="text-[11px] text-[var(--text-muted)] italic opacity-60 line-clamp-1">"{e.note}"</p>}
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                        <button onClick={() => onToggleStatus(e)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${e.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                            {e.status}
                        </button>
                        <div className="flex gap-5">
                            <Edit2 size={20} className="text-blue-500 cursor-pointer active:scale-90 transition-transform" onClick={() => onEdit(e)} />
                            <Trash2 size={20} className="text-red-500 cursor-pointer active:scale-90 transition-transform" onClick={() => onDelete(e)} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};