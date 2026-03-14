"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Fingerprint, AlertOctagon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { SafeButton } from '@/components/UI/SafeButton';

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
        <>
            <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 text-red-500">
                            <ShieldAlert size={20} className="animate-pulse" />
                            <h4 className="text-[11px] font-black     ">{title || "TERMINATION PROTOCOL"}</h4>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-inner"><X size={20} /></button>
                    </div>

                    <div className="p-6 rounded-[30px] bg-red-500/5 border border-red-500/20 flex flex-col items-center text-center shadow-inner">
                        <div className="w-16 h-16 rounded-[22px] bg-red-500/10 flex items-center justify-center text-red-500 mb-4 shadow-2xl">
                            <AlertOctagon size={32} />
                        </div>
                        <p className="text-[10px] font-bold leading-relaxed text-red-500/60 px-2  ">
                            {desc || "THIS ACTION IS IRREVERSIBLE. ALL DATA NODES ASSOCIATED WITH THIS REGISTRY WILL BE ERASED."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between px-1">
                            <label className="text-[9px] font-black text-[var(--text-muted)]   ">Type identity to confirm</label>
                            <span className="text-[9px] font-black text-orange-500     ">{targetName}</span>
                        </div>
                        <input 
                            autoFocus type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RE-TYPE NAME..."
                            className="w-full h-16 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[25px] px-8 text-[13px] font-black   text-red-500 outline-none focus:border-red-500 transition-all shadow-inner placeholder:opacity-10"
                        />
                    </div>

                    <SafeButton
                        actionId="execute-termination"
                        onAction={() => { if(isMatch) { onClose(); setTimeout(() => onConfirm(), 100); } }}
                        variant="danger"
                        size="lg"
                        loadingText="Executing..."
                        blockedText="System Busy"
                        disabled={!isMatch}
                        className="w-full h-18 py-6"
                        shakeOnBlock={false}
                    >
                        <Fingerprint size={22} />
                        EXECUTE PURGE
                    </SafeButton>
                </div>
            </>
        );
};