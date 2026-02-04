"use client";
import { useTranslation as useTranslationContext } from '@/context/TranslationContext';
import { translations } from '@/lib/translations'; // 🔥 রেড লাইন ফিক্সের জন্য ইমপোর্ট করা হলো

/**
 * VAULT PRO: TRANSLATION BRIDGE HOOK
 * ---------------------------------
 * This hook extends the basic translation context with protocol-specific 
 * utilities like Uppercase conversion (T) and Key checking (hasKey).
 */
export const useTranslation = () => {
    const { t, language, setLanguage } = useTranslationContext();

    /**
     * T(key) -> ট্রান্সলেটেড টেক্সটকে প্রোটোকল অনুযায়ী UPPERCASE করে দেয়।
     * এটি ইউআই-তে হেডার এবং বাটনের জন্য ব্যবহৃত হয়।
     */
    const T = (key: string) => {
        const text = t(key);
        return text ? text.toUpperCase() : key.toUpperCase();
    };

    /**
     * hasKey(key) -> ডিকশনারিতে নির্দিষ্ট কি (Key) টি আছে কি না চেক করে।
     * টাইপস্ক্রিপ্ট এরর এড়াতে এটি নিরাপদভাবে ডাটা চেক করে।
     */
    const hasKey = (key: string) => {
        const langData = translations[language] as Record<string, string>;
        return langData ? !!langData[key] : false;
    };

    return { 
        t,          // স্ট্যান্ডার্ড টেক্সট
        T,          // আপারকেস টেক্সট (প্রোটোকল)
        language,   // বর্তমান ভাষা (en/bn)
        setLanguage, // ভাষা পরিবর্তনের ফাংশন
        hasKey      // কি চেক করার ক্ষমতা
    };
};