// src/lib/utils/helpers.ts
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

/**
 * 🛡️ LOGIC C: DATA SOLIDARITY (SHA-256 CHECKSUM GENERATOR)
 * এটি এন্ট্রির মূল ডাটা থেকে SHA-256 হ্যাশ তৈরি করে। 
 * ট্রান্সমিশনের সময় ডাটা নষ্ট হলে সার্ভার এই চেকসাম মিলিয়ে সেটি রিজেক্ট করতে পারবে।
 */
export const generateChecksum = async (data: { 
    amount: number; 
    date: string | Date; 
    title: string 
}): Promise<string> => {
    // ১. ডাটা নরমালাইজেশন (Strict lowercase & formatting)
    const title = data.title?.trim().toLowerCase() || "";
    
    // ২. ডেট ফরম্যাটিং (নিশ্চিত করা যে টাইমস্ট্যাম্প নয়, শুধু তারিখ ব্যবহার হচ্ছে)
    let dateStr = "";
    if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0];
    } else {
        dateStr = String(data.date).split('T')[0];
    }

    // ৩. পেলোড তৈরি (consistent format for hashing)
    const payload = `${data.amount}:${dateStr}:${title}`;
    
    try {
        // ৪. SHA-256 হ্যাশিং (Web Crypto API - Browser & Node.js compatible)
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // ৫. হ্যাশ কনভার্ট করা হেক্সাডেসিমালে
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // ৬. সিকিউরিটি প্রিফিক্স সহ রিটার্ন (ভার্সন কন্ট্রোলড)
        return `sha256_${hashHex}`;
    } catch (error) {
        // Fallback to simple hash if crypto not available
        console.warn('SHA-256 not available, falling back to simple hash:', error);
        let hash = 0;
        for (let i = 0; i < payload.length; i++) {
            const char = payload.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }
        return `v1_${Math.abs(hash)}`;
    }
};

/**
 * 🛡️ SYNC-COMPATIBLE CHECKSUM GENERATOR (Synchronous Version for Legacy Support)
 * যেহেতু কিছু জায়গায় async ব্যবহার করা যায় না, সেজন্য একটি sync ভার্সনও রাখা হলো
 */
export const generateChecksumSync = (data: { 
    amount: number; 
    date: string | Date; 
    title: string 
}): string => {
    // ১. ডাটা নরমালাইজেশন
    const title = data.title?.trim().toLowerCase() || "";
    
    // ২. ডেট ফরম্যাটিং
    let dateStr = "";
    if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0];
    } else {
        dateStr = String(data.date).split('T')[0];
    }

    // ৩. পেলোড তৈরি
    const payload = `${data.amount}-${dateStr}-${title}`;
    
    // ৪. বিটওয়াইজ হ্যাশিং অ্যালগরিদম (Fast & Efficient for JS)
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        const char = payload.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }

    // ৫. সিকিউরিটি প্রিফিক্স সহ রিটার্ন (ভার্সন কন্ট্রোলড)
    return `v1_${Math.abs(hash)}`;
};