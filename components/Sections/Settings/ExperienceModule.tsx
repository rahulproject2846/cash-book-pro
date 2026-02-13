"use client";
import React from 'react';
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

    const ToggleItem = ({ active, onClick, icon: Icon, label, ttKey, colorClass }: any) => (
        <Tooltip text={preferences.showTooltips !== false ? t(ttKey) : ""}>
            <div className={cn(
                "group flex items-center justify-between p-4 bg-[var(--bg-app)]/40 backdrop-blur-sm rounded-[24px] border border-[var(--border)] transition-all duration-500 hover:border-orange-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                active && "border-orange-500/20 bg-orange-500/[0.03]"
            )}>
                <div className="flex items-center gap-3.5">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner border border-transparent",
                        active ? cn("bg-orange-500/10 border-orange-500/20", colorClass) : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border)]"
                    )}>
                        <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-[1.5px] leading-tight">
                            {label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={cn("w-1 h-1 rounded-full animate-pulse", active ? "bg-green-500" : "bg-zinc-600")} />
                            <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[1.2px] opacity-50">
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
            </div>
        </Tooltip>
    );

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[48px] border border-[var(--border)]",
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
                    <h4 className="text-lg font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                        {t('interface_engine') || "INTERFACE ENGINE"}
                    </h4>
                    <div className="flex items-center gap-2 mt-2.5">
                        <span className="h-[1px] w-6 bg-purple-500/40" />
                        <p className="text-[9px] font-black text-purple-500/70 uppercase tracking-[2px]">Core Optimization Protocol</p>
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