"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { SocialAuth } from './SocialAuth'; 

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ INTERNAL ELITE INPUT (Refined for Red Glow) ---
const EliteInput = ({ icon: Icon, type, placeholder, value, name, id, autoComplete, onChange, hasError }: any) => (
    <div className={`relative transition-all duration-500 border rounded-3xl overflow-hidden ${
        hasError 
        ? 'border-red-500/60 bg-red-500/[0.04] shadow-[0_0_20px_rgba(239,68,68,0.15)]' // লাল আভা (Glow)
        : 'border-white/5 bg-white/[0.03] focus-within:border-[var(--accent)]/40 focus-within:bg-white/[0.05]'
    }`}>
        <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
            hasError ? 'text-red-500' : 'text-[var(--text-muted)] group-focus-within:text-[var(--accent)]'
        }`}>
            <Icon size={18} />
        </div>
        <input 
            id={id}
            name={name}
            type={type} 
            autoComplete={autoComplete}
            placeholder={placeholder} 
            className="app-input h-15 pl-14 font-bold text-xs tracking-widest uppercase outline-none w-full bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)]/20"
            value={value} 
            onChange={onChange} 
            required 
        />
    </div>
);

export const LoginView = ({ onSuccess, onGoogleAuth, onSwitch, onForgot }: any) => {
    const { T, t } = useTranslation();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [errorField, setErrorField] = useState<string | null>(null); // 'email', 'password', or 'both'

    // ১. লগইন হ্যান্ডলার (Logic 100% Intact)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorField(null);
        setIsLoading(true);
        const loadingToast = toast.loading(t('auth_establishing_link') || 'Establishing...');
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success(t('auth_authorized'), { id: loadingToast });
                onSuccess(data.user);
            } else { 
                const errorMsg = data.message || t('auth_denied');
                
                // ভুল অনুযায়ী ইনপুট ফিল্ড মার্ক করা
                if (errorMsg.toLowerCase().includes('email')) {
                    setErrorField('email');
                } else if (errorMsg.toLowerCase().includes('password') || errorMsg.toLowerCase().includes('key')) {
                    setErrorField('password');
                } else {
                    setErrorField('both'); // যদি জেনারেল এরর হয় তবে দুইটাই লাল হবে
                }
                
                toast.error(errorMsg, { id: loadingToast }); 
            }
        } catch (error) { 
            toast.error(t('auth_conn_failed'), { id: loadingToast }); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full transition-all duration-500">
            
            {/* --- ১. BRANDING HEADER --- */}
            <div className="text-center mb-[var(--app-gap,2.5rem)] select-none">
                <motion.h2 
                    initial={{ letterSpacing: "10px", opacity: 0 }}
                    animate={{ letterSpacing: "1px", opacity: 1 }}
                    className="text-5xl font-black text-[var(--text-main)] italic tracking-tighter uppercase leading-none"
                >
                    {T('vault_pro_split_1')}<span className="text-[var(--accent)]">{T('vault_pro_split_2')}</span>
                </motion.h2>
                <p className="text-[9px] font-black text-[var(--text-muted)] mt-4 uppercase tracking-[6px] opacity-60">
                    {t('auth_tagline')}
                </p>
            </div>

            {/* --- ২. CREDENTIALS FORM --- */}
            <motion.form 
                onSubmit={handleLogin} 
                className="space-y-[var(--app-gap,1.25rem)]"
                animate={errorField ? { x: [-10, 10, -10, 10, 0] } : {}} // Apple-style Shake
                transition={{ duration: 0.4 }}
            >
                {/* Identity Email */}
                <EliteInput 
                    id="login-email"
                    name="email"
                    icon={Mail} 
                    type="email" 
                    autoComplete="email"
                    placeholder={t('placeholder_email')} 
                    value={formData.email} 
                    onChange={(e: any) => {
                        setFormData({...formData, email: e.target.value});
                        if(errorField === 'email' || errorField === 'both') setErrorField(null);
                    }}
                    hasError={errorField === 'email' || errorField === 'both'}
                />

                {/* Security Key */}
                <EliteInput 
                    id="login-password"
                    name="password"
                    icon={Lock} 
                    type="password" 
                    autoComplete="current-password"
                    placeholder={t('placeholder_key')} 
                    value={formData.password} 
                    onChange={(e: any) => {
                        setFormData({...formData, password: e.target.value});
                        if(errorField === 'password' || errorField === 'both') setErrorField(null);
                    }}
                    hasError={errorField === 'password' || errorField === 'both'}
                />

                {/* Forgot Link */}
                <div className="flex justify-end px-2">
                    <button type="button" onClick={onForgot} className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-widest transition-all opacity-60 hover:opacity-100">
                        {t('auth_forgot_key')}
                    </button>
                </div>

                <Tooltip text={t('tt_auth_unseal')}>
                    <motion.button 
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="vault-btn-elite bg-white text-black shadow-xl hover:bg-[var(--accent)] hover:text-white"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <div className="flex items-center gap-3">
                                <Fingerprint size={18} strokeWidth={3} />
                                {T('btn_unseal')} 
                                <ArrowRight size={18} strokeWidth={3} />
                            </div>
                        )}
                    </motion.button>
                </Tooltip>
            </motion.form>

            {/* --- ৩. SOCIAL HUB & FOOTER --- */}
            <div className="relative my-[var(--app-gap,2.5rem)]">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/5"></span>
                </div>
                <div className="relative flex justify-center text-[7px] uppercase font-black tracking-[4px]">
                    <span className="bg-[var(--bg-app)] px-4 text-[var(--text-muted)] opacity-50">
                        {T('auth_middleware')}
                    </span>
                </div>
            </div>

            <SocialAuth onGoogleAuth={onGoogleAuth} />
            
            <div className="mt-auto pt-10 text-center">
                <button onClick={onSwitch} className="group text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[4px] transition-all">
                    {t('auth_new_operator')} 
                    <span className="ml-2 text-[var(--text-main)] underline underline-offset-8 decoration-orange-500/30 group-hover:text-[var(--accent)] transition-all font-black">
                        {T('btn_initialize')}
                    </span>
                </button>
            </div>
        </div>
    );
};