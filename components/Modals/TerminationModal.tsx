"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Fingerprint, AlertOctagon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';

// 🔥 পুনারাবৃত্তি এড়াতে কাউন্টডাউন কম্পোনেন্টটি এখান থেকে এক্সপোর্ট করা হলো
export const ToastCountdown = ({ initialSeconds }: { initialSeconds: number }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    useEffect(() => {
        if (seconds <= 0) return;
        const timer = setInterval(() => setSeconds(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [seconds]);
    return <span>{seconds}s</span>;
};

export const TerminationModal = ({ isOpen, onClose, onConfirm, targetName, title, desc }: any) => {
    const { t } = useTranslation();
    const [confirmText, setConfirmText] = useState('');
    const isMatch = confirmText.trim().toLowerCase() === targetName?.trim().toLowerCase();

    useEffect(() => { if (!isOpen) setConfirmText(''); }, [isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div 
                initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-[var(--bg-card)] w-full md:max-w-md rounded-[40px] border border-red-500/20 shadow-2xl relative z-10 overflow-hidden"
            >
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-red-500">
                            <ShieldAlert size={20} className="animate-pulse" />
                            <h4 className="text-[11px] font-black uppercase tracking-[4px] italic">{title || "TERMINATION PROTOCOL"}</h4>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-inner"><X size={20} /></button>
                    </div>

                    <div className="p-6 rounded-[30px] bg-red-500/5 border border-red-500/20 flex flex-col items-center text-center shadow-inner">
                        <div className="w-16 h-16 rounded-[22px] bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shadow-2xl">
                            <AlertOctagon size={32} />
                        </div>
                        <p className="text-[10px] font-bold uppercase leading-relaxed text-red-500/60 px-2 tracking-widest">
                            {desc || "THIS ACTION IS IRREVERSIBLE. ALL DATA NODES ASSOCIATED WITH THIS REGISTRY WILL BE ERASED."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between px-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">Type identity to confirm</label>
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] italic">{targetName}</span>
                        </div>
                        <input 
                            autoFocus type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RE-TYPE NAME..."
                            className="w-full h-16 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[25px] px-8 text-[13px] font-black tracking-widest text-red-500 outline-none focus:border-red-500 transition-all shadow-inner placeholder:opacity-10"
                        />
                    </div>

                    <button 
                        onClick={() => { if(isMatch) { onClose(); setTimeout(() => onConfirm(), 100); } }}
                        disabled={!isMatch}
                        className={cn(
                            "w-full h-18 py-6 rounded-[28px] font-black text-[12px] uppercase tracking-[6px] transition-all active:scale-95 flex items-center justify-center gap-5 shadow-2xl",
                            isMatch ? "bg-red-600 text-white shadow-red-600/40 hover:bg-red-700" : "bg-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed border border-white/5"
                        )}
                    >
                        <Fingerprint size={22} /> EXECUTE PURGE
                    </button>
                </div>
            </motion.div>
        </div>
    );
};