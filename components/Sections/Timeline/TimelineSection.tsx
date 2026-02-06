"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Fingerprint, Loader2, History, Zap, ShieldCheck, 
    TrendingUp, TrendingDown, Wallet, Clock 
} from 'lucide-react';
import { db } from '@/lib/offlineDB';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Local Components (Refined v5.2)
import { TimelineStats } from './TimelineStats';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineFeed } from './TimelineFeed';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const TimelineSection = ({ currentUser, onBack }: any) => {
    const { T, t, language } = useTranslation();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSwitchingPage, setIsSwitchingPage] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- 🧬 ১. ডাটা লোড প্রোটোকল ---
    const fetchLocalTimeline = async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            // লেটেস্ট ট্রানজ্যাকশন সবার আগে
            setEntries(data.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()));
        } catch (err) { 
            console.error("Timeline Sync Error:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchLocalTimeline(); }, []);

    // --- 🧬 ২. মাস্টার ক্যালকুলেশন ইঞ্জিন (Report Mismatch Fix) ---
    const { grouped, stats, totalPages } = useMemo(() => {
        // ফিক্স: ব্যালেন্স সবসময় অল ডাটা (entries) থেকে আসবে, সার্চ রেজাল্ট থেকে নয়
        const totalInflow = entries.filter(e => e.type === 'income' && e.status === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const totalOutflow = entries.filter(e => e.type === 'expense' && e.status === 'completed').reduce((a, b) => a + Number(b.amount), 0);
        const totalPending = entries.filter(e => e.status === 'pending').reduce((a, b) => a + Number(b.amount), 0);

        // ফিল্টারিং লজিক (শুধুমাত্র লিস্টের জন্য)
        const filtered = entries.filter(e => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesType;
        });

        const totalPagesCount = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);

        // গ্রুপিং লজিক
        const groupedData: { [key: string]: any[] } = {};
        pageData.forEach(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!groupedData[dateStr]) groupedData[dateStr] = [];
            groupedData[dateStr].push(entry);
        });

        return { 
            grouped: groupedData, 
            stats: { 
                inflow: totalInflow, 
                outflow: totalOutflow, 
                pending: totalPending, 
                total: totalInflow - totalOutflow 
            }, 
            totalPages: totalPagesCount 
        };
    }, [entries, searchQuery, filterType, currentPage]);

    const handlePageChange = (newPage: number) => {
        setIsSwitchingPage(true);
        setTimeout(() => {
            setCurrentPage(newPage);
            setIsSwitchingPage(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 350);
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 transition-all duration-500">
            <div className="relative">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <Fingerprint className="absolute inset-0 m-auto text-orange-500/30" size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[5px] text-orange-500/40 animate-pulse">
                {t('syncing_protocol')}
            </span>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-[1400px] mx-auto space-y-[var(--app-gap,2.5rem)] pb-40 px-[var(--app-padding,1.25rem)] md:px-8 transition-all duration-500"
        >
            
            {/* --- ১. MASTER IDENTITY HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mt-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-orange-500/30 shrink-0">
                        <History size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">
                            {T('nav_timeline')}
                        </h2>
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className="flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                                <ShieldCheck size={12} strokeWidth={3} />
                                <span className="text-[8px] font-black uppercase tracking-[2px]">
                                    {t('archive_synchronized')}
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-[3px] ml-1">
                                FEED V5.2
                            </span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="bg-[var(--bg-card)]/50 backdrop-blur-md px-6 py-3.5 rounded-[22px] border border-[var(--border)] shadow-sm flex items-center gap-4 group hover:border-orange-500/30 transition-all duration-500">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-muted)] opacity-50 mb-1 leading-none">OS IDENTITY</span>
                            <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest">{T('verified_os')}</span>
                        </div>
                        <Fingerprint size={22} className="text-orange-500/40 group-hover:text-orange-500 transition-colors" strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {/* --- ২. SUMMARY RIBBON (Replacing the 4 cards) --- */}
            <TimelineStats stats={stats} symbol={currencySymbol} />

            {/* --- ৩. CONTROL CENTER (Search & Filters) --- */}
            <TimelineToolbar 
                searchQuery={searchQuery} setSearchQuery={(val: string) => { setSearchQuery(val); setCurrentPage(1); }} 
                filterType={filterType} setFilterType={(val: string) => { setFilterType(val); setCurrentPage(1); }} 
            />

            {/* --- ৪. THE PROTOCOL FEED --- */}
            <TimelineFeed 
                groupedEntries={grouped} 
                currencySymbol={currencySymbol} 
                isEmpty={entries.length === 0}
                isSwitchingPage={isSwitchingPage}
                pagination={{ 
                    currentPage, 
                    totalPages, 
                    onPageChange: handlePageChange,
                    totalItemsLabel: toBn(entries.length, language)
                }}
            />
        </motion.div>
    );
};