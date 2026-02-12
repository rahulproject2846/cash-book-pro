"use client";

/**
 * 🔥 VAULT HELPERS (Centralized)
 * 
 * This file contains shared utility functions used across all vault hooks
 * Centralizing helpers prevents import issues and ensures consistency
 */

/**
 * 📅 NORMALIZE TIMESTAMP: Convert various timestamp formats to consistent number
 * 
 * Handles: null, undefined, String, Numbers, and Date objects
 * Returns: number (never NaN) with fallback to 0
 */
export const normalizeTimestamp = (timestamp: any): number => {
    // 🔒 NULL CHECK: Return 0 for null/undefined
    if (timestamp === null || timestamp === undefined) {
        console.log('📅 normalizeTimestamp: null/undefined timestamp, returning 0');
        return 0;
    }
    
    // 🔢 NUMBER CHECK: Return as-is for valid numbers
    if (typeof timestamp === 'number' && !isNaN(timestamp)) {
        return timestamp;
    }
    
    // 📅 STRING CHECK: Parse ISO strings and date objects
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp).getTime();
        if (!isNaN(parsed)) {
            return parsed;
        } else {
            console.log('📅 normalizeTimestamp: invalid date string, returning 0', { timestamp });
            return 0;
        }
    }
    
    // 📅 DATE OBJECT CHECK: Extract timestamp from Date objects
    if (timestamp instanceof Date) {
        const timeValue = timestamp.getTime();
        if (!isNaN(timeValue)) {
            return timeValue;
        } else {
            console.log('📅 normalizeTimestamp: invalid Date object, returning 0', { timestamp });
            return 0;
        }
    }
    
    // 🚨 FALLBACK: Return 0 for any other type
    console.log('📅 normalizeTimestamp: unknown timestamp type, returning 0', { timestamp, type: typeof timestamp });
    return 0;
};

/**
 * 🔍 SAFE ID EXTRACTOR: Extract ID from various object types
 * 
 * Handles: null, undefined, String, and Object with _id/localId properties
 * Returns: string (never undefined) with fallback to empty string
 */
export const safeIdExtractor = (obj: any): string => {
    // 🔒 NULL CHECK: Return empty string for null/undefined
    if (obj === null || obj === undefined) {
        console.log('🔍 safeIdExtractor: null/undefined object, returning empty string');
        return '';
    }
    
    // 🆔 ID CHECK: Try _id first, then localId
    if (typeof obj === 'object' && obj !== null) {
        return obj._id || obj.localId || '';
    }
    
    // 🚨 FALLBACK: Return empty string for any other type
    console.log('🔍 safeIdExtractor: unknown object type, returning empty string', { obj, type: typeof obj });
    return '';
};

/**
 * 🔒 TYPE GUARD: Runtime type checking for objects
 * 
 * Validates object has required properties before processing
 * Returns: boolean indicating if object is safe to process
 */
export const hasValidId = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    
    const hasId = obj._id || obj.localId;
    return typeof hasId === 'string' && hasId.length > 0;
};

/**
 * 🛡️ ERROR LOGGER: Consistent error logging
 * 
 * Centralizes error logging format across vault hooks
 * Provides context and operation details
 */
export const logVaultError = (operation: string, error: any, context?: any) => {
    console.error(`❌ VAULT ERROR [${operation}]:`, {
        error: error?.message || error,
        context,
        timestamp: new Date().toISOString()
    });
};

/**
 * 🔄 DEBOUNCE HELPER: Standard debounce pattern
 * 
 * Provides consistent debouncing across vault hooks
 * Returns: debounced function with proper cleanup
 */
export const createDebounce = (callback: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: any[]) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
            timeoutId = null;
            callback(...args);
        }, delay);
    };
};
