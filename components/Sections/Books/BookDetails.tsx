"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ChevronLeft, ChevronRight, Inbox, Zap } from 'lucide-react';

// Refactored Components
import { StatsGrid } from './StatsGrid';
import { TransactionTable } from './TransactionTable';
import { MobileTransactionCards } from './MobileTransactionCards';
import { DetailsToolbar } from './DetailsToolbar';
import { MobileFilterSheet } from './MobileFilterSheet';

// Global Engine Hooks
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const BookDetails = ({ 
    currentBook, items, onBack, onEdit, onDelete, onToggleStatus, 
    searchQuery, setSearchQuery, pagination, currentUser, stats
}: any) => {
    const { T, t, language } = useTranslation();
    
    // --- ১. স্টেট লজিক (Strict Preservation) ---
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showMobileSettings, setShowMobileSettings] = useState(false);
    
    const userCategories = ['all', ...(currentUser?.categories || [])];
    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";

    // --- ২. স্মার্ট ডাটা প্রসেসিং (useMemo for Performance) ---
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full pb-36 transition-all duration-500"
        >
            <div className=" md:px-8 lg:px-10 space-y-2 sm:space-y-4 lg:space-y-8">
                
                {/* ১. এনালিটিক্যাল স্ট্যাটাস গ্রিড */}
                <StatsGrid 
                    income={stats?.inflow || 0} 
                    expense={stats?.outflow || 0} 
                    labelPrefix={T('vault_prefix') || "Vault"} 
                    currency={currentUser?.currency} 
                />

                {/* ২. কমান্ড সেন্টার (টুলবার) */}
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

                {/* ৩. মোবাইল ফিল্টার ড্রয়ার */}
                <MobileFilterSheet 
                    isOpen={showMobileSettings}
                    onClose={() => setShowMobileSettings(false)}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                    userCategories={userCategories}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                />

                {/* ৪. ট্রানজ্যাকশন কন্টেইনার (Master Ledger) */}
                <div className="relative min-h-[450px] transition-all duration-500 md:bg-[var(--bg-card)]/50 md:backdrop-blur-xl md:rounded-[40px] md:border md:border-[var(--border)] md:shadow-2xl overflow-hidden">
                    
                    {/* Header Decoration for Desktop */}
                    <div className="hidden md:flex items-center gap-3 p-6 border-b border-[var(--border)] opacity-40">
                        <Zap size={14} className="text-orange-500" />
                        <span className="text-[10px] font-black uppercase tracking-[4px]">{T('ledger_live_feed')}</span>
                    </div>

                    <TransactionTable 
                        items={currentItems} onEdit={onEdit} onDelete={onDelete} 
                        onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} 
                    />
                    
                    <MobileTransactionCards 
                        items={currentItems} onEdit={onEdit} onDelete={onDelete} 
                        onToggleStatus={onToggleStatus} currencySymbol={currencySymbol} 
                    />
                    
                    {/* ৫. এম্পটি স্টেট (Native Style) */}
                    <AnimatePresence>
                        {currentItems.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-6"
                            >
                                <div className="w-24 h-24 bg-[var(--bg-app)] rounded-[35px] flex items-center justify-center border border-[var(--border)] shadow-inner">
                                    <Inbox size={40} strokeWidth={1} className="opacity-20" />
                                </div>
                                <div className="text-center">
                                    <p className="font-black uppercase text-[11px] tracking-[5px] opacity-40">{T('empty_ledger') || "No Protocol Records"}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-[2px] opacity-20 mt-2">{T('empty_ledger_desc') || "Start by adding a new entry"}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ৬. স্মার্ট প্যানিনেশন কন্ট্রোল */}
                <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-6 opacity-80">
                    <div className=" hidden md:flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                             <LayoutGrid size={14} />
                        </div>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{T('protocol_archive')}</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <Tooltip text={t('tt_prev_page')}>
                            <button 
                                disabled={pagination?.currentPage === 1} 
                                onClick={() => pagination?.setPage(pagination.currentPage - 1)} 
                                className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90"
                            >
                                <ChevronLeft size={22} strokeWidth={3}/>
                            </button>
                        </Tooltip>

                        <div className="px-8 py-3.5 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-[3px] shadow-xl shadow-orange-500/20">
                            {toBn(pagination?.currentPage, language)} 
                            <span className="opacity-50 mx-2">/</span> 
                            {toBn(pagination?.totalPages, language)}
                        </div>

                        <Tooltip text={t('tt_next_page')}>
                            <button 
                                disabled={pagination?.currentPage === pagination?.totalPages} 
                                onClick={() => pagination?.setPage(pagination.currentPage + 1)} 
                                className="w-12 h-12 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl disabled:opacity-20 hover:border-orange-500 transition-all active:scale-90"
                            >
                                <ChevronRight size={22} strokeWidth={3}/>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};