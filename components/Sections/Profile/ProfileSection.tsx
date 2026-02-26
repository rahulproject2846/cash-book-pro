"use client";
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Fingerprint, ShieldCheck, Zap, Cpu, BadgeCheck, 
    AlertTriangle, Shield, Activity 
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { orchestrator } from '@/lib/vault/core/SyncOrchestrator';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { HubHeader } from '@/components/Layout/HubHeader';
import { cn } from '@/lib/utils/helpers';
import { useVaultStore } from '@/lib/vault/store';

// Modular Components
import { IdentityHero } from './IdentityHero';
import { SecurityForm } from './SecurityForm';
import { DataSovereignty } from './DataSovereignty';
import { ProtocolAuditLog } from './ProtocolAuditLog';
import { DangerZone } from './DangerZone';

/**
 * 🛡️ VAULT PRO: MASTER PROFILE HUB (V12.0)
 * -----------------------------------------
 * Security: Multi-layer Identity Encryption.
 * Sync: Integrated with Atomic Handshake Protocol.
 * UI: Enterprise Grade Native Experience.
 */
export const ProfileSection = () => {
    const { t } = useTranslation();
    
    // 🚀 SINGLE SOURCE OF TRUTH: Get ID from Vault Store
    const { currentUser, userId, logout } = useVaultStore();

    // --- CORE LOGIC ENGINE (Connected to Hook) ---
    const {
        formData, setForm, isLoading, isExporting,
        handleImageProcess, handleRemoveImage, updateProfile, 
        exportMasterData, importMasterData, deleteAccount
    } = useProfile(); // 🛡️ Hook now uses store internally

    // --- SECURITY STATUS STATE ---
    const [systemRisk, setSystemRisk] = useState<{
        systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        highRiskCount: number;
    }>({
        systemHealth: 'HEALTHY',
        highRiskCount: 0
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    // --- FETCH SYSTEM RISK (Real-time Audit) ---
    useEffect(() => {
        const fetchRisk = async () => {
            const risk = await orchestrator.getSystemRiskStatus();
            setSystemRisk(risk);
        };
        fetchRisk();
        const interval = setInterval(fetchRisk, 60000); // 1-minute heartbeat
        return () => clearInterval(interval);
    }, []);

    // --- DYNAMIC SECURITY BADGE (Logic Separation) ---
    const securityBadge = useMemo(() => {
        const configs = {
            HEALTHY: { text: 'SECURE NODE', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: ShieldCheck },
            WARNING: { text: 'RISK DETECTED', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
            CRITICAL: { text: 'LOCKDOWN', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Shield },
        };
        return configs[systemRisk.systemHealth] || configs.HEALTHY;
    }, [systemRisk.systemHealth]);

    const SecurityIcon = securityBadge.icon;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1400px] mx-auto transition-all duration-500 pb-40 px-4 md:px-0"
        >
            {/* --- 1. MASTER IDENTITY HEADER --- */}
            <HubHeader 
                title={t('identity_hub_title') || "IDENTITY HUB"} 
                subtitle={t('master_profile_protocol') || "ENCRYPTION ACTIVE"} 
                icon={Fingerprint}
                showSearch={false}
            >
                {/* 🛡️ SECURITY STATUS BADGE */}
                <Tooltip text={`Integrity Level: ${systemRisk.systemHealth}`}>
                    <div className={cn(
                        "flex items-center gap-4 px-5 py-2.5 rounded-2xl border transition-all cursor-help shadow-sm",
                        "bg-[var(--bg-card)] border-[var(--border)] hover:border-orange-500/30"
                    )}>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-[var(--text-muted)]      mb-0.5">ACCESS</span>
                            <span className={cn("text-[10px] font-black     leading-none", securityBadge.color)}>
                                {securityBadge.text}
                            </span>
                        </div>
                        <div className={cn("p-2 rounded-xl", securityBadge.bg)}>
                            <SecurityIcon size={16} className={cn(securityBadge.color, "animate-pulse")} fill="currentColor" strokeWidth={0} />
                        </div>
                    </div>
                </Tooltip>
            </HubHeader>

            <div className="mt-8 space-y-[var(--app-gap,2.5rem)]">
                
                {/* --- 2. THE IDENTITY MATRIX GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT COLUMN: Physical ID & Logs */}
                    <div className="lg:col-span-1 space-y-8">
                        <IdentityHero 
                            formData={formData} 
                            handleImageProcess={handleImageProcess} 
                            handleRemoveImage={handleRemoveImage}
                            setForm={setForm} 
                            currentUser={currentUser} 
                            fileInputRef={fileInputRef} 
                        />
                        
                        <ProtocolAuditLog />
                    </div>

                    {/* RIGHT COLUMN: Digital Sovereignty & Security */}
                    <div className="lg:col-span-2 space-y-8 md:space-y-12">
                        
                        {/* 🔐 SECURITY ENFORCEMENT */}
                        <div className="apple-card-container">
                            <SecurityForm 
                                formData={formData} 
                                setForm={setForm} 
                                updateProfile={updateProfile} 
                                currentUser={currentUser} 
                                isLoading={isLoading} 
                            />
                        </div>

                        {/* 💾 DATA SOVEREIGNTY (Hard Backups) */}
                        <DataSovereignty 
                            exportMasterData={exportMasterData} 
                            importMasterData={importMasterData} 
                            importInputRef={importInputRef} 
                            isExporting={isExporting} 
                        />

                        {/* 🚨 DANGER ZONE (Total Erasure) */}
                        <DangerZone 
                            onDeleteAccount={deleteAccount} 
                            isLoading={isLoading} 
                            userEmail={currentUser?.email} 
                        />
                    </div>
                </div>

                {/* --- 3. SYSTEM SIGNATURE --- */}
                <div className="pt-28 flex flex-col items-center">
                    <div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-10 opacity-20" />
                    
                    <div className="flex items-center gap-6 opacity-30 hover:opacity-100 transition-all duration-700 group">
                        <div className="w-14 h-14 bg-[var(--bg-card)] rounded-full border border-[var(--border)] flex items-center justify-center shadow-lg group-hover:border-orange-500/50 transition-all">
                            <Cpu size={24} className="text-orange-500 group-hover:rotate-90 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black     text-[var(--text-main)]">
                                VAULT PRO ENGINE
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                                <BadgeCheck size={12} className="text-blue-500" />
                                <span className="text-[8px] font-bold      text-[var(--text-muted)]">
                                    Identity Verified: V12.0 STABLE REL
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};