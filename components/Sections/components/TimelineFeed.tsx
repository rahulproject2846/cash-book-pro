"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, History, ChevronLeft, ChevronRight, Loader2, Database } from 'lucide-react';
import { MasterTransactionCard } from './MasterTransactionCard';

export const TimelineFeed = ({ 
    groupedEntries, 
    currencySymbol, 
    isEmpty, 
    isSwitchingPage, 
    pagination 
}: any) => {

    if (isEmpty) return (
        <div className="py-32 text-center opacity-20 flex flex-col items-center gap-4">
            <History className="w-12 h-12" strokeWidth={1} />
            <p className="text-[11px] font-black uppercase tracking-[6px]">No Protocol Registry Found</p>
        </div>
    );

    return (
        <div className="space-y-6 md:space-y-12 relative min-h-[400px]">
            {/* Page Transition Overlay */}
            <AnimatePresence>
                {isSwitchingPage && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--bg-app)]/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center gap-3"
                    >
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                        <span className="text-[9px] font-black uppercase tracking-[4px] text-orange-500">Syncing Page...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-6 md:space-y-12">
                {Object.keys(groupedEntries).map((date) => (
                    <div key={date} className="relative">
                        {/* Area 1: Optimized Date Header & Record Counter */}
                        <div className="flex items-center justify-between mb-3 md:mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                                    <Calendar className="w-[14px] h-[14px] md:w-4 md:h-4" />
                                </div>
                                <h3 className="text-[9px] md:text-[10px] font-black text-[var(--text-main)] uppercase tracking-[2px] md:tracking-[3px] bg-[var(--bg-card)] px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-[var(--border-color)]">
                                    {date}
                                </h3>
                            </div>

                            {/* --- Area 1: Protocol Entry Counter --- */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm">
                                    <Database className="w-2.5 h-2.5 text-orange-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        {String(groupedEntries[date].length).padStart(2, '0')} Protocols
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Staggered Grid for Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {groupedEntries[date].map((entry: any) => (
                                <MasterTransactionCard 
                                    key={entry.localId || entry._id} 
                                    e={entry} 
                                    currencySymbol={currencySymbol} 
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* COMPACT PAGINATION */}
            <div className="flex justify-between items-center py-5 md:py-10 border-t border-[var(--border-color)]/30 mt-4 md:mt-10">
                <p className="text-[8px] md:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">System Index {pagination.currentPage}</p>
                <div className="flex gap-2 items-center">
                    <button 
                        disabled={pagination.currentPage === 1 || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        className="p-2.5 md:p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl md:rounded-2xl disabled:opacity-20 active:scale-90 transition-all"
                    >
                        <ChevronLeft className="w-[18px] h-[18px] md:w-5 md:h-5" />
                    </button>
                    <div className="px-5 md:px-6 py-2.5 md:py-3 bg-orange-500 text-white rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[2px] shadow-lg">
                        {pagination.currentPage} <span className="opacity-40 mx-1">/</span> {pagination.totalPages}
                    </div>
                    <button 
                        disabled={pagination.currentPage === pagination.totalPages || isSwitchingPage}
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        className="p-2.5 md:p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl md:rounded-2xl disabled:opacity-20 active:scale-90 transition-all"
                    >
                        <ChevronRight className="w-[18px] h-[18px] md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};