"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Timer, ArrowLeft, RefreshCcw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: OTP VIEW (ELITE VERIFICATION)
 * -----------------------------------------
 * Apple-style high-focus identity verification interface.
 * Features large character tracking and haptic feedback.
 */
export const OtpView = ({ email, onBack, onSuccess }: any) => {
    const { t } = useTranslation();
    const [otpCode, setOtpCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(120); 
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ১. কাউন্টডাউন টাইমার ইঞ্জিন (Original Logic Preserved)
    useEffect(() => {
        if (cooldown > 0) {
            timerRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [cooldown]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ২. ভেরিফিকেশন হ্যান্ডলার (Original Logic Preserved)
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length < 6) return toast.error(t('auth_invalid_code') || "Enter 6-digit key");
        
        setIsLoading(true);
        const loadingId = toast.loading(t('auth_verifying_id') || 'Verifying Identity...');
        
        try {
            const res = await fetch('/api/auth/verify', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ email, otp: otpCode }) 
            });
            const data = await res.json();
            
            if (res.ok) {
                 toast.success(t('auth_init_success') || 'Identity Authorized', { id: loadingId });
                 window.location.reload(); 
            } else { 
                toast.error(data.message || 'Verification Failed', { id: loadingId }); 
            }
        } catch (error) { 
            toast.error(t('auth_sys_error') || "System Error", { id: loadingId }); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full transition-all duration-500">
            {/* --- ১. VERIFICATION HEADER --- */}
            <div className="text-center mb-[var(--app-gap,2.5rem)]">
                <div className="flex flex-col items-center gap-5">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 bg-orange-500/10 rounded-[30px] flex items-center justify-center border border-orange-500/20 shadow-inner"
                    >
                        <ShieldAlert className="text-orange-500" size={32} />
                    </motion.div>
                    
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[var(--text-main)]     leading-none">
                            {t('title_protocol_verify') || "VERIFICATION"}
                        </h2>
                        <div className="flex flex-col items-center">
                            <p className="text-[9px] font-bold text-[var(--text-muted)]      opacity-60">
                                {t('auth_proto_dispatched')}
                            </p>
                            <p className="text-[11px] font-black text-orange-500     mt-1 bg-orange-500/5 px-3 py-1 rounded-lg border border-orange-500/10">
                                {email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ২. OTP ENTRY FIELD --- */}
            <form onSubmit={handleVerify} className="space-y-[var(--app-gap,2rem)]">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[var(--text-muted)]      text-center block w-full opacity-40">
                        {t('label_entry_key')}
                    </label>
                    <input 
                        type="text" 
                        placeholder="••••••" 
                        className="app-input text-center text-5xl font-black   py-8 border border-white/5 bg-white/[0.02] focus:bg-white/[0.04] focus:border-orange-500/40 transition-all outline-none rounded-3xl w-full font-mono placeholder:opacity-10" 
                        maxLength={6} 
                        value={otpCode} 
                        onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
                        autoFocus
                        required
                    />
                </div>

                {/* Confirm Action */}
                <Tooltip text={t('tt_auth_confirm_id')}>
                    <motion.button 
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full py-5 bg-white text-black rounded-[24px] font-black text-[11px]      shadow-2xl hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>{t('btn_confirm_identity')} <CheckCircle2 size={18} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </Tooltip>
            </form>

            {/* --- ৩. SECONDARY ACTIONS --- */}
            <div className="mt-auto pt-10 flex items-center justify-between px-2">
                {/* Adjust Details */}
                <button 
                    type="button" 
                    onClick={onBack} 
                    className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)]      transition-all flex items-center gap-2 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {t('btn_adjust_detail')}
                </button>

                {/* Resend Logic with Timer */}
                {cooldown > 0 ? (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full text-orange-500/80">
                        <Timer size={14} />
                        <span className="text-[10px] font-black    font-mono">{formatTime(cooldown)}</span>
                    </div>
                ) : (
                    <button 
                        type="button" 
                        className="text-[9px] font-black text-orange-500      underline underline-offset-8 hover:text-orange-400 transition-all flex items-center gap-2"
                    >
                        <RefreshCcw size={14} />
                        {t('btn_resend_protocol')}
                    </button>
                )}
            </div>
        </div>
    );
};

// Helper for Loader (Used inside button if needed, otherwise CSS spinner is active)
const Loader2 = ({ size = 20 }: { size?: number }) => (
    <svg className="animate-spin" width={size} height={size} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);