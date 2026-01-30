"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ModalLayout } from '@/components/Modals';
import { 
  Mail, Lock, User, ArrowRight, Timer, 
  CheckCircle2, Chrome, ShieldCheck, Fingerprint, 
  Orbit, Globe, ShieldAlert 
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [modalType, setModalType] = useState<'none' | 'register'>('none');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  // --- CORE LOGIC (STRICTLY PRESERVED) ---
  const [regStep, setRegStep] = useState<'details' | 'otp'>('details');
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '' });
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Establishing Secure Link...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Access Authorized`, { id: loadingToast });
        onLoginSuccess(data.user);
      } else { toast.error(data.message || 'Access Denied', { id: loadingToast }); }
    } catch (error) { toast.error('Connection Failed', { id: loadingToast }); }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const loadingToast = toast.loading('Syncing Identity...');
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: credentialResponse.credential }),
        });
        const data = await res.json();
        if (res.ok) {
            toast.success('Identity Verified', { id: loadingToast });
            onLoginSuccess(data.user);
        } else { toast.error(data.message || 'Auth Failed', { id: loadingToast }); }
    } catch (err) { toast.error('Network Error', { id: loadingToast }); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    const loadingId = toast.loading('Generating Protocol...');
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registerForm),
        });
        if (res.ok) {
            toast.success(`Protocol Sent`, { id: loadingId });
            setRegStep('otp'); setCooldown(120);
        } else {
            const data = await res.json();
            toast.error(data.message, { id: loadingId });
        }
    } catch (error) { toast.error("Connection Error", { id: loadingId }); }
  };

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingId = toast.loading('Verifying Identity...');
    try {
        const res = await fetch('/api/auth/verify', { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email: registerForm.email, otp: otpCode }) 
        });
        const data = await res.json();
        if (res.ok) {
             toast.success('Initialize Success', { id: loadingId });
             setModalType('none'); setRegStep('details');
        } else { toast.error(data.message, { id: loadingId }); }
    } catch (error) { toast.error("System Error", { id: loadingId }); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-app)] p-6 font-sans relative overflow-hidden">
      
      {/* --- PREMIUM AMBIENT BACKGROUND --- */}
      {/* 1. Subtle Technical Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
      />
      
      {/* 2. Focused Glow Effect */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-[0.03] dark:opacity-[0.07] blur-[120px] rounded-full pointer-events-none z-0" />

      {/* 3. Floating Digital Nodes */}
      <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                    y: [Math.random() * 100, Math.random() * -100], 
                    opacity: [0.1, 0.3, 0.1],
                    scale: [1, 1.2, 1] 
                }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                className="absolute text-[var(--border)]"
                style={{ top: `${20 * i}%`, left: `${15 * i}%` }}
              >
                  <Orbit size={40 + i * 10} strokeWidth={0.5} />
              </motion.div>
          ))}
      </div>

      {/* --- LOGIN PORTAL INTERFACE --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Portal Metadata Labels */}
        <div className="flex justify-between items-center mb-6 px-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="text-[var(--accent)]" size={14} />
                <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">Security Portal</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">Encrypted</span>
            </div>
        </div>

        {/* MAIN CARD */}
        <div className="app-card p-10 relative overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Card Accent Line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />

          <div className="text-center mb-10">
            <h2 className="text-5xl font-black text-[var(--text-main)] italic tracking-tighter uppercase leading-none select-none">
                VAULT<span className="text-[var(--accent)]">PRO.</span>
            </h2>
            <p className="text-[9px] font-black text-[var(--text-muted)] mt-3 uppercase tracking-[6px]">Financial Operating System</p>
          </div>
          
          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-4">
              <div className="group relative">
                  <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                  <input 
                    type="email" placeholder="IDENTITY EMAIL" 
                    className="app-input pl-13 font-bold text-xs tracking-widest uppercase"
                    value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required 
                  />
              </div>

              <div className="group relative">
                  <Lock className="absolute left-4.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
                  <input 
                    type="password" placeholder="SECURITY KEY" 
                    className="app-input pl-13 font-bold text-xs tracking-widest uppercase"
                    value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required 
                  />
              </div>

              <button type="submit" className="app-btn-primary w-full py-5 text-[11px] uppercase tracking-widest mt-4">
                  Unseal Access <ArrowRight size={18} />
              </button>
          </form>

          {/* Styled Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--border)]"></span></div>
            <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[4px]"><span className="bg-[var(--bg-card)] px-4 text-[var(--text-muted)]">Secure Middleware</span></div>
          </div>

          {/* --- GOOGLE BUTTON (CUSTOM POLISH) --- */}
          <div className="relative group">
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                  {/* Invisible real button for logic */}
                  <div className="absolute inset-0 opacity-0 z-20 cursor-pointer overflow-hidden">
                      <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => toast.error("System Error")} 
                        width="400px" 
                      />
                  </div>
                  {/* Visual Polish - Looks exactly like app-btn-primary but ghost style */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="w-full h-[58px] border-[1.5px] border-[var(--border)] bg-[var(--bg-app)] rounded-2xl flex items-center justify-center gap-3 transition-all group-hover:border-[var(--accent)]"
                  >
                      <Chrome size={20} className="text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors" />
                      <span className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[3px]">Link with Google</span>
                  </motion.div>
              </GoogleOAuthProvider>
          </div>
          
          <div className="mt-10 text-center">
            <button 
                onClick={() => setModalType('register')} 
                className="text-[var(--text-muted)] text-[10px] hover:text-[var(--accent)] font-black uppercase tracking-[4px] transition-all"
            >
                New Operator? <span className="text-[var(--text-main)] underline underline-offset-8">Initialize</span>
            </button>
          </div>
        </div>

        {/* Environmental Metadata Footer */}
        <div className="mt-10 flex justify-center items-center gap-8">
            <div className="flex items-center gap-2 text-[var(--text-muted)] opacity-40 font-black text-[8px] uppercase tracking-[4px]">
                <Fingerprint size={12} /> Biometric ID
            </div>
            <div className="flex items-center gap-2 text-[var(--text-muted)] opacity-40 font-black text-[8px] uppercase tracking-[4px]">
                <Globe size={12} /> Cloud Sync
            </div>
        </div>
      </motion.div>

      {/* --- COMPACT REGISTRATION MODAL (SYNCED WITH NEW ENTRY UI) --- */}
      <AnimatePresence>
        {modalType === 'register' && (
          <ModalLayout title={regStep === 'details' ? "PROTOCOL: INITIALIZATION" : "PROTOCOL: VERIFICATION"} onClose={() => setModalType('none')}>
              
              <div className="p-2 min-h-[340px] flex flex-col justify-center">
                {/* Protocol Sub-header (matches your entry modal) */}
                <div className="mb-6">
                    <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest leading-none">Secure Transaction</p>
                </div>

                <AnimatePresence mode="wait">
                    {regStep === 'details' ? (
                        <motion.form key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4" onSubmit={handleSendOtp}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Identity</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input type="text" placeholder="E.G. JOHN DOE" className="app-input pl-12 font-bold uppercase text-[11px] tracking-widest" value={registerForm.username} onChange={e => setRegisterForm({...registerForm, username: e.target.value})} required/>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Channel Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input type="email" placeholder="SECURE MAIL" className="app-input pl-12 font-bold uppercase text-[11px] tracking-widest" value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} required/>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Security Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                        <input type="password" placeholder="••••••••" className="app-input pl-12 font-bold tracking-widest" value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} required/>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="app-btn-primary w-full py-5 text-[11px] tracking-widest uppercase mt-6">
                                {cooldown > 0 ? `RETRY IN ${formatTime(cooldown)}` : 'REQUEST ACCESS CODE'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-8 text-center" onSubmit={handleFinalRegister}>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-14 h-14 bg-[var(--accent-soft)] rounded-full flex items-center justify-center border border-[var(--ring)]">
                                    <ShieldAlert className="text-[var(--accent)]" size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-[var(--text-main)] tracking-[3px] uppercase">Protocol Dispatched</p>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[2px]">{registerForm.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Entry Key</label>
                                <input 
                                    type="text" placeholder="••••••" 
                                    className="app-input text-center text-4xl font-black tracking-[12px] py-6 border-b-4 border-b-[var(--accent)]" 
                                    maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} autoFocus
                                />
                            </div>

                            <button type="submit" className="app-btn-primary w-full py-5 text-[11px] tracking-widest uppercase shadow-2xl">Confirm Identity</button>
                            
                            <div className="flex items-center justify-between px-2 mt-4">
                                <button type="button" onClick={() => setRegStep('details')} className="text-[9px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-[4px]">Adjust Detail</button>
                                {cooldown > 0 ? (
                                    <div className="flex items-center gap-2 text-[var(--accent)] opacity-60"><Timer size={12} /><span className="text-[9px] font-black tracking-[2px]">{formatTime(cooldown)}</span></div>
                                ) : (
                                    <button type="button" onClick={handleSendOtp} className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[4px] underline underline-offset-8">Resend Protocol</button>
                                )}
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
              </div>
          </ModalLayout>
        )}
      </AnimatePresence>
    </div>
  );
}