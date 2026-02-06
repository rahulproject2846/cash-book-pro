"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, ShieldCheck, Cpu } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const SettingsHeader = ({ isLoading }: { isLoading: boolean }) => {
    const { T, t } = useTranslation();

    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mb-10"
        >
            {/* --- LEFT SECTION: IDENTITY --- */}
            <div className="flex items-center gap-4">
                {/* OS Icon Box */}
                <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-orange-500/20 shrink-0">
                    <Settings size={28} strokeWidth={2.5} className={isLoading ? 'animate-spin-slow' : ''} />
                </div>

                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">
                        {T('nav_system') || "CONFIGURATION"}<span className="text-orange-500">.</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 mt-2.5">
                        {/* Sync Status Badge */}
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                            <div className="relative flex h-2 w-2">
                                {isLoading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoading ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[2px]">
                                {isLoading ? t('syncing_ledger') : T('protocol_active')}
                            </span>
                        </div>
                        <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-[3px] ml-1">
                            ENGINE V5.2
                        </span>
                    </div>
                </div>
            </div>

            {/* --- RIGHT SECTION: CORE STATUS (Native Pill Style) --- */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-[var(--bg-card)]/50 backdrop-blur-md px-6 py-3.5 rounded-[22px] border border-[var(--border)] shadow-sm group hover:border-orange-500/30 transition-all duration-500">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-muted)] opacity-50 leading-none mb-1.5">
                            {T('core_status') || "CORE STATUS"}
                        </span>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={12} className="text-green-500" strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest">
                                {T('protocol_synced') || "PROTOCOL 100% SYNCED"}
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center text-orange-500 border border-[var(--border)] group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Zap size={18} fill="currentColor" strokeWidth={0} />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </motion.div>
    );
};