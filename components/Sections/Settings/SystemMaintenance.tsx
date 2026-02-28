"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, HardDrive, Database, Zap, Loader2, 
    KeyRound, ShieldAlert, Cpu, RefreshCw
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers';

/**
 * 🏆 SYSTEM MAINTENANCE V15.0 (HOLLY GRILL COMPLIANT)
 * ----------------------------------------------------
 * Row 3: Storage Monitoring, Security Protocols, and Purge Operations.
 * Zero Hardcoded Colors | High-Density Information Rows.
 */
export const SystemMaintenance = ({ dbStats, clearLocalCache, isCleaning }: any) => {
    const { t, language } = useTranslation();

    const springConfig = { type: "spring", stiffness: 400, damping: 30 };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,2.5rem)] transition-all duration-500">
            
            {/* --- 🛠️ SECTION 1: HARDWARE HEALTH --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-8 shadow-2xl overflow-hidden group flex flex-col"
            >
                <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Cpu size={220} strokeWidth={1} />
                </div>

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <div className="p-3 bg-[var(--accent)]/10 rounded-[20px] text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
                        <Activity size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight leading-none">
                            {t('hardware_health') || "HARDWARE HEALTH"}
                        </h4>
                        <p className="text-[8px] font-bold text-[var(--accent)] mt-2 opacity-60 uppercase tracking-widest">Storage Registry Safe</p>
                    </div>
                </div>
                
                <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
                    {/* Full Width Data Weight Row */}
                    <div className="w-full p-5 bg-[var(--bg-app)] rounded-[24px] border border-[var(--border)] flex justify-between items-center group/item hover:border-[var(--accent)]/30 transition-all cursor-help">
                        <div className="flex items-center gap-4">
                            <HardDrive size={18} className="text-[var(--text-muted)] group-hover/item:text-[var(--accent)] transition-colors" />
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('data_weight') || "DATA WEIGHT"}</span>
                        </div>
                        <span className="text-sm font-black text-[var(--text-main)] font-mono">
                            {toBn(dbStats?.storageUsed || '0 KB', language)}
                        </span>
                    </div>

                    {/* Full Width Local Registry Row */}
                    <div className="w-full p-5 bg-[var(--bg-app)] rounded-[24px] border border-[var(--border)] flex justify-between items-center group/item hover:border-[var(--accent)]/30 transition-all cursor-help">
                        <div className="flex items-center gap-4">
                            <Database size={18} className="text-[var(--text-muted)] group-hover/item:text-[var(--accent)] transition-colors" />
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('local_registry') || "LOCAL REGISTRY"}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-[var(--text-main)] font-mono">
                                {toBn(dbStats?.totalEntries || 0, language)}
                            </span>
                            <span className="text-[8px] font-black text-[var(--text-muted)] opacity-40 uppercase">Units</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- 🔑 SECTION 2: RECOVERY PROTOCOL --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-6 md:p-8 shadow-2xl overflow-hidden group flex flex-col"
            >
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-3 bg-[var(--accent)]/10 rounded-[20px] text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
                        <KeyRound size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight leading-none">
                            {t('recovery_protocol') || "RECOVERY PROTOCOL"}
                        </h4>
                        <p className="text-[8px] font-bold text-[var(--accent)] mt-2 opacity-60 uppercase tracking-widest">Identity Restoration</p>
                    </div>
                </div>
                
                <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed mb-10 opacity-50 flex-1">
                    {t('recovery_desc') || "Generate an encrypted hash key to restore your vault across decentralized nodes in case of emergency."}
                </p>

                <Tooltip text={t('tt_generate_hash') || "Create Secure Migration Key"}>
                    <motion.button 
                        whileTap={{ scale: 0.96 }}
                        transition={springConfig as any}
                        className="w-full h-16 rounded-[28px] border-2 border-dashed border-[var(--accent)]/30 text-[var(--accent)] text-[10px] font-black hover:bg-[var(--accent)]/5 hover:border-[var(--accent)] transition-all flex items-center justify-center gap-4 group/btn shadow-inner"
                    >
                        <RefreshCw size={18} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                        {t('generate_key') || "GENERATE HASH KEY"}
                    </motion.button>
                </Tooltip>
            </motion.div>

            {/* --- ☢️ SECTION 3: DANGER ZONE (PURGE) --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="relative bg-[var(--destructive)]/[0.02] rounded-[40px] border-2 border-dashed border-[var(--destructive)]/20 p-6 md:p-8 shadow-2xl group flex flex-col"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-[var(--destructive)]/10 rounded-[20px] text-[var(--destructive)] border border-[var(--destructive)]/20 shadow-inner animate-pulse">
                        <ShieldAlert size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-[var(--destructive)] uppercase tracking-tight leading-none">
                            {t('hard_reset') || "DANGER ZONE"}
                        </h4>
                        <p className="text-[8px] font-bold text-[var(--destructive)]/60 mt-2 uppercase tracking-widest">Irreversible Operations</p>
                    </div>
                </div>

                <p className="text-[11px] font-bold text-[var(--destructive)]/40 leading-relaxed mb-10 flex-1">
                    {t('purge_desc') || "Permanently wipe local disk cache and reset all verified nodes. This operation cannot be undone."}
                </p>

                <Tooltip text={t('tt_purge_warning') || "WIPE ALL LOCAL DATA IMMEDIATELY"}>
                    <motion.button 
                        onClick={clearLocalCache}
                        disabled={isCleaning}
                        whileTap={{ scale: 0.96 }}
                        transition={springConfig as any}
                        className={cn(
                            "w-full h-16 text-white rounded-[28px] text-[11px] font-black shadow-xl uppercase tracking-wider",
                            "transition-all flex items-center justify-center gap-4",
                            isCleaning ? "bg-[var(--bg-card)] cursor-not-allowed" : "bg-[var(--destructive)] hover:bg-[var(--destructive)]/90 shadow-[var(--destructive)]/20"
                        )}
                    >
                        {isCleaning ? (
                            <Loader2 className="animate-spin" size={22} />
                        ) : (
                            <>
                                <Zap size={22} fill="currentColor" strokeWidth={0} className="group-hover:scale-125 transition-transform" />
                                {t('purge_btn') || "EXECUTE SYSTEM PURGE"}
                            </>
                        )}
                    </motion.button>
                </Tooltip>
            </motion.div>
        </div>
    );
};