"use client";
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, User, ShieldCheck, Zap, Cpu, ShieldAlert } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Modular Components (Assume these follow V5.2 styling)
import { IdentityHero } from './IdentityHero';
import { SecurityForm } from './SecurityForm';
import { DataSovereignty } from './DataSovereignty';
import { ProtocolAuditLog } from './ProtocolAuditLog';
import { DangerZone } from './DangerZone';

/**
 * VAULT PRO: MASTER PROFILE HUB (V5.2)
 * -----------------------------------------
 * Orchestrates Identity, Security, and Data Sovereignty.
 * Features: Standardized Headers, Dynamic Spacing, and Elite OS Polish.
 */
export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const { T, t, language } = useTranslation();
    
    // --- 🧬 CORE LOGIC ENGINE (100% Preserved) ---
    const {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, updateProfile, exportMasterData, importMasterData, deleteAccount
    } = useProfile(currentUser, setCurrentUser, onLogout);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-[1400px] mx-auto transition-all duration-500"
        >
            <div className="px-4 md:px-8 space-y-[var(--app-gap,2.5rem)] pb-40">
                
                {/* --- ১. MASTER HUB HEADER (Point 1 Standardized) --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 mt-6">
                    <div className="flex items-center gap-4">
                        {/* OS Icon Box */}
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-orange-500/30 shrink-0">
                            <Fingerprint size={28} strokeWidth={2.5} />
                        </div>

                        <div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none">
                                {T('identity_hub_title') || "IDENTITY HUB"}<span className="text-orange-500">.</span>
                            </h2>
                            
                            <div className="flex items-center gap-2 mt-2.5">
                                {/* Protocol Badge */}
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                                    <ShieldCheck size={12} strokeWidth={3} />
                                    <span className="text-[8px] font-black uppercase tracking-[2px]">
                                        {t('master_profile_protocol') || "ENCRYPTION ACTIVE"}
                                    </span>
                                </div>
                                <span className="text-[9px] font-bold text-[var(--text-muted)] opacity-30 uppercase tracking-[3px] ml-1">
                                    ID V5.2
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Meta Info */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="bg-[var(--bg-card)]/50 backdrop-blur-md px-6 py-3.5 rounded-[22px] border border-[var(--border)] shadow-sm flex items-center gap-4 group hover:border-orange-500/30 transition-all duration-500">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black uppercase tracking-[2px] text-[var(--text-muted)] opacity-50 mb-1 leading-none">SYSTEM ACCESS</span>
                                <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{T('encrypted_hub') || "MAXIMUM SECURITY"}</span>
                            </div>
                            <Zap size={22} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                        </div>
                    </div>
                </div>

                {/* --- ২. MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,2.5rem)] items-start">
                    
                    {/* LEFT COLUMN: User Card & Logs */}
                    <div className="lg:col-span-1 space-y-[var(--app-gap,2rem)]">
                        <IdentityHero 
                            formData={formData} 
                            handleImageProcess={handleImageProcess} 
                            setForm={setForm} 
                            currentUser={currentUser} 
                            fileInputRef={fileInputRef} 
                        />
                        
                        <ProtocolAuditLog />
                    </div>

                    {/* RIGHT COLUMN: Security & Sovereignty */}
                    <div className="lg:col-span-2 space-y-[var(--app-gap,2.5rem)]">
                        
                        {/* Security Update Form */}
                        <SecurityForm 
                            formData={formData} 
                            setForm={setForm} 
                            updateProfile={updateProfile} 
                            currentUser={currentUser} 
                            isLoading={isLoading} 
                        />

                        {/* Data Sovereignty (Backup/Restore) */}
                        <DataSovereignty 
                            exportMasterData={exportMasterData} 
                            importMasterData={importMasterData} 
                            importInputRef={importInputRef} 
                            isExporting={isExporting} 
                        />

                        {/* 🔥 DANGER ZONE (The Red Box) */}
                        <DangerZone 
                            onDeleteAccount={deleteAccount} 
                            isLoading={isLoading} 
                            userEmail={currentUser?.email} 
                        />
                        
                    </div>
                </div>

                {/* --- ৩. OS SIGNATURE FOOTER --- */}
                <div className="pt-20 flex flex-col items-center">
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-6 opacity-30" />
                    <div className="flex items-center gap-6 opacity-20 hover:opacity-50 transition-opacity duration-700 cursor-default">
                        <Cpu size={28} strokeWidth={1.5} />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[8px] leading-none">
                                {T('vault_pro_split_1')} {T('vault_pro_split_2')}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-[4px] mt-2">
                                {T('identity_verified') || "IDENTITY NODE V5.2"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};