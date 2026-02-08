"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Copy, Check, Globe, ShieldAlert, Loader2, Link2, 
    Zap, X, ShieldCheck, Fingerprint, Activity, Terminal 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createPortal } from "react-dom";

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ INTERNAL PORTAL (Universal Bypass) ---
const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  return mounted ? createPortal(children, document.body) : null;
};

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const ShareModal = ({ isOpen, onClose, currentBook, onToggleShare }: any) => {
    const { T, t, language } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // ১. প্রোটোকল: মোবাইল ডিটেকশন ও স্ক্রল লক
    useEffect(() => { 
        setIsMobile(window.innerWidth < 768);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.touchAction = 'auto';
        }
    }, [isOpen]);

    if (!isOpen || !currentBook) return null;

    const isPublic = currentBook.isPublic || false;
    const shareToken = currentBook.shareToken || "";
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/share/${shareToken}`;

    const handleCopy = () => {
        if (!shareUrl || !shareToken) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        if (inputRef.current) inputRef.current.select();
        toast.success(t('link_copied') || "Broadcasting Link Copied");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggle = async () => {
        setLoading(true);
        try {
            await onToggleShare(!isPublic);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalPortal>
            <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center overflow-hidden">
                {/* --- 🌑 NATIVE BACKDROP --- */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-xl z-0"
                />

                {/* --- 🍃 THE SOVEREIGN SHEET --- */}
                <motion.div 
                    drag={isMobile ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => { if (info.offset.y > 150) onClose(); }}
                    initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
                    animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
                    exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    className="bg-[var(--bg-card)] w-full md:max-w-md h-auto rounded-t-[45px] md:rounded-[45px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden will-change-transform"
                >
                    {/* Visual Handle */}
                    <div className="w-12 h-1 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20 md:hidden" />

                    <div className="p-8">
                        {/* --- 🏷️ HEADER --- */}
                        <div className="flex justify-between items-center mb-8 relative z-20">
                            <div>
                                <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none flex items-center gap-2">
                                    <Terminal size={14} className="text-orange-500" />
                                    {T('share_vault_title') || "Access Protocol"}
                                </h2>
                                <div className="flex items-center gap-2 mt-1.5 opacity-60">
                                    <ShieldCheck size={10} className="text-orange-500" />
                                    <span className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px]">{T('identity_secured') || "IDENTITY VERIFIED"}</span>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm"><X size={20} /></button>
                        </div>

                        {/* --- ⚙️ CORE INTERFACE --- */}
                        <motion.div layout className="space-y-6 relative z-10">
                            
                            {/* 1. STATUS MODULE */}
                            <motion.div layout className={`p-6 rounded-[35px] border-2 transition-all duration-700 relative overflow-hidden ${isPublic ? 'bg-green-500/5 border-green-500/30 shadow-[0_20px_40px_-10px_rgba(34,197,94,0.15)]' : 'bg-red-500/5 border-red-500/10'}`}>
                                <div className="flex flex-col gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-700 ${isPublic ? 'bg-green-500 text-white shadow-lg' : 'bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
                                            {isPublic ? <Globe size={28} className="animate-pulse" /> : <ShieldAlert size={28} />}
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-[10px] font-black uppercase tracking-[3px] transition-colors ${isPublic ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                                {isPublic ? T('status_live') : T('status_private')}
                                            </p>
                                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-40 leading-relaxed">
                                                {isPublic ? t('desc_public') : t('desc_private')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Trigger */}
                                    <button 
                                        onClick={handleToggle} disabled={loading}
                                        className={`w-full py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[4px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden border-none ${isPublic ? 'bg-[var(--bg-card)] text-red-500 shadow-red-500/5' : 'bg-orange-500 text-white shadow-orange-500/20'}`}
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                            <>
                                                <Fingerprint size={18} strokeWidth={2.5} />
                                                {isPublic ? T('btn_disable') : T('btn_enable')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            {/* 2. REVEAL AREA: Link Endpoint */}
                            <AnimatePresence mode="wait">
                                {isPublic && shareToken && (
                                    <motion.div 
                                        key="link-reveal"
                                        initial={{ opacity: 0, height: 0, y: 10 }} 
                                        animate={{ opacity: 1, height: 'auto', y: 0 }} 
                                        exit={{ opacity: 0, height: 0, y: 10 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 220 }}
                                        className="space-y-4 pt-2 overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-3">
                                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                                                <Link2 size={12} strokeWidth={3} /> {T('label_access_url') || "PUBLIC ENDPOINT URL"}
                                            </span>
                                            
                                            <div className="relative group">
                                                <input 
                                                    ref={inputRef} readOnly value={shareUrl} onClick={handleCopy} 
                                                    className="w-full h-15 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px] pl-6 pr-14 text-[10px] font-mono font-bold text-orange-500 outline-none cursor-pointer focus:border-orange-500/40 transition-all shadow-inner" 
                                                />
                                                <button 
                                                    onClick={handleCopy}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all z-20"
                                                >
                                                    <AnimatePresence mode="wait">
                                                        {copied ? (
                                                            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                                <Check size={18} strokeWidth={3} />
                                                            </motion.div>
                                                        ) : (
                                                            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                                <Copy size={18} strokeWidth={2.5} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between px-2 opacity-30">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-green-500">{T('status_online') || "ONLINE"}</span>
                                                </div>
                                                <span className="text-[8px] font-bold uppercase italic tracking-widest">EXT: {toBn('SHA256v5', language)}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 3. SYSTEM FOOTER */}
                            <div className="pt-8 border-t border-[var(--border)] opacity-30 text-center">
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed max-w-[280px] mx-auto">
                                    {t('share_info_footer')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                    {/* Safe Area Padding for iOS */}
                    <div className="h-[env(safe-area-inset-bottom,1.5rem)] bg-transparent" />
                </motion.div>
            </div>
        </ModalPortal>
    );
};