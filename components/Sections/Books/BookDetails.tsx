"use client";
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

// Refactored Components
import { StatsGrid } from './StatsGrid';
import { TransactionTable } from './TransactionTable';
import { MobileTransactionCards } from './MobileTransactionCards';
import { DetailsToolbar } from './DetailsToolbar';
import { MobileFilterSheet } from './MobileFilterSheet';

export const BookDetails = ({ 
    currentBook, items, onBack, onEdit, onDelete, onToggleStatus, 
    searchQuery, setSearchQuery, pagination, currentUser, stats
}: any) => {
    
    // --- ১. স্টেট লজিক ---
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ২. স্মার্ট ডাটা প্রসেসিং (useMemo for optimization) ---
    const processedItems = useMemo(() => {
        let list = [...(items || [])].filter(i => (i.title || "").toLowerCase().includes(searchQuery.toLowerCase()));
        
        if (categoryFilter !== 'all') {
            list = list.filter(item => (item.category || "").toLowerCase() === categoryFilter.toLowerCase());
        }

        list.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA !== dateB) return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                return (b.createdAt || 0) - (a.createdAt || 0);
            }
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            return sortConfig.direction === 'asc' ? (valA < valB ? -1 : 1) : (valA > valB ? -1 : 1);
        });

        return list;
    }, [items, searchQuery, categoryFilter, sortConfig]);

    const currentItems = processedItems.slice(((pagination?.currentPage || 1) - 1) * 10, (pagination?.currentPage || 1) * 10);

    if (!currentBook) return null;

    return (
        <div className="w-full pb-32">
            <div className="px-4 md:px-10 space-y-8">
                
                {/* ১. স্ট্যাটাস কার্ডস */}
                <StatsGrid 
                    income={stats?.inflow || 0} 
                    expense={stats?.outflow || 0} 
                    labelPrefix="Vault" 
                    currency={currentUser?.currency} 
                />

                {/* ২. নতুন রিফ্যাক্টরড টুলবার */}
                <DetailsToolbar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    userCategories={userCategories}
                    onMobileToggle={() => setShowMobileSettings(true)}
                />

                {/* ৩. মোবাইল ফিল্টার সিট */}
                <MobileFilterSheet 
                    isOpen={showMobileSettings}
                    onClose={() => setShowMobileSettings(false)}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    userCategories={userCategories}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                />

                {/* ৪. ডেটা রেন্ডারিং (Table & Mobile Cards) */}
                <div className="overflow-hidden relative transition-all duration-300 md:bg-[var(--bg-card)] md:rounded-[32px] md:border md:border-[var(--border-color)] md:shadow-sm md:min-h-[500px] bg-transparent border-none">
                    <TransactionTable items={currentItems} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} />
                    <MobileTransactionCards items={currentItems} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} />
                    
                    {currentItems.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-20 gap-4">
                            <LayoutGrid size={48} strokeWidth={1} />
                            <p className="font-black uppercase text-[10px] tracking-[4px]">Empty Protocol Records</p>
                        </div>
                    )}
                </div>

                {/* ৫. স্মার্ট পেজিনেশন */}
                <div className="flex justify-between items-center py-4 px-2">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase hidden md:block tracking-[3px]">Protocol Archive</p>
                    <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end items-center">
                        <button disabled={pagination?.currentPage === 1} onClick={() => pagination?.setPage(pagination.currentPage - 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronLeft size={20}/></button>
                        <div className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20">{pagination?.currentPage} / {pagination?.totalPages}</div>
                        <button disabled={pagination?.currentPage === pagination?.totalPages} onClick={() => pagination?.setPage(pagination.currentPage + 1)} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all"><ChevronRight size={20}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};