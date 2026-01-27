"use client";
import React, { useState, useEffect } from 'react';
import { ModalLayout } from '@/components/Modals'; // তোমার এক্সিস্টিং লেআউট

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const [form, setForm] = useState({
        title: '', amount: '', type: 'expense', category: 'General', 
        paymentMethod: 'Cash', note: '', status: 'Completed', 
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                amount: initialData.amount.toString(),
                date: new Date(initialData.date).toISOString().split('T')[0]
            });
        } else {
            // Reset for new entry
            setForm({
                title: '', amount: '', type: 'expense', category: 'General', 
                paymentMethod: 'Cash', note: '', status: 'Completed', 
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    if (!isOpen) return null;

    return (
        <ModalLayout title={initialData ? "Edit Transaction" : "New Transaction"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="TITLE (e.g. Lunch)" className="app-input font-bold uppercase text-xs" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <input required type="number" placeholder="0.00" className="app-input font-mono-finance text-lg" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    <input type="date" className="app-input text-xs font-bold uppercase" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <select className="app-input text-[10px] font-black" value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="General">GENERAL</option><option value="Salary">SALARY</option><option value="Food">FOOD</option><option value="Rent">RENT</option></select>
                    <select className="app-input text-[10px] font-black" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}><option value="Cash">CASH</option><option value="Bank">BANK</option><option value="bKash">BKASH</option><option value="Nagad">NAGAD</option></select>
                </div>
                <div>
                    <input placeholder="SHORT NOTE (OPTIONAL)" className="app-input text-xs" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${form.type === 'income' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>INCOME</button>
                    <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`flex-1 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${form.type === 'expense' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>EXPENSE</button>
                </div>
                <button className="app-btn-primary w-full py-4 text-xs tracking-widest shadow-xl mt-2">Confirm Action</button>
            </form>
        </ModalLayout>
    );
};