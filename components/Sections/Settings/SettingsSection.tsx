"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Save, Cpu, ShieldCheck } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers';

// Modular Components
import { HubHeader } from '@/components/Layout/HubHeader';
import { GovernanceModule } from './GovernanceModule';
import { RegionModule } from './RegionModule';
import { ExperienceModule } from './ExperienceModule';
import { SystemMaintenance } from './SystemMaintenance';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    const { t, language } = useTranslation();
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings(currentUser, setCurrentUser);

    const [newCat, setNewCat] = useState('');
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);

    // preferences আপডেট হলে লিমিট বাফার সিঙ্ক করা
    useEffect(() => {
        if (preferences?.expenseLimit) setLimitBuffer(preferences.expenseLimit);
    }, [preferences?.expenseLimit]);

    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "w-full max-w-[1400px] mx-auto transition-all duration-500",
                "pb-40 px-1 md:px-0"
            )}
        >
            {/* --- 1. SYSTEM IDENTITY HEADER (Enterprise Standard) --- */}
            <HubHeader 
                title={t('nav_system') || "CONFIGURATION"} 
                subtitle={t('governance_active') || "SYSTEM REGISTRY SECURED"} 
                icon={Settings2}
                showSearch={false}
            >
                {/* Status Indicator inside Header */}
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-inner">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-[var(--text-main)] uppercase tracking-[2px]">
                        {t('node_online') || "CORE ACTIVE"}
                    </span>
                </div>
            </HubHeader>

            <div className={cn("space-y-[var(--app-gap,2.5rem)] mt-6")}>
                
                {/* --- 2. CORE GOVERNANCE (Registry & Limits) --- */}
                <GovernanceModule 
                    categories={categories} 
                    addCategory={addCategory} 
                    removeCategory={removeCategory}
                    limitBuffer={limitBuffer}
                    setLimitBuffer={setLimitBuffer}
                    saveLimit={saveLimit}
                    newCat={newCat}
                    setNewCat={setNewCat}
                    currency={currency}
                    updateCurrency={updateCurrency}
                />

                {/* --- 3. INTERFACE & REGIONAL GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--app-gap,2.5rem)]">
                    <RegionModule 
                        currency={currency} 
                        updateCurrency={updateCurrency} 
                    />

                    <ExperienceModule 
                        preferences={preferences} 
                        updatePreference={updatePreference} 
                    />
                </div>

                {/* --- 4. SYSTEM MAINTENANCE (Disk & Cache) --- */}
                <SystemMaintenance 
                    dbStats={dbStats} 
                    clearLocalCache={clearLocalCache} 
                    isCleaning={isCleaning} 
                />
            </div>

            {/* --- 5. OS BUILD FOOTER --- */}
            <div className="pt-20 flex flex-col items-center">
                <div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-8 opacity-30" />
                
                <div className="flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-all duration-1000 group">
                    <div className="flex items-center gap-4">
                        <Cpu size={14} className="text-orange-500 group-hover:rotate-180 transition-transform duration-1000" />
                        <span className="text-[10px] font-black uppercase tracking-[8px] text-[var(--text-main)]">
                            VAULT PRO SYSTEM
                        </span>
                        <ShieldCheck size={14} className="text-blue-500" />
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-[4px] text-[var(--text-muted)]">
                        {t('system_version') || 'BUILD V11.0 STABLE REL'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};