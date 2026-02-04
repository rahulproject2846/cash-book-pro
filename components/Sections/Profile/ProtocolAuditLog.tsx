"use client";
import React from 'react';
import { History, Shield, Clock, HardDrive } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: PROTOCOL AUDIT LOG (STABILIZED)
 * ----------------------------------------
 * Displays device-specific security events.
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const ProtocolAuditLog = () => {
    const { T, t } = useTranslation();

    // মক ডাটা (Translated Keys mapping)
    const logs = [
        { 
            event: t('event_identity_updated') || 'Identity Hash Updated', 
            time: t('time_just_now') || 'Just Now', 
            icon: Shield, 
            color: 'text-blue-500',
            tt: t('tt_event_identity') || "Identity verified by node engine"
        },
        { 
            event: t('event_backup_exported') || 'Master Backup Exported', 
            time: t('time_2h_ago') || '2 hours ago', 
            icon: HardDrive, 
            color: 'text-orange-500',
            tt: t('tt_event_backup') || "Vault data archived locally"
        },
        { 
            event: t('event_session_verified') || 'Security Session Verified', 
            time: t('time_yesterday') || 'Yesterday', 
            icon: Clock, 
            color: 'text-green-500',
            tt: t('tt_event_session') || "Login integrity confirmed"
        },
    ];

    return (
        <div className="app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] transition-all duration-300">
            {/* Header Area */}
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic mb-[var(--app-gap,2rem)] flex items-center gap-3">
                <History size={18} className="text-orange-500" /> {T('audit_log_title') || "Security Audit Log"}
            </h4>

            {/* Logs Feed */}
            <div className="space-y-[var(--app-gap,1.5rem)]">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between group transition-all">
                        <div className="flex items-center gap-4">
                            <Tooltip text={log.tt}>
                                <div className={`w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center ${log.color} shadow-inner group-hover:border-orange-500/20 transition-all`}>
                                    <log.icon size={16} />
                                </div>
                            </Tooltip>
                            <div>
                                <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">
                                    {log.event}
                                </p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-1 opacity-50">
                                    {log.time}
                                </p>
                            </div>
                        </div>
                        {/* Status Dot */}
                        <div className="h-1 w-1 rounded-full bg-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
            
            {/* Device-specific Notice */}
            <div className="mt-[var(--app-gap,2rem)] pt-[var(--app-gap,1.5rem)] border-t border-[var(--border-color)]/30 text-center opacity-40">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">
                    {t('audit_node_info') || "Only visible on this device node"}
                </p>
            </div>
        </div>
    );
};