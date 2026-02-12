/**
 * 🛡️ SERVER-SIDE CRYPTO UTILITY (Node.js Compatible)
 * SHA-256 checksum generation for server-side validation
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 checksum for data integrity validation
 * This function works in Node.js environment (server-side)
 */
export const generateServerChecksum = (data: { 
    amount: number; 
    date: string | Date; 
    title: string 
}): string => {
    // ১. ডাটা নরমালাইজেশন (Strict lowercase & formatting)
    const title = data.title?.trim().toLowerCase() || "";
    
    // ২. ডেট ফরম্যাটিং (নিশ্চিত করা যে টাইমস্ট্যাম্প নয়, শুধু তারিখ ব্যবহার হচ্ছে)
    let dateStr = "";
    if (data.date instanceof Date) {
        dateStr = data.date.toISOString().split('T')[0];
    } else {
        dateStr = String(data.date).split('T')[0];
    }

    // ৩. পেলোড তৈরি (consistent format for hashing - same as client)
    const payload = `${data.amount}:${dateStr}:${title}`;
    
    try {
        // ৪. SHA-256 হ্যাশিং (Node.js crypto module)
        const hash = createHash('sha256').update(payload, 'utf8').digest('hex');
        
        // ৫. সিকিউরিটি প্রিফিক্স সহ রিটার্ন (ভার্সন কন্ট্রোলড)
        return `sha256_${hash}`;
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
 * Validate checksum format (sha256_ prefix or v1_ prefix)
 */
export const isValidChecksumFormat = (checksum: string): boolean => {
    return checksum.startsWith('sha256_') || checksum.startsWith('v1_');
};

/**
 * Extract hash from checksum (remove prefix)
 */
export const extractHash = (checksum: string): string => {
    if (checksum.startsWith('sha256_')) {
        return checksum.substring(7);
    }
    if (checksum.startsWith('v1_')) {
        return checksum.substring(3);
    }
    return checksum;
};
