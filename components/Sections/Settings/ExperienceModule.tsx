"use client";
import React, { useEffect } from 'react';
import { 
    LayoutTemplate, Smartphone, Lock, Bell, Moon, 
    Monitor, Zap, ShieldCheck, HelpCircle, Activity 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

export const ExperienceModule = ({ preferences, updatePreference }: any) => {
    const { t } = useTranslation();

    // DEBUG: Check if props are being received
    console.log(' [DEBUG] Prefs ready:', !!preferences, 'Action ready:', !!updatePreference);

    // TURBO/MIDNIGHT MODE HANDLING
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        
        // Turbo Mode
        body.classList.toggle('turbo-active', preferences.turboMode);
        
        // Midnight Mode
        root.classList.toggle('midnight-mode', preferences.isMidnight);
    }, [preferences.turboMode, preferences.isMidnight]);

    // ATOMIC HANDSHAKE: Dispatch vault update on mode changes
    useEffect(() => {
        const dispatchUpdate = async () => {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('vault-updated', { 
                    detail: { source: 'ExperienceModule', origin: 'local-mutation' } 
                }));
            }
        };
        dispatchUpdate();
    }, [preferences.turboMode, preferences.isMidnight, preferences.compactMode, preferences.autoLock]);

    const ToggleItem = ({ active, onClick, icon: Icon, label, ttKey, colorClass }: any) => (
        <Tooltip text={preferences.showTooltips !== false ? t(ttKey) : ""}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                    "group flex items-center justify-between p-4 apple-card rounded-[32px] border border-[var(--border)] transition-all duration-500 hover:border-orange-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                    active && "border-orange-500/20 bg-orange-500/[0.03]"
                )}
            >
                <div className="flex items-center gap-3.5">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner border border-transparent",
                        active ? cn("bg-orange-500/10 border-orange-500/20", colorClass) : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)]"
                    )}>
                        <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-[var(--text-main)] leading-tight">
                            {label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={cn("w-1 h-1 rounded-full animate-pulse", active ? "bg-green-500" : "bg-zinc-600")} />
                            <span className="text-[7px] font-medium text-[var(--text-muted)] opacity-50">
                                {active ? 'Protocol Active' : 'Standby Mode'}
                            </span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClick}
                    className={cn(
                        "w-11 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 shadow-inner",
                        active ? "bg-orange-500" : "bg-zinc-800"
                    )}
                >
                    <motion.div 
                        animate={{ x: active ? 20 : 0, scale: active ? 1 : 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-xl"
                    />
                </button>
            </motion.div>
        </Tooltip>
    );

    return (
        <div className={cn(
            "relative apple-card apple-glass rounded-[40px] border border-[var(--border)]",
            "p-8 md:p-12 overflow-hidden shadow-2xl transition-all duration-700 group/module"
        )}>
            {/* 🌌 High-Tech Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.03),transparent)] pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 opacity-[0.03] pointer-events-none group-hover/module:opacity-[0.06] group-hover/module:rotate-12 transition-all duration-1000">
                <LayoutTemplate size={320} className="text-purple-500" />
            </div>

            {/* Header Area */}
            <div className="flex items-center gap-5 mb-12 relative z-10">
                <div className="w-14 h-14 bg-purple-500/10 rounded-[22px] text-purple-500 border border-purple-500/20 shadow-inner flex items-center justify-center">
                    <Zap size={26} strokeWidth={2.5} className="animate-pulse" />
                </div>
                <div>
                    <h4 className="text-lg font-medium text-[var(--text-main)] leading-none">
                        {t('interface_engine') || "INTERFACE ENGINE"}
                    </h4>
                    <div className="flex items-center gap-2 mt-2.5">
                        <span className="h-[1px] w-6 bg-purple-500/40" />
                        <p className="text-[9px] font-medium text-purple-500/70">Core Optimization Protocol</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                {/* 🚀 New: Turbo Mode Controller */}
                <ToggleItem 
                    label={t('turbo_mode_on') || "TURBO MODE"} 
                    ttKey="tt_turbo" 
                    active={preferences.turboMode} 
                    onClick={() => updatePreference('turboMode', !preferences.turboMode)} 
                    icon={Activity} 
                    colorClass="text-cyan-400" 
                />

                <ToggleItem label={t('amoled_midnight')} ttKey="tt_midnight" active={preferences.isMidnight} onClick={() => updatePreference('isMidnight', !preferences.isMidnight)} icon={Moon} colorClass="text-blue-400" />
                <ToggleItem label={t('compact_deck')} ttKey="tt_compact" active={preferences.compactMode} onClick={() => updatePreference('compactMode', !preferences.compactMode)} icon={Smartphone} />
                <ToggleItem label={t('session_shield')} ttKey="tt_autolock" active={preferences.autoLock} onClick={() => updatePreference('autoLock', !preferences.autoLock)} icon={Lock} colorClass="text-red-500" />
                <ToggleItem label={t('system_pulse')} ttKey="tt_reminders" active={preferences.dailyReminder} onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)} icon={Monitor} colorClass="text-green-500" />
                
                {/* System Guidance */}
                <ToggleItem 
                    label={t('system_guidance') || "SYSTEM GUIDANCE"} 
                    ttKey="tt_tooltips_global" 
                    active={preferences.showTooltips !== false} 
                    onClick={() => updatePreference('showTooltips', preferences.showTooltips === false)} 
                    icon={HelpCircle} 
                    colorClass="text-purple-400" 
                />
            </div>
        </div>
    );
};