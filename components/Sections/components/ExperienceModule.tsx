"use client";
import React, { useState } from 'react';
import { LayoutTemplate, Smartphone, Lock, Bell, Moon, Sun, Monitor } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const ExperienceModule = ({ preferences, updatePreference }: any) => {
    const { T } = useTranslation();
    const [isMidnight, setIsMidnight] = useState(false);

    const toggleMidnight = () => {
        setIsMidnight(!isMidnight);
        if (!isMidnight) {
            document.documentElement.style.setProperty('--bg-app', '#000000');
            document.documentElement.style.setProperty('--bg-card', '#080808');
        } else {
            document.documentElement.style.setProperty('--bg-app', '#0F0F0F');
            document.documentElement.style.setProperty('--bg-card', '#1A1A1B');
        }
    };

    const Toggle = ({ active, onClick, icon: Icon, label }: any) => (
        <div className="flex items-center justify-between p-5 bg-[var(--bg-app)] rounded-2xl border border-[var(--border-color)] group hover:border-[var(--accent)]/30 transition-all">
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] ${active ? 'text-orange-500 shadow-lg shadow-orange-500/10' : 'text-[var(--text-muted)]'}`}>
                    <Icon size={16} />
                </div>
                <span className="text-[10px] font-black uppercase text-[var(--text-main)] tracking-widest">{label}</span>
            </div>
            <button 
                onClick={onClick}
                className={`w-11 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-orange-500' : 'bg-slate-800'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-md transition-all duration-300 ${active ? 'right-1' : 'left-1'}`}></div>
            </button>
        </div>
    );

    return (
        <div className="app-card p-8 bg-[var(--bg-card)] shadow-2xl">
            <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3 mb-8">
                <LayoutTemplate size={18} className="text-purple-500" /> {T('interface_engine')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Toggle label={T('amoled_midnight')} active={isMidnight} onClick={toggleMidnight} icon={Moon} />
                <Toggle label={T('compact_deck')} active={preferences.compactMode} onClick={() => updatePreference('compactMode', !preferences.compactMode)} icon={Smartphone} />
                <Toggle label={T('session_shield')} active={preferences.autoLock} onClick={() => updatePreference('autoLock', !preferences.autoLock)} icon={Lock} />
                <Toggle label={T('system_pulse')} active={preferences.dailyReminder} onClick={() => updatePreference('dailyReminder', !preferences.dailyReminder)} icon={Monitor} />
                <Toggle label={T('activity_brief')} active={true} onClick={() => {}} icon={Bell} />
            </div>
        </div>
    );
};