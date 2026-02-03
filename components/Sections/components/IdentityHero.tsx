"use client";
import React, { useMemo } from 'react';
import { Camera, Chrome, Zap, ShieldCheck, Activity, Trash2, User, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const IdentityHero = ({ formData, handleImageProcess, setForm, currentUser, fileInputRef }: any) => {
    
    // ১. প্রোফাইল ইন্টিগ্রিটি লজিক
    const healthScore = useMemo(() => {
        let score = 0;
        if (formData.name) score += 25;
        if (formData.image) score += 25;
        if (currentUser?.authProvider === 'google') score += 25;
        if (localStorage.getItem('last_backup_time')) score += 25;
        return score;
    }, [formData, currentUser]);

    // ২. ইমেজ রিমুভ করার লজিক
    const handleRemovePhoto = () => {
        setForm({ ...formData, image: '' });
    };

    return (
        <div className="app-card p-10 flex flex-col items-center text-center relative overflow-hidden group bg-[var(--bg-card)] shadow-2xl border-[var(--border-color)] min-h-[520px]">
            
            {/* Background Branding */}
            <div className="absolute top-0 left-0 p-4 opacity-20">
                <p className="text-[7px] font-black uppercase tracking-[3px] text-[var(--text-muted)]">
                    PROTOCOL_INTEGRITY: <span className="text-orange-500">{healthScore}%</span>
                </p>
            </div>

            {/* --- AVATAR & RING SECTION --- */}
            <div className="relative mt-8 group/avatar">
                {/* Visual Circle (Health Tracker) */}
                <div className="absolute -inset-5">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                        <circle cx="100" cy="100" r="92" stroke="var(--border)" strokeWidth="1" fill="transparent" />
                        <motion.circle 
                            cx="100" cy="100" r="92" 
                            stroke="var(--accent)" 
                            strokeWidth="3" 
                            fill="transparent"
                            strokeDasharray="578"
                            initial={{ strokeDashoffset: 578 }}
                            animate={{ strokeDashoffset: 578 - (578 * healthScore) / 100 }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
                
                {/* Main Identity Area */}
                <div className="w-44 h-44 rounded-[55px] flex items-center justify-center shadow-2xl border-8 border-[var(--bg-card)] bg-[var(--bg-app)] relative z-10 overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                    {formData.image ? (
                        <img src={formData.image} alt="ID" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-app)] to-[var(--border)]">
                            <User size={64} strokeWidth={1} className="text-[var(--text-muted)] opacity-30" />
                            <span className="text-xl font-black text-orange-500/20 italic uppercase">{formData.name?.charAt(0)}</span>
                        </div>
                    )}
                </div>

                {/* Floating Action Duo (Upload & Remove) */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                    <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-orange-500 text-white p-3 rounded-2xl shadow-xl shadow-orange-500/30 border-4 border-[var(--bg-card)] hover:bg-orange-600 transition-all"
                        title="Upload Photo"
                    >
                        <Camera size={18} strokeWidth={2.5} />
                    </motion.button>
                    
                    {formData.image && (
                        <motion.button 
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={handleRemovePhoto}
                            className="bg-red-500/10 text-red-500 p-3 rounded-2xl shadow-xl border-4 border-[var(--bg-card)] hover:bg-red-500 hover:text-white transition-all backdrop-blur-md"
                            title="Remove Photo"
                        >
                            <Trash2 size={18} strokeWidth={2.5} />
                        </motion.button>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleImageProcess(e.target.files[0])} accept="image/*" className="hidden" />
            </div>

            {/* --- IDENTITY INFO --- */}
            <div className="mt-16 relative z-10">
                <div className="flex items-center justify-center gap-2.5">
                    <h3 className="text-3xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none">{formData.name}</h3>
                    {healthScore >= 75 && <ShieldCheck size={24} className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />}
                </div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[4px] mt-2 opacity-50">{currentUser?.email}</p>
                
                {/* Verification Badge (The Bridge UX) */}
                <div className="mt-8 flex justify-center">
                    {currentUser?.authProvider === 'google' ? (
                        <div className="px-5 py-2.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-blue-400 flex items-center gap-3 shadow-inner">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg"><Chrome size={14} /></div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none">Google Verified</p>
                                <p className="text-[7px] font-bold uppercase opacity-40 mt-1">Identity Protocol Secured</p>
                            </div>
                        </div>
                    ) : (
                        <div className="px-5 py-2.5 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-500 flex items-center gap-3">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg"><MailCheck size={14} /></div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none">Standard Identity</p>
                                <p className="text-[7px] font-bold uppercase opacity-40 mt-1">Email Auth active</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sub-metrics */}
                <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4">
                    <div className="p-4 rounded-[24px] bg-[var(--bg-app)] border border-[var(--border-color)]">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1 opacity-40">Connection</p>
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Activity size={12} className="animate-pulse" /> Stable
                        </p>
                    </div>
                    <div className="p-4 rounded-[24px] bg-[var(--bg-app)] border border-[var(--border-color)]">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase mb-1 opacity-40">Hierarchy</p>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Master Node</p>
                    </div>
                </div>
            </div>

            {/* Bottom ID Code */}
            <div className="mt-auto pt-8 opacity-10">
                <p className="text-[9px] font-mono font-bold tracking-[6px] uppercase">
                    ID-{String(currentUser?._id).slice(-8).toUpperCase()}
                </p>
            </div>
        </div>
    );
};