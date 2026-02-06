"use client";
import React from 'react';
import { 
    KeyRound, Loader2, ShieldCheck, Lock, Chrome, 
    Zap, Fingerprint, MailCheck, User, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: SECURITY FORM (V5.2 ELITE)
 * --------------------------------------------
 * Handles identity and key rotation protocols.
 * Smart awareness for Google Managed vs. Standard Credentials.
 */

// --- 🛠️ SUB-COMPONENT: SMART SECURITY INPUT ---
const SecurityInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text", required = false, disabled = false }: any) => (
    <div className="space-y-2 group/input w-full">
        <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-orange-500/60" />} {label}
        </span>
        <div className={`relative h-14 rounded-[22px] border-2 transition-all duration-500 flex items-center px-5 bg-[var(--bg-app)] 
            ${disabled ? 'opacity-40 border-[var(--border)]' : 'border-[var(--border)] focus-within:border-orange-500/50 shadow-inner'}`}
        >
            <input 
                type={type} value={value} onChange={onChange} required={required} disabled={disabled}
                placeholder={placeholder}
                className="w-full bg-transparent border-none outline-none text-[13px] font-black uppercase tracking-widest text-[var(--text-main)] placeholder:opacity-20"
            />
        </div>
    </div>
);

export const SecurityForm = ({ formData, setForm, updateProfile, currentUser, isLoading }: any) => {
    const { T, t, language } = useTranslation();
    const isGoogleUser = currentUser?.authProvider !== 'credentials';

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-[var(--card-padding,2.5rem)] overflow-hidden shadow-xl transition-all duration-500 group">
            
            {/* Background Branding Decor */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <ShieldCheck size={300} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-orange-500/10 rounded-2xl text-orange-500 border border-orange-500/20 shadow-inner">
                        <ShieldCheck size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[4px] italic leading-none">
                            {T('security_protocol_title') || "SECURITY PROTOCOL"}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                            Identity & Access Configuration
                        </p>
                    </div>
                </div>

                {/* Managed Status Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl opacity-60">
                    <Zap size={10} className="text-orange-500" fill="currentColor" />
                    <span className="text-[8px] font-black uppercase tracking-widest">{T('status_master') || "MASTER LEVEL"}</span>
                </div>
            </div>
            
            <form onSubmit={updateProfile} className="space-y-8 relative z-10">
                
                {/* 1. IDENTITY REGISTRY (Name Field) */}
                <div className="p-1 bg-[var(--bg-app)] ">
                    <SecurityInput 
                        label={T('identity_name_label') || "IDENTITY REGISTRY NAME"}
                        placeholder={t('placeholder_identity')}
                        value={formData.name}
                        onChange={(e: any) => setForm({...formData, name: e.target.value})}
                        icon={User}
                        required
                    />
                </div>

                {/* 2. KEY MANAGEMENT (Managed Protection) */}
                <div className="relative">
                    <AnimatePresence>
                        {isGoogleUser && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] bg-red-500/[0.02] rounded-[30px] border border-red-500/10"
                            >
                                <Tooltip text={t('tt_google_pass_locked')}>
                                    <div className="bg-[var(--bg-card)] border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl group/lock cursor-not-allowed active:scale-95 transition-all">
                                        <Lock size={16} className="text-red-500 animate-pulse" />
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">
                                                {T('google_locked_label') || "IDENTITY MANAGED BY GOOGLE"}
                                            </p>
                                            <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase mt-1 opacity-60">Key Rotation Restricted</p>
                                        </div>
                                    </div>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-1 transition-all duration-700 ${isGoogleUser ? 'blur-md opacity-20 pointer-events-none' : 'opacity-100'}`}>
                        {/* Current Security Key */}
                        <SecurityInput 
                            label={T('current_key_label') || "CURRENT SECURITY KEY"}
                            placeholder="••••••••"
                            type="password"
                            value={formData.currentPassword || ''}
                            onChange={(e: any) => setForm({...formData, currentPassword: e.target.value})}
                            icon={KeyRound}
                            required={!isGoogleUser}
                        />

                        {/* New Security Key */}
                        <SecurityInput 
                            label={T('new_key_label') || "NEW ACCESS KEY"}
                            placeholder="••••••••"
                            type="password"
                            value={formData.newPassword || ''}
                            onChange={(e: any) => setForm({...formData, newPassword: e.target.value})}
                            icon={Fingerprint}
                        />
                    </div>
                </div>

                {/* 3. EXECUTION CONTROL */}
                <div className="pt-4">
                    <Tooltip text={isGoogleUser ? t('tt_save_google') : t('tt_save_security')}>
                        <button 
                            disabled={isLoading} 
                            className={`w-full h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[5px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 border-none group/btn
                                ${isGoogleUser 
                                    ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' 
                                    : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'}
                            `}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <div className="flex items-center gap-4">
                                    {isGoogleUser ? <Chrome size={20} strokeWidth={2.5} /> : <Fingerprint size={20} strokeWidth={2.5} className="group-hover/btn:rotate-12 transition-transform" />}
                                    <span>{T('action_save_security') || "EXECUTE IDENTITY UPDATE"}</span>
                                </div>
                            )}
                        </button>
                    </Tooltip>
                </div>
            </form>
        </div>
    );
};