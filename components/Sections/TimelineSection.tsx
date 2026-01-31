"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, History, Calendar, Wallet, TrendingUp, TrendingDown, 
    Activity, Fingerprint, ChevronDown, Check, SlidersHorizontal, 
    ShieldCheck, Loader2,Clock 
} from 'lucide-react';

// Core Systems
import { db } from '@/lib/offlineDB';
import { EntryRow } from '../EntryRow'; 

// --- ১. স্টুডিও ড্রপডাউন (Consistent with BookDetails) ---
const TimelineDropdown = ({ value, options, onChange, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 px-5 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:border-orange-500 transition-all active:scale-95"
            >
                {Icon && <Icon size={18} className="text-orange-500" />}
                <span className="max-w-[60px] truncate">{value === 'all' ? 'ALL' : value.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[300] right-0 top-16 w-48 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden py-1.5"
                    >
                        {options.map((opt: string) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt.toLowerCase()); setIsOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${value.toLowerCase() === opt.toLowerCase() ? 'text-orange-500 bg-orange-500/5' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}
                            >
                                {opt}
                                {value.toLowerCase() === opt.toLowerCase() && <Check size={14} />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const TimelineSection = ({ currentUser }: any) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    const fetchLocalTimeline = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            const sorted = data.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                return dateB - dateA;
            });
            setEntries(sorted);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchLocalTimeline();
        window.addEventListener('vault-updated', fetchLocalTimeline);
        return () => window.removeEventListener('vault-updated', fetchLocalTimeline);
    }, []);

    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type.toLowerCase() === filterType.toLowerCase();
            return matchesSearch && matchesType;
        });
    }, [entries, searchQuery, filterType]);

    const groupedEntries = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        filteredEntries.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!groups[date]) groups[date] = [];
            groups[date].push(entry);
        });
        return groups;
    }, [filteredEntries]);

    const stats = useMemo(() => {
        const inflow = filteredEntries.filter(e => e.type === 'income' && e.status.toLowerCase() === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const outflow = filteredEntries.filter(e => e.type === 'expense' && e.status.toLowerCase() === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const pending = filteredEntries.filter(e => e.status.toLowerCase() === 'pending').reduce((a, b) => a + Number(b.amount), 0);
        return { inflow, outflow, pending, total: inflow - outflow };
    }, [filteredEntries]);

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10 pb-32 max-w-6xl mx-auto px-2 md:px-4">
            
            {/* --- COMPACT HEADER --- */}
            <div className="flex justify-between items-center bg-[var(--bg-card)] p-5 md:p-8 rounded-[32px] border border-[var(--border-color)]">
                <div className="text-left">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[3px] text-orange-500 mb-1">Active Registry</p>
                    <h2 className="text-2xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">
                        Timeline<span className="text-orange-500">.</span>
                    </h2>
                </div>
                <div className="flex flex-col items-end">
                    <Fingerprint size={24} className="text-[var(--text-muted)] opacity-30 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">Verified OS</span>
                </div>
            </div>

            {/* --- COMPACT STATS GRID (2x2 on Mobile) --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                {[
                    { label: 'Balance', val: stats.total, color: 'text-blue-500', border: 'border-blue-500/30', icon: Wallet },
                    { label: 'Inflow', val: stats.inflow, color: 'text-green-500', border: 'border-green-500/30', icon: TrendingUp },
                    { label: 'Outflow', val: stats.outflow, color: 'text-red-500', border: 'border-red-500/30', icon: TrendingDown },
                    { label: 'Pending', val: stats.pending, color: 'text-orange-500', border: 'border-orange-500/30', icon: Clock },
                ].map((s) => (
                    <div key={s.label} className={`bg-[var(--bg-card)] p-4 md:p-6 rounded-[24px] border-l-4 ${s.border} shadow-sm relative overflow-hidden`}>
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p>
                        <h3 className={`text-sm md:text-2xl font-bold mt-1 truncate ${s.color}`}>
                            {s.val < 0 ? '-' : s.val > 0 ? '+' : ''}{currencySymbol}{Math.abs(s.val).toLocaleString()}
                        </h3>
                        <s.icon size={40} className="absolute -right-2 -bottom-2 opacity-[0.03] text-[var(--text-main)]" />
                    </div>
                ))}
            </div>

            {/* --- SMART UNIFIED TOOLBAR (Search & Dropdown in One Line) --- */}
            <div className="flex gap-2 items-center sticky top-24 z-[100] py-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input 
                        placeholder="SEARCH RECORDS..." 
                        className="w-full h-14 pl-12 pr-4 bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl text-[11px] font-black uppercase tracking-widest focus:border-orange-500 outline-none transition-all shadow-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <TimelineDropdown 
                    value={filterType} 
                    options={['all', 'income', 'expense']} 
                    onChange={setFilterType} 
                    icon={SlidersHorizontal}
                />
            </div>

            {/* --- THE FEED --- */}
            <div className="relative pl-2 md:pl-0">
                {/* Timeline Track */}
                <div className="absolute left-[20px] md:left-[23px] top-4 bottom-0 w-[1.5px] bg-gradient-to-b from-orange-500/30 via-[var(--border-color)] to-transparent" />

                <div className="space-y-10 relative z-10">
                    {Object.keys(groupedEntries).map((date) => (
                        <div key={date} className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-md shrink-0">
                                    <Calendar size={16} />
                                </div>
                                <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[3px] bg-[var(--bg-app)] px-4 py-1.5 rounded-full border border-[var(--border-color)]">
                                    {date}
                                </h3>
                            </div>

                            <div className="space-y-3 md:pl-16">
                                {groupedEntries[date].map((entry) => (
                                    <motion.div 
                                        key={entry.localId || entry._id}
                                        initial={{ opacity: 0, x: -5 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        className="active:scale-[0.98] transition-transform"
                                    >
                                        <EntryRow entry={entry} currencySymbol={currencySymbol} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredEntries.length === 0 && (
                        <div className="py-24 text-center opacity-30">
                            <History size={40} className="mx-auto mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Protocol Found</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Signature Bottom */}
            <div className="flex flex-col items-center gap-2 pt-16 opacity-10">
                <ShieldCheck size={20} />
                <p className="text-[8px] font-black uppercase tracking-[4px]">Verified Registry</p>
            </div>
        </motion.div>
    );
};