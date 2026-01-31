"use client";
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

/**
 * VAULT ENGINE: SETTINGS CONTROLLER (V5)
 * --------------------------------------
 * Responsibilities:
 * 1. Financial Guardrails (Budget limits, Categories)
 * 2. Vault Health (Storage size, Entry counts, Cache cleaning)
 * 3. User Preferences Sync
 */

export const useSettings = (currentUser: any, setCurrentUser: any) => {
    // --- States ---
    const [isLoading, setIsLoading] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    
    // System Stats
    const [dbStats, setDbStats] = useState({
        totalEntries: 0,
        storageUsed: "0 KB",
        lastSync: new Date().toLocaleTimeString(),
        categoryUsage: {} as Record<string, number>
    });

    // User Preferences (Derived from Current User)
    const [preferences, setPreferences] = useState(currentUser?.preferences || {
        dailyReminder: false,
        weeklyReports: false,
        highExpenseAlert: false,
        expenseLimit: 0 // New Feature: Expense Threshold
    });

    const [categories, setCategories] = useState<string[]>(currentUser?.categories || []);
    const [currency, setCurrency] = useState(currentUser?.currency || 'BDT (৳)');

    // --- 1. VAULT HEALTH DIAGNOSTICS ---
    const calculateSystemStats = useCallback(async () => {
        if (!db.isOpen()) await db.open();
        
        const entries = await db.entries.toArray();
        
        // A. Storage Estimation (Rough Approximation)
        const size = new Blob([JSON.stringify(entries)]).size;
        const sizeString = size > 1024 * 1024 
            ? `${(size / (1024 * 1024)).toFixed(2)} MB` 
            : `${(size / 1024).toFixed(2)} KB`;

        // B. Category Usage Analysis
        const usage: Record<string, number> = {};
        entries.forEach(e => {
            const cat = e.category || 'GENERAL';
            usage[cat] = (usage[cat] || 0) + 1;
        });

        setDbStats({
            totalEntries: entries.length,
            storageUsed: sizeString,
            lastSync: new Date().toLocaleTimeString(),
            categoryUsage: usage
        });
    }, []);

    useEffect(() => {
        if (currentUser) calculateSystemStats();
    }, [currentUser, calculateSystemStats]);

    // --- 2. CLOUD SYNC PROTOCOL ---
    const syncSettings = async (newCats: string[], newCurr: string, newPref: any) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUser._id, 
                    categories: newCats, 
                    currency: newCurr, 
                    preferences: newPref 
                }),
            });
            
            const data = await res.json();
            if (res.ok) {
                setCurrentUser(data.user);
                localStorage.setItem('cashbookUser', JSON.stringify(data.user));
                toast.success("System Configuration Updated");
            } else {
                throw new Error("API Error");
            }
        } catch (error) {
            toast.error("Sync Protocol Failed");
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. ACTIONS ---
    
    // Category Management
    const addCategory = (tag: string) => {
        const trimmed = tag.trim().toUpperCase();
        if (!trimmed || categories.includes(trimmed)) return;
        const newList = [...categories, trimmed];
        setCategories(newList);
        syncSettings(newList, currency, preferences);
    };

    const removeCategory = (tag: string) => {
        const newList = categories.filter(c => c !== tag);
        setCategories(newList);
        syncSettings(newList, currency, preferences);
    };

    // Preference Toggles
    const updatePreference = (key: string, value: any) => {
        const newPref = { ...preferences, [key]: value };
        setPreferences(newPref);
        syncSettings(categories, currency, newPref);
    };

    // Currency Switch
    const updateCurrency = (val: string) => {
        setCurrency(val);
        syncSettings(categories, val, preferences);
    };

    // 🔥 DANGER ZONE: Cache Cleaning
    const clearLocalCache = async () => {
        if(!confirm("Are you sure? This will wipe local data and force a re-sync from cloud.")) return;
        
        setIsCleaning(true);
        try {
            await Promise.all([db.books.clear(), db.entries.clear()]);
            toast.success("Local Cache Purged");
            window.location.reload(); // Force app to reload and hydrate
        } catch (err) {
            toast.error("Purge Failed");
        } finally {
            setIsCleaning(false);
        }
    };

    return {
        // Data
        categories,
        currency,
        preferences,
        dbStats,
        
        // States
        isLoading,
        isCleaning,

        // Actions
        addCategory,
        removeCategory,
        updatePreference,
        updateCurrency,
        clearLocalCache,
        refreshStats: calculateSystemStats
    };
};