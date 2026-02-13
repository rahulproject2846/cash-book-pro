"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
    Loader2, AlertTriangle, BookOpen, Calendar, 
    ArrowUpRight, ArrowDownLeft, Search, Wallet, 
    Download, ShieldCheck 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { AdvancedExportModal } from '@/components/Modals/AdvancedExportModal';

// Global Engine Hooks & Components (Self-Contained)
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip'; 

export default function PublicLedgerPage() {
    const { t } = useTranslation(); // Translation Hook Injected
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
                    throw new Error(jsonData.message || t('access_restricted'));
                }
                
                setData(jsonData.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if(token) fetchPublicData();
    }, [token, t]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] transition-colors">
            <Loader2 className="animate-spin text-orange-500 mb-3" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">{t('verifying_protocol')}</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] p-6 text-center transition-colors">
            <div className="w-20 h-20 bg-red-500/5 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-500/10 shadow-sm">
                <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-black uppercase text-white tracking-tight">{t('access_denied')}</h1>
            <p className="text-sm text-slate-400 mt-2 font-medium max-w-xs mx-auto uppercase tracking-wide">{error}</p>
        </div>
    );

    const { book, entries } = data;

    // ... Filtered Entries Logic (অপরিবর্তিত) ...
    const filteredEntries = entries.filter((e: any) => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.amount.toString().includes(searchQuery) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalIn = filteredEntries.filter((e: any) => e.type === 'income' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const totalOut = filteredEntries.filter((e: any) => e.type === 'expense' && e.status === 'Completed').reduce((a: any, b: any) => a + b.amount, 0);
    const balance = totalIn - totalOut;

    // --- RENDER ---
    return (
        // Global Styling for Public Page (Dark Mode Theme)
        <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-orange-500/30">
            
            <div className="bg-[#1A1A1B] border-b border-[#2D2D2D] pt-12 pb-8 px-4 md:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-700/80 text-slate-300 text-[10px] font-black uppercase tracking-widest mb-4">
                        <ShieldCheck size={12} /> {t('secure_read_only')}
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                                {book.name}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[3px] mt-2 ml-1">
                                {book.description || t('digital_financial_protocol')}
                            </p>
                        </div>
                        <Tooltip text={t('tt_export_archive')}>
                            <button 
                                onClick={() => setShowExportModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-600/30 active:scale-95"
                            >
                                <Download size={14} /> {t('export_archive')}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
                
                {/* 1. Stats Grid (Compact Spacing & Translation) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--app-gap,1.25rem)]">
                    {/* Inflow */}
                    <div className="bg-[#1A1A1B] p-[var(--card-padding,1.75rem)] rounded-2xl border border-[#2D2D2D] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowDownLeft size={64} className="text-green-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_inflow')}</p>
                        <h3 className="text-3xl font-mono font-bold text-green-500 tracking-tight">+{totalIn.toLocaleString()}</h3>
                    </div>
                    
                    {/* Outflow */}
                    <div className="bg-[#1A1A1B] p-[var(--card-padding,1.75rem)] rounded-2xl border border-[#2D2D2D] shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpRight size={64} className="text-red-600"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_outflow')}</p>
                        <h3 className="text-3xl font-mono font-bold text-red-500 tracking-tight">-{totalOut.toLocaleString()}</h3>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-orange-900/20 p-[var(--card-padding,1.75rem)] rounded-2xl border border-orange-900 shadow-2xl flex flex-col justify-between h-36 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} className="text-white"/></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('net_balance')}</p>
                        <h3 className={`text-3xl font-mono font-bold tracking-tight ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {balance < 0 ? '-' : '+'}{Math.abs(balance).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="space-y-[var(--app-gap,1.5rem)]">
                    {/* 2. Search Field (Themed) */}
                    <div className="relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder={t('filter_protocol_desc')} 
                            className="w-full pl-14 pr-6 py-5 bg-[#1A1A1B] border border-[#2D2D2D] rounded-[22px] text-xs font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-all shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* 3. Data Table (Themed) */}
                    <div className="hidden md:block bg-[#1A1A1B] rounded-[24px] border border-[#2D2D2D] shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#121212]/50 border-b border-[#2D2D2D]">
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('timestamp')}</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('transaction_detail')}</th>
                                    <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('classification')}</th>
                                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2D2D2D]/50">
                                {filteredEntries.map((e: any) => (
                                    <tr key={e._id} className="hover:bg-[#121212] transition-colors group">
                                        <td className="py-6 px-8 text-xs font-bold text-slate-400 font-mono uppercase tracking-tighter">
                                            {new Date(e.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="py-6 px-6">
                                            <div className="font-black text-sm uppercase text-white tracking-tight leading-none">{e.title}</div>
                                            {e.note && <div className="text-[10px] text-slate-400 italic mt-2 font-medium">"{e.note}"</div>}
                                        </td>
                                        <td className="py-6 px-6">
                                            <span className="px-3 py-1 rounded-lg bg-orange-900/30 text-orange-400 text-[9px] font-black uppercase tracking-widest border border-orange-900/50">
                                                {e.category}
                                            </span>
                                        </td>
                                        <td className={`py-6 px-8 text-right font-mono font-bold text-base ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. Mobile Cards (Themed) */}
                    <div className="md:hidden space-y-[var(--app-gap,1rem)]">
                        {filteredEntries.map((e: any) => (
                            <div key={e._id} className="bg-[#1A1A1B] p-6 rounded-[24px] border border-[#2D2D2D] shadow-sm flex flex-col gap-5">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-base font-black uppercase text-white tracking-tight leading-none">{e.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                            <Calendar size={10} /> {new Date(e.date).toLocaleDateString()} • {e.category}
                                        </p>
                                    </div>
                                    <span className={`text-xl font-mono font-bold ${e.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                        {e.type === 'income' ? '+' : '-'}{e.amount.toLocaleString()}
                                    </span>
                                </div>
                                {e.note && <div className="pt-4 border-t border-[#2D2D2D]/50 text-[10px] italic text-slate-400">"{e.note}"</div>}
                            </div>
                        ))}
                    </div>

                    {filteredEntries.length === 0 && (
                        <div className="text-center py-20 bg-[#1A1A1B] rounded-[32px] border border-[#2D2D2D] border-dashed">
                            <p className="text-xs font-black uppercase tracking-[4px] text-slate-600">{t('no_protocol_records')}</p>
                        </div>
                    )}
                </div>

                <div className="text-center pt-12 pb-6 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black uppercase tracking-[5px] text-white mb-1">
                        {t('secure_vault_interface')}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                        {t('design_by_rahul')}
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