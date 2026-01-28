"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
    Loader2, AlertTriangle, BookOpen, Calendar, 
    ArrowUpRight, ArrowDownLeft, Search, Wallet, 
    Download, ShieldCheck 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

export default function PublicLedgerPage() {
    const params = useParams();
    const token = params.token as string;
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const res = await fetch(`/api/public/${token}`);
                const jsonData = await res.json();
                
                if (!res.ok) {
                    throw new Error(jsonData.message || "Access Restricted");
                }
                
                setData(jsonData.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if(token) fetchPublicData();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="animate-spin text-orange-500 mb-3" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Verifying Protocol...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-100 shadow-sm">
                <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-tight">Access Denied</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xs mx-auto uppercase tracking-wide">{error}</p>
        </div>
    );

    const { book, entries } = data;

    const filteredEntries = entries.filter((e: any) => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.amount.toString().includes(searchQuery) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalIn = filteredEntries.filter((e: any) => e.type === 'income' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const totalOut = filteredEntries.filter((e: any) => e.type === 'expense' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const balance = totalIn - totalOut;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-orange-100 selection:text-orange-900">
            
            <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-4 md:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <ShieldCheck size={12} /> Secure Read-Only Access
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                                {book.name}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[3px] mt-2 ml-1">
                                {book.description || "Digital Financial Protocol"}
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                        >
                            <Download size={14} /> Export Archive
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowDownLeft size={64} className="text-green-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inflow</p>
                        <h3 className="text-3xl font-mono font-bold text-green-600 tracking-tight">+{totalIn.toLocaleString()}</h3>
                    </div>
                    
                    <div className="bg-white p-7 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpRight size={64} className="text-red-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outflow</p>
                        <h3 className="text-3xl font-mono font-bold text-red-600 tracking-tight">-{totalOut.toLocaleString()}</h3>
                    </div>

                    <div className="bg-slate-900 p-7 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between h-36 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} className="text-white"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Balance</p>
                        <h3 className={`text-3xl font-mono font-bold tracking-tight ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {balance < 0 ? '-' : '+'}{Math.abs(balance).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Filter protocol by identity or amount..." 
                            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[22px] text-xs font-bold uppercase tracking-widest text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-8 focus:ring-slate-100 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="hidden md:block bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Detail</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEntries.map((e: any) => (
                                    <tr key={e._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-6 px-8 text-xs font-bold text-slate-400 font-mono uppercase tracking-tighter">
                                            {new Date(e.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="font-black text-sm uppercase text-slate-800 tracking-tight leading-none">{e.title}</div>
                                            {e.note && <div className="text-[10px] text-slate-400 italic mt-2 font-medium">"{e.note}"</div>}
                                        </td>
                                        <td className="py-6 px-6">
                                            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                                {e.category}
                                            </span>
                                        </td>
                                        <td className={`py-6 px-8 text-right font-mono font-bold text-base ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-4">
                        {filteredEntries.map((e: any) => (
                            <div key={e._id} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col gap-5">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-base font-black uppercase text-slate-800 tracking-tight leading-none">{e.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                            <Calendar size={10} /> {new Date(e.date).toLocaleDateString()} • {e.category}
                                        </p>
                                    </div>
                                    <span className={`text-xl font-mono font-bold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                    </span>
                                </div>
                                {e.note && <div className="pt-4 border-t border-slate-50 text-[10px] italic text-slate-400">"{e.note}"</div>}
                            </div>
                        ))}
                    </div>

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
                            <p className="text-xs font-black uppercase tracking-[4px] text-slate-300">No protocol records found</p>
                        </div>
                    )}
                </div>

                <div className="text-center pt-12 pb-6 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-900 mb-1">
                        Secure Vault Interface
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                        Design and Development by Rahul
                    </p>
                </div>
            </div>

            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={showExportModal} 
                        onClose={() => setShowExportModal(false)} 
                        entries={filteredEntries} 
                        bookName={book.name}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}