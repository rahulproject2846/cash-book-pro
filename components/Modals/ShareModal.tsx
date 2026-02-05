"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Copy, Check, Globe, ShieldAlert, Loader2, Link2, 
    Share2, Zap, X, ShieldCheck, Fingerprint 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const ShareModal = ({ isOpen, onClose, currentBook, onToggleShare }: any) => {
    const { T, t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

    if (!isOpen || !currentBook) return null;

    const isPublic = currentBook.isPublic || false;
    const shareToken = currentBook.shareToken || "";
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/share/${shareToken}`;

    const handleCopy = () => {
        if (!shareUrl) return;
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
            // রিঅ্যাক্টিভ ফিডব্যাক: অন অফ করার সাথে সাথে UI পাল্টাবে
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            {/* --- 🌑 ELITE BACKDROP (Glassmorphism) --- */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-xl"
            />

            {/* --- 🍃 THE BROADCST SHEET (Native Transition) --- */}
            <motion.div 
                initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
                exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="bg-[var(--bg-card)] w-full md:max-w-md h-auto rounded-t-[40px] md:rounded-[40px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                {/* Visual Handle */}
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20 md:hidden" />

                <div className="p-8">
                    {/* --- 🏷️ HEADER SECTION --- */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-tight">
                                {T('share_vault_title') || "Access Protocol"}
                            </h2>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-70 flex items-center gap-2">
                                <ShieldCheck size={10} /> {T('identity_secured') || "IDENTITY VERIFIED"}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        
                        {/* ১. স্ট্যাটাস কার্ড (Native Logic Interface) */}
                        <motion.div 
                            layout
                            className={`p-6 rounded-[32px] border-2 transition-all duration-500 relative overflow-hidden ${
                                isPublic 
                                ? 'bg-green-500/5 border-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                                : 'bg-red-500/5 border-red-500/10'
                            }`}
                        >
                            <div className="flex flex-col gap-5 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-700 ${isPublic ? 'bg-green-500 text-white shadow-lg' : 'bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
                                        {isPublic ? <Globe size={28} className="animate-pulse" /> : <ShieldAlert size={28} />}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-[10px] font-black uppercase tracking-[3px] transition-colors ${isPublic ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                            {isPublic ? (T('status_live') || 'PROTOCOL: BROADCASTING') : (T('status_private') || 'PROTOCOL: RESTRICTED')}
                                        </p>
                                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-40">
                                            {isPublic ? (t('desc_public') || 'Open access channel') : (t('desc_private') || 'Encryption active')}
                                        </p>
                                    </div>
                                </div>

                                {/* Main Execution Toggle */}
                                <button 
                                    onClick={handleToggle}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[4px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden ${
                                        isPublic 
                                        ? 'bg-[var(--bg-card)] border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                                        : 'bg-orange-500 text-white border-transparent hover:bg-orange-600'
                                    }`}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : (
                                        <>
                                            <Fingerprint size={16} strokeWidth={3} />
                                            {isPublic ? (T('btn_disable') || 'TERMINATE BROADCAST') : (T('btn_enable') || 'INITIALIZE LINK')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {/* ২. ইন্টারেক্টিভ লিঙ্ক এরিয়া (Smart Appearance) */}
                        <AnimatePresence mode="wait">
                            {isPublic && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="space-y-4"
                                >
                                    <div className="flex flex-col gap-3">
                                        <span className="text-[8px] font-black text-orange-500 uppercase tracking-[3px] ml-1 flex items-center gap-2">
                                            <Link2 size={12} strokeWidth={3} /> {T('label_access_url') || "PUBLIC ENDPOINT URL"}
                                        </span>
                                        
                                        <div className="relative group">
                                            <input 
                                                ref={inputRef} readOnly value={shareUrl} onClick={handleCopy} 
                                                className="vault-glass-input !h-14 !pl-6 !pr-14 !text-[10px] !font-mono font-bold text-orange-500 !bg-[var(--bg-app)] !rounded-2xl cursor-pointer select-all" 
                                            />
                                            
                                            <button 
                                                onClick={handleCopy}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all z-20"
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
                                        
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-1.5">
                                                <Zap size={10} className="text-green-500 animate-pulse" fill="currentColor" />
                                                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">{T('status_online') || "ONLINE"}</span>
                                            </div>
                                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-30 italic">Endpoint: SHA256v5</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ৩. প্রোটোকল ফুটার */}
                        <div className="pt-6 border-t border-[var(--border)] opacity-30 text-center">
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
                                {t('share_info_footer') || "Secure Link enables read-only protocol synchronization across devices."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Safe Area for Mobile */}
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </motion.div>
        </div>
    );
};