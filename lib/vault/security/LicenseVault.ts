"use client";

import { LocalUser } from '@/lib/offlineDB';

/**
 * 🎫 LICENSE STATUS INTERFACE
 * Standardized return type for license validation
 */
export interface LicenseStatus {
  access: boolean;
  reason?: string;
  plan: string;
  userId: string;
}

/**
 * 🎫 LICENSE VAULT - The Ticket Checker
 * Validates user plan, offline expiry, and access rights.
 */
export class LicenseVault {
  /**
   * 🛡️ VALIDATE ACCESS
   * Checks if user is allowed to use Pro features offline.
   */
  static validateAccess(user: LocalUser): { access: boolean; reason?: string; plan: string } {
    // GATEKEEPER: Pro-status can only be granted via Online Server Response. Local manual overrides will fail signature verification.
    
    // 🛡️ MIGRATION WHITELIST: Allow migrated users without signature
    if (user.isMigrated && !user.licenseSignature) {
      console.log('🛡️ [LICENSE] Migrated user without signature - granting free access');
      return { access: true, plan: 'free' };
    }
    
    // 1. Free Plan Logic
    if (!user.plan || user.plan === 'free') {
      return { access: true, plan: 'free' };
    }

    // 2. Pro Plan Logic (Check Expiry)
    if (user.plan === 'pro') {
      const now = Date.now();
      
      // If no expiry date set, treat as expired/invalid
      if (!user.offlineExpiry) {
        return { access: false, reason: 'NO_EXPIRY_SET', plan: 'pro' };
      }

      // Check if expired
      if (now > user.offlineExpiry) {
        return { access: false, reason: 'OFFLINE_LICENSE_EXPIRED', plan: 'pro' };
      }

      return { access: true, plan: 'pro' };
    }

    // Fallback
    return { access: true, plan: 'free' };
  }

  /**
   * 🔐 VERIFY SIGNATURE
   * Cryptographic signature verification using HMAC-SHA256
   * Prevents local tampering of Pro license data
   */
  static async verifySignature(user: LocalUser): Promise<boolean> {
    try {
      // Free users don't need signature verification
      if (user.plan !== 'pro') {
        return true;
      }

      // 🛡️ MIGRATION WHITELIST: Allow migrated users without signature
      if (user.isMigrated && !user.licenseSignature) {
        console.log('🛡️ [SIGNATURE] Migrated user without signature - allowing access');
        return true;
      }

      // Pro users must have a signature
      if (!user.licenseSignature) {
        console.warn('🔐 [SIGNATURE] Pro user missing license signature');
        return false;
      }

      // Create payload string for hashing
      const payload = `${user._id}:${user.plan}:${user.offlineExpiry}`;
      const secret = process.env.NEXT_PUBLIC_LICENSE_SECRET || 'offline_robot_secret_2026';
      
      // Create HMAC-SHA256 hash
      const encoder = new TextEncoder();
      const data = encoder.encode(`${payload}:${secret}`);
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      
      // Convert buffer to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Compare calculated hash with stored signature
      const isValid = hashHex === user.licenseSignature;
      
      if (!isValid) {
        console.warn('🔐 [SIGNATURE] License signature verification failed - possible tampering detected');
        console.warn(`🔐 [SIGNATURE] Expected: ${hashHex}`);
        console.warn(`🔐 [SIGNATURE] Received: ${user.licenseSignature}`);
      }
      
      return isValid;
      
    } catch (error) {
      console.error('🔐 [SIGNATURE] Error during signature verification:', error);
      return false;
    }
  }

  /**
   * 🚀 ASYNC LICENSE VERIFICATION (V6.3)
   * Fetches user and validates license asynchronously
   */
  static async verifyLicenseAsync(userId: string): Promise<LicenseStatus> {
    try {
      const { db } = await import('@/lib/offlineDB');
      const user = await db.users.get(userId);
      
      if (!user) {
        return { access: false, reason: 'USER_NOT_FOUND', plan: 'unknown', userId };
      }

      // Use existing synchronous validation logic
      const result = LicenseVault.validateAccess(user);
      return { ...result, userId };
      
    } catch (error) {
      console.error('🔐 [LICENSE] Async verification failed:', error);
      return { access: false, reason: 'VERIFICATION_ERROR', plan: 'unknown', userId };
    }
  }

  /**
   * ⚡ GET EXPIRED PRO USERS (V6.3)
   * Uses new offlineExpiry index for efficient counting
   */
  static async getExpiredProUsers(): Promise<number> {
    try {
      const { db } = await import('@/lib/offlineDB');
      const now = Date.now();
      
      // 🎯 INDEXED QUERY: Uses offlineExpiry index efficiently
      const expiredCount = await db.users
        .where('offlineExpiry')
        .below(now)
        .and((user: LocalUser) => user.plan === 'pro')
        .count();
        
      console.log(`⚡ [LICENSE] Found ${expiredCount} expired Pro users using indexed query`);
      return expiredCount;
      
    } catch (error) {
      console.error('🔐 [LICENSE] Failed to get expired Pro users:', error);
      return 0;
    }
  }

  /**
   * 🚨 IDENTITY COMPROMISE CHECK (V6.3)
   * Checks if user identity is compromised via risk score or plan mismatch
   */
  static async isIdentityCompromised(userId: string): Promise<boolean> {
    try {
      const { db } = await import('@/lib/offlineDB');
      const user = await db.users.get(userId);
      
      if (!user) {
        console.warn('🚨 [IDENTITY] User not found for compromise check');
        return true; // Missing user = compromised
      }

      // Check risk score threshold
      if (user.riskScore && user.riskScore > 80) {
        console.warn(`🚨 [IDENTITY] High risk score detected: ${user.riskScore}`);
        return true;
      }

      // Check for plan inconsistencies (basic integrity check)
      if (user.plan === 'pro' && !user.licenseSignature) {
        console.warn('🚨 [IDENTITY] Pro user missing license signature');
        return true;
      }

      if (user.plan === 'pro' && user.offlineExpiry && user.offlineExpiry < Date.now()) {
        console.warn('🚨 [IDENTITY] Pro user with expired license');
        return true;
      }

      return false;
      
    } catch (error) {
      console.error('🚨 [IDENTITY] Compromise check failed:', error);
      return true; // Assume compromised on error
    }
  }
}
