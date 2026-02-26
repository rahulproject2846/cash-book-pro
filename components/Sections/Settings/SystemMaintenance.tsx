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

export const SystemMaintenance = ({ dbStats, clearLocalCache, isCleaning }: any) => {
    const { t, language } = useTranslation();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 transition-all duration-500">
            
            {/* --- ১. STORAGE HEALTH (The System Monitor) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className={cn(
                    "lg:col-span-1 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
                    "p-6 md:p-8 shadow-2xl relative overflow-hidden group"
                )}
            >
                <div className="absolute -right-10 -top-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Cpu size={220} strokeWidth={1} />
                </div>

                <div className="flex items-center gap-4 mb-10 relative z-10">
                    <Tooltip text={t('tt_hardware_monitor') || "Live System Resource Monitor"}>
                        <div className="p-3 bg-green-500/10 rounded-[20px] text-green-500 border border-green-500/20 shadow-inner">
                            <Activity size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)]      leading-none">
                            {t('hardware_health') || "HARDWARE HEALTH"}
                        </h4>
                        <p className="text-[8px] font-bold text-green-500    mt-2 opacity-60">Storage Registry Safe</p>
                    </div>
                </div>
                
                <div className="space-y-3 relative z-10">
                    {/* Data Weight Indicator */}
                    <Tooltip text={t('tt_storage_used') || "Current physical disk usage"}>
                        <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] flex justify-between items-center group/item hover:border-orange-500/30 transition-all cursor-help">
                            <div className="flex items-center gap-3">
                                <HardDrive size={16} className="text-[var(--text-muted)] group-hover/item:text-orange-500 transition-colors" />
                                <span className="text-[9px] font-black   text-[var(--text-muted)]">{t('data_weight') || "DATA WEIGHT"}</span>
                            </div>
                            <span className="text-xs font-black text-[var(--text-main)] font-mono">
                                {toBn(dbStats.storageUsed, language)}
                            </span>
                        </div>
                    </Tooltip>

                    {/* Local Registry UNITs */}
                    <Tooltip text={t('tt_registry_count') || "Total verified nodes in local storage"}>
                        <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] flex justify-between items-center group/item hover:border-orange-500/30 transition-all cursor-help">
                            <div className="flex items-center gap-3">
                                <Database size={16} className="text-[var(--text-muted)] group-hover/item:text-orange-500 transition-colors" />
                                <span className="text-[9px] font-black   text-[var(--text-muted)]">{t('local_registry') || "LOCAL REGISTRY"}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-black text-[var(--text-main)] font-mono">
                                    {toBn(dbStats.totalEntries, language)}
                                </span>
                                <span className="text-[7px] font-black text-[var(--text-muted)] opacity-40">UNITs</span>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </motion.div>

            {/* --- ২. RECOVERY PROTOCOL (Security Blueprint) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className={cn(
                    "lg:col-span-1 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
                    "p-6 md:p-8 shadow-2xl relative overflow-hidden group"
                )}
            >
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <Tooltip text={t('tt_recovery_node') || "Disaster Recovery Protocol Active"}>
                        <div className="p-3 bg-blue-500/10 rounded-[20px] text-blue-500 border border-blue-500/20 shadow-inner">
                            <KeyRound size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)]      leading-none">
                            {t('recovery_protocol') || "RECOVERY PROTOCOL"}
                        </h4>
                        <p className="text-[8px] font-bold text-blue-500    mt-2 opacity-60">Identity Restoration</p>
                    </div>
                </div>
                
                <p className="text-[10px] font-bold text-[var(--text-muted)] leading-relaxed mb-10 opacity-40  ">
                    {t('recovery_desc') || "Generate an encrypted hash key to restore your vault across decentralized nodes."}
                </p>

                <Tooltip text={t('tt_generate_hash') || "Create Secure Migration Key"}>
                    <button className="w-full h-14 rounded-[22px] border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black    hover:bg-blue-500/5 hover:border-blue-500 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                        <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                        {t('generate_key') || "GENERATE HASH KEY"}
                    </button>
                </Tooltip>
            </motion.div>

            {/* --- ৩. PURGE / DANGER ZONE (Controlled Demolition) --- */}
            <motion.div 
                whileHover={{ y: -5 }}
                className={cn(
                    "lg:col-span-1 bg-red-500/[0.02] rounded-[40px] border-2 border-dashed border-red-500/20",
                    "p-6 md:p-8 shadow-2xl relative transition-all group"
                )}
            >
                <div className="flex items-center gap-4 mb-8">
                    <Tooltip text={t('tt_danger_zone') || "Critical System Operations"}>
                        <div className="p-3 bg-red-500/10 rounded-[20px] text-red-500 border border-red-500/20 shadow-inner animate-pulse">
                            <ShieldAlert size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-red-500      leading-none">
                            {t('hard_reset') || "DANGER ZONE"}
                        </h4>
                        <p className="text-[8px] font-bold text-red-500/60    mt-2">Irreversible Operations</p>
                    </div>
                </div>

                <p className="text-[10px] font-bold text-red-500/40 leading-relaxed mb-10  ">
                    {t('purge_desc') || "Permanently wipe local disk cache. This action is irreversible within the current session."}
                </p>

                <Tooltip text={t('tt_purge_warning') || "WIPE ALL LOCAL DATA IMMEDIATELY"}>
                    <button 
                        onClick={clearLocalCache}
                        disabled={isCleaning}
                        className={cn(
                            "w-full h-16 text-white rounded-[25px] text-[11px] font-black    shadow-xl",
                            "active:scale-95 transition-all flex items-center justify-center gap-3",
                            isCleaning ? "bg-zinc-800" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                        )}
                    >
                        {isCleaning ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Zap size={20} fill="currentColor" strokeWidth={0} className="group-hover:scale-125 transition-transform" />
                                {t('purge_btn') || "EXECUTE SYSTEM PURGE"}
                            </>
                        )}
                    </button>
                </Tooltip>
            </motion.div>
        </div>
    );
};