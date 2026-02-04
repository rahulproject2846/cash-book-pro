"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Globe, ShieldAlert, Loader2, Link2, Share2 } from 'lucide-react';
import { ModalLayout } from '@/components/Modals';
import toast from 'react-hot-toast';

// Global Engine Hooks
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: SHARE PROTOCOL MODAL (PREMIUM UX)
 * -------------------------------------------
 * Features: Live Pulse, Smart Copy, and Smooth State Transitions.
 */
export const ShareModal = ({ isOpen, onClose, currentBook, onToggleShare }: any) => {
    const { T, t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen || !currentBook) return null;

    const isPublic = currentBook.isPublic || false;
    const shareToken = currentBook.shareToken || "";
    // উইন্ডো অবজেক্ট সেফটি চেক
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/share/${shareToken}`;

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        
        // ভিজ্যুয়াল ফিডব্যাক
        setCopied(true);
        if (inputRef.current) inputRef.current.select(); // স্মার্ট সিলেকশন
        toast.success(t('link_copied') || "Secure Link Copied");
        
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
        <ModalLayout title={T('share_vault_title') || "Vault Access Protocol"} onClose={onClose}>
            <div className="space-y-[var(--app-gap,1.5rem)] py-2">
                
                {/* ১. স্ট্যাটাস কার্ড (Premium Card with Glow) */}
                <motion.div 
                    layout
                    className={`relative p-[var(--card-padding,1.5rem)] rounded-[var(--radius-card,24px)] border-2 transition-all duration-500 overflow-hidden ${
                    isPublic 
                    ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.15)]' 
                    : 'bg-red-500/5 border-red-500/10'
                }`}>
                    {/* Background Icon Watermark */}
                    <div className={`absolute -right-4 -bottom-4 opacity-[0.05] rotate-12 transition-colors duration-500 ${isPublic ? 'text-green-500' : 'text-red-500'}`}>
                        <Share2 size={100} />
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isPublic ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                                {isPublic ? (
                                    <Globe size={24} className="animate-pulse" /> // 🔥 Pulse Effect
                                ) : (
                                    <ShieldAlert size={24} />
                                )}
                            </div>
                            <div className="text-left">
                                <p className={`text-[11px] font-black uppercase tracking-[2px] transition-colors duration-300 ${isPublic ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                                    {isPublic ? (T('status_live') || 'PROTOCOL: LIVE') : (T('status_private') || 'PROTOCOL: PRIVATE')}
                                </p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-60">
                                    {isPublic ? (t('desc_public') || 'Publicly Accessible') : (t('desc_private') || 'Restricted Access')}
                                </p>
                            </div>
                        </div>

                        {/* Toggle Button */}
                        <Tooltip text={isPublic ? t('tt_disable_share') : t('tt_enable_share')}>
                            <button 
                                onClick={handleToggle}
                                disabled={loading}
                                className={`w-full md:w-auto px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    isPublic 
                                    ? 'bg-[var(--bg-app)] border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                                    : 'bg-green-600 text-white shadow-green-500/20 hover:bg-green-700 border border-transparent'
                                }`}
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : (isPublic ? (T('btn_disable') || 'DISABLE') : (T('btn_enable') || 'ENABLE'))}
                            </button>
                        </Tooltip>
                    </div>
                </motion.div>

                {/* ২. লিঙ্ক এরিয়া (Smooth Slide Animation) */}
                <AnimatePresence>
                    {isPublic && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 space-y-3">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
                                    <Link2 size={12} className="text-orange-500" /> {T('label_access_url') || "SECURE LINK"}
                                </label>
                                
                                <div className="relative group">
                                    <input 
                                        ref={inputRef}
                                        readOnly 
                                        value={shareUrl} 
                                        onClick={handleCopy} // Click to Copy/Select
                                        className="app-input h-14 pr-14 text-[11px] font-mono font-bold text-orange-500 bg-[var(--bg-app)] border-2 border-[var(--border-color)] rounded-2xl group-hover:border-orange-500/30 transition-all cursor-pointer focus:ring-4 focus:ring-orange-500/5 select-all" 
                                    />
                                    
                                    <Tooltip text={copied ? t('copied') : t('copy_link')}>
                                        <button 
                                            onClick={handleCopy}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-90 shadow-sm"
                                        >
                                            <AnimatePresence mode="wait">
                                                {copied ? (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                        <Check size={18} className="text-green-500" strokeWidth={3} />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                        <Copy size={18} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    </Tooltip>
                                </div>
                                
                                <p className="text-[8px] font-bold text-orange-500/60 uppercase tracking-widest text-right mt-1 animate-pulse">
                                    {t('link_active_warning') || "● Live Public Node"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ৩. ইনফো টেক্সট */}
                <div className="pt-4 border-t border-[var(--border-color)]/30">
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center opacity-40 leading-relaxed max-w-xs mx-auto">
                        {t('share_info_footer') || "Sharing allows read-only access to this ledger via the secure protocol link."}
                    </p>
                </div>
            </div>
        </ModalLayout>
    );
};