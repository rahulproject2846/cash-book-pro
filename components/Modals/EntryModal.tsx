"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronDown, ShieldCheck, Wallet, Calendar, 
    Layers, CreditCard, Info, Loader2, Clock, X 
} from 'lucide-react';
import { ModalLayout } from '@/components/Modals';

/**
 * VAULT PRO: PURE ENTRY MODAL UI (V3)
 * ----------------------------------
 * এটি শুধুমাত্র UI এবং ইনপুট হ্যান্ডেল করে। 
 * লজিক মেইন BooksSection থেকে onSubmit এর মাধ্যমে ইনজেক্ট করা হয়।
 */

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData, currentUser }: any) => {
    // ১. ফর্ম স্টেট (V3 Schema)
    const [form, setForm] = useState({
        title: '', 
        amount: '', 
        type: 'expense', 
        category: 'GENERAL', 
        paymentMethod: 'CASH', 
        note: '', 
        status: 'completed', 
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    const [isLoading, setIsLoading] = useState(false);

    // হেল্পারস
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
    const userCategories = currentUser?.categories || ['GENERAL', 'SALARY', 'FOOD', 'RENT'];

    // ২. হাইড্রেশন লজিক (এডিট না কি নতুন তা নির্ধারণ)
    useEffect(() => {
        if (initialData && isOpen) {
            setForm({
                ...initialData,
                amount: initialData.amount.toString(),
                date: new Date(initialData.date).toISOString().split('T')[0],
                // যদি টাইম না থাকে তবে বর্তমান সময়
                time: initialData.time || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
                status: (initialData.status || 'completed').toLowerCase()
            });
        } else if (isOpen) {
            // ফর্ম রিসেট (নতুন এন্ট্রির জন্য)
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
        e.preventDefault(); // 🔥 ফর্ম সাবমিট এখানে বন্ধ হবে
        setIsLoading(true);
        // 🔥 ফিক্স: আমরা শুধু ফর্মের ডেটা পাঠাবো, ইভেন্ট নয়
        await onSubmit(form); 
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[var(--bg-card)] w-full md:max-w-lg md:rounded-[32px] rounded-t-[32px] border-t md:border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50 shrink-0">
                    <div>
                        <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[2px] italic">
                            {initialData ? "PROTOCOL: MODIFY ENTRY" : "PROTOCOL: NEW ENTRY"}
                        </h2>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5">Secure Transaction Engine</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6 overflow-y-auto no-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* ১. ট্রানজেকশন টাইটেল */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Identity</label>
                            <input 
                                required 
                                placeholder="E.G. SERVER MAINTENANCE" 
                                className="app-input h-14 text-sm font-extrabold uppercase tracking-widest border-2 focus:border-orange-500 transition-all bg-[var(--bg-app)]" 
                                value={form.title} 
                                onChange={e => setForm({...form, title: e.target.value})} 
                            />
                        </div>

                        {/* ২. অ্যামাউন্ট, ডেট এবং টাইম (Triple Grid) */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Capital Amount</label>
                                <div className="flex items-center h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-4 gap-3 focus-within:border-orange-500 transition-all">
                                    <span className="text-lg font-black text-orange-500 select-none">{currencySymbol}</span>
                                    <input 
                                        required type="number" placeholder="0.00" 
                                        className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-lg font-mono-finance font-bold text-[var(--text-main)] outline-none" 
                                        value={form.amount} 
                                        onChange={e => setForm({...form, amount: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                        <Calendar size={12} /> Date
                                    </label>
                                    <input 
                                        type="date" 
                                        className="app-input h-14 uppercase text-[10px] font-black tracking-widest border-2 bg-[var(--bg-app)] focus:border-orange-500" 
                                        value={form.date} 
                                        onChange={e => setForm({...form, date: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                                        <Clock size={12} /> Time
                                    </label>
                                    <input 
                                        type="time" 
                                        className="app-input h-14 uppercase text-[10px] font-black tracking-widest border-2 bg-[var(--bg-app)] focus:border-orange-500" 
                                        value={form.time} 
                                        onChange={e => setForm({...form, time: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ৩. ক্যাটাগরি এবং পেমেন্ট মেথড */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Classification</label>
                                <select 
                                    className="app-input h-14 text-[10px] font-black uppercase tracking-widest border-2 bg-[var(--bg-app)] focus:border-orange-500"
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    {userCategories.map((cat: string) => (
                                        <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Channel</label>
                                <select 
                                    className="app-input h-14 text-[10px] font-black uppercase tracking-widest border-2 bg-[var(--bg-app)] focus:border-orange-500"
                                    value={form.paymentMethod}
                                    onChange={e => setForm({...form, paymentMethod: e.target.value})}
                                >
                                    <option value="CASH">CASH</option>
                                    <option value="BANK">BANK</option>
                                    <option value="BKASH">BKASH</option>
                                    <option value="NAGAD">NAGAD</option>
                                </select>
                            </div>
                        </div>

                        {/* ৪. নোট */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Additional Note</label>
                            <input 
                                placeholder="OPTIONAL MEMO..." 
                                className="app-input h-12 text-[10px] font-bold uppercase tracking-widest border-2 bg-[var(--bg-app)] focus:border-orange-500" 
                                value={form.note} 
                                onChange={e => setForm({...form, note: e.target.value})} 
                            />
                        </div>

                        {/* ৫. টাইপ সুইচ */}
                        <div className="flex gap-4 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setForm({...form, type: 'income'})} 
                                className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${form.type === 'income' ? 'bg-green-600 border-green-600 text-white' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}
                            >
                                INCOME
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setForm({...form, type: 'expense'})} 
                                className={`flex-1 h-14 rounded-2xl font-black text-[10px] tracking-[3px] border-2 transition-all ${form.type === 'expense' ? 'bg-red-600 border-red-600 text-white' : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] opacity-50'}`}
                            >
                                EXPENSE
                            </button>
                        </div>

                        {/* ৬. সাবমিট */}
                        <button 
                            disabled={isLoading}
                            className="app-btn-primary w-full h-16 text-sm font-black tracking-[4px] shadow-2xl mt-4 bg-orange-500"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : "CONFIRM PROTOCOL"}
                        </button>
                        <div className="h-4 md:hidden"></div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};