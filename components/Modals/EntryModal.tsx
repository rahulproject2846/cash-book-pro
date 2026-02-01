"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, ShieldCheck, Calendar, CreditCard, 
    Layers, Info, Loader2, Clock, X, DollarSign, Check 
} from 'lucide-react';

/**
 * VAULT PRO: ATOMIC ENTRY MODAL (V5 - FINAL POLISH)
 * -----------------------------------------------
 * UX Fixes:
 * 1. Labels visible on both mobile & desktop.
 * 2. Removed double arrows on selects.
 * 3. Styled Dropdowns with native-support on mobile for better UX.
 */

// --- সাব-কম্পোনেন্ট: স্মার্ট স্টুডিও সিলেক্ট ---
const StudioSelect = ({ label, value, options, onChange, icon: Icon }: any) => {
    return (
        <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500" />} {label}
            </label>
            <div className="relative group">
                <select 
                    // appearance-none default arrow সরাবে।
                    // focus:border-orange-500 থিমের সাথে সিঙ্ক করবে।
                    className="app-input h-13 px-4 text-[14px] font-black uppercase border-2 bg-[var(--bg-app)] appearance-none focus:border-orange-500 transition-all cursor-pointer pr-10" 
                    value={value} 
                    onChange={e => onChange(e.target.value)}
                >
                    {options.map((opt: string) => (
                        <option key={opt} value={opt} className="bg-[var(--bg-card)] text-[var(--text-main)]">
                            {opt.toUpperCase()}
                        </option>
                    ))}
                </select>
                {/* কাস্টম অ্যারো: এটি একটিই দেখাবে */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors">
                    <ChevronDown size={14} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
};

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData, currentUser }: any) => {
    const [form, setForm] = useState({
        title: '', amount: '', type: 'expense', category: 'GENERAL', 
        paymentMethod: 'CASH', note: '', status: 'completed', 
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    const [isLoading, setIsLoading] = useState(false);
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    const userCategories = currentUser?.categories || ['GENERAL', 'SALARY', 'FOOD', 'RENT'];

    useEffect(() => {
        if (initialData && isOpen) {
            setForm({
                ...initialData,
                amount: initialData.amount.toString(),
                date: new Date(initialData.date).toISOString().split('T')[0],
                time: initialData.time || "00:00",
                status: (initialData.status || 'completed').toLowerCase()
            });
        } else if (isOpen) {
            setForm({
                title: '', amount: '', type: 'expense', 
                category: userCategories[0] || 'GENERAL', 
                paymentMethod: 'CASH', note: '', status: 'completed', 
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
            });
        }
    }, [initialData, isOpen, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit(form); 
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4 p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md" />

            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="bg-[var(--bg-card)] w-full md:max-w-lg md:rounded-[40px] rounded-t-[40px] border-t md:border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]"
            >
                {/* --- HEADER --- */}
                <div className="px-8 py-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
                                {initialData ? "Protocol: Modify" : "Protocol: New Entry"}
                            </h2>
                            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">Secure Transaction Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-2xl bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-red-500 border border-[var(--border-color)] active:scale-90 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-10 overflow-y-auto no-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* IDENTITY FIELD */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Identity</label>
                            <input 
                                required placeholder="E.G. SERVER MAINTENANCE" 
                                className="app-input h-14 text-sm font-bold uppercase tracking-widest border-2 focus:border-orange-500 bg-[var(--bg-app)] shadow-inner" 
                                value={form.title} onChange={e => setForm({...form, title: e.target.value})} 
                            />
                        </div>

                        {/* CAPITAL & SCHEDULE GRID */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                    <DollarSign size={12} className="text-orange-500" /> Capital Amount
                                </label>
                                <div className="flex items-center h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-5 gap-3 focus-within:border-orange-500 transition-all">
                                    <span className="text-xl font-black text-orange-500">{currencySymbol}</span>
                                    <input required type="number" placeholder="0.00" className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-xl font-mono-finance font-bold text-[var(--text-main)] outline-none" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Date Input with Label Fixed */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                        <Calendar size={12} className="text-orange-500" /> Date
                                    </label>
                                    <input type="date" className="app-input h-14 uppercase text-[14px] font-black border-2 bg-[var(--bg-app)] focus:border-orange-500 cursor-pointer" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                                </div>
                                {/* Time Input with Label Fixed */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                        <Clock size={12} className="text-orange-500" /> Time
                                    </label>
                                    <input type="time" className="app-input h-14 uppercase text-[14px] font-black border-2 bg-[var(--bg-app)] focus:border-orange-500 cursor-pointer" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* CLASSIFICATION (CUSTOM SELECTS) */}
                        <div className="grid grid-cols-2 gap-5">
                            <StudioSelect label="Tag" value={form.category} options={userCategories} onChange={(val:any) => setForm({...form, category: val})} icon={Layers} />
                            <StudioSelect label="Via" value={form.paymentMethod} options={['CASH', 'BANK', 'BKASH', 'NAGAD']} onChange={(val:any) => setForm({...form, paymentMethod: val})} icon={CreditCard} />
                        </div>

                        {/* NOTE FIELD */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2"><Info size={12}/> Memo</label>
                            <input placeholder="OPTIONAL MEMO..." className="app-input h-12 text-[14px] font-bold uppercase tracking-widest border-2 bg-[var(--bg-app)]" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                        </div>

                        {/* TYPE SWITCHER */}
                        <div className="flex gap-4 pt-2">
                            <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${form.type === 'income' ? 'bg-green-600 border-green-600 text-white shadow-lg' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-30'}`}>INCOME</button>
                            <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${form.type === 'expense' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-30'}`}>EXPENSE</button>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button disabled={isLoading} className="app-btn-primary w-full h-16 text-sm font-black tracking-[4px] shadow-2xl mt-4 bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all">
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "CONFIRM PROTOCOL"}
                        </button>
                        
                        <div className="h-6 md:hidden" />
                    </form>
                </div>
            </motion.div>
            
            {/* Global CSS to kill double arrows once and for all */}
            <style jsx global>{`
                select.app-input {
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                }
                select.app-input::-ms-expand {
                    display: none !important;
                }
            `}</style>
        </div>
    );
};