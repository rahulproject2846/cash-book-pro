"use client";

import type { LocalEntry, LocalBook } from '@/lib/offlineDB';
import { telemetry } from '../Telemetry';

import { getTimestamp } from '@/lib/shared/utils';

/**
 * 🛡️ VAULT PRO: SUPREME UTILITIES & NORMALIZER (V3.0)
 * ---------------------------------------------------
 * এই ফাইলটি অ্যাপের ডাটা ক্লিনসিং, টাইমস্ট্যাম্প এবং ইভেন্ট ডিসপ্যাচিং হ্যান্ডেল করে।
 * প্রোডাকশন গ্রেড: টাইপ-সেফ, মেমরি এফিসিয়েন্ট এবং লেগাসি ডাটা রেসকিউ ফ্রেন্ডলি।
 */

// --- ১. টাইমস্ট্যাম্প হেল্পারস (EXPORTS) ---

/**
 * 🔢 BANGLA TO ENGLISH CONVERTER - Converts Bangla numerals to English
 */
const BANGLA_NUMERALS = '০১২৩৪৫৬৭৮৯';
const ENGLISH_NUMERALS = '0123456789';

export const convertBanglaToEnglish = (text: string): string => {
    return text.split('').map(char => {
        const index = BANGLA_NUMERALS.indexOf(char);
        return index !== -1 ? ENGLISH_NUMERALS[index] : char;
    }).join('');
};

/**
 * 💰 FINANCIAL PRECISION FIXER - Ensures 2 decimal places and Bangla conversion
 */
export const fixFinancialPrecision = (amount: any): number => {
    if (amount === undefined || amount === null) return 0;
    
    // Convert Bangla numerals to English
    const converted = convertBanglaToEnglish(String(amount));
    
    // Parse to float and remove non-numeric characters
    const num = parseFloat(converted.replace(/[^\d.-]/g, ''));
    
    // Return 0 if invalid
    if (isNaN(num)) return 0;
    
    // Ensure exactly 2 decimal places
    return Math.round(num * 100) / 100;
};

/**
 * 🛡️ XSS & CONTENT SANITIZER - Removes script injection and limits content
 */
export const sanitizeContent = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    // Remove XSS patterns
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi
    ];
    
    let sanitized = text;
    xssPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
    });
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
};

/**
 * ✅ COMPLETENESS VALIDATOR - Ensures mandatory fields are present
 */
export const validateCompleteness = (
    record: any, 
    type: 'book' | 'entry' | 'user'
): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    if (type === 'user') {
        // User mandatory fields
        if (!record.username || record.username === '') {
            missingFields.push('username');
        }
        if (!record.email || record.email === '') {
            missingFields.push('email');
        }
    } else if (type === 'entry') {
        // Entry mandatory fields
        if (!record.amount || record.amount === 0) {
            missingFields.push('amount (must be > 0)');
        }
        if (!record.date || record.date === '') {
            missingFields.push('date');
        }
        if (!record.title || record.title === '') {
            missingFields.push('title');
        }
    } else if (type === 'book') {
        // Book mandatory fields
        if (!record.name || record.name === '') {
            missingFields.push('name');
        }
    }
    
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
};

/**
 * যেকোনো ফরমেটের টাইমস্ট্যাম্পকে Unix Number-এ রূপান্তর করে।
 */
export const normalizeTimestamp = (val: any): number => {
    if (!val) return getTimestamp();
    if (typeof val === 'number') return val;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? getTimestamp() : parsed;
};

// --- ২. ডাটা স্যানিটাইজেশন হেল্পারস (INTERNAL) ---

