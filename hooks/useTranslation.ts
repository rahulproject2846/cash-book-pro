"use client";
import { useTranslation as useTranslationContext } from '@/context/TranslationContext';
import { translations } from '@/lib/translations';

export const useTranslation = () => {
    const { t, language, setLanguage } = useTranslationContext();

    /**
     * hasKey(key) -> নির্দিষ্ট কি-টি ডাটাবেসে আছে কি না নিশ্চিত করে।
     */
    const hasKey = (key: string) => {
        const langData = translations[language as keyof typeof translations] as Record<string, string>;
        return langData ? !!langData[key] : false;
    };

    return { 
        t,          
        language,   
        setLanguage, 
        hasKey      
    };
};