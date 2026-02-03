"use client";
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes'; // থিম সিঙ্ক করার জন্য
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

/**
 * VAULT ENGINE: SETTINGS CONTROLLER (V6 - MASTER SYNC)
 * --------------------------------------------------
 * থিম কনফ্লিক্ট ফিক্স এবং হার্ড-সিঙ্ক লজিক যুক্ত করা হয়েছে।
 */

export const useSettings = (currentUser: any, setCurrentUser: any) => {
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    
    const [dbStats, setDbStats] = useState({
        totalEntries: 0,
        storageUsed: "0 KB",
        lastSync: new Date().toLocaleTimeString(),
        categoryUsage: {} as Record<string, number>
    });

    // Preferences Logic
    const [preferences, setPreferences] = useState(currentUser?.preferences || {
        dailyReminder: false,
        highExpenseAlert: false,
        expenseLimit: 0,
        isMidnight: false // নতুন মিডনাইট মোড স্টেট
    });

    const [categories, setCategories] = useState<string[]>(currentUser?.categories || []);
    const [currency, setCurrency] = useState(currentUser?.currency || 'BDT (৳)');

    // --- ১. থিম প্রোটোকল লজিক (Midnight Mode Fix) ---
    
    // সিএসএস ভেরিয়েবল অ্যাপ্লাই করা
    const applyMidnightCSS = (active: boolean) => {
        const root = document.documentElement;
        if (active) {
            root.style.setProperty('--bg-app', '#000000');
            root.style.setProperty('--bg-card', '#080808');
            root.style.setProperty('--border', '#1A1A1A');
            root.style.setProperty('--border-color', '#1A1A1A');
        } else {
            root.style.removeProperty('--bg-app');
            root.style.removeProperty('--bg-card');
            root.style.removeProperty('--border');
            root.style.removeProperty('--border-color');
        }
    };

    // থিম কনফ্লিক্ট হ্যান্ডলার
    useEffect(() => {
        if (preferences.isMidnight) {
            if (theme !== 'dark') setTheme('dark'); // মিডনাইট থাকলে ডার্ক মোড বাধ্যতামুলক
            applyMidnightCSS(true);
        } else {
            applyMidnightCSS(false);
        }
    }, [preferences.isMidnight, theme, setTheme]);

    // লাইট মোড সিলেক্ট করলে মিডনাইট অটো অফ করা
    useEffect(() => {
        if (theme === 'light' && preferences.isMidnight) {
            updatePreference('isMidnight', false);
        }
    }, [theme]);

    // --- ২. ডাটাবেস ম্যাট্রিক্স (Vault Health) ---
    const calculateSystemStats = useCallback(async () => {
        if (!db.isOpen()) await db.open();
        const entries = await db.entries.toArray();
        const size = new Blob([JSON.stringify(entries)]).size;
        const sizeString = size > 1024 * 1024 
            ? `${(size / (1024 * 1024)).toFixed(2)} MB` 
            : `${(size / 1024).toFixed(2)} KB`;

        setDbStats({
            totalEntries: entries.length,
            storageUsed: sizeString,
            lastSync: new Date().toLocaleTimeString(),
            categoryUsage: {}
        });
    }, []);

    useEffect(() => {
        if (currentUser) calculateSystemStats();
    }, [currentUser, calculateSystemStats]);

    // --- ৩. ক্লাউড হার্ড-সিঙ্ক ইঞ্জিন ---
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
                
                // গ্লোবাল ইভেন্ট ফায়ার করা যাতে অন্য পেজ আপডেট হয়
                window.dispatchEvent(new Event('vault-updated'));
                window.dispatchEvent(new Event('vault-settings-updated'));
            }
        } catch (error) {
            toast.error("Cloud Sync Interrupted");
        } finally {
            setIsLoading(false);
        }
    };

    // --- ৪. অ্যাকশন হ্যান্ডলার্স ---
    
    const addCategory = (tag: string) => {
        const trimmed = tag.trim().toUpperCase();
        if (!trimmed || categories.includes(trimmed)) return;
        const newList = [...categories, trimmed];
        setCategories(newList);
        syncSettings(newList, currency, preferences);
        toast.success(`Tag ${trimmed} Activated`);
    };

    const removeCategory = (tag: string) => {
        const newList = categories.filter(c => c !== tag);
        setCategories(newList);
        syncSettings(newList, currency, preferences);
    };

    // ... আগের কোড ...

    // Preference Toggles (Instant Update)
    const updatePreference = (key: string, value: any) => {
        // ১. সাথে সাথে লোকাল স্টেট আপডেট
        const newPref = { ...preferences, [key]: value };
        setPreferences(newPref);

        // ২. সাথে সাথে লোকাল স্টোরেজ এবং ইউজার অবজেক্ট আপডেট (যাতে রিলোডে ঠিক থাকে)
        const updatedUser = { ...currentUser, preferences: newPref };
        setCurrentUser(updatedUser);
        localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));

        // ৩. স্পেশাল হ্যান্ডলিং: Midnight Mode
        if (key === 'isMidnight') {
            if (value === true) {
                document.documentElement.classList.add('midnight-mode');
                // Midnight অন করলে ডার্ক মোড ফোর্স করা
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('midnight-mode');
            }
        }

        // ৪. স্পেশাল হ্যান্ডলিং: Compact Mode
        if (key === 'compactMode') {
             if (value === true) document.documentElement.classList.add('compact-deck');
             else document.documentElement.classList.remove('compact-deck');
        }

        // ৫. সবার শেষে সার্ভারে ডাটা পাঠানো (সাইলেন্টলি)
        syncSettings(categories, currency, newPref);
    };

    // ... বাকি কোড ...

    const updateCurrency = (val: string) => {
        setCurrency(val);
        syncSettings(categories, val, preferences);
        toast.success(`Master Currency: ${val}`);
    };

    const clearLocalCache = async () => {
        if(!confirm("Terminate local nodes? System will re-sync from cloud.")) return;
        setIsCleaning(true);
        try {
            await Promise.all([db.books.clear(), db.entries.clear()]);
            localStorage.removeItem('cashbookUser');
            toast.success("Protocol Purged Successfully");
            window.location.reload();
        } catch (err) {
            toast.error("Purge Failed");
        } finally {
            setIsCleaning(false);
        }
    };

    return {
        categories,
        currency,
        preferences,
        dbStats,
        isLoading,
        isCleaning,
        addCategory,
        removeCategory,
        updatePreference,
        updateCurrency,
        clearLocalCache,
        refreshStats: calculateSystemStats
    };
};