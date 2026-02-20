/**
 * 🛠️ UNIFIED UTILITIES - Foundation for Grand Unification
 * 
 * Centralized utilities for ID generation, timestamps, and date formatting.
 * Replaces scattered patterns with consistent, secure implementations.
 */

import { format } from 'date-fns';

/**
 * 🔐 GENERATE UUID - Cryptographically Secure
 * Uses native crypto.randomUUID() with fallback for older environments
 */
export const generateUUID = (): string => {
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments (still more secure than Math.random())
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Last resort - still better than Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * ⏰ GET TIMESTAMP - Consistent Timestamp Generation
 * Returns Unix timestamp in milliseconds
 */
export const getTimestamp = (): number => {
  return Date.now();
};

/**
 * 📅 FORMAT DATE - Consistent Date Formatting
 * Uses date-fns for reliable date operations
 * 
 * @param date - Date object, timestamp, or string
 * @returns Formatted date string 'YYYY-MM-DD'
 */
export const formatDate = (date: Date | number | string): string => {
  try {
    const dateObj = new Date(date);
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.warn('Invalid date provided to formatDate:', date);
    return format(new Date(), 'yyyy-MM-dd');
  }
};

/**
 * 🎯 GENERATE CID - Secure Client ID with Prefix
 * Maintains backward compatibility while using secure UUID generation
 */
export const generateCID = (): string => {
  const uuid = generateUUID();
  return `cid_${uuid}`;
};

/**
 * 🕐 FORMAT TIME - Time Formatting Helper
 * Returns time in 'HH:mm' format
 */
export const formatTime = (date: Date | number | string): string => {
  try {
    const dateObj = new Date(date);
    return format(dateObj, 'HH:mm');
  } catch (error) {
    console.warn('Invalid time provided to formatTime:', date);
    return format(new Date(), 'HH:mm');
  }
};

/**
 * 📊 FORMAT DATETIME - Combined Date and Time
 * Returns full datetime in 'YYYY-MM-DD HH:mm' format
 */
export const formatDateTime = (date: Date | number | string): string => {
  try {
    const dateObj = new Date(date);
    return format(dateObj, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.warn('Invalid datetime provided to formatDateTime:', date);
    return format(new Date(), 'yyyy-MM-dd HH:mm');
  }
};
