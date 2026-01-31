"use client";
import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export const TransactionTable = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    return (
        <div className="hidden xl:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-[var(--bg-app)]/50 border-b border-[var(--border-color)] sticky top-0 z-10 backdrop-blur-md">
                    <tr className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">
                        <th className="py-6 px-6 w-14 text-center">#</th>
                        <th className="py-6 px-4 w-32">Date</th>
                        <th className="py-6 px-4 w-24">Time</th>
                        <th className="py-6 px-4 w-48">Description</th>
                        <th className="py-6 px-4">Note / Memo</th>
                        <th className="py-6 px-4 w-32">Category</th>
                        <th className="py-6 px-4 w-24 text-center">Via</th>
                        <th className="py-6 px-4 w-40 text-right">Amount</th>
                        <th className="py-6 px-4 w-28 text-center">Status</th>
                        <th className="py-6 px-6 w-28 text-right">Option</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                    {items.map((e: any, i: number) => (
                        <tr key={e.localId || e._id} className="hover:bg-[var(--bg-app)]/80 transition-all group">
                            <td className="py-6 px-6 text-center text-xs font-bold text-[var(--text-muted)] opacity-30">{i + 1}</td>
                            <td className="py-6 px-4 text-sm font-bold text-[var(--text-muted)] font-mono">{new Date(e.date).toLocaleDateString('en-GB')}</td>
                            <td className="py-6 px-4 text-xs font-bold text-[var(--text-muted)] font-mono opacity-60">{e.time || "--:--"}</td>
                            <td className="py-6 px-4"><div className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight truncate max-w-[180px]">{e.title}</div></td>
                            <td className="py-6 px-4"><div className="text-[11px] text-[var(--text-muted)] font-medium italic opacity-60 truncate max-w-[250px]">{e.note ? `"${e.note}"` : "---"}</div></td>
                            <td className="py-6 px-4"><span className="px-3 py-1.5 rounded-lg bg-orange-500/5 text-orange-500 text-[9px] font-black uppercase border border-orange-500/10 tracking-widest">{e.category}</span></td>
                            <td className="py-6 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase opacity-70">{e.paymentMethod}</td>
                            <td className={`py-6 px-4 text-right font-mono-finance font-bold text-lg ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {e.type === 'income' ? '+' : '-'}{currencySymbol}{e.amount.toLocaleString()}
                            </td>
                            <td className="py-6 px-4 text-center">
                                <button onClick={() => onToggleStatus(e)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${e.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                    {e.status}
                                </button>
                            </td>
                            <td className="py-6 px-6 text-right">
                                <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <button onClick={() => onEdit(e)} className="p-2 text-blue-500 bg-blue-500/5 rounded-xl border border-blue-500/10 hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={14}/></button>
                                    <button onClick={() => onDelete(e)} className="p-2 text-red-500 bg-red-500/5 rounded-xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={14}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};