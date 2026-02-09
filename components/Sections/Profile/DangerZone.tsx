"use client";
import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, Trash2, AlertOctagon, Loader2, 
    X, Fingerprint, ShieldX, Cpu, Zap, BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

export const DangerZone = ({ onDeleteAccount, isLoading, userEmail }: any) => {
    const { T, t } = useTranslation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

    const isMatch = confirmationText.toLowerCase() === userEmail?.toLowerCase();

    return (
        <div className={cn(
            "relative bg-red-500/[0.02] rounded-[40px] border-2 border-dashed border-red-500/20",
            "p-8 md:p-10 overflow-hidden shadow-2xl transition-all duration-500 group"
        )}>
            
            {/* Background Decor (Destruction Blueprint) */}
            <div className="absolute -right-10 -top-10 opacity-[0.03] rotate-12 pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700">
                <AlertOctagon size={320} strokeWidth={1} className="text-red-500" />
            </div>

            <div className="relative z-10">
                {/* --- 🏷️ HEADER SECTION --- */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Tooltip text={t('tt_danger_node') || "Critical System Operations Active"}>
                            <div className="p-3 bg-red-500/10 rounded-[20px] text-red-500 border border-red-500/20 shadow-inner animate-pulse">
                                <ShieldAlert size={22} strokeWidth={2.5} />
                            </div>
                        </Tooltip>
                        <div>
                            <h4 className="text-base font-black text-red-500 uppercase tracking-[3px] italic leading-none">
                                {T('danger_zone_title') || "CRITICAL PROTOCOLS"}
                            </h4>
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-2 opacity-50">
                                Irreversible System Termination
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Action Card: Identity Erasure (Elite Apple Style) */}
                    <div className={cn(
                        "flex flex-col md:flex-row justify-between items-center p-8 bg-[var(--bg-app)]",
                        "border border-red-500/10 rounded-[30px] group/item hover:border-red-500/30 transition-all duration-500 gap-8 shadow-inner"
                    )}>
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[22px] bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/10 group-hover/item:bg-red-500 group-hover/item:text-white transition-all duration-700 shadow-sm">
                                <ShieldX size={24} />
                            </div>
                            <div className="text-center md:text-left space-y-1.5">
                                <p className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[2px]">
                                    {T('label_termination') || "IDENTITY TERMINATION"}
                                </p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[1px] opacity-40">
                                    {t('desc_termination') || "Wipe all ledgers and cloud backup records."}
                                </p>
                            </div>
                        </div>
                        
                        <Tooltip text={t('tt_termination_warning') || "Initialize deletion sequence"}>
                            <button 
                                onClick={() => setShowConfirm(true)}
                                className="w-full md:w-auto px-10 h-14 bg-zinc-800 text-red-500 rounded-[20px] font-black text-[10px] uppercase tracking-[3px] hover:bg-red-600 hover:text-white active:scale-95 transition-all shadow-xl"
                            >
                                {T('btn_delete_identity') || "DELETE IDENTITY"}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* --- 🛡️ THE TERMINATION PROTOCOL MODAL (Hardened UI) --- */}
            <AnimatePresence>
                {showConfirm && (
                    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center overflow-hidden">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)} className="fixed inset-0 bg-black/80 backdrop-blur-2xl" />
                        
                        <motion.div 
                            initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0, y: 20 }}
                            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
                            exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="bg-[var(--bg-card)] w-full md:max-w-lg h-auto rounded-t-[45px] md:rounded-[45px] border-t md:border border-red-500/20 shadow-[0_50px_100px_-20px_rgba(220,38,38,0.3)] relative z-10 flex flex-col overflow-hidden"
                        >
                            <div className="p-10 space-y-10">
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <BadgeAlert size={16} className="text-red-500 animate-pulse" />
                                        <h4 className="text-[11px] font-black uppercase tracking-[4px] text-red-500 italic">
                                            {T('term_confirm_title') || "TERMINATION PROTOCOL"}
                                        </h4>
                                    </div>
                                    <button onClick={() => setShowConfirm(false)} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-inner">
                                        <X size={20} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Warning Box (System OS Style) */}
                                <div className="p-8 rounded-[35px] bg-red-500/[0.03] border border-red-500/10 flex flex-col items-center text-center shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                                    <div className="w-20 h-20 rounded-[28px] bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-2xl">
                                        <AlertOctagon size={40} className="animate-pulse" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-[3px] text-red-500 mb-5">
                                        {T('critical_auth') || "SECURITY AUTHENTICATION"}
                                    </h4>
                                    <ul className="text-[10px] font-bold uppercase leading-relaxed text-red-500/50 text-left space-y-3 list-none px-2 tracking-widest">
                                        <li className="flex items-start gap-3"><Zap size={10} className="shrink-0 mt-0.5" /> {t('warn_ledger_loss')}</li>
                                        <li className="flex items-start gap-3"><Zap size={10} className="shrink-0 mt-0.5" /> {t('warn_backup_loss')}</li>
                                        <li className="flex items-start gap-3"><Zap size={10} className="shrink-0 mt-0.5" /> {t('warn_irreversible')}</li>
                                    </ul>
                                </div>

                                {/* Smart Verification Input */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] flex items-center gap-2">
                                            <Fingerprint size={12} className="text-orange-500" /> {t('label_type_email')}
                                        </label>
                                        <span className="text-[8px] font-black text-red-500/40 uppercase tracking-widest">Identity Match Required</span>
                                    </div>
                                    <div className="group relative">
                                        <input 
                                            type="text" 
                                            placeholder={userEmail}
                                            className="w-full h-16 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[25px] px-8 text-[13px] font-black tracking-widest text-red-500 outline-none focus:border-red-500 transition-all shadow-inner placeholder:opacity-10"
                                            value={confirmationText}
                                            onChange={(e) => setConfirmationText(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Final Execute Button (Elite Size) */}
                                <Tooltip text={isMatch ? t('tt_execute_purge') : t('tt_match_identity')}>
                                    <button 
                                        onClick={onDeleteAccount}
                                        disabled={!isMatch || isLoading}
                                        className={cn(
                                            "w-full h-18 py-6 rounded-[28px] font-black text-[12px] uppercase tracking-[6px] transition-all active:scale-95 flex items-center justify-center gap-5 shadow-2xl",
                                            isMatch 
                                                ? "bg-red-600 text-white shadow-red-600/40 hover:bg-red-700" 
                                                : "bg-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed border border-white/5"
                                        )}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" size={24} />
                                        ) : (
                                            <>
                                                <ShieldAlert size={22} strokeWidth={2.5} />
                                                {T('action_auth_termination') || "EXECUTE SYSTEM PURGE"}
                                            </>
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                            
                            <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};