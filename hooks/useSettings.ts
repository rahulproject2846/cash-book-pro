"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

export const useSettings = (currentUser: any, setCurrentUser: any) => {
    const { theme, setTheme } = useTheme();
    const [isCleaning, setIsCleaning] = useState(false);
    const [dbStats, setDbStats] = useState({ storageUsed: '0 KB', totalEntries: 0 });
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ১. ইউজার ডাটা থেকে সলিড স্টেট জেনারেট (Derived States)
    const preferences = currentUser?.preferences || {};
    const categories = currentUser?.categories || [];
    const currency = currentUser?.currency || 'BDT (৳)';

    // ২. DOM side-effects (এটি রিলোড দিলেও Compact/Midnight ধরে রাখবে)
    useEffect(() => {
        if (!currentUser) return;
        
        const root = document.documentElement;
        const body = document.body;
        const prefs = currentUser.preferences || {};

        // Compact Mode Apply
        prefs.compactMode ? root.classList.add('compact-deck') : root.classList.remove('compact-deck');

        // Midnight Mode Apply
        if (prefs.isMidnight) {
            root.classList.add('midnight-mode');
            if (theme !== 'dark') setTheme('dark');
        } else {
            root.classList.remove('midnight-mode');
        }

        // 🚀 Turbo Mode Apply (New Intelligence)
        if (prefs.turboMode) {
            body.classList.add('turbo-active');
        } else {
            body.classList.remove('turbo-active');
        }

        // Language apply
        if (prefs.language) {
            localStorage.setItem('vault_lang', prefs.language);
        }
    }, [currentUser, setTheme, theme]);

    // ৩. ডাটাবেজ স্ট্যাটস ক্যালকুলেশন
    const calculateStorage = useCallback(async () => {
        try {
            const count = await db.entries.count();
            const estimate = await navigator.storage?.estimate();
            const used = estimate?.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : '0.1 MB';
            setDbStats({ storageUsed: used, totalEntries: count });
        } catch (e) { console.warn("Storage check skipped"); }
    }, []);

    useEffect(() => { calculateStorage(); }, [calculateStorage]);

    // ৪. সলিড সিঙ্ক ইঞ্জিন (Debounced Sync for performance)
    const performServerSync = useCallback(async (updatedUser: any) => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        syncTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch('/api/user/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: updatedUser._id, 
                        categories: updatedUser.categories, 
                        currency: updatedUser.currency, 
                        preferences: updatedUser.preferences 
                    }),
                });
                if (!res.ok) throw new Error("Sync failed");
                console.log("📡 Settings: Cloud Registry Synchronized.");
            } catch (error) {
                console.warn("Settings Sync Pending (Network/Server)");
            }
        }, 1000); // ১ সেকেন্ড ওয়েট করবে যাতে ঘনঘন সেভ না হয়
    }, []);

    // ৫. কোর আপডেট লজিক (Optimistic Update)
    const masterUpdate = (updates: any) => {
        if (!currentUser) return;

        // নতুন ইউজার অবজেক্ট তৈরি
        const updatedUser = { 
            ...currentUser, 
            ...updates,
            // যদি প্রেফারেন্স এর ভেতর কোনো কী থাকে তবে তা মার্জ করো
            preferences: { ...currentUser.preferences, ...(updates.preferences || {}) }
        };

        // লোকাল আপডেট (Instant UI)
        setCurrentUser(updatedUser);
        localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));

        // সার্ভার সিঙ্ক
        performServerSync(updatedUser);
    };

    const updatePreference = (key: string, value: any) => {
        masterUpdate({ preferences: { [key]: value } });
    };

    const addCategory = (tag: string) => {
        const trimmed = tag.trim().toUpperCase();
        if (!trimmed || categories.includes(trimmed)) return;
        masterUpdate({ categories: [...categories, trimmed] });
    };

    const removeCategory = (tag: string) => {
        masterUpdate({ categories: categories.filter((c: string) => c !== tag) });
    };

    const updateCurrency = (val: string) => {
        masterUpdate({ currency: val });
    };

    const clearLocalCache = async () => {
        if (!confirm("DANGER: This will wipe local data and force re-sync. Proceed?")) return;
        setIsCleaning(true);
        try {
            await db.delete();
            localStorage.clear();
            window.location.reload();
        } catch (e) { setIsCleaning(false); }
    };

    return {
        categories, currency, preferences, dbStats,
        isLoading: !currentUser, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    };
};