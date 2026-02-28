"use client";
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { db } from '@/lib/offlineDB';
import { useVaultStore } from '@/lib/vault/store/index';

/**
 * 🛡️ VAULT PRO: MASTER SETTINGS ENGINE (V26.0 - STABLE REL)
 * ---------------------------------------------------
 * Logic: Simple Atomic Handshake (Zustand -> Dexie).
 * Performance: Direct Store Selection for Zero-Lag UI.
 */
export const useSettings = () => {
    const { theme, setTheme } = useTheme();
    const [isCleaning, setIsCleaning] = useState(false);
    const [dbStats, setDbStats] = useState({ storageUsed: '0.1 MB', totalEntries: 0 });

    // 🚀 SELECTORS: Directly from Store for instantaneous reactivity
    const preferences = useVaultStore(state => state.preferences);
    const categories = useVaultStore(state => state.categories);
    const currency = useVaultStore(state => state.currency);
    const currentUser = useVaultStore(state => state.currentUser);
    const setPreferences = useVaultStore(state => state.setPreferences);
    const setCategories = useVaultStore(state => state.setCategories);
    const setCurrency = useVaultStore(state => state.setCurrency);

    // 🤝 HANDSHAKE: Notify SyncOrchestrator of local mutations
    const dispatchHandshake = useCallback(() => {
        const store = useVaultStore.getState();
        
        // 🔄 LOOP PREVENTION: Don't dispatch if this is a remote mutation
        if (store.isRemoteMutation) {
            console.log('🔄 [SETTINGS] Skipping vault-updated dispatch - remote mutation detected');
            return;
        }
        
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vault-updated', { 
                detail: { source: 'useSettings', origin: 'local-mutation' } 
            }));
        }
    }, []);

    // 🎨 DOM SYNC: Apply visual protocols directly
    useEffect(() => {
        if (!currentUser || !preferences) return;
        
        const root = document.documentElement;
        const body = document.body;

        // 1. Turbo & Midnight Classes
        body.classList.toggle('turbo-active', !!preferences.turboMode);
        root.classList.toggle('midnight-mode', !!preferences.isMidnight);
        root.classList.toggle('compact-deck', !!preferences.compactMode);

        // 2. Theme Enforcement
        if (preferences.isMidnight && theme !== 'dark') {
            setTheme('dark');
        }
    }, [preferences?.turboMode, preferences?.isMidnight, preferences?.compactMode, preferences?.autoLock, preferences?.dailyReminder, preferences?.showTooltips, theme, setTheme]);

    // 📊 SYSTEM AUDIT: Physical Storage Calculation
    const calculateStorage = useCallback(async () => {
        try {
            const count = await db.entries.count();
            const estimate = await navigator.storage?.estimate();
            const used = estimate?.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : '0.1 MB';
            setDbStats({ storageUsed: used, totalEntries: count });
        } catch (e) { /* Silent fail for storage estimate */ }
    }, []);

    useEffect(() => { calculateStorage(); }, [calculateStorage]);

    /**
     * 🚀 ATOMIC MUTATION ENGINE
     * Sequence: Zustand State (UI) -> Dexie Persistence (DB).
     */
    const atomicUpdate = async (patch: { preferences?: any, categories?: string[], currency?: string }) => {
        if (!currentUser?._id) return;

        // 1. Calculate Merged State
        const updatedPrefs = { ...preferences, ...(patch.preferences || {}) };
        const updatedCats = patch.categories || categories;
        const updatedCurr = patch.currency || currency;

        // 2. UI REACTION: Immediate Zustand Update
        if (patch.preferences) setPreferences(updatedPrefs);
        if (patch.categories) setCategories(updatedCats);
        if (patch.currency) setCurrency(updatedCurr);

        // 3. PERSISTENCE: Save to IndexedDB
        try {
            await db.users.update(currentUser._id, {
                preferences: updatedPrefs,
                categories: updatedCats,
                currency: updatedCurr
            });
            // 4. SYNC TRIGGER: Notify server via handshake
            dispatchHandshake();
        } catch (error) {
            console.error('❌ [SETTINGS] DB Update Failed:', error);
        }
    };

    // 🛠️ PUBLIC INTERFACE
    const updatePreference = (key: string, value: any) => {
        setPreferences({ [key]: value }); // Instant Zustand update
        // No database. No handshake. Pure local UI.
    };

    const addCategory = async (tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        await atomicUpdate({ categories: [...categories, trimmed] });
    };

    const removeCategory = async (tag: string) => {
        await atomicUpdate({ categories: categories.filter((c: string) => c !== tag) });
    };

    const updateCurrency = async (val: string) => {
        await atomicUpdate({ currency: val });
    };

    const clearLocalCache = async () => {
        if (!confirm("🚨 DANGER: Full System Wipe! All local data will be deleted. Proceed?")) return;
        setIsCleaning(true);
        try {
            const { logout } = useVaultStore.getState();
            logout();
            await db.delete();
            window.location.href = '/';
        } catch (e) { 
            setIsCleaning(false);
            console.error('Nuclear reset failed:', e);
        }
    };

    return {
        categories, currency, preferences, dbStats,
        isLoading: !currentUser, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    };
};