"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Loader2, ArrowDownUp, SlidersHorizontal } from 'lucide-react';
import { db } from '@/lib/offlineDB';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { useModal } from '@/context/ModalContext';
import { useVault } from '@/hooks/useVault';

// Local Components
import { TimelineFeed } from './TimelineFeed';
import { TimelineMobileCards } from './TimelineMobileCards'; // 🔥 নতুন মোবাইল কার্ড ইন্টিগ্রেশন

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const TimelineSection = ({ currentUser }: any) => {
    const { T, t, language } = useTranslation();
    const { openModal, closeModal } = useModal();
    
    // ১. ভল্ট ইঞ্জিন ইন্টিগ্রেশন
    const { saveEntry, deleteEntry, toggleEntryStatus } = useVault(currentUser);

    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSwitchingPage, setIsSwitchingPage] = useState(false);
    
    // কন্ট্রোল স্টেটস
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortOption, setSortOption] = useState('date');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // ২. ডাটা লোড প্রোটোকল
    const fetchLocalTimeline = useCallback(async () => {
        try {
            if (!db.isOpen()) await db.open();
            const data = await db.entries.where('isDeleted').equals(0).toArray();
            setEntries(data);
        } catch (err) { 
            console.error("Timeline Load Error:", err); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => { fetchLocalTimeline(); }, [fetchLocalTimeline]);

    // ৩. অ্যাকশন হ্যান্ডলার্স (Elite Logic Injection)
    
    // এন্ট্রি সেভ লজিক (Add/Edit)
    const handleSaveEntryLogic = async (data: any, editTarget?: any) => {
        const success = await saveEntry(data, editTarget);
        if (success) {
            closeModal();
            fetchLocalTimeline(); // ডাটা রিফ্রেশ
            window.dispatchEvent(new Event('vault-updated')); // গ্লোবাল সিঙ্ক
            toast.success(t('protocol_secured') || "Protocol Secured");
        }
    };

    // এডিট মডাল কল
    const handleEdit = (entry: any) => {
        openModal('addEntry', { 
            entry, 
            currentUser, 
            onSubmit: (data: any) => handleSaveEntryLogic(data, entry) 
        });
    };

    // ডিলিট প্রোটোকল
    const handleDelete = (entry: any) => {
        openModal('deleteConfirm', {
            targetName: entry.title,
            onConfirm: async () => {
                await deleteEntry(entry);
                closeModal();
                fetchLocalTimeline();
                window.dispatchEvent(new Event('vault-updated'));
                toast.success(t('entry_terminated') || "Entry Terminated");
            }
        });
    };

    // স্ট্যাটাস টগল
    const handleToggleStatus = async (entry: any) => {
        await toggleEntryStatus(entry);
        fetchLocalTimeline();
        window.dispatchEvent(new Event('vault-updated'));
    };

    // ৪. ফিল্টারিং ও সর্টিং ইঞ্জিন (Memoized)
    const { grouped, totalPages } = useMemo(() => {
        let filtered = entries.filter(e => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesType;
        });

        filtered.sort((a, b) => {
            if (sortOption === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
            if (sortOption === 'amount') return b.amount - a.amount;
            return (a.title || "").localeCompare(b.title || "");
        });

        const totalPagesCount = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);

        const groupedData: { [key: string]: any[] } = {};
        pageData.forEach(entry => {
            const dateStr = new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            if (!groupedData[dateStr]) groupedData[dateStr] = [];
            groupedData[dateStr].push(entry);
        });

        return { grouped: groupedData, totalPages: totalPagesCount };
    }, [entries, searchQuery, filterType, sortOption, currentPage]);

    const handlePageChange = (newPage: number) => {
        setIsSwitchingPage(true);
        setTimeout(() => {
            setCurrentPage(newPage);
            setIsSwitchingPage(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 350);
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <span className="text-[10px] font-black uppercase tracking-[5px] text-orange-500/40 animate-pulse">{t('syncing_protocol')}</span>
        </div>
    );

    return (
        <div className="w-full max-w-[1920px] mx-auto pb-40">
            
            {/* --- ১. MASTER HUB HEADER --- */}
            <HubHeader 
                title={T('nav_timeline')} 
                subtitle={`${toBn(entries.length, language)} ${T('active_protocols')}`}
                icon={History}
                showSearch={true}
                searchQuery={searchQuery}
                onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
            >
                <div className="flex items-center gap-2">
                    {/* সর্ট ড্রপডাউন (সিঙ্ক্রোনাইজড) */}
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="h-11 px-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase outline-none focus:border-orange-500/50 cursor-pointer text-[var(--text-main)] appearance-none hidden md:block">
                        <option value="date">{t('sort_date')}</option>
                        <option value="amount">{t('sort_amount')}</option>
                        <option value="title">{t('sort_title')}</option>
                    </select>

                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-11 px-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase outline-none focus:border-orange-500/50 cursor-pointer text-[var(--text-main)] appearance-none hidden md:block">
                        <option value="all">{t('all')}</option>
                        <option value="income">{t('income')}</option>
                        <option value="expense">{t('expense')}</option>
                    </select>
                </div>
            </HubHeader>

            {/* --- ২. FEED AREA (Desktop Table & Mobile Cards) --- */}
            <div className="px-[var(--app-padding,1.25rem)] md:px-8 mt-4">
                
                {/* ১. ডেস্কটপ টেবিল ভিউ */}
                <TimelineFeed 
                    groupedEntries={grouped} 
                    currencySymbol={currencySymbol} 
                    isEmpty={entries.length === 0}
                    isSwitchingPage={isSwitchingPage}
                    pagination={{ currentPage, totalPages, onPageChange: handlePageChange }}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />

                {/* ২. মোবাইল কার্ড ভিউ */}
                <TimelineMobileCards 
                    groupedEntries={grouped}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    currencySymbol={currencySymbol}
                />

            </div>
        </div>
    );
};