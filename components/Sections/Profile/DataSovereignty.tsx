"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Database, Upload, Download, Loader2, 
    ShieldCheck, RefreshCw, FileJson, Zap 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: DATA SOVEREIGNTY MODULE (ELITE EDITION)
 * --------------------------------------------------
 * Handles local JSON backup and restoration of protocol data.
 * Features: Native Haptics, Glassmorphism, and Master Spacing.
 */
export const DataSovereignty = ({ exportMasterData, importMasterData, importInputRef, isExporting }: any) => {
    const { T, t } = useTranslation();

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] overflow-hidden shadow-xl transition-all duration-500 group">
            
            {/* --- 🌑 BACKGROUND AURA --- */}
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                <Database size={280} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-inner">
                        <Database size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('data_sovereignty_title') || "DATA SOVEREIGNTY"}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                            Local Protocol Recovery Hub
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 opacity-20">
                     <ShieldCheck size={14} />
                     <span className="text-[8px] font-black uppercase tracking-[2px]">Encrypted Archive</span>
                </div>
            </div>
            
            {/* --- ⚙️ CONTENT AREA --- */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10">
                
                <div className="flex-1 text-center lg:text-left">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[1.5px] leading-relaxed max-w-sm opacity-60">
                        {t('data_sovereignty_desc') || "Generate or restore local protocol snapshots for absolute data ownership and cross-device migration."}
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase text-green-500 tracking-[3px]">Local Disk Access Validated</span>
                    </div>
                </div>

                {/* --- 🚀 ACTION BUTTONS --- */}
                <div className="flex gap-4 w-full lg:w-auto">
                    
                    {/* 1. RESTORE ACTION (Native Sheet Style) */}
                    <Tooltip text={t('tt_restore')}>
                        <button 
                            onClick={() => importInputRef.current?.click()} 
                            disabled={isExporting} 
                            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-app)] hover:border-blue-500/50 hover:bg-blue-500/5 text-[var(--text-muted)] hover:text-blue-500 font-black text-[10px] uppercase tracking-[3px] transition-all active:scale-95 flex items-center justify-center gap-3 group/btn shadow-sm"
                        >
                            <Upload size={18} strokeWidth={3} className="group-hover/btn:-translate-y-0.5 transition-transform" /> 
                            {T('action_restore') || "RESTORE"}
                        </button>
                    </Tooltip>
                    <input type="file" ref={importInputRef} onChange={importMasterData} accept=".json" className="hidden" />

                    {/* 2. BACKUP ACTION (Master Execution) */}
                    <Tooltip text={t('tt_backup')}>
                        <button 
                            onClick={exportMasterData} 
                            disabled={isExporting} 
                            className="flex-1 lg:flex-none h-14 px-10 rounded-2xl bg-orange-500 text-white font-black text-[10px] uppercase tracking-[3px] hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 border-none relative overflow-hidden"
                        >
                            {isExporting ? (
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                >
                                    <RefreshCw size={18} strokeWidth={3} />
                                </motion.div>
                            ) : (
                                <>
                                    <FileJson size={18} strokeWidth={2.5} /> 
                                    {T('action_backup') || "BACKUP"}
                                </>
                            )}
                            
                            {/* Visual Pulse for active interaction */}
                            {!isExporting && <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />}
                        </button>
                    </Tooltip>

                </div>
            </div>

            {/* Micro Detail: System Bottom Info */}
            <div className="mt-8 pt-4 border-t border-[var(--border)] opacity-20 flex justify-between items-center group-hover:opacity-40 transition-opacity">
                <span className="text-[7px] font-black uppercase tracking-[4px]">Sovereignty Protocol v5.2</span>
                <Zap size={10} className="text-orange-500" fill="currentColor" />
            </div>
        </div>
    );
};