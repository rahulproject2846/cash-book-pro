"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/lib/translations';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children, currentUser }: { children: React.ReactNode, currentUser: any }) => {
    // ইউজারের প্রেফারেন্স বা ব্রাউজার ল্যাঙ্গুয়েজ থেকে ডিটেক্ট করা
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // ১. আগে চেক করো ইউজারের সেভ করা সেটিংস আছে কি না
        const savedLang = currentUser?.preferences?.language || localStorage.getItem('vault_lang');
        if (savedLang) {
            setLanguageState(savedLang as Language);
        } else {
            // ২. না থাকলে ব্রাউজারের ভাষা চেক করো (বাংলা হলে অটো বাংলা হবে)
            const browserLang = navigator.language.startsWith('bn') ? 'bn' : 'en';
            setLanguageState(browserLang);
        }
    }, [currentUser]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('vault_lang', lang);
        // গ্লোবাল ইভেন্ট যাতে অন্য কম্পোনেন্ট দ্রুত আপডেট হয়
        window.dispatchEvent(new Event('language-changed'));
    };

    // ট্রান্সলেশন ফাংশন
    const t = (key: string): string => {
        const langData = translations[language] as any;
        return langData[key] || key; // কি খুঁজে না পেলে কি-টাই রিটার্ন করবে
    };

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