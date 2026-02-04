"use client";
import React, { useState } from 'react';
import { ShieldAlert, Trash2, AlertOctagon, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { ModalLayout } from '@/components/Modals';

/**
 * VAULT PRO: DANGER ZONE MODULE (ELITE UX V2)
 * ----------------------------------------
 * Handles high-stakes destructive actions with multi-step verification.
 */
export const DangerZone = ({ onDeleteAccount, isLoading, userEmail }: any) => {
    const { T, t } = useTranslation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    const isMatch = confirmationText.toLowerCase() === userEmail?.toLowerCase();

    return (
        <div className="app-card border-2 border-red-500/20 bg-red-500/[0.01] p-[var(--card-padding,2rem)] relative overflow-hidden transition-all duration-300">
            
            {/* Background Branded Icon */}
            <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 pointer-events-none text-red-500">
                <AlertOctagon size={180} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-red-500 uppercase tracking-[3px] italic">
                            {T('danger_zone_title') || "Critical Protocols"}
                        </h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[1.5px] opacity-60">
                            {t('danger_zone_desc') || "Sensitive security & termination actions"}
                        </p>
                    </div>
                </div>

                <div className="space-y-[var(--app-gap,1rem)]">
                    {/* Action 1: Permanent Erasure */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-5 bg-red-500/[0.02] border border-red-500/10 rounded-2xl group hover:border-red-500/30 transition-all gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-[var(--bg-card)] text-red-400">
                                <Trash2 size={16} />
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">
                                    {T('label_termination') || "Permanent Identity Termination"}
                                </p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase opacity-40 mt-1">
                                    {t('desc_termination') || "This action will wipe all nodes, ledgers, and records."}
                                </p>
                            </div>
                        </div>
                        
                        <Tooltip text={t('tt_termination_warning')}>
                            <button 
                                onClick={() => setShowConfirm(true)}
                                className="w-full md:w-auto px-8 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-red-600/20 hover:bg-red-700 active:scale-95 transition-all"
                            >
                                {T('btn_delete_identity') || "Delete Account"}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* --- MULTI-STEP VERIFICATION MODAL --- */}
            <AnimatePresence>
                {showConfirm && (
                    <ModalLayout title={T('term_confirm_title')} onClose={() => setShowConfirm(false)}>
                        <div className="space-y-8 p-2">
                            <div className="p-6 rounded-[30px] bg-red-500/5 border-2 border-red-500/20 text-red-500 flex flex-col items-center text-center">
                                <AlertOctagon size={48} className="mb-4 opacity-40 animate-pulse" />
                                <h4 className="text-sm font-black uppercase tracking-widest mb-3">
                                    {T('critical_auth') || "Verification Required"}
                                </h4>
                                <ul className="text-[9px] font-bold uppercase leading-relaxed opacity-70 text-left space-y-2 list-disc px-4">
                                    <li>{t('warn_ledger_loss') || "All 12+ active ledgers will be erased."}</li>
                                    <li>{t('warn_backup_loss') || "Remote cloud backups will be purged."}</li>
                                    <li>{t('warn_irreversible') || "This protocol is irreversible."}</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 italic">
                                    {t('label_type_email') || "Type your identity email to confirm"}
                                </label>
                                <input 
                                    type="text" 
                                    placeholder={userEmail}
                                    className="app-input w-full h-14 bg-red-500/[0.02] border-2 border-red-500/20 rounded-2xl px-6 text-sm font-black tracking-widest text-red-500 outline-none focus:border-red-500 transition-all"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={onDeleteAccount}
                                disabled={!isMatch || isLoading}
                                className={`w-full py-5 rounded-[22px] font-black text-xs uppercase tracking-[4px] shadow-2xl transition-all active:scale-95 flex items-center justify-center
                                    ${isMatch 
                                        ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-700' 
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                                `}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : T('action_auth_termination')}
                            </button>
                        </div>
                    </ModalLayout>
                )}
            </AnimatePresence>
        </div>
    );
};