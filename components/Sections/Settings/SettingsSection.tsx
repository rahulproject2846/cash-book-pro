"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Cpu, ShieldCheck, Wifi } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { useVaultStore } from '@/lib/vault/store/index';

// 🏆 Modular Components (Holly Grill Standards)
import { HubHeader } from '@/components/Layout/HubHeader';
import { InterfaceEngine } from './InterfaceEngine';
import { SystemRegistry } from './SystemRegistry';
import { SystemMaintenance } from './SystemMaintenance';

/**
 * 🏆 SETTINGS SECTION V18.0 (HOLLY GRILL PRODUCTION READY)
 * ---------------------------------------------------------
 * Layout Architecture:
 * - Row 1: Interface Engine (Full Width Command Center)
 * - Row 2: System Registry (Governance + Localization Grid)
 * - Row 3: System Maintenance (Hardware & Security Hub)
 */
export const SettingsSection = () => {
    const { t } = useTranslation();
    const {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    } = useSettings();

    const { lastSyncedAt } = useVaultStore();

    // Local Buffer State for Limit Security
    const [newCat, setNewCat] = useState('');
    const [limitBuffer, setLimitBuffer] = useState(preferences?.expenseLimit || 0);
    const [lastSynced, setLastSynced] = useState<string>('');

    // --- 🛰️ SYNC HEARTBEAT MONITOR ---
    useEffect(() => {
        if (lastSyncedAt && lastSyncedAt !== undefined) {
            const time = new Date(lastSyncedAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
            setLastSynced(time);
        }
    }, [lastSyncedAt]);

    // Update buffer when preference changes
    useEffect(() => {
        if (preferences?.expenseLimit !== undefined) {
            setLimitBuffer(preferences.expenseLimit);
        }
    }, [preferences?.expenseLimit]);

    const saveLimit = () => {
        if (limitBuffer !== preferences.expenseLimit) {
            updatePreference('expenseLimit', Number(limitBuffer));
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className={cn(
                "w-full max-w-[1400px] mx-auto transition-all duration-500",
                "pb-40 px-2 md:px-0"
            )}
        >
            {/* --- 🛡️ 1. GLOBAL SYSTEM HEADER --- */}
            <HubHeader 
                title={t('nav_system') || "CONFIGURATION"} 
                subtitle={t('governance_active') || "SYSTEM REGISTRY SECURED"} 
                icon={Settings2}
                showSearch={false}
            >
                {/* Real-time Node Status */}
                <div className="flex items-center gap-3 px-5 py-2.5 apple-card rounded-2xl shadow-inner border border-[var(--border)]">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">
                        {t('node_online') || "CORE ACTIVE"}
                    </span>
                </div>
                
                {/* Sync Identity Tracker */}
                <div className="flex items-center gap-3 px-5 py-2.5 apple-glass rounded-2xl border border-[var(--border)]">
                    <Wifi size={14} className="text-[var(--accent)]" />
                    <span className="text-[10px] font-black text-[var(--text-main)] opacity-70">
                        LAST SYNCED: {lastSynced || 'NEVER'}
                    </span>
                </div>
            </HubHeader>

            <div className={cn("space-y-[var(--app-gap,2.5rem)] mt-10")}>
                
                {/* --- 🚀 ROW 1: INTERFACE COMMAND CENTER (Full Width) --- */}
                <InterfaceEngine 
                    preferences={preferences} 
                    updatePreference={updatePreference} 
                />

                {/* --- 📦 ROW 2: CORE REGISTRY (Governance & Localization) --- */}
                <SystemRegistry 
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

                {/* --- 🛠️ ROW 3: MAINTENANCE & SECURITY HUB --- */}
                <SystemMaintenance 
                    dbStats={dbStats} 
                    clearLocalCache={clearLocalCache} 
                    isCleaning={isCleaning} 
                />
            </div>

            {/* --- 📜 SYSTEM BUILD FOOTER --- */}
            <div className="pt-24 pb-10 flex flex-col items-center">
                <div className="h-px w-48 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-10 opacity-30" />
                
                <div className="flex flex-col items-center gap-4 opacity-30 hover:opacity-100 transition-all duration-1000 group cursor-default">
                    <div className="flex items-center gap-5">
                        <Cpu size={16} className="text-[var(--accent)] group-hover:rotate-180 transition-transform duration-1000" />
                        <span className="text-[11px] font-black text-[var(--text-main)] tracking-[0.2em] uppercase">
                            VAULT PRO SYSTEM RUNTIME
                        </span>
                        <ShieldCheck size={16} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                        <span className="text-[9px] font-black text-[var(--text-muted)] tracking-widest">
                            {t('system_version') || 'BUILD V18.0 STABLE REL'}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};