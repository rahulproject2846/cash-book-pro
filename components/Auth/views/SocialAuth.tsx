"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome, ShieldCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google'; 
import toast from 'react-hot-toast';

import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const SocialAuth = ({ onGoogleAuth }: any) => {
    const { t } = useTranslation();
    const [isVerifying, setIsVerifying] = useState(false);

    // ১. গুগল পপ-আপ ইঞ্জিন (Direct Handshake Hook)
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            setIsVerifying(true);
            // সরাসরি সাকসেস ডাটা প্যারেন্টে পাঠিয়ে দিচ্ছি
            onGoogleAuth(tokenResponse);
        },
        onError: () => {
            toast.error(t('auth_denied') || "Google Access Denied");
            setIsVerifying(false);
        }
        // 🔥 নোট: ux_mode এখানে প্রয়োজন নেই, এটি ডিফল্টভাবেই পপ-আপ
    });

    return (
        <div className="relative w-full">
            <Tooltip text={t('tt_auth_google')}>
                <motion.button 
                    type="button"
                    disabled={isVerifying}
                    whileHover={!isVerifying ? { scale: 1.01, backgroundColor: "rgba(255, 255, 255, 0.05)" } : {}}
                    whileTap={!isVerifying ? { scale: 0.98 } : {}}
                    onClick={() => {
                        setIsVerifying(true);
                        login(); 
                    }}
                    className={`w-full h-[58px] border rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-sm
                        ${isVerifying 
                            ? 'bg-blue-500/5 border-blue-500/20 cursor-wait' 
                            : 'border-white/5 bg-white/[0.02] hover:border-blue-500/40 group'
                        }
                    `}
                >
                    {isVerifying ? (
                        <div className="flex items-center gap-3">
                            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] font-black text-blue-500     ">{t('auth_verifying')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Chrome size={20} className="text-[var(--text-main)] group-hover:text-blue-500 transition-colors duration-300" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-[#0c0c0c] animate-pulse" />
                            </div>
                            <span className="text-[11px] font-black text-[var(--text-main)]     ">{t('btn_link_google')}</span>
                        </div>
                    )}
                </motion.button>
            </Tooltip>
        </div>
    );
};