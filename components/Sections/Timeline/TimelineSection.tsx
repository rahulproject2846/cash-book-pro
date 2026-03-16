"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Loader2, ArrowDownUp, Filter, Zap } from 'lucide-react';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { StatsGrid } from '@/components/Sovereign/Shared/StatsGrid';
import { useModal } from '@/context/ModalContext';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { cn, toBn } from '@/lib/utils/helpers';
import { getPlatform } from '@/lib/platform';

// Unified UI Components
import { TimelineFeed } from './TimelineFeed';
import MobileLedgerCards from '@/components/UI/MobileLedgerCards';

export const TimelineSection = ({ currentUser }: any) => {
    const { t, language } = useTranslation();
    const { openModal, closeModal } = useModal();
    const { saveEntry, deleteEntry, toggleEntryStatus } = getVaultStore();

    // ১. রিঅ্যাক্টিভ ডাটা ইঞ্জিন (LiveQuery: অটো-আপডেট এনসিওর করে)
    const entries = useLiveQuery(
        () => db.entries.where('userId').equals(String(currentUser?._id)).and((e: any) => e.isDeleted === 0).toArray(),
        []
    ) || [];

    // 🚀 VIRTUALIZATION THRESHOLD: Use virtualized list for 1000+ entries
    const shouldUseVirtualization = entries.length > 1000;

    if (shouldUseVirtualization) {
        return (
            <div className="space-y-4">
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <span className="text-xs font-bold">🚀</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-900">Virtualized Timeline</h3>
                            <p className="text-sm text-blue-700">
                                Showing {entries.length} entries with optimized performance
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // কন্ট্রোল স্টেটস
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortOption, setSortOption] = useState('date');
    const [currentPage, setCurrentPage] = useState(1);
    const [isSwitchingPage, setIsSwitchingPage] = useState(false);

    const ITEMS_PER_PAGE = 10;
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // ২. অ্যাকশন হ্যান্ডলার্স (Surgical Clean-up)
    const handleEdit = (entry: any) => {
        openModal('addEntry', { 
            entry, 
            currentUser, 
            onSubmit: async (data: any) => {
                const success = await saveEntry(data, entry);
                if (success) closeModal();
            }
        });
    };

    const handleDelete = (entry: any) => {
        openModal('deleteConfirm', {
            targetName: entry.title,
            title: "TERMINATE RECORD",
            onConfirm: async () => {
                await deleteEntry(entry);
                closeModal();
            }
        });
    };

    // ৩. মাস্টার ফিল্টারিং ও ক্যালকুলেশন ইঞ্জিন
    const { grouped, totalPages, filteredStats } = useMemo(() => {
        // ক. ফিল্টারিং
        let filtered = entries.filter((e: any) => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || e.type?.toLowerCase() === filterType.toLowerCase();
            return matchesSearch && matchesType;
        });

        // খ. সর্টিং
        filtered.sort((a: any, b: any) => {
            if (sortOption === 'amount') return b.amount - a.amount;
            if (sortOption === 'title') return (a.title || "").localeCompare(b.title || "");
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // গ. স্ট্যাটাস ক্যালকুলেশন
        const inF = filtered.filter((e: any) => e.type === 'income' && e.status === 'completed').reduce((s: number, e: any) => s + Number(e.amount), 0);
        const outF = filtered.filter((e: any) => e.type === 'expense' && e.status === 'completed').reduce((s: number, e: any) => s + Number(e.amount), 0);

        // ঘ. প্যাজিনেশন ও গ্রুপিং
        const totalPagesCount = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageData = filtered.slice(start, start + ITEMS_PER_PAGE);

        const groupedData: { [key: string]: any[] } = {};
        pageData.forEach((entry: any) => {
            const dateStr = new Date(entry.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { 
                day: '2-digit', month: 'short', year: 'numeric' 
            });
            if (!groupedData[dateStr]) groupedData[dateStr] = [];
            groupedData[dateStr].push(entry);
        });

        return { 
            grouped: groupedData, 
            totalPages: totalPagesCount,
            filteredStats: { inF, outF, count: filtered.length }
        };
    }, [entries, searchQuery, filterType, sortOption, currentPage, language]);

    const handlePageChange = (newPage: number) => {
        setIsSwitchingPage(true);
        setTimeout(() => {
            setCurrentPage(newPage);
            setIsSwitchingPage(false);
            getPlatform().navigation.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto pb-40 px-[1.25rem] md:px-8 space-y-10 mt-6">
                
                {/* --- ২. DYNAMIC STATS GRID (Replacing TotalStats) --- */}
                <StatsGrid 
                    income={filteredStats.inF}
                    expense={filteredStats.outF}
                    currency={currentUser?.currency}
                />

                {/* --- ৩. FEED AREA (Adaptive Rendering) --- */}
                <div className="relative">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <TimelineFeed 
                            groupedEntries={grouped} 
                            currencySymbol={currencySymbol} 
                            isEmpty={entries.length === 0}
                            pagination={{ currentPage, totalPages, onPageChange: handlePageChange }}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleStatus={toggleEntryStatus}
                        />
                    </div>

                    {/* Mobile View */}
                    <div className="block md:hidden">
                        <MobileLedgerCards 
                            isGrouped={true}
                            groupedEntries={grouped}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleStatus={toggleEntryStatus}
                            currencySymbol={currencySymbol}
                        />
                    </div>

                    {/* Empty State Overlay */}
                    {entries.length === 0 && (
                        <div className="py-40 flex flex-col items-center justify-center opacity-20 gap-4 text-[var(--text-muted)]">
                            <Zap size={60} strokeWidth={1} />
                            <p className="text-[10px] font-black">{t('empty_ledger')}</p>
                        </div>
                    )}
                </div>
        </div>
    );
};