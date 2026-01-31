"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Globe, ShieldAlert, Loader2 } from 'lucide-react';
import { ModalLayout } from '@/components/Modals';
import toast from 'react-hot-toast';

export const ShareModal = ({ isOpen, onClose, currentBook, onToggleShare }: any) => {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !currentBook) return null;

    const isPublic = currentBook.isPublic || false;
    const shareToken = currentBook.shareToken || "";
    const shareUrl = `${window.location.origin}/share/${shareToken}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
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
        <ModalLayout title="Vault Share" onClose={onClose}>
            <div className="space-y-6 py-2">
                
                {/* ১. স্ট্যাটাস কার্ড */}
                <div className={`p-6 rounded-[24px] border-2 transition-all duration-500 flex justify-between items-center ${
                    isPublic 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-slate-500/5 border-[var(--border-color)]'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPublic ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                            {isPublic ? <Globe size={20} /> : <ShieldAlert size={20} />}
                        </div>
                        <div className="text-left">
                            <p className={`text-[11px] font-black uppercase tracking-[2px] ${isPublic ? 'text-green-500' : 'text-slate-400'}`}>
                                {isPublic ? 'Protocol: Live' : 'Protocol: Private'}
                            </p>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                {isPublic ? 'Accessible via link' : 'Vault is secured'}
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={handleToggle}
                        disabled={loading}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                            isPublic 
                            ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' 
                            : 'bg-green-600 text-white shadow-green-500/20 hover:bg-green-700'
                        }`}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : (isPublic ? 'Disable' : 'Enable')}
                    </button>
                </div>

                {/* ২. লিঙ্ক এরিয়া (শুধুমাত্র পাবলিক হলে দেখাবে) */}
                {isPublic && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1">Access URL</p>
                        <div className="relative group">
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="app-input pr-14 text-[10px] font-mono font-bold text-orange-500 bg-[var(--bg-app)] border-2 border-[var(--border-color)] group-hover:border-orange-500/30 transition-all" 
                            />
                            <button 
                                onClick={handleCopy}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ৩. ইনফো টেক্সট */}
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center opacity-40 leading-relaxed">
                    Sharing allows read-only access to this ledger via the secure protocol link.
                </p>
            </div>
        </ModalLayout>
    );
};