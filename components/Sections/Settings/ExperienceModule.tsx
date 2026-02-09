"use client";
import React from 'react';
import { 
    LayoutTemplate, Smartphone, Lock, Bell, Moon, 
    Monitor, Zap, ShieldCheck, HelpCircle 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';

export const ExperienceModule = ({ preferences, updatePreference }: any) => {
    const { T, t } = useTranslation();

    const ToggleItem = ({ active, onClick, icon: Icon, label, ttKey, colorClass }: any) => (
        <Tooltip text={preferences.showTooltips !== false ? t(ttKey) : ""}>
            <div className={cn(
                "group flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-[22px] border border-[var(--border)] transition-all duration-500 hover:shadow-md",
                active && "border-orange-500/30 bg-orange-500/[0.02]"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner",
                        active ? cn("bg-orange-500/10", colorClass) : "bg-[var(--bg-card)] text-[var(--text-muted)]"
                    )}>
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest leading-none">
                            {label}
                        </span>
                        <span className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-[1px] mt-1 opacity-40">
                            {active ? 'Protocol Active' : 'Standby'}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={onClick}
                    className={cn(
                        "w-10 h-5 rounded-full relative transition-all duration-500 flex items-center px-0.5",
                        active ? "bg-orange-500" : "bg-zinc-800"
                    )}
                >
                    <motion.div 
                        animate={{ x: active ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                </button>
            </div>
        </Tooltip>
    );

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            {/* Background Decor */}
            <div className="absolute -right-20 -bottom-20 opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <LayoutTemplate size={400} className="text-purple-500" />
            </div>

            <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="p-3 bg-purple-500/10 rounded-[20px] text-purple-500 border border-purple-500/20 shadow-inner">
                    <Zap size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                        {T('interface_engine') || "INTERFACE ENGINE"}
                    </h4>
                    <p className="text-[8px] font-bold text-purple-500 uppercase tracking-[2px] mt-2 opacity-60">Customize Visual Interaction</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                <ToggleItem label={T('amoled_midnight')} ttKey="tt_midnight" active={preferences.isMidnight} onClick={() => updatePreference('isMidnight', !preferences.isMidnight)} icon={Moon} colorClass="text-blue-400" />
                <ToggleItem label={T('compact_deck')} ttKey="tt_compact" active={preferences.compactMode} onClick={() => updatePreference('compactMode', !preferences.compactMode)} icon={Smartphone} />
                <ToggleItem label={T('session_shield')} ttKey="tt_autolock" active={preferences.autoLock} onClick={() => updatePreference('autoLock', !preferences.autoLock)} icon={Lock} colorClass="text-red-500" />
                <ToggleItem label={T('system_pulse')} ttKey="tt_reminders" active={preferences.dailyReminder} onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)} icon={Monitor} colorClass="text-green-500" />
                <ToggleItem label={T('activity_brief')} ttKey="tt_notifications" active={true} onClick={() => {}} icon={Bell} colorClass="text-yellow-500" />
                
                {/* --- New: Tooltip Controller --- */}
                <ToggleItem 
                    label={T('system_guidance') || "SYSTEM GUIDANCE"} 
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