const sanitizeId = (id: any): string => {
    if (!id) return '';
    const idStr = String(id);
    // Regex: ObjectId wrapper এবং কোটেশন পরিষ্কার করে
    return idStr
        .replace(/^ObjectId\("(.+?)"\)$/, '$1') 
        .replace(/['"]/g, '')                   
        .trim();
};

// --- ৩. মাস্টার রেকর্ড নরমলাইজার (EXPORT) ---

/**
 * 🧑 USER NORMALIZER - Dedicated user profile processing
 * Separates user normalization from entry/book validation
 */
export const normalizeUser = (user: any, currentUserId?: string): any => {
    if (!user || typeof user !== 'object') return null;

    const normalized = { ...user };

    // ১. আইডি প্রোটেকশন (যদি _id এবং userId দুটোই না থাকে তবে ডাটা বাদ)
    if (!normalized._id) {
        console.warn("🚫 [USER NORMALIZER] Invalid user record - missing _id:", user);
        return null;
    }

    // ২. আইডি ইউনিফিকেশন
    normalized._id = sanitizeId(normalized._id);
    normalized.userId = sanitizeId(currentUserId);

    // ৩. টাইমস্ট্যাম্প ইউনিফিকেশন
    normalized.updatedAt = normalizeTimestamp(normalized.updatedAt);

    // 🛡️ XSS SANITIZATION: Clean user string fields
    if (normalized.username) {
        normalized.username = sanitizeContent(normalized.username);
    }
    if (normalized.email) {
        normalized.email = sanitizeContent(normalized.email);
    }

    // 🔐 LICENSE & SECURITY FIELDS (V6.2 Compatibility)
    if (normalized.plan !== undefined) {
        normalized.plan = String(normalized.plan).toLowerCase();
    }
    if (normalized.riskScore !== undefined) {
        normalized.riskScore = Number(normalized.riskScore);
    }
    if (normalized.offlineExpiry !== undefined) {
        normalized.offlineExpiry = Number(normalized.offlineExpiry);
    }

    // Generate missing fields if needed
    if (!normalized.updatedAt) {
        normalized.updatedAt = getTimestamp();
    }

    // Ensure V6.2 security fields have defaults
    if (normalized.plan === undefined) {
        normalized.plan = 'free';
    }
    if (normalized.riskScore === undefined) {
        normalized.riskScore = 0;
    }
    if (normalized.offlineExpiry === undefined) {
        normalized.offlineExpiry = 0;
    }
    if (normalized.receiptId === undefined) {
        normalized.receiptId = null;
    }
    if (normalized.licenseSignature === undefined) {
        normalized.licenseSignature = null;
    }

    console.log('🧑 [USER NORMALIZER] User record processed successfully');
    return normalized;
};

/**
 * ডাটাবেজে ঢোকার আগে রেকর্ডকে সলিড ফরমেটে নিয়ে আসে।
 * লেগাসি ডাটা (admin user, missing CID) উদ্ধার করে।
 */
export const normalizeRecord = (data: any, currentUserId?: string): any => {
    if (!data || typeof data !== 'object') return null;

    const normalized = { ...data };

    // ১. আইডি প্রোটেকশন (যদি _id এবং cid দুটোই না থাকে তবে ডাটা বাদ)
    if (!normalized._id && !normalized.cid) {
        console.warn("🚫 [NORMALIZER] Invalid record skipped:", data);
        return null;
    }

    // 🔢 FINANCIAL PRECISION: Fix amount with Bangla conversion and 2-decimal precision
    if (normalized.amount !== undefined) {
        normalized.amount = fixFinancialPrecision(normalized.amount);
    }

    // 🛡️ XSS SANITIZATION: Clean all string fields
    if (normalized.title) {
        normalized.title = sanitizeContent(normalized.title);
    }
    if (normalized.note) {
        normalized.note = sanitizeContent(normalized.note);
        // 📝 NOTE LIMIT: Trim to 200 characters max
        if (normalized.note.length > 200) {
            normalized.note = normalized.note.substring(0, 200);
        }
    }
    if (normalized.name) {
        normalized.name = sanitizeContent(normalized.name);
    }
    if (normalized.description) {
        normalized.description = sanitizeContent(normalized.description);
    }
    if (normalized.category) {
        normalized.category = sanitizeContent(normalized.category);
    }
    if (normalized.paymentMethod) {
        normalized.paymentMethod = sanitizeContent(normalized.paymentMethod);
    }

    // ২. আইডি ইউনিফিকেশন
    normalized._id = sanitizeId(normalized._id);
    normalized.userId = sanitizeId(normalized.userId);
    normalized.bookId = sanitizeId(normalized.bookId);

    // 🔍 RECORD TYPE DETECTION: User, Book, or Entry
    const isUser = !!normalized.username && !!normalized.email; // User has username and email
    const isBook = !!normalized.name; // Books use name, Entries use title
    const isEntry = !!normalized.title; // Entries have title field

    // 🔴 ORPHAN RESCUE: Rescue entries with missing bookId instead of rejecting
    if (isEntry && (!normalized.bookId || normalized.bookId === 'undefined' || normalized.bookId === '')) {
        console.warn(`⚠️ [ORPHAN RESCUE] Assigning fallback ID to entry CID: ${normalized.cid} - Missing bookId`);
        normalized.bookId = data.bookId || 'orphaned-data';
    }

    // Generate required fields if missing
    if (!normalized.vKey) {
        // 🎯 RIGID SEQUENTIAL VKEY: New Create = 1, Update = existing + 1
        normalized.vKey = 1; // Always start new records at vKey: 1
    }
    
    if (!normalized.checksum) {
        normalized.checksum = `checksum_${normalized.cid}_${getTimestamp()}`;
    }

    // ৩. লেগাসি রেসকিউ (CID & UserID) - Only for entries, not users
    if (!isUser && (!normalized.cid || String(normalized.cid).trim() === '')) {
        normalized.cid = `cid_legacy_${normalized._id}`;
    }

    const activeUid = sanitizeId(currentUserId);
    if (!normalized.userId || normalized.userId === 'admin' || normalized.userId === 'unknown') {
        if (activeUid) {
            normalized.userId = activeUid;
        } else {
            console.warn("⚠️ [NORMALIZER] Potential orphan record:", normalized.cid);
        }
    }

    // ৪. টাইমস্ট্যাম্প ইউনিফিকেশন
    normalized.createdAt = normalizeTimestamp(normalized.createdAt);
    normalized.updatedAt = normalizeTimestamp(normalized.updatedAt);
    // 🚨 CRITICAL FIX: Don't normalize date field - keep as ISO string for checksum consistency
    // if (normalized.date) normalized.date = normalizeTimestamp(normalized.date);

    // ৫. ফিল্ড এলিয়াস (Legacy Support)
    if (normalized.memo && !normalized.note) normalized.note = normalized.memo;
    if (normalized.via && !normalized.paymentMethod) normalized.paymentMethod = normalized.via;
    
    // ✅ COMPLETENESS VALIDATION: Check mandatory fields before returning
    let recordType: 'book' | 'entry' | 'user';
    if (isUser) {
        recordType = 'user';
    } else if (isBook) {
        recordType = 'book';
    } else {
        recordType = 'entry';
    }
    
    const completeness = validateCompleteness(normalized, recordType);
    
    if (!completeness.isValid) {
        console.warn(`🚨 [VALIDATOR] Record incomplete: ${normalized.cid || 'unknown'}. Missing: ${completeness.missingFields.join(', ')}`);
        return null; // Prevent saving/syncing incomplete data
    }

    // 🔧 TYPE CORRECTION: Force type to lowercase and handle 'Entry' -> 'expense'
    if (normalized.type) {
        normalized.type = String(normalized.type).toLowerCase();
        if (normalized.type === 'entry' || normalized.type === 'Entry') {
            normalized.type = 'expense';
        }
    }

    // 🔧 FIELD NORMALIZATION: Only normalize if field exists (preserve undefined for selective merge)
    if (normalized.category !== undefined) {
        normalized.category = String(normalized.category).toLowerCase().trim();
    }
    if (normalized.paymentMethod !== undefined) {
        normalized.paymentMethod = String(normalized.paymentMethod).toLowerCase().trim();
    }
    if (normalized.status !== undefined) {
        normalized.status = String(normalized.status).toLowerCase().trim();
    }
    
    // 🛡️ IMAGE FIELD PRESERVATION: Never overwrite valid URLs with undefined/null
    if (data.image !== undefined) {
        // Only preserve image if it's explicitly provided as undefined/null
        // This prevents accidental overwrites of valid URLs during normalization
        normalized.image = data.image;
    }

    // ৬. ডাটা ইন্টিগ্রিটি (Enforced Rules)
    // RULE: PRESERVE EXPLICIT SYNCED FLAG
    if (data.synced !== undefined) {
      // If synced is explicitly provided, preserve it
      normalized.synced = data.synced;
    } else if (normalized._id) {
      // Only default to synced: 1 if no explicit flag and has _id
      normalized.synced = 1;
    } else {
      // Default to unsynced for new local records
      normalized.synced = 0;
    }
    
    // RULE: ENSURE syncAttempts IS ALWAYS A NUMBER
    if (data.syncAttempts !== undefined) {
      normalized.syncAttempts = isNaN(Number(data.syncAttempts)) ? 0 : Number(data.syncAttempts);
    } else {
      normalized.syncAttempts = 0; // Default for new records
    }
    
    // RULE: FORCE Boolean to Number conversion
    normalized.isDeleted = (data.isDeleted === true || data.isDeleted === 1) ? 1 : 0;
    
    // 🚨 CONFLICT SANITIZATION: Handle conflicts on client side
    normalized.conflicted = (data.conflicted === 1) ? 1 : 0;
    normalized.conflictReason = data.conflictReason || "";
    normalized.serverData = data.serverData || null;
    
    // অপ্রয়োজনীয় ফিল্ডস ক্লিনআপ
    delete normalized.memo;
    delete normalized.via;
    delete normalized.__v;

    return normalized;
};

// --- ৪. জেনারেল ইউটিলিটিস (EXPORTS) ---

export const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

export const isValidId = (id: any): boolean => {
    return typeof id === 'string' && id.length > 0;
};

/**
 * গ্লোবাল ডাটাবেজ আপডেট ইভেন্ট ডিসপ্যাচার।
 */
export const dispatchDatabaseUpdate = (operation: string, type: 'book' | 'entry', data?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('database-updated', { 
            detail: { operation, type, data, timestamp: Date.now() } 
        }));
    }
};

/**
 * সিঙ্ক সাকসেস বা এরর লগ করার স্মার্ট ট্র্যাকার।
 */
export const logVault = (operation: string, error: any, context?: any): void => {
    telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: `Operation failed: ${operation}`,
        data: { error: error?.message || error, context }
    });
};