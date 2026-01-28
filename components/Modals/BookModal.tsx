"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Edit3, Check, Loader2, Info } from 'lucide-react';
import { ModalLayout } from '@/components/Modals';

export const BookModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const [form, setForm] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    // ডিফল্ট ডাটা বা এডিট ডাটা সেটআপ
    useEffect(() => {
        if (initialData) {
            setForm({ 
                name: initialData.name, 
                description: initialData.description || "" 
            });
        } else {
            setForm({ name: '', description: '' });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // মেইন সাবমিট ফাংশন কল করা (যা BooksSection থেকে আসে)
        await onSubmit(form);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <ModalLayout 
            title={initialData ? "Protocol: Update Vault" : "Protocol: Initialize Vault"} 
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* ১. লেজার নাম ইনপুট */}
                <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
                        <BookOpen size={12} className="text-orange-500" /> Ledger Identity
                    </label>
                    <input 
                        required 
                        placeholder="E.G. BUSINESS OPERATIONS" 
                        className="app-input h-14 text-sm font-extrabold uppercase tracking-widest border-2 focus:border-orange-500 transition-all" 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        autoFocus
                    />
                </div>

                {/* ২. ডেসক্রিপশন ইনপুট */}
                <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
                        <Info size={12} className="text-orange-500" /> Protocol Memo
                    </label>
                    <input 
                        placeholder="OPTIONAL VAULT DESCRIPTION..." 
                        className="app-input h-14 text-[10px] font-bold uppercase tracking-widest border-2 focus:border-orange-500 transition-all" 
                        value={form.description} 
                        onChange={e => setForm({...form, description: e.target.value})} 
                    />
                </div>

                {/* ৩. সিস্টেম নোট (UX Tip) */}
                <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                    <p className="text-[9px] text-orange-500 font-bold leading-relaxed uppercase tracking-wider">
                        Note: Once initialized, this vault will be secured within your identity profile for private financial tracking.
                    </p>
                </div>

                {/* ৪. অ্যাকশন বাটন */}
                <button 
                    disabled={isLoading}
                    className="app-btn-primary w-full h-16 text-[11px] font-black tracking-[4px] shadow-2xl shadow-orange-500/20 mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        initialData ? "SYNC CHANGES" : "EXECUTE INITIALIZATION"
                    )}
                </button>
            </form>
        </ModalLayout>
    );
};