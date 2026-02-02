"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Loader2, History } from 'lucide-react';
import { db } from '@/lib/offlineDB';

import { TimelineStats } from './components/TimelineStats';
import { TimelineToolbar } from './components/TimelineToolbar';
import { TimelineFeed } from './components/TimelineFeed';

export const TimelineSection = ({ currentUser }: any) => {
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

    const { filteredData, grouped, stats, totalPages } = useMemo(() => {
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

        return { filteredData: pageData, grouped, stats: { inflow, outflow, pending, total: inflow - outflow }, totalPages };
    }, [entries, searchQuery, filterType, currentPage]);

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-[var(--text-muted)] animate-pulse">Syncing Protocol</span>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 md:space-y-8 pb-32 max-w-6xl mx-auto px-4">
            
            {/* COMPACT NATIVE HEADER */}
            <div className="flex justify-between items-end mt-4 md:mt-6">
                <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                        <History className="w-[18px] h-[18px] text-orange-500" />
                        <h2 className="text-2xl md:text-5xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">Timeline</h2>
                    </div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[3px] text-orange-500 opacity-80 ml-1">Archive Synchronized</p>
                </div>
                <div className="flex flex-col items-end opacity-30 hidden md:flex">
                    <Fingerprint className="w-7 h-7" />
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1">Verified Registry</span>
                </div>
            </div>

            {/* STATS (2X2 Grid) */}
            <TimelineStats stats={stats} symbol={currencySymbol} />

            {/* TOOLBAR */}
            <TimelineToolbar 
                searchQuery={searchQuery} setSearchQuery={(val: string) => { setSearchQuery(val); setCurrentPage(1); }} 
                filterType={filterType} setFilterType={(val: string) => { setFilterType(val); setCurrentPage(1); }} 
            />

            {/* FEED WITH PAGINATION */}
            <TimelineFeed 
                groupedEntries={grouped} 
                currencySymbol={currencySymbol} 
                isEmpty={entries.length === 0}
                isSwitchingPage={isSwitchingPage}
                pagination={{
                    currentPage,
                    totalPages,
                    onPageChange: handlePageChange
                }}
            />
        </motion.div>
    );
};