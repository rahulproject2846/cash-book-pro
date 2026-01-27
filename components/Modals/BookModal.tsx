"use client";
import React, { useState, useEffect } from 'react';
import { ModalLayout } from '@/components/Modals';

export const BookModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const [form, setForm] = useState({ name: '', description: '' });

    useEffect(() => {
        if (initialData) setForm({ name: initialData.name, description: initialData.description });
        else setForm({ name: '', description: '' });
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form);
    };

    if (!isOpen) return null;

    return (
        <ModalLayout title={initialData ? "Update Ledger" : "Create Ledger"} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ledger Name</label>
                    <input required placeholder="e.g. Daily Expenses" className="app-input font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <input placeholder="Short details..." className="app-input text-xs" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <button className="app-btn-primary w-full py-4 uppercase tracking-widest mt-2">{initialData ? 'Save Changes' : 'Create Ledger'}</button>
            </form>
        </ModalLayout>
    );
};