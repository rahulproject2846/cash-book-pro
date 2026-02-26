"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, Send, ShieldQuestion } from 'lucide-react';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: FORGOT PASSWORD VIEW (ELITE RECOVERY)
 * ----------------------------------------------
 * Apple-style minimalist recovery interface.
 * High-focus input with haptic submission and smooth exit.
 */
export const ForgotPassView = ({ onBack }: any) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ১. রিকভারি রিকোয়েস্ট হ্যান্ডলার (Original Logic Preserved)
    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingId = toast.loading(t('auth_sending_recovery') || 'Sending Recovery Link...');
        
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                toast.success(t('auth_recovery_sent') || 'Access Key Dispatched', { id: loadingId });
            } else {
                const data = await res.json();
                toast.error(data.message || t('auth_email_not_found'), { id: loadingId });
            }
        } catch (err) {
            toast.error(t('auth_conn_failed'), { id: loadingId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full transition-all duration-500">
            {/* --- ১. RECOVERY HEADER --- */}
            <div className="text-center mb-[var(--app-gap,2.5rem)]">
                <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-16 h-16 bg-blue-500/10 rounded-[28px] flex items-center justify-center border border-blue-500/20 shadow-inner mx-auto mb-6"
                >
                    <ShieldQuestion className="text-blue-400" size={28} />
                </motion.div>

                <h2 className="text-3xl font-black text-[var(--text-main)]     leading-none">
                    {t('auth_forgot_key_title') || "RECOVER ACCESS"}
                </h2>
                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-3      opacity-60 max-w-[220px] mx-auto leading-relaxed">
                    {t('auth_forgot_desc')}
                </p>
            </div>

            {/* --- ২. RECOVERY FORM --- */}
            <form onSubmit={handleResetRequest} className="space-y-[var(--app-gap,1.5rem)]">
                <div className="group relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-400 transition-colors duration-300">
                        <Mail size={18} />
                    </div>
                    <input 
                        type="email" 
                        placeholder={t('placeholder_email')}
                        className="app-input h-15 pl-14 font-bold text-xs     rounded-3xl border border-white/5 bg-white/[0.03] focus:border-blue-500/40 focus:bg-white/[0.05] outline-none w-full transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <Tooltip text={t('tt_send_recovery') || "Request secure access key"}>
                    <motion.button 
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-5 bg-white text-black rounded-[24px] font-black text-[11px]      shadow-xl hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 mt-4"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>{t('btn_send_recovery')} <Send size={16} strokeWidth={2.5} /></>
                        )}
                    </motion.button>
                </Tooltip>
            </form>

            {/* --- ৩. FOOTER NAVIGATION --- */}
            <div className="mt-auto pt-10 text-center">
                <button 
                    onClick={onBack} 
                    className="group text-[var(--text-muted)] text-[10px] font-black      transition-all flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[var(--text-main)] underline underline-offset-8 decoration-white/10 group-hover:text-[var(--accent)] group-hover:decoration-orange-500 transition-all">
                        {t('btn_back_to_login')}
                    </span>
                </button>
            </div>
        </div>
    );
};