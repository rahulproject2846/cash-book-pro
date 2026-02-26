"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    History, Shield, Clock, HardDrive, 
    ShieldCheck, Cpu, GitCommit 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন cn utility

export const ProtocolAuditLog = () => {
    const { t } = useTranslation();

    // --- 🧬 DATA MAPPING (Logic Preserved) ---
    const logs = [
        { 
            event: t('event_identity_updated') || 'Identity Hash Updated', 
            time: t('time_just_now') || 'Just Now', 
            icon: Shield, 
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            tt: t('tt_event_identity') || "Identity verified by node engine"
        },
        { 
            event: t('event_backup_exported') || 'Master Backup Exported', 
            time: t('time_2h_ago') || '2 hours ago', 
            icon: HardDrive, 
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            tt: t('tt_event_backup') || "Vault data archived locally"
        },
        { 
            event: t('event_session_verified') || 'Security Session Verified', 
            time: t('time_yesterday') || 'Yesterday', 
            icon: Clock, 
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            tt: t('tt_event_session') || "Login integrity confirmed"
        },
    ];

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-8 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* Background Decor (Server Rack Illusion) */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity duration-700">
                <Cpu size={280} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-4">
                    <Tooltip text={t('tt_audit_log') || "Real-time Node Event Tracker"}>
                        <div className="p-3 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20 shadow-inner">
                            <History size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)]        leading-none">
                            {t('audit_log_title') || "SECURITY AUDIT LOG"}
                        </h4>
                        <p className="text-[8px] font-bold text-orange-500      mt-2 opacity-60">
                            Local Node Activity Feed
                        </p>
                    </div>
                </div>
                
                {/* Active Monitor Badge */}
                <Tooltip text={t('tt_monitoring') || "System events are actively recorded"}>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl cursor-help hover:bg-green-500/20 transition-colors">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[8px] font-black   text-green-500   hidden sm:block">MONITORING</span>
                    </div>
                </Tooltip>
            </div>

            {/* --- 🛤️ THE AUDIT FEED (Timeline Style) --- */}
            <div className="relative space-y-10 pl-6">
                
                {/* Elite Vertical Spine Line */}
                <div className="absolute left-[38px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-orange-500/40 via-[var(--border)] to-transparent opacity-30" />

                {logs.map((log, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 25 }}
                        className="flex items-start gap-6 group/item relative z-10"
                    >
                        {/* Timeline Node Connector */}
                        <div className="absolute -left-12 top-3 text-[var(--border)] opacity-30 group-hover/item:text-orange-500 group-hover/item:opacity-100 transition-colors">
                            <GitCommit size={14} />
                        </div>

                        {/* Timeline Icon Node */}
                        <Tooltip text={log.tt}>
                            <div className={cn(
                                "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner transition-all duration-500 cursor-help",
                                log.bg, log.color, log.border,
                                "border group-hover/item:scale-110 group-hover/item:shadow-lg"
                            )}>
                                <log.icon size={20} strokeWidth={2.5} />
                            </div>
                        </Tooltip>

                        {/* Event Details */}
                        <div className="flex-1 pt-1.5">
                            <p className="text-[12px] font-black text-[var(--text-main)]     group-hover/item:text-orange-500 transition-colors cursor-default">
                                {log.event}
                            </p>
                            <div className="flex items-center gap-2 mt-2 opacity-40">
                                <Clock size={12} />
                                <span className="text-[9px] font-bold text-[var(--text-muted)]    ">
                                    {log.time}
                                </span>
                            </div>
                        </div>

                        {/* Hover Activity Indicator */}
                        <div className="pt-3 pr-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover/item:opacity-100 scale-50 group-hover/item:scale-100 transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* --- 🔐 FOOTER NOTICE --- */}
            <div className="mt-14 pt-6 border-t border-[var(--border)]/50 opacity-30 group-hover:opacity-60 flex items-center justify-center gap-3 transition-opacity duration-500">
                <ShieldCheck size={14} className="text-orange-500" />
                <p className="text-[9px] font-black text-[var(--text-muted)]     ">
                    {t('audit_node_info') || "ONLY VISIBLE ON THIS LOCAL HARDWARE NODE"}
                </p>
            </div>
        </div>
    );
};