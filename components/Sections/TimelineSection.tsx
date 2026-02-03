"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Loader2, History } from 'lucide-react';
import { db } from '@/lib/offlineDB';

import { TimelineStats } from './components/TimelineStats';
import { TimelineToolbar } from './components/TimelineToolbar';
import { TimelineFeed } from './components/TimelineFeed';

export const TimelineSection = ({ currentUser, onBack }: any) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSwitchingPage, setIsSwitchingPage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    const fetchLocalTimeline = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            setEntries(data.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchLocalTimeline(); }, []);

    const handlePageChange = (newPage: number) => {
        setIsSwitchingPage(true);
        setTimeout(() => {
            setCurrentPage(newPage);
            setIsSwitchingPage(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 350);
    };

    const { grouped, stats, totalPages } = useMemo(() => {
        const filtered = entries.filter(e => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesType;
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);

        const grouped: { [key: string]: any[] } = {};
        pageData.forEach(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(entry);
        });

        const inflow = filtered.filter(e => e.type === 'income' && e.status === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const outflow = filtered.filter(e => e.type === 'expense' && e.status === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const pending = filtered.filter(e => e.status === 'pending').reduce((a, b) => a + Number(b.amount), 0);

        return { grouped, stats: { inflow, outflow, pending, total: inflow - outflow }, totalPages };
    }, [entries, searchQuery, filterType, currentPage]);

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Syncing Protocol</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10 pb-32 max-w-6xl mx-auto px-4">
            
            {/* --- MASTER BRANDED HEADER (SS Match) --- */}
            <div className="flex justify-between items-center mt-6 md:mt-10 px-1">
                <div className=" flex-col items-center gap-4 md:gap-5 w-full md:w-auto">
                    {/* Desktop: Icon on Left | Mobile: Text on Left (Icon on Right via flex-row-reverse) */}
                    <div className="flex flex-row items-center justify-start gap-4">
                        <div className="flex flex-col md:order-2">
                            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                                Timeline
                            </h2>
                            <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[3px] text-orange-500 mt-2">
                                Archive Synchronized
                            </p>
                        </div>
                        {/* Orange History Icon */}
                        <div className="w-11 h-11 md:w-14 md:h-14 bg-orange-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner md:order-1">
                            <History className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end opacity-20 hidden md:flex">
                    <Fingerprint className="w-8 h-8" />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-2">Verified OS</span>
                </div>
            </div>

            {/* Stats (2X2 Grid) */}
            <TimelineStats stats={stats} symbol={currencySymbol} />

            {/* Toolbar */}
            <TimelineToolbar 
                searchQuery={searchQuery} setSearchQuery={(val: string) => { setSearchQuery(val); setCurrentPage(1); }} 
                filterType={filterType} setFilterType={(val: string) => { setFilterType(val); setCurrentPage(1); }} 
            />

            {/* Feed with Master Card Design */}
            <TimelineFeed 
                groupedEntries={grouped} 
                currencySymbol={currencySymbol} 
                isEmpty={entries.length === 0}
                isSwitchingPage={isSwitchingPage}
                pagination={{ currentPage, totalPages, onPageChange: handlePageChange }}
            />
        </motion.div>
    );
};