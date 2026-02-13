"use client";
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, ShieldCheck, Zap, Cpu, BadgeCheck } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { cn } from '@/lib/utils/helpers';

// Modular Components
import { IdentityHero } from './IdentityHero';
import { SecurityForm } from './SecurityForm';
import { DataSovereignty } from './DataSovereignty';
import { ProtocolAuditLog } from './ProtocolAuditLog';
import { DangerZone } from './DangerZone';

/**
 * VAULT PRO: MASTER PROFILE HUB (V11.0 ELITE)
 * -----------------------------------------
 * Orchestrates Identity, Security, and Data Sovereignty.
 * Consistency: 100% Synced with Settings & Dashboard.
 */
export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const { t, language } = useTranslation();
    
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
            className={cn(
                "w-full max-w-[1400px] mx-auto transition-all duration-500",
                "pb-40 px-1 md:px-0"
            )}
        >
            {/* --- ১. MASTER IDENTITY HEADER (Enterprise Standard) --- */}
            <HubHeader 
                title={t('identity_hub_title') || "IDENTITY HUB"} 
                subtitle={t('master_profile_protocol') || "IDENTITY ENCRYPTION ACTIVE"} 
                icon={Fingerprint}
                showSearch={false}
            >
                {/* Status Indicator inside Header */}
                <Tooltip text={t('tt_access_secured') || "Maximum security clearance active"}>
                    <div className="flex items-center gap-4 bg-[var(--bg-card)] px-5 py-2.5 rounded-2xl border border-[var(--border)] shadow-inner group hover:border-orange-500/30 transition-all cursor-help">
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-[var(--text-muted)] uppercase tracking-[2px] mb-0.5">ACCESS LEVEL</span>
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none">ELITE NODE</span>
                        </div>
                        <Zap size={18} className="text-orange-500 animate-pulse" fill="currentColor" strokeWidth={0} />
                    </div>
                </Tooltip>
            </HubHeader>

            <div className={cn("mt-6 space-y-[var(--app-gap,2.5rem)]")}>
                
                {/* --- ২. MAIN CONTENT GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
                    
                    {/* LEFT COLUMN: User Card & Logs (1/3 Width) */}
                    <div className="lg:col-span-1 space-y-8">
                        <IdentityHero 
                            formData={formData} 
                            handleImageProcess={handleImageProcess} 
                            setForm={setForm} 
                            currentUser={currentUser} 
                            fileInputRef={fileInputRef} 
                        />
                        
                        <ProtocolAuditLog />
                    </div>

                    {/* RIGHT COLUMN: Security & Sovereignty (2/3 Width) */}
                    <div className="lg:col-span-2 space-y-8 md:space-y-10">
                        
                        {/* Security Update Module */}
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

                        {/* 🔥 DANGER ZONE (Controlled Demolition) */}
                        <DangerZone 
                            onDeleteAccount={deleteAccount} 
                            isLoading={isLoading} 
                            userEmail={currentUser?.email} 
                        />
                        
                    </div>
                </div>

                {/* --- ৩. OS SIGNATURE FOOTER --- */}
                <div className="pt-24 flex flex-col items-center">
                    <div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-8 opacity-30" />
                    
                    <div className="flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-all duration-1000 group cursor-default">
                        <div className="flex items-center gap-5">
                            <Cpu size={24} className="text-orange-500 group-hover:rotate-180 transition-transform duration-1000" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[10px] leading-none ml-[10px]">
                                    {t('vault_pro_split_1')} {t('vault_pro_split_2')}
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-[4px] mt-2 flex items-center gap-2">
                                    <BadgeCheck size={10} className="text-blue-500" />
                                    {t('identity_verified') || "IDENTITY NODE V11.0 STABLE"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};