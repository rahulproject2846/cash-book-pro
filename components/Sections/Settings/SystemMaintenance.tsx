"use client";
import React from 'react';
import { Activity, HardDrive, Database, Zap, Loader2, KeyRound } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: SYSTEM MAINTENANCE MODULE (100% STABLE)
 * -----------------------------------------------
 * Handles Storage Health, Recovery Hash, and Data Purging.
 * Fully integrated with Global Variables, Multi-language, and Tooltips.
 */
export const SystemMaintenance = ({ dbStats, clearLocalCache, isCleaning }: any) => {
    const { T, t } = useTranslation();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,2rem)] transition-all duration-300">
            
            {/* ১. STORAGE HEALTH CARD */}
            <div className="lg:col-span-1 app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden transition-all">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8 relative z-10">
                    <Activity size={18} className="text-green-500" /> {T('hardware_health')}
                </h4>
                
                <div className="space-y-4 relative z-10">
                    {/* Data Weight Indicator */}
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] flex justify-between items-center group hover:border-orange-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <HardDrive size={16} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{T('data_weight')}</span>
                        </div>
                        <span className="text-xs font-black text-orange-500 font-mono tracking-tighter">{dbStats.storageUsed}</span>
                    </div>

                    {/* Local Registry UNITs */}
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] flex justify-between items-center group hover:border-orange-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <Database size={16} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{T('local_registry')}</span>
                        </div>
                        <span className="text-xs font-black text-orange-500 font-mono tracking-tighter">{dbStats.totalEntries} UNITs</span>
                    </div>
                </div>
            </div>

            {/* ২. RECOVERY PROTOCOL CARD */}
            <div className="lg:col-span-1 app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl relative overflow-hidden transition-all">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                    <KeyRound size={18} className="text-blue-500" /> {T('recovery_protocol')}
                </h4>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-6 opacity-70">
                    {t('recovery_desc')}
                </p>
                <button className="w-full py-4 rounded-xl border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/5 hover:border-blue-500 transition-all active:scale-95">
                    {T('generate_key')}
                </button>
            </div>

            {/* ৩. PURGE / DANGER ZONE CARD */}
            <div className="lg:col-span-1 app-card p-[var(--card-padding,2rem)] bg-red-500/[0.01] border-2 border-dashed border-red-500/20 shadow-xl transition-all">
                <h4 className="text-xs font-black text-red-500 uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                    <Zap size={18} /> {T('hard_reset')}
                </h4>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-6 opacity-70">
                    {t('purge_desc')}
                </p>
                <Tooltip text={t('tt_purge_warning')}>
                    <button 
                        onClick={clearLocalCache}
                        disabled={isCleaning}
                        className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-red-600"
                    >
                        {isCleaning ? <Loader2 size={16} className="animate-spin" /> : T('purge_btn')}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};