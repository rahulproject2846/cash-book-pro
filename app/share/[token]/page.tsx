"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
    Loader2, AlertTriangle, BookOpen, Calendar, 
    ArrowUpRight, ArrowDownLeft, Search, Wallet, 
    Download, ShieldCheck 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
// নিশ্চিত করো এই পাথ-এ ফাইলটি তৈরি আছে
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

export default function PublicLedgerPage() {
    const params = useParams();
    const token = params.token as string;
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // 🔥 New State for Export Modal
    const [showExportModal, setShowExportModal] = useState(false);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const res = await fetch(`/api/public/${token}`);
                if (!res.ok) throw new Error("This ledger link is either expired or private.");
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if(token) fetchPublicData();
    }, [token]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-orange-500 mb-3" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Verifying Access...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-100">
                <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-tight">Access Restricted</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium max-w-xs mx-auto">{error}</p>
        </div>
    );

    const { book, entries } = data;

    // Filter Logic
    const filteredEntries = entries.filter((e: any) => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.amount.toString().includes(searchQuery)
    );

    const totalIn = filteredEntries.filter((e: any) => e.type === 'income' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const totalOut = filteredEntries.filter((e: any) => e.type === 'expense' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-orange-100 selection:text-orange-900">
            
            {/* --- 1. HERO HEADER --- */}
            <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-4 md:px-8">
                <div className="max-w-4xl mx-auto text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <ShieldCheck size={12} /> Public Read-Only View
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">
                                {book.name}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[3px] mt-2 ml-1">
                                {book.description || "Digital Financial Statement"}
                            </p>
                        </div>
                        
                        {/* 🔥 NEW EXPORT BUTTON */}
                        <button 
                            onClick={() => setShowExportModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                        >
                            <Download size={14} /> Export Data
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
                
                {/* --- 2. STATS SUMMARY --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Income */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowDownLeft size={60} className="text-green-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Income</p>
                        <h3 className="text-3xl font-mono font-bold text-green-600 tracking-tight">+{totalIn.toLocaleString()}</h3>
                    </div>
                    
                    {/* Expense */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpRight size={60} className="text-red-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Expense</p>
                        <h3 className="text-3xl font-mono font-bold text-red-600 tracking-tight">-{totalOut.toLocaleString()}</h3>
                    </div>

                    {/* Balance */}
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between h-32 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={60} className="text-white"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Balance</p>
                        <h3 className={`text-3xl font-mono font-bold tracking-tight ${totalIn - totalOut >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {(totalIn - totalOut).toLocaleString()}
                        </h3>
                    </div>
                </div>

                {/* --- 3. SEARCH & TABLE CONTENT --- */}
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search transaction by name or amount..." 
                            className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEntries.map((e: any) => (
                                    <tr key={e._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="py-4 px-6 text-xs font-bold text-slate-500 font-mono">
                                            {new Date(e.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-xs uppercase text-slate-800">{e.title}</div>
                                            {e.note && <div className="text-[10px] text-slate-400 italic mt-1 group-hover:text-slate-500 transition-colors">"{e.note}"</div>}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wide border border-slate-200">
                                                {e.category}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-6 text-right font-mono font-bold text-sm ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-3">
                        {filteredEntries.map((e: any) => (
                            <div key={e._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xs font-black uppercase text-slate-800">{e.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                                            <Calendar size={10} /> {new Date(e.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`text-base font-mono font-bold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                    <span className="px-2 py-1 rounded bg-slate-50 text-slate-500 text-[9px] font-black uppercase border border-slate-100">
                                        {e.category}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{e.paymentMethod}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions found</p>
                        </div>
                    )}
                </div>

                {/* --- 4. FOOTER --- */}
                <div className="text-center pt-8 pb-4 opacity-40">
                    <p className="text-[9px] font-black uppercase tracking-[3px] text-slate-900 mb-1">
                        Secure Vault System
                    </p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                        Designed by Rahul
                    </p>
                </div>
            </div>

            {/* 🔥 NEW MODAL INTEGRATION */}
            <AnimatePresence>
                {showExportModal && (
                    <AdvancedExportModal 
                        isOpen={showExportModal} 
                        onClose={() => setShowExportModal(false)} 
                        entries={filteredEntries} // Filtered Data pass kora holo
                        bookName={book.name}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}