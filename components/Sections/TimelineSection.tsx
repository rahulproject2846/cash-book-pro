"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History, Filter, Loader2, ArrowUpDown, Calendar, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { EntryRow } from '../EntryRow'; // আপনার আগের বানানো রো কম্পোনেন্ট
import { TotalStats } from '@/components/Sections/TotalStats';

export const TimelineSection = ({ currentUser }: any) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                const res = await fetch(`/api/entries/all?userId=${currentUser._id}`);
                const data = await res.json();
                if (res.ok) setEntries(data.entries);
            } catch (err) {
                console.error("Timeline Sync Error");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchTimeline();
    }, [currentUser]);

    // ফিল্টারিং লজিক
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [entries, searchQuery, filterType]);

    // গ্লোবাল ক্যালকুলেশন
    const totalIn = filteredEntries.filter(e => e.type === 'income' && e.status === 'Completed').reduce((a, b) => a + b.amount, 0);
    const totalOut = filteredEntries.filter(e => e.type === 'expense' && e.status === 'Completed').reduce((a, b) => a + b.amount, 0);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Scanning Global Registry</p>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">Global Timeline</h2>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-[3px] mt-1">Chronological Activity Protocol</p>
                </div>
            </div>

            {/* Global Quick Stats */}
            <TotalStats 
                totalIncome={totalIn} 
                totalExpense={totalOut} 
                pendingAmount={filteredEntries.filter(e => e.status === 'Pending').reduce((a,b)=>a+b.amount, 0)}
                currencySymbol={currencySymbol}
            />

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                    <input 
                        placeholder="SEARCH ACROSS ALL VAULTS..." 
                        className="app-input pl-14 pr-6 py-5 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-[22px] text-xs font-black uppercase tracking-widest focus:border-orange-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {['all', 'income', 'expense'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`flex-1 md:flex-none px-6 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Records List */}
            <div className="space-y-4">
                {filteredEntries.map((entry) => (
                    <EntryRow 
                        key={entry._id} 
                        entry={entry} 
                        currencySymbol={currencySymbol}
                        // Timeline পেজে এডিট/ডিলিট বন্ধ রাখা নিরাপদ (Read-only)
                        // অথবা আপনি চাইলে BooksSection এর মত লজিক এখানেও আনতে পারেন
                    />
                ))}
                {filteredEntries.length === 0 && (
                    <div className="p-20 text-center app-card border-dashed border-2 border-[var(--border-color)] opacity-40">
                        <History size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No activity found in any vault</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};