"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronDown, ShieldCheck, Wallet, Calendar, 
    Layers, CreditCard, Info, Loader2, Check 
} from 'lucide-react';
import { ModalLayout } from '@/components/Modals';

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData, currentUser }: any) => {
    const [form, setForm] = useState({
        title: '', amount: '', type: 'expense', category: 'General', 
        paymentMethod: 'Cash', note: '', status: 'Completed', 
        date: new Date().toISOString().split('T')[0]
    });
    const [isLoading, setIsLoading] = useState(false);

    // কারেন্সি সিম্বল বের করা
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    const userCategories = currentUser?.categories || ['General', 'Salary', 'Food', 'Rent'];

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                amount: initialData.amount.toString(),
                date: new Date(initialData.date).toISOString().split('T')[0]
            });
        } else {
            setForm({
                title: '', amount: '', type: 'expense', 
                category: userCategories[0], 
                paymentMethod: 'Cash', note: '', status: 'Completed', 
                date: new Date().toISOString().split('T')[0]
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
        <ModalLayout 
            title={initialData ? "Protocol: Modify Entry" : "Protocol: New Entry"} 
            onClose={onClose}
        >
            <div className="max-h-[80vh] overflow-y-auto no-scrollbar px-1">
                <form onSubmit={handleSubmit} className="space-y-6 pb-2">
                    
                    {/* ১. ট্রানজেকশন টাইটেল */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                            <ShieldCheck size={12} className="text-orange-500" /> Transaction Identity
                        </label>
                        <input 
                            required 
                            placeholder="E.G. OFFICE MAINTENANCE" 
                            className="app-input h-14 text-sm font-extrabold uppercase tracking-widest border-2 focus:border-orange-500 transition-all" 
                            value={form.title} 
                            onChange={e => setForm({...form, title: e.target.value})} 
                        />
                    </div>

                    {/* ২. অ্যামাউন্ট এবং ডেট (Fixed Overlap Logic) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Capital Amount</label>
                            <div className="flex items-center h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl focus-within:border-orange-500 transition-all px-4 gap-3 shadow-sm">
                                <span className="text-xl font-black text-orange-500 select-none">
                                    {currencySymbol}
                                </span>
                                <input 
                                    required 
                                    type="number" 
                                    placeholder="0.00" 
                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-xl font-mono-finance font-bold text-[var(--text-main)] outline-none" 
                                    value={form.amount} 
                                    onChange={e => setForm({...form, amount: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Timestamp</label>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    className="app-input h-14 uppercase text-xs font-black tracking-widest border-2 cursor-pointer focus:border-orange-500" 
                                    value={form.date} 
                                    onChange={e => setForm({...form, date: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* ৩. ক্যাটাগরি এবং পেমেন্ট মেথড (Studio Dropdowns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                <Layers size={12} className="text-orange-500" /> Classification
                            </label>
                            <div className="relative">
                                <select 
                                    className="app-input h-14 px-5 text-[11px] font-black uppercase tracking-widest border-2 appearance-none cursor-pointer bg-[var(--bg-app)] focus:border-orange-500" 
                                    value={form.category} 
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    {userCategories.map((cat: string) => (
                                        <option key={cat} value={cat} className="bg-[var(--bg-card)] text-[var(--text-main)]">
                                            {cat.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={16} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                <CreditCard size={12} className="text-orange-500" /> Channel
                            </label>
                            <div className="relative">
                                <select 
                                    className="app-input h-14 px-5 text-[11px] font-black uppercase tracking-widest border-2 appearance-none cursor-pointer bg-[var(--bg-app)] focus:border-orange-500" 
                                    value={form.paymentMethod} 
                                    onChange={e => setForm({...form, paymentMethod: e.target.value})}
                                >
                                    <option value="Cash" className="bg-slate-900 text-white">CASH</option>
                                    <option value="Bank" className="bg-slate-900 text-white">BANK TRANSFER</option>
                                    <option value="bKash" className="bg-slate-900 text-white">BKASH / MFS</option>
                                    <option value="Nagad" className="bg-slate-900 text-white">NAGAD / MFS</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* ৪. নোট ইনপুট */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                            <Info size={12} className="text-orange-500" /> Additional Memo
                        </label>
                        <input 
                            placeholder="OPTIONAL DESCRIPTION..." 
                            className="app-input h-12 text-[10px] font-bold uppercase tracking-widest border-2" 
                            value={form.note} 
                            onChange={e => setForm({...form, note: e.target.value})} 
                        />
                    </div>

                    {/* ৫. টাইপ সুইচ (Income/Expense) */}
                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setForm({...form, type: 'income'})} 
                            className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all duration-300 ${form.type === 'income' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}
                        >
                            INCOME
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setForm({...form, type: 'expense'})} 
                            className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all duration-300 ${form.type === 'expense' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}
                        >
                            EXPENSE
                        </button>
                    </div>

                    {/* ৬. অ্যাকশন বাটন */}
                    <button 
                        disabled={isLoading}
                        className="app-btn-primary w-full h-18 text-sm font-black tracking-[4px] shadow-2xl mt-4 bg-orange-500 hover:bg-orange-600 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "EXECUTE PROTOCOL"}
                    </button>
                </form>
            </div>
        </ModalLayout>
    );
};