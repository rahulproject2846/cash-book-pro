"use client";
import React from 'react';
import { HardDrive, Upload, Download, Loader2, Database } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: DATA SOVEREIGNTY MODULE (STABILIZED)
 * ---------------------------------------------
 * Handles local JSON backup and restoration of protocol data.
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const DataSovereignty = ({ exportMasterData, importMasterData, importInputRef, isExporting }: any) => {
    const { T, t } = useTranslation();

    return (
        <div className="app-card p-[var(--card-padding,2rem)] border-dashed border-2 border-[var(--border-color)] bg-[var(--bg-app)]/30 flex flex-col md:flex-row justify-between items-center gap-[var(--app-gap,2rem)] group transition-all duration-300">
            
            {/* --- LEFT AREA: IDENTITY & DESCRIPTION --- */}
            <div className="flex items-center gap-[var(--app-gap,1.5rem)]">
                <div className="w-16 h-16 bg-[var(--bg-card)] rounded-[var(--radius-card,24px)] border border-[var(--border-color)] flex items-center justify-center text-orange-500 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                    <Database size={28} strokeWidth={2.5} />
                </div>
                <div className="text-center md:text-left">
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[2px]">
                        {T('data_sovereignty_title') || "Data Sovereignty"}
                    </h4>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1.5 uppercase tracking-[1px] opacity-60 leading-relaxed max-w-[250px]">
                        {t('data_sovereignty_desc') || "Backup your protocol archives locally."}
                    </p>
                </div>
            </div>
            
            {/* --- RIGHT AREA: ACTION BUTTONS --- */}
            <div className="flex gap-[var(--app-gap,1rem)] w-full md:w-auto">
                
                {/* 1. RESTORE ACTION */}
                <Tooltip text={t('tt_restore')}>
                    <button 
                        onClick={() => importInputRef.current?.click()} 
                        disabled={isExporting} 
                        className="flex-1 md:flex-none px-8 py-4 rounded-2xl border-2 border-[var(--border-color)] hover:border-blue-500 hover:text-blue-500 text-[var(--text-muted)] font-black text-[9px] uppercase tracking-[2px] transition-all flex items-center justify-center gap-3 active:scale-95 bg-[var(--bg-app)]"
                    >
                        <Upload size={16} /> {T('action_restore') || "Restore"}
                    </button>
                </Tooltip>
                <input type="file" ref={importInputRef} onChange={importMasterData} accept=".json" className="hidden" />

                {/* 2. BACKUP ACTION */}
                <Tooltip text={t('tt_backup')}>
                    <button 
                        onClick={exportMasterData} 
                        disabled={isExporting} 
                        className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-[var(--text-main)] text-[var(--bg-app)] font-black text-[9px] uppercase tracking-[2px] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-500/5"
                    >
                        {isExporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Download size={16} /> {T('action_backup') || "Backup"}
                            </>
                        )}
                    </button>
                </Tooltip>

            </div>
        </div>
    );
};