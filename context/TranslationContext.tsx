"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language } from '@/lib/translations';
import { db } from '@/lib/offlineDB';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string; // 🎯 Changed to lowercase t for consistency
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children, currentUser }: { children: React.ReactNode, currentUser: any }) => {
    const [language, setLanguageState] = useState<Language>('en');

    // ১. ল্যাঙ্গুয়েজ ডিটেকশন প্রোটোকল
    useEffect(() => {
        const localLang = localStorage.getItem('vault_lang');
        const userLang = currentUser?.preferences?.language;

        if (localLang) {
            setLanguageState(localLang as Language);
        } else if (userLang) {
            setLanguageState(userLang as Language);
        } else {
            const browserLang = navigator.language.startsWith('bn') ? 'bn' : 'en';
            setLanguageState(browserLang as Language);
        }
    }, [currentUser]);

    // ২. ল্যাঙ্গুয়েজ সেট করার ফাংশন (Surgical Update)
    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('vault_lang', lang);

        if (currentUser?._id) {
            try {
                // 🛡️ SAFE UPDATE: Fetch existing user to preserve other preferences
                const existingUser = await db.users.get(currentUser._id);
                if (existingUser) {
                    await db.users.update(currentUser._id, {
                        preferences: {
                            ...existingUser.preferences,
                            language: lang
                        }
                    });
                }
                console.log("Protocol Language Sync: [SUCCESS]");
            } catch (err) {
                console.warn("DB Sync Interrupted: Fallback active");
            }
        }
        window.dispatchEvent(new Event('language-changed'));
    };

    // ৩. ট্রান্সলেশন ফাংশন (Memoized for performance)
    const t = useCallback((key: string): string => {
        const langData = translations[language] as any;
        return langData?.[key] || key; 
    }, [language]); // language চেঞ্জ হলেই শুধু এটি আপডেট হবে

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) throw new Error("useTranslation must be used within TranslationProvider");
    return context;
};