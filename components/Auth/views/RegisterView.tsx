"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: REGISTER VIEW (ELITE IDENTITY HUB)
 * -------------------------------------------
 * Apple-style minimalist initialization interface.
 * High-integrity form handling with dynamic layout adjustment.
 */
export const RegisterView = ({ onSwitch, onOtpSent }: any) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    // ১. ওটিপি রিকোয়েস্ট হ্যান্ডলার (Original Logic Preserved)
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const loadingId = toast.loading(t('auth_generating_proto') || 'Generating Protocol...');
        
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            if (res.ok) {
                toast.success(t('auth_proto_sent') || `Protocol Sent`, { id: loadingId });
                // প্যারেন্ট কন্ট্রোলারে ডাটা পাঠানো হচ্ছে ওটিপি ভিউতে যাওয়ার জন্য
                onOtpSent(formData);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Initialization Failed', { id: loadingId });
            }
        } catch (error) { 
            toast.error(t('auth_conn_failed') || "Connection Error", { id: loadingId }); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full transition-all duration-500">
            {/* --- ১. PROTOCOL HEADER --- */}
            <div className="text-center mb-[var(--app-gap,2rem)]">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[8px] font-black uppercase tracking-[3px] mb-4"
                >
                    <ShieldCheck size={10} /> {t('auth_secure_transaction')}
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter italic leading-none">
                    {t('title_protocol_init') || "INITIALIZATION"}
                </h2>
                <p className="text-[9px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-[3px] opacity-60">
                    {t('auth_create_identity')}
                </p>
            </div>

            {/* --- ২. IDENTITY FORM --- */}
            <form onSubmit={handleRequestOtp} className="space-y-[var(--app-gap,1.1rem)]">
                {/* Identity Name */}
                <div className="group relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors duration-300">
                        <User size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder={t('placeholder_name')} 
                        className="app-input h-15 pl-14 font-bold uppercase text-[11px] tracking-widest rounded-3xl border border-white/5 bg-white/[0.03] focus:border-[var(--accent)]/40 focus:bg-white/[0.05] outline-none w-full transition-all"
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required
                    />
                </div>
                
                {/* Channel Address (Email) */}
                <div className="group relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors duration-300">
                        <Mail size={18} />
                    </div>
                    <input 
                        type="email" 
                        placeholder={t('placeholder_email')} 
                        className="app-input h-15 pl-14 font-bold text-xs tracking-widest uppercase rounded-3xl border border-white/5 bg-white/[0.03] focus:border-[var(--accent)]/40 focus:bg-white/[0.05] outline-none w-full transition-all"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required
                    />
                </div>

                {/* Security Key (Password) */}
                <div className="group relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors duration-300">
                        <Lock size={18} />
                    </div>
                    <input 
                        type="password" 
                        placeholder={t('placeholder_key')} 
                        className="app-input h-15 pl-14 font-bold tracking-widest rounded-3xl border border-white/5 bg-white/[0.03] focus:border-[var(--accent)]/40 focus:bg-white/[0.05] outline-none w-full transition-all"
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required
                    />
                </div>

                {/* Submit Action */}
                <Tooltip text={t('tt_auth_request_code')}>
                    <motion.button 
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full py-5 bg-white text-black rounded-[24px] font-black text-[11px] uppercase tracking-[4px] shadow-xl hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 mt-6"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>{t('btn_request_code')} <ArrowRight size={18} strokeWidth={3} /></>
                        )}
                    </motion.button>
                </Tooltip>
            </form>

            {/* --- ৩. FOOTER NAVIGATION --- */}
            <div className="mt-auto pt-10 text-center">
                <button 
                    onClick={onSwitch} 
                    className="group text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[4px] transition-all flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    {t('auth_existing_operator')} 
                    <span className="text-[var(--text-main)] underline underline-offset-8 decoration-orange-500/30 group-hover:text-[var(--accent)] group-hover:decoration-orange-500 transition-all">
                        {t('btn_unseal')}
                    </span>
                </button>
            </div>
        </div>
    );
};