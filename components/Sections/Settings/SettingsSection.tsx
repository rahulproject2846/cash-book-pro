"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';

// Modular Components
import { SettingsHeader } from './SettingsHeader';
import { GovernanceModule } from './GovernanceModule';
import { RegionModule } from './RegionModule';
import { ExperienceModule } from './ExperienceModule';
import { SystemMaintenance } from './SystemMaintenance';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    const { T } = useTranslation();
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings(currentUser, setCurrentUser);

    const [newCat, setNewCat] = useState('');
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);

    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            // 🔥 ইনজেকশন: ডাইনামিক স্পেসিং এবং প্যাডিং
            className="max-w-7xl mx-auto space-y-[var(--app-gap,2.5rem)] pb-32 px-[var(--card-padding,1rem)] md:px-0"
        >
            <SettingsHeader isLoading={isLoading} />

            <div className="space-y-[var(--app-gap,2.5rem)]">
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

                <RegionModule 
                    currency={currency} 
                    updateCurrency={updateCurrency} 
                />

                <ExperienceModule 
                    preferences={preferences} 
                    updatePreference={updatePreference} 
                />

                <SystemMaintenance 
                    dbStats={dbStats} 
                    clearLocalCache={clearLocalCache} 
                    isCleaning={isCleaning} 
                />
            </div>

            <div className="pt-10 flex flex-col items-center opacity-20">
                <div className="h-px w-32 bg-[var(--border-color)] mb-4" />
                <span className="text-[9px] font-black uppercase tracking-[8px]">{T('system_version') || 'Vault OS v5.0.1 Stable'}</span>
            </div>
        </motion.div>
    );
};