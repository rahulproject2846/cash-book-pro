"use client";
import { useTranslation as useTranslationContext } from '@/context/TranslationContext';

export const useTranslation = () => {
    const { t, language, setLanguage } = useTranslationContext();

    /**
     * t(key) -> ট্রান্সলেটেড টেক্সট দেয়
     * T(key) -> ট্রান্সলেটেড টেক্সটকে প্রোটোকল অনুযায়ী UPPERCASE করে দেয়
     */
    const T = (key: string) => t(key).toUpperCase();

    return { t, T, language, setLanguage };
};