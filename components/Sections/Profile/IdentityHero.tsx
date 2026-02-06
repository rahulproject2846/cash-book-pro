"use client";
import React, { useMemo } from 'react';
import { 
    Camera, Chrome, Zap, ShieldCheck, Activity, 
    Trash2, User, MailCheck, ShieldAlert, Fingerprint 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: IDENTITY HERO MODULE (V5.2 ELITE)
 * -------------------------------------------
 * Premium representation of the Master Identity and Integrity Score.
 * Fully decoupled from hardcoded strings.
 */
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

    // --- 🛠️ ২. BENGALI NUMBER SYNC ---
    const toBn = (num: any) => {
        if (language !== 'bn') return num;
        const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯' };
        return String(num).split('').map(c => bnNums[c] || c).join('');
    };

    return (
        <div className="relative bg-[var(--bg-card)] rounded-[40px] border border-[var(--border)] p-8 flex flex-col items-center text-center overflow-hidden shadow-2xl transition-all duration-500 group">
            
            {/* --- 🛡️ INTEGRITY WATERMARK --- */}
            <div className="absolute top-6 left-8 z-10">
                <div className="flex flex-col items-start gap-1">
                    <span className="text-[7px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">
                        {T('label_integrity') || "INTEGRITY"}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${healthScore >= 75 ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <span className={`text-[11px] font-black font-mono tracking-tighter ${healthScore >= 75 ? 'text-green-500' : 'text-orange-500'}`}>
                            {toBn(healthScore)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* --- 📸 IDENTITY AVATAR & ENCRYPTED RING --- */}
            <div className="relative mt-8 group/avatar">
                {/* Protocol Health Ring */}
                <div className="absolute -inset-6">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                        <circle cx="100" cy="100" r="88" stroke="var(--border)" strokeWidth="1.5" fill="transparent" strokeDasharray="6 6" className="opacity-20" />
                        <motion.circle 
                            cx="100" cy="100" r="88" 
                            stroke="var(--accent)" 
                            strokeWidth="4" 
                            fill="transparent"
                            strokeDasharray="552"
                            initial={{ strokeDashoffset: 552 }}
                            animate={{ strokeDashoffset: 552 - (552 * healthScore) / 100 }}
                            transition={{ duration: 2, ease: "circOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                
                {/* Squircle Profile Image */}
                <div className="w-48 h-48 rounded-[60px] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-[10px] border-[var(--bg-card)] bg-[var(--bg-app)] relative z-10 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
                    {formData.image ? (
                        <motion.img 
                            initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            src={formData.image} alt="ID" className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-app)] to-[var(--border)]">
                            <User size={72} strokeWidth={1} className="text-[var(--text-muted)] opacity-20" />
                            <span className="text-2xl font-black text-orange-500/20 italic uppercase mt-2">
                                {formData.name?.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Haptic Action Buttons */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
                    <Tooltip text={t('tt_upload_photo')}>
                        <motion.button 
                            whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-orange-500 text-white p-3.5 rounded-2xl shadow-xl shadow-orange-500/30 border-4 border-[var(--bg-card)] hover:bg-orange-600 transition-all"
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
                                className="bg-red-500 text-white p-3.5 rounded-2xl shadow-xl shadow-red-500/20 border-4 border-[var(--bg-card)] hover:bg-red-600 transition-all"
                            >
                                <Trash2 size={20} strokeWidth={2.5} />
                            </motion.button>
                        </Tooltip>
                    )}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => e.target.files && handleImageProcess(e.target.files[0])} />
            </div>

            {/* --- 📝 IDENTITY INFO SECTION --- */}
            <div className="mt-16 relative z-10 w-full">
                <div className="flex items-center justify-center gap-3">
                    <h3 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none truncate max-w-[85%] group-hover:text-orange-500 transition-colors">
                        {formData.name}
                    </h3>
                    {healthScore >= 75 && (
                        <Tooltip text={t('tt_profile_secured')}>
                            <ShieldCheck size={26} className="text-green-500 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                        </Tooltip>
                    )}
                </div>
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-3 opacity-40 select-all">
                    {currentUser?.email}
                </p>
                
                {/* Native Verification Badge */}
                <div className="mt-10 flex justify-center">
                    {currentUser?.authProvider === 'google' ? (
                        <div className="px-6 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-400 flex items-center gap-4 shadow-inner group/badge hover:border-blue-500/30 transition-all duration-500">
                            <div className="p-2 bg-blue-500/10 rounded-xl group-hover/badge:scale-110 transition-transform"><Chrome size={18} strokeWidth={2.5} /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{T('label_google_verified') || "GOOGLE VERIFIED"}</p>
                                <p className="text-[8px] font-bold uppercase opacity-40 mt-1.5 tracking-wider">{t('identity_secured')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-3 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-500 flex items-center gap-4 group/badge hover:border-orange-500/30 transition-all duration-500">
                            <div className="p-2 bg-orange-500/10 rounded-xl group-hover/badge:scale-110 transition-transform"><MailCheck size={18} strokeWidth={2.5} /></div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{T('label_standard_identity') || "VAULT IDENTITY"}</p>
                                <p className="text-[8px] font-bold uppercase opacity-40 mt-1.5 tracking-wider">{t('email_auth_active')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Sub-metrics */}
                <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                    <div className="p-5 rounded-[28px] bg-[var(--bg-app)] border border-[var(--border)] group/item hover:border-orange-500/30 transition-all">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-2 opacity-40 tracking-[2px]">{T('label_connection')}</p>
                        <div className="flex items-center justify-center gap-2 text-green-500">
                            <Activity size={14} className="animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest">{T('label_status_stable') || "STABLE"}</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-[28px] bg-[var(--bg-app)] border border-[var(--border)] group/item hover:border-orange-500/30 transition-all">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-2 opacity-40 tracking-[2px]">{T('label_hierarchy')}</p>
                        <div className="flex items-center justify-center gap-2 text-orange-500">
                            <Zap size={14} fill="currentColor" strokeWidth={0} />
                            <span className="text-[11px] font-black uppercase tracking-widest">{T('label_rank_master') || "MASTER"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 🛰️ OS SIGNATURE FOOTER --- */}
            <div className="mt-auto pt-10 flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-current" />
                    <Fingerprint size={20} strokeWidth={1.5} />
                    <div className="h-px w-8 bg-current" />
                </div>
                <p className="text-[10px] font-mono font-bold tracking-[6px] uppercase mt-2">
                    NODE-{String(currentUser?._id).slice(-8).toUpperCase()}
                </p>
            </div>
        </div>
    );
};