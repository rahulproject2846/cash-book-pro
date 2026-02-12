"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ChevronLeft, ChevronRight, Inbox, Zap, GitCommit, ShieldCheck, Activity } from 'lucide-react';

// Sub Components
import { StatsGrid } from '@/components/UI/StatsGrid'; 
import { TransactionTable } from './TransactionTable';
import MobileLedgerCards from '@/components/UI/MobileLedgerCards';
import { DetailsToolbar } from './DetailsToolbar';
import { MobileFilterSheet } from './MobileFilterSheet';

// Global UI Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers
import { Tooltip } from '@/components/UI/Tooltip';

export const BookDetails = ({ 
    currentBook, items, onBack, onAdd, onEdit, onDelete, onToggleStatus, 
    searchQuery, setSearchQuery, pagination, currentUser, stats
}: any) => {
    const { T, t, language } = useTranslation();
    
    // ১. ফিল্টার ও সর্ট স্টেট
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ২. মাস্টার সর্টিং ও ফিল্টারিং ইঞ্জিন (V11.5 Standard) ---
    const processedItems = useMemo(() => {
        if (!items) return [];

        let list = items.filter((item: any) => {
            const matchesSearch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            const currentBookId = String(currentBook?._id || currentBook?.localId);
            const entryBookId = String(item.bookId);
            return matchesSearch && currentBookId === entryBookId;
        });
        
        if (categoryFilter !== 'all') {
            list = list.filter((item: any) => (item.category || "").toLowerCase() === categoryFilter.toLowerCase());
        }

        list.sort((a: any, b: any) => {
            const valA = a[sortConfig.key] || 0;
            const valB = b[sortConfig.key] || 0;
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        return list;
    }, [items, searchQuery, categoryFilter, sortConfig, currentBook]);

    const currentItems = processedItems.slice(((pagination?.currentPage || 1) - 1) * 10, (pagination?.currentPage || 1) * 10);

    if (!currentBook) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] pb-36 transition-all duration-500"
        >
            <div className="md:px-8 lg:px-10 space-y-10 mt-2">
                
                {/* --- ১. DYNAMIC STATS GRID --- */}
                <StatsGrid 
                    income={stats?.inflow || 0} 
                    expense={stats?.outflow || 0} 
                    pending={stats?.pending || 0}
                    surplus={(stats?.inflow || 0) - (stats?.outflow || 0)}
                    currency={currentUser?.currency} 
                />

                {/* --- ২. CONTROL HUB (Search & Filter) --- */}
                <div className="space-y-6">
                    <DetailsToolbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        sortConfig={sortConfig} setSortConfig={setSortConfig}
                        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                        userCategories={userCategories}
                        onMobileToggle={() => setShowMobileSettings(true)}
                    />

                    <MobileFilterSheet 
                        isOpen={showMobileSettings} onClose={() => setShowMobileSettings(false)}
                        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                        userCategories={userCategories}
                        sortConfig={sortConfig} setSortConfig={setSortConfig}
                    />
                </div>

                {/* --- ৩. MAIN LEDGER VIEW (The Apple Metal Container) --- */}
                <div className={cn(
                    "relative min-h-[500px] transition-all duration-500",
                    "md:bg-[var(--bg-card)] md:backdrop-blur-3xl md:rounded-[40px] md:border md:border-[var(--border)] md:shadow-2xl overflow-hidden"
                )}>
                    {/* Feed Header */}
                    <div className="hidden md:flex items-center justify-between p-7 border-b border-[var(--border)] bg-[var(--bg-app)]/30">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-500/10 rounded-xl">
                                <Zap size={16} className="text-orange-500 animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[4px] text-[var(--text-main)]">{T('ledger_live_feed')}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-30">
                            <ShieldCheck size={14} className="text-green-500" />
                            <span className="text-[8px] font-black uppercase tracking-[2px]">Encrypted Stream Active</span>
                        </div>
                    </div>

                    {/* Table View (Desktop) */}
                    <TransactionTable items={currentItems} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} />
                    
                    {/* Card View (Mobile) - Using the New Unified Ledger Cards */}
                    <div className="md:hidden">
                        <MobileLedgerCards 
                            isGrouped={false}
                            items={currentItems} 
                            onEdit={onEdit}
                            onDelete={onDelete} 
                            onToggleStatus={onToggleStatus}
                            currencySymbol={currencySymbol}
                        />
                    </div>
                    
                    {/* Empty State Overlay */}
                    <AnimatePresence>
                        {currentItems.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6 py-20">
                                <div className="w-24 h-24 bg-[var(--bg-app)] rounded-[40px] flex items-center justify-center border border-[var(--border)] shadow-inner opacity-20">
                                    <Inbox size={48} strokeWidth={1} />
                                </div>
                                <p className="font-black uppercase text-[11px] tracking-[5px] opacity-40">{T('empty_ledger')}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- ৪. MASTER ARCHIVE FOOTER & PAGINATION --- */}
                <div className="flex flex-col md:flex-row justify-between items-center py-10 gap-8 opacity-90 border-t border-[var(--border)]/20 mt-6">
                    <div className="hidden md:flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
                             <GitCommit size={20} strokeWidth={3} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[4px] leading-none">{T('protocol_archive')}</p>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1.5 opacity-60">Sequence Verified</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <Tooltip text={t('tt_prev_page')} position="bottom">
                            <button 
                                disabled={pagination?.currentPage === 1} 
                                onClick={() => pagination?.setPage(pagination.currentPage - 1)} 
                                className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90 shadow-xl"
                            >
                                <ChevronLeft size={28} strokeWidth={3}/>
                            </button>
                        </Tooltip>

                        <div className="px-10 py-4 bg-orange-500 text-white rounded-[24px] text-[13px] font-black uppercase tracking-[4px] shadow-2xl shadow-orange-500/30">
                            {toBn(pagination?.currentPage, language)} <span className="opacity-40 mx-1">/</span> {toBn(pagination?.totalPages, language)}
                        </div>

                        <Tooltip text={t('tt_next_page')} position="bottom">
                            <button 
                                disabled={pagination?.currentPage === pagination?.totalPages} 
                                onClick={() => pagination?.setPage(pagination.currentPage + 1)} 
                                className="w-14 h-14 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90 shadow-xl"
                            >
                                <ChevronRight size={28} strokeWidth={3}/>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};