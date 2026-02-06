"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';

// Modular Components (Refined v5.2)
import { SettingsHeader } from './SettingsHeader';
import { GovernanceModule } from './GovernanceModule';
import { RegionModule } from './RegionModule';
import { ExperienceModule } from './ExperienceModule';
import { SystemMaintenance } from './SystemMaintenance';

/**
 * VAULT PRO: MASTER SETTINGS SECTION (V5.2)
 * ----------------------------------------
 * The core orchestrator for system configurations.
 * Features: Dynamic Spacing, Leaf Transitions, and Master Logic Integrity.
 */
export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    const { T, language } = useTranslation();
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings(currentUser, setCurrentUser);

    const [newCat, setNewCat] = useState('');
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);

    // --- 🧬 LOGIC PRESERVED ---
    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-[1400px] mx-auto transition-all duration-500"
        >
            <div className="px-4 md:px-8 space-y-[var(--app-gap,2.5rem)] pb-40">
                
                {/* --- 1. SYSTEM IDENTITY HEADER --- */}
                <SettingsHeader isLoading={isLoading} />

                <div className="space-y-[var(--app-gap,2.5rem)]">
                    
                    {/* --- 2. CORE GOVERNANCE (Registry, Limits, Base Currency) --- */}
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
                <div className="pt-16 flex flex-col items-center">
                    <div className="h-px w-40 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-6 opacity-50" />
                    
                    <div className="flex flex-col items-center gap-2 opacity-30 hover:opacity-100 transition-opacity duration-700 cursor-default">
                        <span className="text-[10px] font-black uppercase tracking-[10px] text-[var(--text-main)] ml-[10px]">
                            {T('vault_pro_split_1')} {T('vault_pro_split_2')}
                        </span>
                        <div className="flex items-center gap-3">
                             <div className="h-[1px] w-4 bg-orange-500" />
                             <span className="text-[8px] font-bold uppercase tracking-[4px] text-[var(--text-muted)]">
                                {T('system_version') || 'BUILD V5.2.0 STABLE'}
                             </span>
                             <div className="h-[1px] w-4 bg-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Spacing Injection for Settings Specific items */}
            <style jsx global>{`
                .settings-card-glow {
                    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
                }
                .midnight-mode .settings-card-glow {
                    box-shadow: none;
                }
            `}</style>
        </motion.div>
    );
};