// src/lib/utils/helpers.ts

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER (Exported) ---
export const toBn = (num: any, lang: string): string => {
    // num যদি null/undefined হয়, তবে ফাঁকা স্ট্রিং রিটার্ন করবে
    const str = String(num === null || num === undefined ? '' : num);
    if (lang !== 'bn') return str;
    
    // শুধু সংখ্যা নয়, কমা ও ডটও কনভার্ট করা হয়েছে
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    
    return str.split('').map(c => bnNums[c] || c).join('');
};

// --- 🕒 HELPER: TRANSLATED TIME AGO (Exported) ---
export const getTimeAgo = (date: any, lang: string, T: any): string => {
    // ডেটা না থাকলে বা ইনভ্যালিড হলে একটি সেফ মেসেজ
    if (!date) return lang === 'bn' ? 'সময় নেই' : 'NO TIME'; 

    const now = new Date().getTime();
    const past = new Date(date).getTime();
    
    // যদি future date হয়, তবুও JUST NOW দেখাবে
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