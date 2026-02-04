"use client";
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { db } from '@/lib/offlineDB';

/**
 * VAULT ENGINE: SETTINGS CONTROLLER (STABILIZED V7)
 * ------------------------------------------------
 * Fix: Removed redundant JS styling. Relies purely on CSS classes.
 * Fix: Instant LocalStorage update before Server Sync.
 */

export const useSettings = (currentUser: any, setCurrentUser: any) => {
    const { theme, setTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    
    // লোকাল স্টেট ইনিশিয়ালাইজেশন (সেফ চেক সহ)
    const [preferences, setPreferences] = useState({
        language: 'en',
        compactMode: false,
        isMidnight: false,
        autoLock: false,
        dailyReminder: false,
        expenseLimit: 0,
        ...currentUser?.preferences // মার্জ করা হলো
    });

    const [categories, setCategories] = useState<string[]>(currentUser?.categories || []);
    const [currency, setCurrency] = useState(currentUser?.currency || 'BDT (৳)');
    const [dbStats, setDbStats] = useState({ storageUsed: '0 KB', totalEntries: 0 });

    // ১. ডাটাবেজ হেলথ চেক
    const calculateStorage = useCallback(async () => {
        if (!db.isOpen()) await db.open();
        const count = await db.entries.count();
        const estimate = await navigator.storage?.estimate();
        const used = estimate?.usage ? (estimate.usage / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown';
        setDbStats({ storageUsed: used, totalEntries: count });
    }, []);

// src/hooks/useSettings.ts এর ভেতর ওই useEffect (লাইন ৪৩)
useEffect(() => {
    if (currentUser) {
        setCategories(currentUser.categories || []);
        setCurrency(currentUser.currency || 'BDT (৳)');
        
        // 🔥 FIX: ফাংশন দিয়ে আপডেট না করে সরাসরি অবজেক্ট দিয়ে আপডেট করুন
        setPreferences({ 
            ...preferences, 
            ...currentUser.preferences 
        });
        
        calculateStorage();
    }
}, [currentUser, calculateStorage]); // <--- এখানে 'preferences' যোগ করা লাগবে না

    // ২. সার্ভার সিঙ্ক ইঞ্জিন (সাইলেন্ট মোড)
const syncSettings = async (newCats: string[], newCurr: string, newPref: any) => {
    try {
        await fetch('/api/user/settings', { // <--- আপনার API Endpoint
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: currentUser._id, 
                categories: newCats, 
                currency: newCurr, 
                preferences: newPref 
            }),
        });
        // আমরা সার্ভারের রেসপন্সের জন্য অপেক্ষা করব না UI আপডেটের ক্ষেত্রে
    } catch (error) {
        console.error("Background Sync Failed");
    }
};

    // 🔥 ৩. প্রেফারেন্স ইঞ্জিন (FIXED)
    const updatePreference = (key: string, value: any) => {
        // ক. স্টেট আপডেট
        const updatedPrefs = { ...preferences, [key]: value };
        setPreferences(updatedPrefs);

        // খ. ইনস্ট্যান্ট এফেক্ট (DOM Manipulation)
        const root = document.documentElement;

        if (key === 'isMidnight') {
            if (value) {
                root.classList.add('midnight-mode');
                setTheme('dark'); // মিডনাইট হলে ডার্ক ফোর্স করা
            } else {
                root.classList.remove('midnight-mode');
            }
        }

        if (key === 'compactMode') {
            value ? root.classList.add('compact-deck') : root.classList.remove('compact-deck');
        }

        if (key === 'language') {
            // ল্যাঙ্গুয়েজ চেঞ্জ হলে ইভেন্ট ফায়ার করা
            localStorage.setItem('vault_lang', value);
            window.dispatchEvent(new Event('language-changed'));
        }

        // গ. লোকাল স্টোরেজ আপডেট (যাতে রিলোড দিলেও থাকে)
        const updatedUser = { ...currentUser, preferences: updatedPrefs };
    localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

        // ঘ. সার্ভার সিঙ্ক (ব্যাকগ্রাউন্ডে)
        syncSettings(categories, currency, updatedPrefs);
    };

    // ৪. ক্যাটাগরি ও কারেন্সি হ্যান্ডলার
    const addCategory = (tag: string) => {
        const trimmed = tag.trim().toUpperCase();
        if (!trimmed || categories.includes(trimmed)) return;
        const newCats = [...categories, trimmed];
        setCategories(newCats);
        updateUserProfile({ categories: newCats });
    };

    const removeCategory = (tag: string) => {
        const newCats = categories.filter(c => c !== tag);
        setCategories(newCats);
        updateUserProfile({ categories: newCats });
    };

    const updateCurrency = (val: string) => {
        setCurrency(val);
        updateUserProfile({ currency: val });
    };

    // ইন্টারনাল হেল্পার (Dry Code)
    const updateUserProfile = (updates: any) => {
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        localStorage.setItem('cashbookUser', JSON.stringify(updatedUser));
        syncSettings(updates.categories || categories, updates.currency || currency, preferences);
    };

    const clearLocalCache = async () => {
        if (!confirm("Purge local cache? This will force a re-sync.")) return;
        setIsCleaning(true);
        try {
            await db.delete();
            localStorage.clear();
            window.location.reload();
        } catch (e) {
            setIsCleaning(false);
        }
    };

    return {
        categories, currency, preferences, dbStats,
        isLoading, isCleaning,
        addCategory, removeCategory, updatePreference, updateCurrency, clearLocalCache
    };
};