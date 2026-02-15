"use client";
import React, { useState } from 'react';
import { 
    KeyRound, Loader2, ShieldCheck, Lock, Chrome, 
    Zap, Fingerprint, User, BadgeCheck, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

// --- 🛠️ SUB-COMPONENT: ELITE SECURITY INPUT ---
const SecurityInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text", required = false, disabled = false, ttKey }: any) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-3 group/input w-full">
            <div className="flex items-center gap-2 ml-1">
                {Icon && <Icon size={12} className="text-orange-500/60" />}
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px]">
                    {label}
                </span>
            </div>
            <Tooltip text={disabled ? "" : t(ttKey) || "Update identity node"}>
                <div className={cn(
                    "relative h-14 rounded-[22px] border-2 transition-all duration-500 flex items-center px-6 bg-[var(--bg-app)]",
                    disabled 
                        ? "opacity-30 border-[var(--border)] cursor-not-allowed" 
                        : "border-[var(--border)] focus-within:border-orange-500/40 shadow-inner"
                )}>
                    <input 
                        type={type} value={value} onChange={onChange} required={required} disabled={disabled}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none outline-none text-[13px] font-bold tracking-widest text-[var(--text-main)] placeholder:opacity-10"
                    />
                </div>
            </Tooltip>
        </div>
    );
};

export const SecurityForm = ({ formData, setForm, updateProfile, currentUser, isLoading }: any) => {
    const { t, language } = useTranslation();
    const isGoogleUser = currentUser?.authProvider !== 'credentials';

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-6 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* Background Branding Decor */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.02] rotate-12 pointer-events-none group-hover:opacity-[0.04] transition-opacity">
                <ShieldCheck size={350} strokeWidth={1} />
            </div>

            {/* --- 🏷️ HEADER SECTION --- */}
            <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <Tooltip text={t('tt_security_node') || "System Security Protocol Active"}>
                        <div className="p-3 bg-orange-500/10 rounded-[20px] text-orange-500 border border-orange-500/20 shadow-inner">
                            <ShieldCheck size={22} strokeWidth={2.5} />
                        </div>
                    </Tooltip>
                    <div>
                        <h4 className="text-base font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                            {t('security_protocol_title') || "SECURITY PROTOCOL"}
                        </h4>
                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-2 opacity-60">
                            Identity & Access Configuration
                        </p>
                    </div>
                </div>

                {/* Managed Status Badge */}
                <Tooltip text={t('tt_master_rank') || "Highest privilege access level"}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-app)] border border-[var(--border)] rounded-[18px] opacity-60 hover:opacity-100 transition-opacity cursor-help">
                        <Zap size={12} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{t('status_master') || "MASTER LEVEL"}</span>
                    </div>
                </Tooltip>
            </div>
            
            <form onSubmit={updateProfile} className="space-y-10 relative z-10">
                
                {/* 1. IDENTITY REGISTRY (Name Field) */}
                <div className="space-y-4">
                    <SecurityInput 
                        label={t('identity_name_label') || "IDENTITY REGISTRY NAME"}
                        placeholder={t('placeholder_identity')}
                        value={formData.name || ''}
                        onChange={(e: any) => setForm({...formData, name: e.target.value})}
                        icon={User}
                        ttKey="tt_identity_input"
                        required
                    />
                </div>

                {/* 2. KEY MANAGEMENT (Managed Protection) */}
                <div className="relative">
                    <AnimatePresence>
                        {isGoogleUser && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="absolute -inset-2 z-20 flex flex-col items-center justify-center backdrop-blur-[3px] bg-red-500/[0.03] rounded-[30px] border border-red-500/10"
                            >
                                <Tooltip text={t('tt_google_pass_locked')}>
                                    <div className="bg-[var(--bg-card)] border border-red-500/20 px-8 py-4 rounded-[25px] flex items-center gap-5 shadow-2xl group/lock cursor-not-allowed active:scale-95 transition-all">
                                        <div className="p-3 bg-red-500/10 rounded-2xl">
                                            <Lock size={18} className="text-red-500 animate-pulse" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">
                                                {t('google_locked_label') || "MANAGED BY GOOGLE"}
                                            </p>
                                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-2 opacity-50">Key Rotation Restricted</p>
                                        </div>
                                    </div>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-2 gap-6 p-1 transition-all duration-1000",
                        isGoogleUser ? "blur-md opacity-20 pointer-events-none" : "opacity-100"
                    )}>
                        {/* Current Security Key */}
                        <SecurityInput 
                            label={t('current_key_label') || "CURRENT SECURITY KEY"}
                            placeholder="••••••••"
                            type="password"
                            value={formData.currentPassword || ''}
                            onChange={(e: any) => setForm({...formData, currentPassword: e.target.value})}
                            icon={KeyRound}
                            ttKey="tt_current_pass"
                            required={!isGoogleUser}
                        />

                        {/* New Security Key */}
                        <SecurityInput 
                            label={t('new_key_label') || "NEW ACCESS KEY"}
                            placeholder="••••••••"
                            type="password"
                            value={formData.newPassword || ''}
                            onChange={(e: any) => setForm({...formData, newPassword: e.target.value})}
                            icon={Fingerprint}
                            ttKey="tt_new_pass"
                        />
                    </div>
                </div>

                {/* 3. EXECUTION CONTROL */}
                <div className="pt-2">
                    <Tooltip text={isGoogleUser ? t('tt_save_google') : t('tt_save_security')}>
                        <button 
                            disabled={isLoading} 
                            className={cn(
                                "w-full h-16 rounded-[28px] font-black text-[12px] uppercase tracking-[5px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 border-none group/btn",
                                isGoogleUser 
                                    ? "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700" 
                                    : "bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 size={22} className="animate-spin" />
                            ) : (
                                <div className="flex items-center gap-5">
                                    {isGoogleUser 
                                        ? <Chrome size={22} strokeWidth={2.5} /> 
                                        : <Fingerprint size={22} strokeWidth={2.5} className="group-hover/btn:rotate-12 transition-transform duration-500" />
                                    }
                                    <span>{t('action_save_security') || "EXECUTE IDENTITY UPDATE"}</span>
                                </div>
                            )}
                        </button>
                    </Tooltip>
                </div>
            </form>
        </div>
    );
};