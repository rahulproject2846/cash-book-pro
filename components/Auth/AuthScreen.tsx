"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { ShieldCheck, Fingerprint, Globe, Orbit, Loader2 } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { OtpView } from './views/OtpView';
import { ForgotPassView } from './views/ForgotPassView';
import { identityManager } from '@/lib/vault/core/IdentityManager';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export type AuthView = 'login' | 'register' | 'otp' | 'forgot';

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>('login');
  const [direction, setDirection] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });

  // 🔐 IDENTITY WAKE-UP: Handle login success with immediate identity update
  const handleLoginSuccess = (user: any) => {
    // 🚨 WAKE UP CALL: Immediately update IdentityManager with full user object
    identityManager.setIdentity(user);
    
    // Then call parent callback (async to avoid blocking navigation)
    setTimeout(() => {
      onLoginSuccess(user);
    }, 0);
  };

  const navigateTo = (nextView: AuthView) => {
    setDirection(nextView === 'login' ? -1 : 1);
    setView(nextView);
  };

  // গুগল হ্যান্ডশেক লজিক
  const handleGoogleAuth = async (tokenResponse: any) => {
    if (!tokenResponse.access_token) return;
    
    setIsVerifying(true);
    const loadingToast = toast.loading(t('auth_syncing_id') || 'Syncing Identity...');
    
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success(t('auth_id_verified') || 'Identity Verified', { id: loadingToast });
            onLoginSuccess(data.user);
        } else { 
            toast.error(data.message || t('auth_failed'), { id: loadingToast }); 
        }
    } catch (err) { 
        toast.error(t('auth_net_error'), { id: loadingToast }); 
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] p-[var(--app-padding,1.5rem)] font-sans relative overflow-hidden selection:bg-orange-500/30">
        
        {/* ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]" style={{ backgroundImage: `linear-gradient(var(--border-color) 1.5px, transparent 1.5px), linear-gradient(90deg, var(--border-color) 1.5px, transparent 1.5px)`, backgroundSize: '80px 80px' }} />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500 blur-[120px] rounded-full" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] relative z-10">
            <div className="flex justify-between items-center mb-8 px-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">{t('auth_security_portal')}</span>
                </div>
                {isVerifying && (
                    <div className="flex items-center gap-2 text-orange-500">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Verifying...</span>
                    </div>
                )}
            </div>

            <div className="app-card relative overflow-hidden shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl border border-white/10 bg-white/[0.02] min-h-[520px] flex flex-col transition-all duration-700">
                <div className="p-[var(--card-padding,2.5rem)] flex-1 flex flex-col">
                    <AnimatePresence mode="wait" custom={direction} initial={false}>
                        <motion.div
                            key={view}
                            custom={direction}
                            initial={{ x: direction * 40, opacity: 0, filter: 'blur(10px)' }}
                            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
                            exit={{ x: direction * -40, opacity: 0, filter: 'blur(10px)' }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="w-full h-full flex flex-col"
                        >
                            {view === 'login' && <LoginView onSuccess={onLoginSuccess} onGoogleAuth={handleGoogleAuth} onSwitch={() => navigateTo('register')} onForgot={() => navigateTo('forgot')} />}
                            {view === 'register' && <RegisterView onSwitch={() => navigateTo('login')} onOtpSent={(data: any) => { setRegisterData(data); navigateTo('otp'); }} />}
                            {view === 'otp' && <OtpView email={registerData.email} onBack={() => navigateTo('register')} />}
                            {view === 'forgot' && <ForgotPassView onBack={() => navigateTo('login')} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-12 flex justify-center items-center gap-10 opacity-30">
                <div className="flex items-center gap-2.5"><Fingerprint size={14} strokeWidth={2.5} /><span className="text-[8px] font-black uppercase tracking-[3px]">{t('biometric_id')}</span></div>
                <div className="flex items-center gap-2.5"><Globe size={14} strokeWidth={2.5} /><span className="text-[8px] font-black uppercase tracking-[3px]">{t('cloud_sync')}</span></div>
            </div>
        </motion.div>
      </div>
    </GoogleOAuthProvider>
  );
}