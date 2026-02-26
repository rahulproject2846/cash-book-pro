"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { db } from '@/lib/offlineDB';
import { useVaultStore } from '@/lib/vault/store/index';
import { identityManager } from '@/lib/vault/core/IdentityManager';

/**
 * 🛡️ VAULT PRO: MASTER SETTINGS ENGINE (V26.0)
 * ---------------------------------------------------
 * Architecture: Atomic Store-Driven Updates.
 * Handshake: Dispatches 'local-mutation' for SyncOrchestrator.
 * Performance: Zero-Flicker DOM Injection.
 */

export const useSettings = () => {
    const { theme, setTheme } = useTheme();
    const [isCleaning, setIsCleaning] = useState(false);
    const [dbStats, setDbStats] = useState({ storageUsed: '0 KB', totalEntries: 0 });

    // 🚀 STORE INTEGRATION: Single Source of Truth
    const { 
        currentUser, 
        setPreferences, 
        setCategories, 
        setCurrency 
    } = useVaultStore();

    // 🎯 DERIVED STATES: Memoized for Performance
    const preferences = useMemo(() => currentUser?.preferences || {}, [currentUser]);
    const categories = useMemo(() => currentUser?.categories || [], [currentUser]);
    const currency = useMemo(() => currentUser?.currency || 'BDT (৳)', [currentUser]);

    // 🤝 THE ATOMIC HANDSHAKE: Notify Sync Engine
    const dispatchHandshake = useCallback(() => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vault-updated', { 
                detail: { source: 'useSettings', origin: 'local-mutation' } 
            }));
        }
    }, []);

    // 🎨 DOM SIDE-EFFECTS: Real-time Theme & Turbo Sync
    useEffect(() => {
        if (!currentUser) return;
        
        const root = document.documentElement;
        const body = document.body;
        const prefs = currentUser.preferences || {};

        // 1. Compact Mode
        prefs.compactMode ? root.classList.add('compact-deck') : root.classList.remove('compact-deck');

        // 2. Midnight OLED Logic
        if (prefs.isMidnight) {
            root.classList.add('midnight-mode');
            if (theme !== 'dark') setTheme('dark');
        } else {
            root.classList.remove('midnight-mode');
        }

        // 3. Turbo Mode (Class matches your Global CSS)
        prefs.turboMode ? body.classList.add('turbo-active') : body.classList.remove('turbo-active');

        // 4. Persistence Guard
        if (prefs.language) localStorage.setItem('vault_lang', prefs.language);
        
    }, [currentUser, setTheme, theme]);

    // 📊 DATABASE STORAGE AUDIT
    const calculateStorage = useCallback(async () => {
        try {
            const count = await db.entries.count();
            const estimate = await navigator.storage?.estimate();
            const used = estimate?.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : '0.1 MB';
            setDbStats({ storageUsed: used, totalEntries: count });
        } catch (e) { console.warn("Storage check skipped"); }
    }, []);

    useEffect(() => { calculateStorage(); }, [calculateStorage]);

    /**
     * 🚀 ATOMIC UPDATE CORE
     * এটি সরাসরি স্টোর এবং আইডেন্টিটি ম্যানেজার আপডেট করে এবং সিঙ্ক ট্রিগার করে।
     */
    const atomicUpdate = async (patch: { preferences?: any, categories?: string[], currency?: string }) => {
        if (!currentUser) return;

        // 1. Prepare New User State
        const updatedUser = {
            ...currentUser,
            preferences: { ...currentUser.preferences, ...(patch.preferences || {}) },
            categories: patch.categories || currentUser.categories,
            currency: patch.currency || currentUser.currency
        };

        // 2. Commit to Zustand Store (UI Reaction)
        if (patch.preferences) setPreferences(updatedUser.preferences);
        if (patch.categories) setCategories(updatedUser.categories);
        if (patch.currency) setCurrency(updatedUser.currency);

        // 3. Sync IdentityManager (Local Persistence & Multi-tab Sync)
        identityManager.setIdentity(updatedUser);

        // 4. Trigger Sync Handshake (Background Server Sync)
        dispatchHandshake();
    };

    // 🛠️ EXPOSED ACTIONS
    const updatePreference = (key: string, value: any) => {
        atomicUpdate({ preferences: { [key]: value } });
    };

    const addCategory = (tag: string) => {
        const trimmed = tag.trim();
        if (!trimmed || categories.includes(trimmed)) return;
        atomicUpdate({ categories: [...categories, trimmed] });
    };

    const removeCategory = (tag: string) => {
        atomicUpdate({ categories: categories.filter((c: string) => c !== tag) });
    };

    const updateCurrency = (val: string) => {
        atomicUpdate({ currency: val });
    };

    const clearLocalCache = async () => {
        if (!confirm("🚨 DANGER: Full System Wipe! All local data will be deleted. Proceed?")) return;
        setIsCleaning(true);
        try {
            // 🛑 1. Clear In-memory State
            const { logout } = useVaultStore.getState();
            logout();
            
            // 🧹 2. Atomic Database Destruction
            const { db } = await import('@/lib/offlineDB');
            await db.delete();
            
            // 🔄 3. Nuclear Restart
            window.location.href = '/';
        } catch (e) { 
            setIsCleaning(false);
            console.error('Hard reset failed:', e);
        }
    };

    return {
        categories, currency, preferences, dbStats,
        isLoading: !currentUser, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    };
};