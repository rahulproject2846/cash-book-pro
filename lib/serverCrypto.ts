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
    time?: string;
    title: string;
    note?: string;
    category?: string;
    paymentMethod?: string;
    type?: string;
    status?: string;
}): string => {
    // 🔐 SECURITY: Validate required environment variable
    if (!process.env.VAULT_SECRET_KEY) {
        throw new Error('CRITICAL_SECURITY_ERROR: VAULT_SECRET_KEY environment variable is not set on server');
    }
    
    // ১. ডাটা নরমালাইজেশন (Trim ONLY - respect user's case)
    const title = data.title?.trim() || "";
    const note = data.note?.trim() || "";
    const category = data.category?.trim() || "";
    const paymentMethod = data.paymentMethod?.trim() || "";
    const type = data.type?.trim() || "";
    const status = data.status?.trim() || "";
    
    // ২. ডেট ফরম্যাটিং (নিশ্চিত করা যে টাইমস্ট্যাম্প নয়, শুধু তারিখ ব্যবহার হচ্ছে)
    const dateStr = String(data.date);  // 🚨 ZERO-LOGIC: Use raw string directly
    const timeStr = String(data.time || "");  // 🚨 ZERO-LOGIC: Use raw string directly

    // ৩. পেলোড তৈরি (consistent format for hashing - ALL 8 FIELDS matching client)
    const payload = `${data.amount}:${String(data.date)}:${String(data.time || "")}:${title}:${note}:${category}:${paymentMethod}:${type}:${status}`;
    
    try {
        // ৪. SHA-256 হ্যাশিং (Node.js crypto module)
        const hash = createHash('sha256').update(payload, 'utf8').digest('hex');
        
        // ৫. সিকিউরিটি প্রিফিক্স সহ রিটার্ন (ভার্সন কন্ট্রোলড)
        return `sha256_${hash}`;
    } catch (error) {
        // 🔒 SECURITY: No fallback for cryptographic failures
        throw new Error(`CRITICAL_CRYPTOGRAPHIC_ERROR: SHA-256 generation failed: ${error}`);
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
