"use client";
import React from 'react';
import { LayoutTemplate, Smartphone, Lock, Bell, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { motion } from 'framer-motion';

/**
 * VAULT PRO: EXPERIENCE MODULE (100% STABLE)
 * ---------------------------------------
 * Handles Interface Toggles: Midnight, Compact, Shield, etc.
 * Fully integrated with Global Variables, Multi-language, and Tooltips.
 */
export const ExperienceModule = ({ preferences, updatePreference }: any) => {
    const { T, t } = useTranslation();

    // 🔥 Exclusive Midnight Logic: গ্লোবাল ক্লাস টগল এবং ডেটাবেজ সিঙ্ক
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

    // সাব-কম্পোনেন্ট: রিইউজেবল টগল বাটন উইথ টুলটিপ
    const Toggle = ({ active, onClick, icon: Icon, label, ttKey }: any) => (
        <Tooltip text={t(ttKey)}>
            <div className="flex items-center justify-between p-[var(--card-padding,1.25rem)] bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] group hover:border-orange-500/30 transition-all duration-300 w-full">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] transition-all ${active ? 'text-orange-500 shadow-lg shadow-orange-500/10 border-orange-500/20' : 'text-[var(--text-muted)]'}`}>
                        <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest whitespace-nowrap">
                        {label}
                    </span>
                </div>
                <button 
                    onClick={onClick}
                    className={`w-12 h-6 rounded-full relative transition-all duration-500 flex items-center px-1 ${active ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800'}`}
                >
                    <motion.div 
                        animate={{ x: active ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-4 h-4 bg-white rounded-full shadow-md"
                    />
                </button>
            </div>
        </Tooltip>
    );

    return (
        <div className="app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] shadow-2xl transition-all duration-300 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -left-10 -bottom-10 opacity-[0.01] pointer-events-none rotate-12">
                <LayoutTemplate size={300} />
            </div>

            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8 relative z-10">
                <LayoutTemplate size={18} className="text-purple-500" /> {T('interface_engine')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--app-gap,1rem)] relative z-10">
                {/* 1. Midnight Mode */}
                <Toggle 
                    label={T('amoled_midnight')} 
                    ttKey="tt_midnight"
                    active={preferences.isMidnight} 
                    onClick={handleMidnightToggle} 
                    icon={Moon} 
                />
                
                {/* 2. Compact View */}
                <Toggle 
                    label={T('compact_deck')} 
                    ttKey="tt_compact"
                    active={preferences.compactMode} 
                    onClick={() => updatePreference('compactMode', !preferences.compactMode)} 
                    icon={Smartphone} 
                />
                
                {/* 3. Security Shield */}
                <Toggle 
                    label={T('session_shield')} 
                    ttKey="tt_autolock"
                    active={preferences.autoLock} 
                    onClick={() => updatePreference('autoLock', !preferences.autoLock)} 
                    icon={Lock} 
                />
                
                {/* 4. System Pulse (Reminders) */}
                <Toggle 
                    label={T('system_pulse')} 
                    ttKey="tt_reminders"
                    active={preferences.dailyReminder} 
                    onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)} 
                    icon={Monitor} 
                />
                
                {/* 5. Activity Brief */}
                <Toggle 
                    label={T('activity_brief')} 
                    ttKey="tt_notifications"
                    active={true} 
                    onClick={() => {}} 
                    icon={Bell} 
                />
            </div>
        </div>
    );
};