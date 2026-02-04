"use client";
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// Modular Components
import { IdentityHero } from './IdentityHero';
import { SecurityForm } from './SecurityForm';
import { DataSovereignty } from './DataSovereignty';
import { ProtocolAuditLog } from './ProtocolAuditLog';
import { DangerZone } from './DangerZone'; // 🔥 নতুন ইন্টিগ্রেশন

/**
 * VAULT PRO: MASTER PROFILE HUB (STABILIZED)
 * -----------------------------------------
 * Orchestrates Identity, Security, Data Sovereignty and Termination Protocols.
 * Fully compatible with Compact Mode and Multi-language engines.
 */
export const ProfileSection = ({ currentUser, setCurrentUser, onLogout }: any) => {
    const { T, t } = useTranslation();
    
    const {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, updateProfile, exportMasterData, importMasterData, deleteAccount
    } = useProfile(currentUser, setCurrentUser, onLogout);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="pb-32 max-w-6xl mx-auto space-y-[var(--app-gap,2.5rem)] px-[var(--app-padding,1rem)] transition-all duration-300"
        >
            
            {/* --- ১. MASTER BRANDED HEADER --- */}
            <div className="flex items-end justify-between border-b border-[var(--border-color)] pb-8 mt-6">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] uppercase italic tracking-tighter leading-none">
                        {T('identity_hub_title') || "Identity Hub"}<span className="text-orange-500">.</span>
                    </h2>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[4px] mt-4 ml-1">
                        {t('master_profile_protocol') || "Master Profile Protocol"}
                    </p>
                </div>
                <div className="hidden md:flex flex-col items-end opacity-20">
                    <Tooltip text={t('tt_encrypted_hub') || "Security Level: Maximum"}>
                        <div className="flex flex-col items-end">
                            <Fingerprint size={32} strokeWidth={1.5} className="text-[var(--text-main)]" />
                            <span className="text-[8px] font-black uppercase tracking-widest mt-2 text-[var(--text-main)]">
                                {T('encrypted_hub') || "Encrypted Hub"}
                            </span>
                        </div>
                    </Tooltip>
                </div>
            </div>

            {/* --- ২. MAIN CONTENT GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--app-gap,2rem)]">
                
                {/* LEFT COLUMN: Identity & Logs */}
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

                {/* RIGHT COLUMN: Security, Backup & Danger Zone */}
                <div className="lg:col-span-2 space-y-[var(--app-gap,2rem)]">
                    
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

                    {/* 🔥 DANGER ZONE: Centralized Termination Logic */}
                    <DangerZone 
                        onDeleteAccount={deleteAccount} 
                        isLoading={isLoading} 
                        userEmail={currentUser?.email} 
                    />
                    
                </div>
            </div>

            {/* মডাল কোড এখান থেকে সরিয়ে DangerZone কম্পোনেন্টে নেওয়া হয়েছে */}
        </motion.div>
    );
};