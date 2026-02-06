"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, HardDrive, Database, Zap, Loader2, 
    KeyRound, ShieldAlert, Cpu, RefreshCw 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: SYSTEM MAINTENANCE MODULE (ELITE EDITION)
 * ---------------------------------------------------
 * Handles Storage Health, Recovery Hash, and Data Purging.
 * Optimized for OS-level consistency and Haptic feedback.
 */

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const SystemMaintenance = ({ dbStats, clearLocalCache, isCleaning }: any) => {
    const { T, t, language } = useTranslation();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,2rem)] transition-all duration-500">
            
            {/* --- ১. STORAGE HEALTH (The System Monitor) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="lg:col-span-1 bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] shadow-xl relative overflow-hidden group"
            >
                <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Cpu size={200} strokeWidth={1} />
                </div>

                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <div className="p-2 bg-green-500/10 rounded-xl text-green-500 border border-green-500/20 shadow-inner">
                        <Activity size={18} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic">
                        {T('hardware_health') || "HARDWARE HEALTH"}
                    </h4>
                </div>
                
                <div className="space-y-4 relative z-10">
                    {/* Data Weight Indicator */}
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] flex justify-between items-center group/item hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <HardDrive size={16} className="text-[var(--text-muted)] group-hover/item:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{T('data_weight') || "DATA WEIGHT"}</span>
                        </div>
                        <span className="text-xs font-black text-orange-500 font-mono tracking-tighter">
                            {toBn(dbStats.storageUsed, language)}
                        </span>
                    </div>

                    {/* Local Registry UNITs */}
                    <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] flex justify-between items-center group/item hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-3">
                            <Database size={16} className="text-[var(--text-muted)] group-hover/item:text-orange-500 transition-colors" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{T('local_registry') || "LOCAL REGISTRY"}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-black text-orange-500 font-mono tracking-tighter">
                                {toBn(dbStats.totalEntries, language)}
                            </span>
                            <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-tighter opacity-40">UNITs</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- ২. RECOVERY PROTOCOL (Security Blueprint) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="lg:col-span-1 bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] shadow-xl relative overflow-hidden group"
            >
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 border border-blue-500/20 shadow-inner">
                        <KeyRound size={18} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[3px] italic">
                        {T('recovery_protocol') || "RECOVERY PROTOCOL"}
                    </h4>
                </div>
                
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-8 opacity-60 tracking-wider">
                    {t('recovery_desc') || "Generate an encrypted hash key to restore your vault across decentralized nodes."}
                </p>

                <button className="w-full h-14 rounded-2xl border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-[3px] hover:bg-blue-500/5 hover:border-blue-500 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                    <RefreshCw size={14} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                    {T('generate_key') || "GENERATE HASH KEY"}
                </button>
            </motion.div>

            {/* --- ৩. PURGE / DANGER ZONE (Controlled Demolition) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className="lg:col-span-1 bg-red-500/[0.02] rounded-[32px] border-2 border-dashed border-red-500/20 p-[var(--card-padding,2rem)] shadow-xl relative transition-all group"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20 shadow-inner animate-pulse">
                        <ShieldAlert size={18} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-[3px] italic">
                        {T('hard_reset') || "DANGER ZONE"}
                    </h4>
                </div>

                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase leading-relaxed mb-8 opacity-60 tracking-wider">
                    {t('purge_desc') || "Permanently wipe local disk cache. This action is irreversible within the current session."}
                </p>

                <Tooltip text={t('tt_purge_warning')}>
                    <button 
                        onClick={clearLocalCache}
                        disabled={isCleaning}
                        className="w-full h-14 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-red-600 disabled:opacity-50 overflow-hidden relative group/purge"
                    >
                        {isCleaning ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Zap size={18} fill="currentColor" strokeWidth={0} className="group-hover/purge:scale-125 transition-transform" />
                                {T('purge_btn') || "EXECUTE SYSTEM PURGE"}
                            </>
                        )}
                    </button>
                </Tooltip>
            </motion.div>
        </div>
    );
};