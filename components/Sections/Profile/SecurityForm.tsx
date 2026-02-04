"use client";
import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, Moon, Sun, Lock } from 'lucide-react';
import { Chrome } from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: SECURITY FORM (AUTH-AWARE REFACTOR)
 * --------------------------------------------
 * Credentials: Full access with mandatory current password.
 * Google: Locked/Blurred password fields with specific guidance.
 */
export const SecurityForm = ({ formData, setForm, updateProfile, currentUser, isLoading }: any) => {
    const { T, t } = useTranslation();
    const [isMidnight, setIsMidnight] = useState(false);

    const isGoogleUser = currentUser?.authProvider !== 'credentials';

    const toggleMidnight = () => {
        setIsMidnight(!isMidnight);
        const root = document.documentElement;
        if (!isMidnight) {
            root.style.setProperty('--bg-app', '#000000');
            root.style.setProperty('--bg-card', '#080808');
            root.classList.add('midnight-mode');
        } else {
            root.style.setProperty('--bg-app', '#0F0F0F');
            root.style.setProperty('--bg-card', '#1A1A1B');
            root.classList.remove('midnight-mode');
        }
    };

    return (
        <div className="app-card p-[var(--card-padding,2rem)] bg-[var(--bg-card)] shadow-2xl border border-[var(--border-color)] transition-all duration-300">
            <div className="flex justify-between items-center mb-[var(--app-gap,2rem)]">
                <h4 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[3px] italic flex items-center gap-3">
                    <ShieldCheck size={18} className="text-orange-500" /> {T('security_protocol_title')}
                </h4>
                
                {/* AMOLED Midnight Toggle */}
                <Tooltip text={t('tt_midnight_toggle')}>
                    <button 
                        type="button"
                        onClick={toggleMidnight}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 ${isMidnight ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-transparent border-[var(--border-color)] text-[var(--text-muted)]'}`}
                    >
                        {isMidnight ? <Moon size={12} fill="currentColor" /> : <Sun size={12} />}
                        <span className="text-[8px] font-black uppercase tracking-widest">
                            {isMidnight ? T('midnight_on') : T('midnight_off')}
                        </span>
                    </button>
                </Tooltip>
            </div>
            
            <form onSubmit={updateProfile} className="space-y-[var(--app-gap,2rem)]">
                {/* 1. Identity Name Field - Available for all */}
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                        {T('identity_name_label')}
                    </label>
                    <input 
                        type="text" 
                        required
                        className="app-input w-full h-14 font-black uppercase text-sm tracking-widest bg-[var(--bg-app)] border-2 border-[var(--border-color)] focus:border-orange-500/40 outline-none px-6 rounded-2xl transition-all" 
                        value={formData.name} 
                        onChange={(e) => setForm({...formData, name: e.target.value})} 
                    />
                </div>

                {/* 2. Key Management Section (Logic Switch) */}
                <div className="relative">
                    {/* Google User Overlay / Red Alert */}
                    {isGoogleUser && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                            <Tooltip text={t('tt_google_pass_locked')}>
                                <div className="bg-red-500/10 backdrop-blur-[2px] border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl cursor-not-allowed">
                                    <Lock size={14} className="text-red-500" />
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                                        {T('google_locked_label') || "Google Identity Locked"}
                                    </span>
                                </div>
                            </Tooltip>
                        </div>
                    )}

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)]/30 transition-all ${isGoogleUser ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
                        {/* Current Password Field */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <KeyRound size={12} /> {T('current_key_label')}
                            </label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                required={!isGoogleUser} // Credentials এর জন্য Required
                                className="app-input w-full h-14 font-mono border-2 border-orange-500/20 focus:border-orange-500 bg-[var(--bg-app)] px-6 rounded-2xl outline-none transition-all" 
                                value={formData.currentPassword || ''} 
                                onChange={(e) => setForm({...formData, currentPassword: e.target.value})} 
                            />
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                {T('new_key_label')}
                            </label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                className="app-input w-full h-14 font-mono bg-[var(--bg-app)] border-2 border-[var(--border-color)] focus:border-orange-500/40 px-6 rounded-2xl outline-none transition-all" 
                                value={formData.newPassword || ''} 
                                onChange={(e) => setForm({...formData, newPassword: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Submit Action with Google Awareness */}
                <Tooltip text={isGoogleUser ? t('tt_save_google') : t('tt_save_security')}>
                    <button 
                        disabled={isLoading} 
                        className={`app-btn-primary w-full py-5 text-[10px] font-black tracking-[4px] uppercase border-none text-white shadow-2xl rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center
                            ${isGoogleUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}
                        `}
                    >
                        {isLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <div className="flex items-center gap-3">
                                {isGoogleUser && <Chrome size={14} />}
                                {T('action_save_security')}
                            </div>
                        )}
                    </button>
                </Tooltip>
            </form>
        </div>
    );
};