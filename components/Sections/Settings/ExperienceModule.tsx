"use client";
import React from 'react';
import { 
    LayoutTemplate, Smartphone, Lock, Bell, Moon, 
    Monitor, Zap, ShieldCheck, Sparkles 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { motion } from 'framer-motion';

/**
 * VAULT PRO: EXPERIENCE MODULE (ELITE EDITION)
 * -------------------------------------------
 * Handles Interface Toggles: Midnight, Compact, Shield, etc.
 * Optimized for OS-level consistency and Haptic feedback.
 */

export const ExperienceModule = ({ preferences, updatePreference }: any) => {
    const { T, t } = useTranslation();

    // --- 🧬 LOGIC PRESERVED: Midnight Global Class Trigger ---
    const handleMidnightToggle = () => {
        const newState = !preferences.isMidnight;
        updatePreference('isMidnight', newState);
        
        const root = document.documentElement;
        if (newState) {
            root.classList.add('midnight-mode');
        } else {
            root.classList.remove('midnight-mode');
        }
    };

    // --- 🔘 SUB-COMPONENT: ELITE NATIVE TOGGLE ---
    const ToggleItem = ({ active, onClick, icon: Icon, label, ttKey, colorClass = "text-orange-500" }: any) => (
        <Tooltip text={t(ttKey)}>
            <div className={`group flex items-center justify-between p-4 md:p-5 bg-[var(--bg-app)] rounded-[24px] border border-[var(--border)] transition-all duration-500 hover:shadow-lg hover:border-orange-500/20 ${active ? 'ring-1 ring-orange-500/10' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        active 
                        ? `bg-orange-500/10 ${colorClass}` 
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}>
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest leading-none">
                            {label}
                        </span>
                        <span className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-[1px] mt-1 opacity-40">
                            {active ? 'Protocol Active' : 'Protocol Standby'}
                        </span>
                    </div>
                </div>

                {/* Apple Style Switch */}
                <button 
                    onClick={onClick}
                    className={`w-11 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 border-none outline-none ${
                        active ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-zinc-800'
                    }`}
                >
                    <motion.div 
                        animate={{ x: active ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-md"
                    />
                </button>
            </div>
        </Tooltip>
    );

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2rem)] overflow-hidden shadow-xl transition-all duration-500 group">
            
            {/* Background Decor (Engine Blueprint) */}
            <div className="absolute -right-20 -bottom-20 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                <LayoutTemplate size={400} strokeWidth={1} />
            </div>

            {/* Header: OS Section Style */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-500 border border-purple-500/20 shadow-inner">
                        <Zap size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('interface_engine')}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                            Customize System Interaction
                        </p>
                    </div>
                </div>
                <Sparkles size={18} className="text-orange-500 opacity-20 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {/* 1. Midnight Mode (OLED Focus) */}
                <ToggleItem 
                    label={T('amoled_midnight')} 
                    ttKey="tt_midnight"
                    active={preferences.isMidnight} 
                    onClick={handleMidnightToggle} 
                    icon={Moon} 
                    colorClass="text-blue-400"
                />
                
                {/* 2. Compact View (Efficiency Focus) */}
                <ToggleItem 
                    label={T('compact_deck')} 
                    ttKey="tt_compact"
                    active={preferences.compactMode} 
                    onClick={() => updatePreference('compactMode', !preferences.compactMode)} 
                    icon={Smartphone} 
                />
                
                {/* 3. Session Shield (Security Focus) */}
                <ToggleItem 
                    label={T('session_shield')} 
                    ttKey="tt_autolock"
                    active={preferences.autoLock} 
                    onClick={() => updatePreference('autoLock', !preferences.autoLock)} 
                    icon={Lock} 
                    colorClass="text-red-500"
                />
                
                {/* 4. System Pulse (Reminder Focus) */}
                <ToggleItem 
                    label={T('system_pulse')} 
                    ttKey="tt_reminders"
                    active={preferences.dailyReminder} 
                    onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)} 
                    icon={Monitor} 
                    colorClass="text-green-500"
                />
                
                {/* 5. Activity Brief (Notification Focus) */}
                <ToggleItem 
                    label={T('activity_brief')} 
                    ttKey="tt_notifications"
                    active={true} 
                    onClick={() => {}} 
                    icon={Bell} 
                    colorClass="text-yellow-500"
                />

                {/* 6. Dynamic Visuals (Identity Focus) */}
                <div className="hidden lg:flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-[24px] opacity-20">
                    <ShieldCheck size={24} />
                </div>
            </div>
        </div>
    );
};