"use client";
import React, { useState, useEffect } from 'react';
import { 
    Smartphone, Lock, Moon, Monitor, Zap, 
    Activity, HelpCircle, Cpu, Sparkles, Layers
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

/**
 * 🏆 INTERFACE ENGINE V20.0 (FINAL STABLE RELEASE)
 * ---------------------------------------------------------
 * - UI: Apple-grade interactive cards (Full-Width).
 * - Logic: Direct-to-Store Atomic Mutations.
 * - Performance: Optimized for Zero Layout Shift.
 */
export const InterfaceEngine = ({ preferences, updatePreference }: any) => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);

    // 🛡️ HYDRATION GUARD: Prevent rising/falling flicker on reload
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 🛰️ DOM SYNC: Apply system-level visual overrides
    useEffect(() => {
        if (!isMounted || !preferences) return;
        const root = document.documentElement;
        const body = document.body;
        
        body.classList.toggle('turbo-active', !!preferences.turboMode);
        root.classList.toggle('midnight-mode', !!preferences.isMidnight);
        root.classList.toggle('compact-deck', !!preferences.compactMode);
    }, [isMounted, preferences]);

    // 🚧 LOADING STATE: Neutral placeholder with exact height to kill flickers
    if (!isMounted || !preferences) {
        return <div className="w-full h-[580px] bg-[var(--bg-card)]/10 rounded-[48px] border border-[var(--border)] animate-pulse" />;
    }

    const ToggleItem = ({ active, onClick, icon: Icon, label, ttKey, colorClass }: any) => (
        <Tooltip text={preferences?.showTooltips !== false ? t(ttKey) : ""}>
            <motion.button
                type="button"
                onClick={onClick}
                whileHover={{ scale: 1.01, backgroundColor: 'var(--bg-card)' }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "group relative w-full flex items-center justify-between p-6 rounded-[32px] border transition-colors duration-300",
                    "z-20 cursor-pointer select-none overflow-hidden",
                    active 
                        ? "bg-[var(--accent)]/[0.04] border-[var(--accent)]/30 shadow-[0_10px_30px_rgba(var(--accent-rgb),0.05)]" 
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]/20 shadow-sm"
                )}
            >
                <div className="flex items-center gap-4 relative z-10">
                    {/* Icon Housing */}
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border",
                        active 
                            ? cn("bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)]", colorClass) 
                            : "bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border)]"
                    )}>
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    </div>

                    <div className="flex flex-col text-left">
                        <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-wider">
                            {label}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full", 
                                active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[var(--text-muted)] opacity-30"
                            )} />
                            <span className="text-[8px] font-black text-[var(--text-muted)] opacity-50 tracking-tighter uppercase">
                                {active ? 'Protocol Active' : 'Standby Mode'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Switch (Visual only, button logic is on parent) */}
                <div className={cn(
                    "w-11 h-6 rounded-full relative transition-colors duration-500 flex items-center px-1 shadow-inner",
                    active ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                )}>
                    <motion.div 
                        animate={{ x: active ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                </div>
            </motion.button>
        </Tooltip>
    );

    return (
        <section className={cn(
            "relative w-full bg-[var(--bg-card)] rounded-[48px] border border-[var(--border)]",
            "p-10 md:p-14 overflow-hidden shadow-2xl transition-all duration-700"
        )}>
            {/* 🌌 Background Decor (Z-0) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--accent),transparent)] opacity-[0.02] pointer-events-none z-0" />
            <div className="absolute top-0 right-0 p-10 opacity-[0.015] pointer-events-none z-0">
                <Cpu size={280} />
            </div>

            {/* Header: Core System Registry */}
            <div className="flex items-center justify-between mb-16 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-[26px] text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shadow-inner">
                        <Zap size={28} strokeWidth={2.5} className={preferences?.turboMode ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight">
                            {t('interface_engine') || "INTERFACE ENGINE"}
                        </h4>
                        <div className="flex items-center gap-3 mt-3">
                            <Sparkles size={12} className="text-[var(--accent)] opacity-60" />
                            <p className="text-[10px] font-black text-[var(--accent)] opacity-60 uppercase tracking-widest">
                                Core Optimization & UI Protocol
                            </p>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-[var(--bg-app)] border border-[var(--border)] rounded-full backdrop-blur-sm">
                    <Layers size={14} className="text-[var(--accent)]" />
                    <span className="text-[9px] font-black text-[var(--text-main)] opacity-70 tracking-tighter uppercase">
                        Holly Grill V20.0 REL
                    </span>
                </div>
            </div>
            
            {/* Matrix: 6-Cell Balanced Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 w-full">
                <ToggleItem 
                    label={t('turbo_mode_on') || "TURBO ENGINE"} 
                    ttKey="tt_turbo" 
                    active={preferences?.turboMode} 
                    onClick={() => updatePreference('turboMode', !preferences?.turboMode)} 
                    icon={Activity} 
                    colorClass="text-cyan-400" 
                />

                <ToggleItem 
                    label={t('amoled_midnight') || "MIDNIGHT PROTOCOL"} 
                    ttKey="tt_midnight" 
                    active={preferences?.isMidnight} 
                    onClick={() => updatePreference('isMidnight', !preferences?.isMidnight)} 
                    icon={Moon} 
                    colorClass="text-blue-400" 
                />

                <ToggleItem 
                    label={t('compact_deck') || "COMPACT INTERFACE"} 
                    ttKey="tt_compact" 
                    active={preferences?.compactMode} 
                    onClick={() => updatePreference('compactMode', !preferences?.compactMode)} 
                    icon={Smartphone} 
                    colorClass="text-orange-400"
                />

                <ToggleItem 
                    label={t('session_shield') || "SECURITY SHIELD"} 
                    ttKey="tt_autolock" 
                    active={preferences?.autoLock} 
                    onClick={() => updatePreference('autoLock', !preferences?.autoLock)} 
                    icon={Lock} 
                    colorClass="text-red-500" 
                />

                <ToggleItem 
                    label={t('system_pulse') || "SYSTEM MONITORING"} 
                    ttKey="tt_reminders" 
                    active={preferences?.dailyReminder} 
                    onClick={() => updatePreference('dailyReminder', !preferences?.dailyReminder)} 
                    icon={Monitor} 
                    colorClass="text-green-500" 
                />
                
                <ToggleItem 
                    label={t('system_guidance') || "INTERACTIVE GUIDANCE"} 
                    ttKey="tt_tooltips_global" 
                    active={preferences?.showTooltips !== false} 
                    onClick={() => updatePreference('showTooltips', preferences?.showTooltips === false)} 
                    icon={HelpCircle} 
                    colorClass="text-[var(--accent)]" 
                />
            </div>
        </section>
    );
};