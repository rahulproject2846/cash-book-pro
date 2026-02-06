"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    History, Shield, Clock, HardDrive, 
    Zap, ShieldCheck, Activity, Cpu 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: PROTOCOL AUDIT LOG (V5.2 ELITE)
 * -----------------------------------------
 * Displays device-specific security events with a vertical spine timeline.
 * Fully decoupled from hardcoded strings.
 */
export const ProtocolAuditLog = () => {
    const { T, t } = useTranslation();

    // --- 🧬 DATA MAPPING (Logic Preserved) ---
    const logs = [
        { 
            event: t('event_identity_updated') || 'Identity Hash Updated', 
            time: t('time_just_now') || 'Just Now', 
            icon: Shield, 
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            tt: t('tt_event_identity') || "Identity verified by node engine"
        },
        { 
            event: t('event_backup_exported') || 'Master Backup Exported', 
            time: t('time_2h_ago') || '2 hours ago', 
            icon: HardDrive, 
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            tt: t('tt_event_backup') || "Vault data archived locally"
        },
        { 
            event: t('event_session_verified') || 'Security Session Verified', 
            time: t('time_yesterday') || 'Yesterday', 
            icon: Clock, 
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            tt: t('tt_event_session') || "Login integrity confirmed"
        },
    ];

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] overflow-hidden shadow-xl transition-all duration-500 group">
            
            {/* Background Decor */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <Cpu size={250} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-inner">
                        <History size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('audit_log_title') || "SECURITY AUDIT LOG"}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                            Local Node Activity Feed
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/10 rounded-xl">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">MONITORING</span>
                </div>
            </div>

            {/* --- 🛤️ THE AUDIT FEED (Timeline Style) --- */}
            <div className="relative space-y-8 pl-4">
                {/* Vertical Spine Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-orange-500/40 via-[var(--border)] to-transparent opacity-30" />

                {logs.map((log, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-6 group/item relative z-10"
                    >
                        {/* Timeline Node Icon */}
                        <Tooltip text={log.tt}>
                            <div className={`w-10 h-10 rounded-xl ${log.bg} border border-[var(--border)] flex items-center justify-center ${log.color} shadow-inner group-hover/item:border-orange-500/30 transition-all duration-300 shrink-0`}>
                                <log.icon size={18} strokeWidth={2.5} />
                            </div>
                        </Tooltip>

                        {/* Event Details */}
                        <div className="flex-1 pt-1">
                            <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest group-hover/item:text-orange-500 transition-colors">
                                {log.event}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 opacity-40">
                                <Clock size={10} />
                                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    {log.time}
                                </span>
                            </div>
                        </div>

                        {/* Activity Pulsing Dot */}
                        <div className="pt-2">
                             <div className="w-1 h-1 rounded-full bg-orange-500 opacity-20 group-hover/item:opacity-100 group-hover/item:scale-150 transition-all" />
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* --- 🔐 FOOTER NOTICE --- */}
            <div className="mt-12 pt-6 border-t border-[var(--border)] opacity-30 flex items-center justify-center gap-3">
                <ShieldCheck size={14} className="text-orange-500" />
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">
                    {t('audit_node_info') || "ONLY VISIBLE ON THIS LOCAL HARDWARE NODE"}
                </p>
            </div>
        </div>
    );
};