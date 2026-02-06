"use client";
import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, Trash2, AlertOctagon, Loader2, 
    X, Fingerprint, ShieldX, Cpu, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const DangerZone = ({ onDeleteAccount, isLoading, userEmail }: any) => {
    const { T, t } = useTranslation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

    const isMatch = confirmationText.toLowerCase() === userEmail?.toLowerCase();

    return (
        <div className="relative bg-red-500/[0.02] rounded-[32px] border-2 border-dashed border-red-500/20 p-[var(--card-padding,2rem)] overflow-hidden transition-all duration-500 group">
            
            {/* Background Decor (Destruction Blueprint) */}
            <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12 pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700">
                <AlertOctagon size={280} strokeWidth={1} className="text-red-500" />
            </div>

            <div className="relative z-10">
                {/* --- HEADER --- */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-2.5 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20 shadow-inner animate-pulse">
                        <ShieldAlert size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-red-500 uppercase tracking-[4px] italic leading-none">
                            {T('danger_zone_title') || "CRITICAL PROTOCOLS"}
                        </h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1.5 opacity-40">
                            Irreversible System Termination
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Action Card: Identity Erasure */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-[var(--bg-card)] border border-red-500/10 rounded-[28px] group/item hover:border-red-500/40 transition-all duration-500 gap-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 group-hover/item:bg-red-500 group-hover/item:text-white transition-all duration-500">
                                <ShieldX size={22} />
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">
                                    {T('label_termination') || "IDENTITY TERMINATION"}
                                </p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[1px] mt-1 opacity-40">
                                    {t('desc_termination') || "Wipe all ledgers and cloud backup records."}
                                </p>
                            </div>
                        </div>
                        
                        <Tooltip text={t('tt_termination_warning')}>
                            <button 
                                onClick={() => setShowConfirm(true)}
                                className="w-full md:w-auto px-10 h-12 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[3px] shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all"
                            >
                                {T('btn_delete_identity') || "DELETE IDENTITY"}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* --- 🛡️ THE TERMINATION PROTOCOL MODAL --- */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="fixed inset-0 bg-black/70 backdrop-blur-xl" />
                        
                        <motion.div 
                            initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
                            exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="bg-[var(--bg-card)] w-full md:max-w-md h-auto rounded-t-[45px] md:rounded-[45px] border-t md:border border-red-500/20 shadow-2xl relative z-10 flex flex-col overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-[4px] text-red-500 italic">
                                        {T('term_confirm_title') || "CONFIRM TERMINATION"}
                                    </h4>
                                    <button onClick={() => setShowConfirm(false)} className="w-9 h-9 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Warning Box */}
                                <div className="p-6 rounded-[32px] bg-red-500/5 border border-red-500/20 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-[22px] bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shadow-inner">
                                        <AlertOctagon size={32} className="animate-pulse" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">
                                        {T('critical_auth') || "SECURITY AUTHENTICATION"}
                                    </h4>
                                    <ul className="text-[9px] font-bold uppercase leading-relaxed text-red-500/60 text-left space-y-2 list-disc px-4 tracking-wider">
                                        <li>{t('warn_ledger_loss')}</li>
                                        <li>{t('warn_backup_loss')}</li>
                                        <li>{t('warn_irreversible')}</li>
                                    </ul>
                                </div>

                                {/* Smart Verification Input */}
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2">
                                        <Zap size={12} className="text-orange-500" /> {t('label_type_email')}
                                    </label>
                                    <div className="group relative">
                                        <input 
                                            type="text" 
                                            placeholder={userEmail}
                                            className="w-full h-14 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl px-6 text-[12px] font-black tracking-widest text-red-500 outline-none focus:border-red-500 transition-all shadow-inner placeholder:opacity-20"
                                            value={confirmationText}
                                            onChange={(e) => setConfirmationText(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Final Execute Button */}
                                <button 
                                    onClick={onDeleteAccount}
                                    disabled={!isMatch || isLoading}
                                    className={`w-full h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[5px] transition-all active:scale-95 flex items-center justify-center gap-4 shadow-2xl
                                        ${isMatch 
                                            ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700' 
                                            : 'bg-[var(--bg-app)] text-[var(--text-muted)] opacity-30 cursor-not-allowed'}
                                    `}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <Fingerprint size={20} strokeWidth={2.5} />
                                            {T('action_auth_termination') || "EXECUTE PURGE"}
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};