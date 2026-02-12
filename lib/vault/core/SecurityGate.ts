"use client";
import { db, clearVaultData } from '@/lib/offlineDB';

/**
 * VAULT PRO: SECURITY GATE (V25.0 - UNBREAKABLE INTEGRITY)
 * ----------------------------------------------------
 * Security validation and system block management
 */

export class SecurityGate {
  /**
   * 🔒 SECURITY VALIDATION: Check response for security status
   */
  checkSecurityStatus(result: any): boolean {
    if (!result) return false;
    
    // Check for system block or security violations
    if (result.blocked || result.systemBlock || result.securityViolation) {
      console.error('🚨 SECURITY BLOCK DETECTED:', result);
      return false;
    }
    
    // Check for user deactivation
    if (result.userDeactivated || result.deactivated) {
      console.error('🚨 USER DEACTIVATED:', result);
      return false;
    }
    
    return true;
  }

  /**
   * 🚨 SYSTEM BLOCK: Emergency security action
   */
  async performSystemBlock() {
    console.error('🚨 SYSTEM BLOCK ACTIVATED - Performing emergency cleanup');
    
    try {
      // Clear all local data immediately
      await clearVaultData();
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cashbookUser');
        localStorage.removeItem('vault_last_sync_timestamp');
        
        // Force redirect to login
        window.location.href = '/';
      }
    } catch (err) {
      console.error('❌ SYSTEM BLOCK FAILED:', err);
      // Fallback: force reload anyway
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 2000);
    }
  }

  /**
   * 🚨 LOGOUT: Clean up and redirect to login
   */
  async logout() {
    // 🔒 MEMORY LEAK FIX: Cleanup resources before logout
    if (typeof window !== 'undefined') {
      await db.delete();
      localStorage.removeItem('cashbookUser');
      localStorage.removeItem('vault_last_sync_timestamp');
      window.location.href = '/';
    }
  }
}
