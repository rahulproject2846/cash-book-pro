"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';
import { db } from '@/lib/offlineDB'; // 🔥 ডাটাবেজে সেভ করার জন্য ইমপোর্ট করা হলো

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children, currentUser }: { children: React.ReactNode, currentUser: any }) => {
    // ১. লোকাল স্টেট
    const [language, setLanguageState] = useState<Language>('en');

    // ২. সিস্টেম লোড হওয়ার সময় ল্যাঙ্গুয়েজ ডিটেক্ট করার প্রোটোকল
// ১. সিস্টেম লোড হওয়ার সময় ল্যাঙ্গুয়েজ ডিটেক্ট করা (FIXED)
    useEffect(() => {
        // ক. সবথেকে লেটেস্ট সোর্স (Local Storage) আগে চেক করা
        const localLang = localStorage.getItem('vault_lang');
        // খ. সার্ভারের ডাটা (User Profile)
        const userLang = currentUser?.preferences?.language;

        if (localLang) {
            // যদি লোকালে সেট করা থাকে, সেটিই চূড়ান্ত (Priority 1)
            setLanguageState(localLang as Language);
        } else if (userLang) {
            // যদি লোকালে না থাকে (নতুন ডিভাইস), তবে সার্ভারের ডাটা নাও (Priority 2)
            setLanguageState(userLang as Language);
        } else {
            // ডিফল্ট ব্রাউজার চেক (Priority 3)
            const browserLang = navigator.language.startsWith('bn') ? 'bn' : 'en';
            setLanguageState(browserLang);
        }
    }, [currentUser]);

    /**
     * 🔥 UPGRADE: setLanguage ফাংশন এখন পারমানেন্টলি ডাটা সেভ করবে।
     * এটি লোকাল স্টেট, লোকাল স্টোরেজ এবং IndexDB তিন জায়গাতেই আপডেট পাঠাবে।
     */
    const setLanguage = async (lang: Language) => {
        // ক. ইউআই দ্রুত আপডেট করার জন্য স্টেট চেঞ্জ
        setLanguageState(lang);
        
        // খ. দ্রুত সিঙ্কের জন্য লোকাল স্টোরেজে সেভ
        localStorage.setItem('vault_lang', lang);

        // গ. ডাটাবেজে পারমানেন্টলি সেভ করা (Surgical Add)
        if (currentUser?._id) {
            try {
                // Dexie এর মাধ্যমে ইউজারের প্রেফারেন্স টেবিল আপডেট
                await db.users.update(currentUser._id, {
                    'preferences.language': lang
                });
                console.log("Protocol Language Sync: [SUCCESS]");
            } catch (err) {
                console.warn("DB Sync Interrupted: Persistence fallback to LocalStorage");
            }
        }

        // ঘ. গ্লোবাল ইভেন্ট ফায়ার করা যাতে অন্য কম্পোনেন্ট রি-রেন্ডার হয়
        window.dispatchEvent(new Event('language-changed'));
    };

    // ট্রান্সলেশন ফাংশন
    const t = (key: string): string => {
        const langData = translations[language] as any;
        // যদি কি খুঁজে না পায়, তবে অরিজিনাল কি-টাই রিটার্ন করবে (Error Proof)
        return langData?.[key] || key; 
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

// কাস্টম হুক - এটি শুধু ইন্টারনাল ব্যবহারের জন্য
export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) throw new Error("useTranslation must be used within TranslationProvider");
    return context;
};