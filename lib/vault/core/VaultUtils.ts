"use client";

import type { LocalEntry, LocalBook } from '@/lib/offlineDB';
import { telemetry } from '../Telemetry';

/**
 * 🛡️ VAULT PRO: SUPREME UTILITIES & NORMALIZER (V3.0)
 * ---------------------------------------------------
 * এই ফাইলটি অ্যাপের ডাটা ক্লিনসিং, টাইমস্ট্যাম্প এবং ইভেন্ট ডিসপ্যাচিং হ্যান্ডেল করে।
 * প্রোডাকশন গ্রেড: টাইপ-সেফ, মেমরি এফিসিয়েন্ট এবং লেগাসি ডাটা রেসকিউ ফ্রেন্ডলি।
 */

// --- ১. টাইমস্ট্যাম্প হেল্পারস (EXPORTS) ---

/**
 * যেকোনো ফরমেটের টাইমস্ট্যাম্পকে Unix Number-এ রূপান্তর করে।
 */
export const normalizeTimestamp = (val: any): number => {
    if (!val) return Date.now();
    if (typeof val === 'number') return val;
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? Date.now() : parsed;
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
 * ডাটাবেজে ঢোকার আগে রেকর্ডকে সলিড ফরমেটে নিয়ে আসে।
 * লেগাসি ডাটা (admin user, missing CID) উদ্ধার করে।
 */
export const normalizeRecord = (data: any, currentUserId?: string): any => {
    if (!data || typeof data !== 'object') return null;

    const normalized = { ...data };

    // 🕵️ IDENTITY AUDIT: Track localId handling
    console.log('🕵️ NORMALIZE IDENTITY CHECK:', { 
        inputLocalId: normalized.localId, 
        inputId: normalized._id, 
        typeOfLocalId: typeof normalized.localId,
        typeOfId: typeof normalized._id
    });

    // ১. আইডি প্রোটেকশন (যদি _id এবং cid দুটোই না থাকে তবে ডাটা বাদ)
    if (!normalized._id && !normalized.cid) {
        console.warn("🚫 [NORMALIZER] Invalid record skipped:", data);
        return null;
    }

    // ২. আইডি ইউনিফিকেশন
    normalized._id = sanitizeId(normalized._id);
    normalized.userId = sanitizeId(normalized.userId);
    normalized.bookId = sanitizeId(normalized.bookId);

    // ৩. লেগাসি রেসকিউ (CID & UserID)
    if (!normalized.cid || String(normalized.cid).trim() === '') {
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
    if (normalized.date) normalized.date = normalizeTimestamp(normalized.date);

    // ৫. ফিল্ড এলিয়াস (Legacy Support)
    if (normalized.memo && !normalized.note) normalized.note = normalized.memo;
    if (normalized.via && !normalized.paymentMethod) normalized.paymentMethod = normalized.via;
    
    // 🔧 TYPE CORRECTION: Force type to lowercase and handle 'Entry' -> 'expense'
    if (normalized.type) {
        normalized.type = String(normalized.type).toLowerCase();
        if (normalized.type === 'entry' || normalized.type === 'Entry') {
            normalized.type = 'expense';
        }
    }

    // 🔧 FIELD NORMALIZATION: Force category, paymentMethod, and status to lowercase
    if (normalized.category) {
        normalized.category = String(normalized.category).toLowerCase().trim();
    }
    if (normalized.paymentMethod) {
        normalized.paymentMethod = String(normalized.paymentMethod).toLowerCase().trim();
    }
    if (normalized.status) {
        normalized.status = String(normalized.status).toLowerCase().trim();
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