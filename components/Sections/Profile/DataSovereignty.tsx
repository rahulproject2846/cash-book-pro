"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Database, Upload, Download, Loader2, 
    ShieldCheck, RefreshCw, FileJson, Zap, BadgeCheck, HardDrive
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

/**
 * VAULT PRO: DATA SOVEREIGNTY MODULE (V11.0 ELITE)
 * --------------------------------------------------
 * Handles local JSON backup and restoration.
 * Design: High-Integrity OS Interface.
 */
export const DataSovereignty = ({ exportMasterData, importMasterData, importInputRef, isExporting }: any) => {
    const { T, t } = useTranslation();

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-8 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* --- 🌑 BACKGROUND AURA (OS Detailing) --- */}
            <div className="absolute -right-10 -top-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                <Database size={350} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-4">
                    <Tooltip text={t('tt_sovereignty_node') || "Data Ownership Protocol Active"}>
                        <div className="p-3 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20 shadow-inner">
                            <Database size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                            {T('data_sovereignty_title') || "DATA SOVEREIGNTY"}
                        </h4>
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-2 opacity-60">
                            Local Protocol Recovery Hub
                        </p>
                    </div>
                </div>
                
                {/* Secure Badge */}
                <Tooltip text={t('tt_archive_status') || "Verified JSON Architecture"}>
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border)] rounded-[18px] opacity-40 hover:opacity-100 transition-opacity cursor-help">
                         <BadgeCheck size={14} className="text-green-500" />
                         <span className="text-[9px] font-black uppercase tracking-[2px]">Secured Archive</span>
                    </div>
                </Tooltip>
            </div>
            
            {/* --- ⚙️ CONTENT AREA --- */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-10 relative z-10">
                
                <div className="flex-1 text-center lg:text-left space-y-4">
                    <Tooltip text={t('tt_sovereignty_desc') || "Your data, your control"}>
                        <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[1.5px] leading-relaxed max-w-sm opacity-50 cursor-default">
                            {t('data_sovereignty_desc') || "Generate or restore local protocol snapshots for absolute data ownership and cross-device migration."}
                        </p>
                    </Tooltip>
                    
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[8px] font-black uppercase text-green-500 tracking-[3px]">Local Disk Access Validated</span>
                    </div>
                </div>

                {/* --- 🚀 ACTION BUTTONS --- */}
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    
                    {/* 1. RESTORE ACTION */}
                    <Tooltip text={t('tt_restore_identity') || "Import external protocol node"}>
                        <button 
                            onClick={() => importInputRef.current?.click()} 
                            disabled={isExporting} 
                            className={cn(
                                "h-16 px-8 rounded-[25px] border-2 border-[var(--border)] bg-[var(--bg-app)]",
                                "text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30",
                                "font-black text-[11px] uppercase tracking-[3px] transition-all active:scale-95 flex items-center justify-center gap-4 group/btn shadow-sm"
                            )}
                        >
                            <Upload size={20} strokeWidth={2.5} className="group-hover/btn:-translate-y-0.5 transition-transform" /> 
                            {T('action_restore') || "RESTORE"}
                        </button>
                    </Tooltip>
                    <input type="file" ref={importInputRef} onChange={importMasterData} accept=".json" className="hidden" />

                    {/* 2. BACKUP ACTION */}
                    <Tooltip text={t('tt_backup_identity') || "Secure local data snapshot"}>
                        <button 
                            onClick={exportMasterData} 
                            disabled={isExporting} 
                            className={cn(
                                "h-16 px-10 rounded-[25px] bg-orange-500 text-white shadow-2xl",
                                "font-black text-[11px] uppercase tracking-[3px] hover:bg-orange-600 active:scale-95",
                                "transition-all flex items-center justify-center gap-4 border-none shadow-orange-500/20 group/backup"
                            )}
                        >
                            {isExporting ? (
                                <RefreshCw size={20} className="animate-spin" strokeWidth={3} />
                            ) : (
                                <>
                                    <FileJson size={20} strokeWidth={2.5} className="group-hover/backup:scale-110 transition-transform" /> 
                                    {T('action_backup') || "BACKUP"}
                                </>
                            )}
                        </button>
                    </Tooltip>

                </div>
            </div>

            {/* Micro Detail Footer */}
            <div className="mt-12 pt-6 border-t border-[var(--border)]/50 opacity-20 group-hover:opacity-50 flex justify-between items-center transition-opacity duration-500">
                <div className="flex items-center gap-2">
                    <HardDrive size={12} className="text-orange-500" />
                    <span className="text-[8px] font-black uppercase tracking-[4px]">Sovereignty Protocol V11.0</span>
                </div>
                <Zap size={10} className="text-orange-500" fill="currentColor" />
            </div>
        </div>
    );
};