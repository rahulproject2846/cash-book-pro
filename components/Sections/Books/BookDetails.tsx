"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ChevronLeft, ChevronRight, Inbox, Zap } from 'lucide-react';

// Sub Components
import { StatsGrid } from './StatsGrid';
import { TransactionTable } from './TransactionTable';
import { MobileTransactionCards } from './MobileTransactionCards';
import { DetailsToolbar } from './DetailsToolbar';
import { MobileFilterSheet } from './MobileFilterSheet';

// Global UI Components
import { useTranslation } from '@/hooks/useTranslation';
import { toBn } from '@/lib/utils/helpers'; 
import { Tooltip } from '@/components/UI/Tooltip';



export const BookDetails = ({ 
    currentBook, items, onBack, onEdit, onDelete, onToggleStatus, 
    searchQuery, setSearchQuery, pagination, currentUser, stats
}: any) => {
    const { T, t, language } = useTranslation();
    
    // ১. ফিল্টার ও সর্ট স্টেট
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ২. মাস্টার সর্টিং ও ফিল্টারিং প্রোটোকল (FIXED: Instant Update logic) ---
    const processedItems = useMemo(() => {
        if (!items) return [];

        // ক. ফিল্টারিং লজিক (Surgical Fix: localId এবং _id সিঙ্ক করা হয়েছে)
        let list = items.filter((item: any) => {
            const matchesSearch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
            
            // আইডি চেকিং: এটি নিশ্চিত করে যে এন্ট্রি করার পর ডাটা উধাও হবে না
            const currentBookId = String(currentBook?._id || currentBook?.localId);
            const entryBookId = String(item.bookId);
            const matchesBook = currentBookId === entryBookId;

            return matchesSearch && matchesBook;
        });
        
        if (categoryFilter !== 'all') {
            list = list.filter((item: any) => (item.category || "").toLowerCase() === categoryFilter.toLowerCase());
        }

        // খ. সর্টিং: createdAt মিলি-সেকেন্ড দিয়ে (Latest First)
        list.sort((a: any, b: any) => {
            const valA = a[sortConfig.key] || 0;
            const valB = b[sortConfig.key] || 0;
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        });

        return list;
    }, [items, searchQuery, categoryFilter, sortConfig, currentBook?._id, currentBook?.localId]);

    const currentItems = processedItems.slice(((pagination?.currentPage || 1) - 1) * 10, (pagination?.currentPage || 1) * 10);

    if (!currentBook) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full pb-36 transition-all duration-500"
        >
            <div className="md:px-8 lg:px-10 space-y-4 lg:space-y-8">
                
                <StatsGrid 
                    income={stats?.inflow || 0} 
                    expense={stats?.outflow || 0} 
                    pending={stats?.pending || 0}
                    labelPrefix={T('vault_prefix') || "Vault"} 
                    currency={currentUser?.currency} 
                />

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

                <div className="relative min-h-[450px] transition-all duration-500 md:bg-[var(--bg-card)] md:backdrop-blur-xl md:rounded-[40px] md:border md:border-[var(--border)] md:shadow-2xl overflow-hidden">
                    <div className="hidden md:flex items-center gap-3 p-6 border-b border-[var(--border)] opacity-40">
                        <Zap size={14} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[4px]">{T('ledger_live_feed')}</span>
                    </div>

                    <TransactionTable items={currentItems} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} />
                    <MobileTransactionCards items={currentItems} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} />
                    
                    <AnimatePresence>
                        {currentItems.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6">
                                <div className="w-24 h-24 bg-[var(--bg-app)] rounded-[35px] flex items-center justify-center border border-[var(--border)] opacity-20"><Inbox size={40} /></div>
                                <p className="font-black uppercase text-[11px] tracking-[5px] opacity-40">{T('empty_ledger')}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-6 opacity-80">
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                             <LayoutGrid size={14} />
                        </div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{T('protocol_archive')}</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <Tooltip text={t('tt_prev_page')}>
                            <button disabled={pagination?.currentPage === 1} onClick={() => pagination?.setPage(pagination.currentPage - 1)} className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90 shadow-sm"><ChevronLeft size={22} strokeWidth={3}/></button>
                        </Tooltip>
                        <div className="px-8 py-3.5 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[3px] shadow-xl">
                            {toBn(pagination?.currentPage, language)} / {toBn(pagination?.totalPages, language)}
                        </div>
                        <Tooltip text={t('tt_next_page')}>
                            <button disabled={pagination?.currentPage === pagination?.totalPages} onClick={() => pagination?.setPage(pagination.currentPage + 1)} className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90 shadow-sm"><ChevronRight size={22} strokeWidth={3}/></button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};