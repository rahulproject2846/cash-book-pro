"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';

// Modular Components
import { SettingsHeader } from './components/SettingsHeader';
import { GovernanceModule } from './components/GovernanceModule';
import { RegionModule } from './components/RegionModule'; // 🔥 নতুন মডিউল
import { ExperienceModule } from './components/ExperienceModule';
import { SystemMaintenance } from './components/SystemMaintenance';

export const SettingsSection = ({ currentUser, setCurrentUser }: any) => {
    // লজিক ইঞ্জিন হুক
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings(currentUser, setCurrentUser);

    // লোকাল স্টেট
    const [newCat, setNewCat] = useState('');
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);

    // লিমিট সেভ করার লজিক (OnBlur)
    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-10 pb-32 px-4">
            
            {/* --- HEADER & SYNC PULSE --- */}
            <SettingsHeader isLoading={isLoading} />

            <div className="space-y-10">
                
                {/* 1. GOVERNANCE (Tags & Expense Limits) */}
                <GovernanceModule 
                    categories={categories} 
                    addCategory={addCategory} 
                    removeCategory={removeCategory}
                    limitBuffer={limitBuffer}
                    setLimitBuffer={setLimitBuffer}
                    saveLimit={saveLimit}
                    newCat={newCat}
                    setNewCat={setNewCat}
                />

                {/* 2. REGION (Language & Currency) - 🔥 NEW ADDITION */}
                <RegionModule 
                    currency={currency} 
                    updateCurrency={updateCurrency} 
                />

                {/* 3. EXPERIENCE (Midnight Mode, Compact View, Security) */}
                <ExperienceModule 
                    preferences={preferences} 
                    updatePreference={updatePreference} 
                />

                {/* 4. MAINTENANCE (Storage Health & Hard Reset) */}
                <SystemMaintenance 
                    dbStats={dbStats} 
                    clearLocalCache={clearLocalCache} 
                    isCleaning={isCleaning} 
                />
            </div>

            {/* Bottom System Stamp */}
            <div className="pt-10 flex flex-col items-center opacity-20">
                <div className="h-px w-32 bg-[var(--border-color)] mb-4" />
                <span className="text-[9px] font-black uppercase tracking-[8px]">Vault OS v5.0.1 Stable</span>
            </div>
        </motion.div>
    );
};