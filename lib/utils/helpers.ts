import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🛠️ CN (Class Name) UTILITY
 * Tailwind-এর ক্লাস কনফ্লিক্ট সলভ করে এবং ডাইনামিক ক্লাস হ্যান্ডেল করে।
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 🛠️ BENGALI NUMBER CONVERTER
 */
export const toBn = (num: any, lang: string = 'en'): string => {
    const str = String(num === null || num === undefined ? '' : num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯',',':',','.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

/**
 * 🕒 TRANSLATED TIME AGO
 */
export const getTimeAgo = (date: any, lang: string = 'en', T?: any): string => {
    if (!date) return lang === 'bn' ? 'সময় নেই' : 'NO TIME'; 
    const now = new Date().getTime();
    const past = new Date(date).getTime();
    if (isNaN(past) || past > now) return lang === 'bn' ? 'এখনই' : 'JUST NOW';
    const seconds = Math.floor((now - past) / 1000);
    let interval = seconds / 31536000;
    if (interval >= 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' বছর আগে' : 'Y AGO');
    interval = seconds / 2592000;
    if (interval >= 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' মাস আগে' : 'MO AGO');
    interval = seconds / 86400;
    if (interval >= 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' দিন আগে' : 'D AGO');
    interval = seconds / 3600;
    if (interval >= 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' ঘণ্টা আগে' : 'H AGO');
    interval = seconds / 60;
    if (interval >= 1) return toBn(Math.floor(interval), lang) + (lang === 'bn' ? ' মিনিট আগে' : 'M AGO');
    return lang === 'bn' ? 'এখনই' : 'JUST NOW';
};