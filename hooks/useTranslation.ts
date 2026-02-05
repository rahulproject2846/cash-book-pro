"use client";
import { useTranslation as useTranslationContext } from '@/context/TranslationContext';
import { translations } from '@/lib/translations';

export const useTranslation = () => {
    const { t, language, setLanguage } = useTranslationContext();

    /**
     * T(key) -> ট্রান্সলেটেড টেক্সটকে UPPERCASE করে।
     * যদি কি (Key) না পাওয়া যায়, তবে কি-টিকেই আপারকেস করে রিটার্ন করে।
     */
    const T = (key: string) => {
        const text = t(key);
        // যদি টেক্সট কি-এর সমান হয় (মানে অনুবাদ নেই), তবে জাস্ট কি-টি রিটার্ন করবে
        return text ? text.toUpperCase() : key.toUpperCase();
    };

    /**
     * hasKey(key) -> নির্দিষ্ট কি-টি ডাটাবেসে আছে কি না নিশ্চিত করে।
     */
    const hasKey = (key: string) => {
        const langData = translations[language as keyof typeof translations] as Record<string, string>;
        return langData ? !!langData[key] : false;
    };

    return { 
        t,          
        T,          
        language,   
        setLanguage, 
        hasKey      
    };
};