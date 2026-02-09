"use client";
import React, { useMemo } from 'react';
import { 
    Camera, Chrome, Zap, ShieldCheck, Activity, 
    Trash2, User, MailCheck, Fingerprint, BadgeCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn } from '@/lib/utils/helpers'; // তোর নতুন helpers

export const IdentityHero = ({ formData, handleImageProcess, setForm, currentUser, fileInputRef }: any) => {
    const { T, t, language } = useTranslation();
    
    // --- 🧬 ১. INTEGRITY LOGIC (100% Preserved) ---
    const healthScore = useMemo(() => {
        let score = 0;
        if (formData.name) score += 25;
        if (formData.image) score += 25;
        if (currentUser?.authProvider === 'google') score += 25;
        if (typeof window !== 'undefined' && localStorage.getItem('last_backup_time')) score += 25;
        return score;
    }, [formData, currentUser]);

    const handleRemovePhoto = () => {
        setForm({ ...formData, image: '' });
    };

    return (
        <div className={cn(
            "relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)]",
            "p-8 flex flex-col items-center text-center overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* --- 🛡️ INTEGRITY WATERMARK (Elite Badge Style) --- */}
            <div className="absolute top-6 left-8 z-10">
                <Tooltip text={t('tt_integrity_score') || "System Integrity Measurement"}>
                    <div className="flex flex-col items-start gap-1.5 cursor-help">
                        <span className="text-[8px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-40">
                            {T('label_integrity') || "INTEGRITY"}
                        </span>
                        <div className="flex items-center gap-2 bg-[var(--bg-app)] px-2.5 py-1 rounded-lg border border-[var(--border)] shadow-inner">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                healthScore >= 75 ? "bg-green-500" : "bg-orange-500"
                            )} />
                            <span className={cn(
                                "text-[11px] font-black font-mono tracking-tighter",
                                healthScore >= 75 ? "text-green-500" : "text-orange-500"
                            )}>
                                {toBn(healthScore, language)}%
                            </span>
                        </div>
                    </div>
                </Tooltip>
            </div>

            {/* --- 📸 IDENTITY AVATAR & ENCRYPTED RING --- */}
            <div className="relative mt-10 group/avatar">
                {/* Protocol Health Ring (Decorative SVG Logic) */}
                <div className="absolute -inset-8 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                        <circle cx="110" cy="110" r="95" stroke="var(--border)" strokeWidth="1" fill="transparent" strokeDasharray="8 8" />
                        <motion.circle 
                            cx="110" cy="110" r="95" 
                            stroke="var(--accent)" 
                            strokeWidth="3" 
                            fill="transparent"
                            strokeDasharray="596"
                            initial={{ strokeDashoffset: 596 }}
                            animate={{ strokeDashoffset: 596 - (596 * healthScore) / 100 }}
                            transition={{ duration: 2.5, ease: "circOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                
                {/* Elite Squircle Profile Image */}
                <div className={cn(
                    "w-48 h-48 rounded-[65px] flex items-center justify-center",
                    "shadow-[0_35px_70px_-15px_rgba(0,0,0,0.4)] border-[12px] border-[var(--bg-card)]",
                    "bg-[var(--bg-app)] relative z-10 overflow-hidden",
                    "group-hover:scale-[1.03] transition-all duration-700 ease-out"
                )}>
                    {formData.image ? (
                        <motion.img 
                            initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            src={formData.image} alt="ID" className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-app)] to-[var(--border)]">
                            <User size={72} strokeWidth={1} className="text-[var(--text-muted)] opacity-10" />
                            <span className="text-3xl font-black text-orange-500/10 italic uppercase mt-2">
                                {formData.name?.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Apple Style Haptic Action Buttons */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
                    <Tooltip text={t('tt_upload_photo')}>
                        <motion.button 
                            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-orange-500 text-white p-4 rounded-2xl shadow-xl shadow-orange-500/30 border-4 border-[var(--bg-card)] hover:bg-orange-600 transition-all"
                        >
                            <Camera size={20} strokeWidth={2.5} />
                        </motion.button>
                    </Tooltip>
                    
                    {formData.image && (
                        <Tooltip text={t('tt_remove_photo')}>
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                                onClick={handleRemovePhoto}
                                className="bg-zinc-800 text-red-500 p-4 rounded-2xl shadow-xl border-4 border-[var(--bg-card)] hover:bg-red-500 hover:text-white transition-all"
                            >
                                <Trash2 size={20} strokeWidth={2.5} />
                            </motion.button>
                        </Tooltip>
                    )}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => e.target.files && handleImageProcess(e.target.files[0])} />
            </div>

            {/* --- 📝 IDENTITY INFO SECTION --- */}
            <div className="mt-16 relative z-10 w-full space-y-4">
                <div className="flex items-center justify-center gap-3">
                    <Tooltip text={t('tt_display_identity') || "System Registered Username"}>
                        <h3 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none truncate max-w-[85%] group-hover:text-orange-500 transition-colors cursor-help">
                            {formData.name}
                        </h3>
                    </Tooltip>
                    {healthScore >= 75 && (
                        <Tooltip text={t('tt_profile_secured')}>
                            <BadgeCheck size={28} className="text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]" />
                        </Tooltip>
                    )}
                </div>
                
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] opacity-40 select-all font-mono">
                    {currentUser?.email}
                </p>
                
                {/* Native OS Verification Badge */}
                <div className="pt-6 flex justify-center">
                    {currentUser?.authProvider === 'google' ? (
                        <Tooltip text={t('tt_google_auth') || "Authenticated via Google Systems"}>
                            <div className="px-6 py-3 rounded-[22px] bg-blue-500/5 border border-blue-500/10 text-blue-400 flex items-center gap-4 shadow-inner group/badge hover:border-blue-500/30 transition-all duration-500 cursor-help">
                                <div className="p-2 bg-blue-500/10 rounded-xl group-hover/badge:scale-110 transition-transform"><Chrome size={18} strokeWidth={2.5} /></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{T('label_google_verified') || "GOOGLE VERIFIED"}</p>
                                    <p className="text-[8px] font-bold uppercase opacity-40 mt-2 tracking-wider">{t('identity_secured')}</p>
                                </div>
                            </div>
                        </Tooltip>
                    ) : (
                        <Tooltip text={t('tt_vault_auth') || "Standard Vault Identity"}>
                            <div className="px-6 py-3 rounded-[22px] bg-orange-500/5 border border-orange-500/10 text-orange-500 flex items-center gap-4 group/badge hover:border-orange-500/30 transition-all duration-500 cursor-help">
                                <div className="p-2 bg-orange-500/10 rounded-xl group-hover/badge:scale-110 transition-transform"><MailCheck size={18} strokeWidth={2.5} /></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">{T('label_standard_identity') || "VAULT IDENTITY"}</p>
                                    <p className="text-[8px] font-bold uppercase opacity-40 mt-2 tracking-wider">{t('email_auth_active')}</p>
                                </div>
                            </div>
                        </Tooltip>
                    )}
                </div>

                {/* System Nodes Info Grid */}
                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <Tooltip text={t('tt_network_status') || "Live Connection Monitor"}>
                        <div className="p-5 rounded-[30px] bg-[var(--bg-app)] border border-[var(--border)] group/item hover:border-orange-500/30 transition-all cursor-help">
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-2 opacity-40 tracking-[3px]">{T('label_connection')}</p>
                            <div className="flex items-center justify-center gap-2 text-green-500">
                                <Activity size={14} className="animate-pulse" />
                                <span className="text-[11px] font-black uppercase tracking-[2px]">{T('label_status_stable') || "STABLE"}</span>
                            </div>
                        </div>
                    </Tooltip>

                    <Tooltip text={t('tt_access_rank') || "Permission Tier Level"}>
                        <div className="p-5 rounded-[30px] bg-[var(--bg-app)] border border-[var(--border)] group/item hover:border-orange-500/30 transition-all cursor-help">
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-2 opacity-40 tracking-[3px]">{T('label_hierarchy')}</p>
                            <div className="flex items-center justify-center gap-2 text-orange-500">
                                <Zap size={14} fill="currentColor" strokeWidth={0} />
                                <span className="text-[11px] font-black uppercase tracking-[2px]">{T('label_rank_master') || "MASTER"}</span>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* --- 🛰️ OS SIGNATURE FOOTER --- */}
            <div className="mt-auto pt-12 flex flex-col items-center gap-3 opacity-10 group-hover:opacity-40 transition-all duration-1000">
                <div className="flex items-center gap-5">
                    <div className="h-px w-10 bg-current" />
                    <Fingerprint size={22} strokeWidth={1.5} className="animate-pulse" />
                    <div className="h-px w-10 bg-current" />
                </div>
                <Tooltip text={t('tt_node_serial') || "Unique System Node Identity"}>
                    <p className="text-[9px] font-mono font-bold tracking-[8px] uppercase cursor-help">
                        NODE-{String(currentUser?._id).slice(-8).toUpperCase()}
                    </p>
                </Tooltip>
            </div>
        </div>
    );
};