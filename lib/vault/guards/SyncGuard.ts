"use client";

/**
 * 🛡️ SYNC GUARD - Centralized Security & Network Validation
 * 
 * VERBATIM LOGIC EXTRACTION from SyncOrchestrator.ts and PushService.ts
 * Eliminates 200+ lines of duplicate code while preserving exact behavior
 */

import { identityManager } from '../core/IdentityManager';
import { db } from '@/lib/offlineDB';
import { getVaultStore } from '../store/storeHelper';
import { LicenseVault, RiskManager } from '../security';
import { telemetry } from '../Telemetry';
import { GuardContext, GuardResult, NetworkStateResult, SecurityValidationResult } from '../types/SyncTypes';

/**
 * 🛡️ SYNC GUARD CLASS
 * Centralized validation for all sync services
 */
export class SyncGuard {
  /**
   * 🔍 VALIDATE SYNC ACCESS
   * VERBATIM: Extract exact logic from all 3 services
   */
  static async validateSyncAccess(context: GuardContext): Promise<GuardResult> {
    try {
      // 🆕 VERBATIM: userId check from all 3 services
      const userId = identityManager.getUserId() || '';
      
      // 🆕 VERBATIM: Network state checks from PushService.ts:535-555 and PullService.ts:263-273
      const networkResult = await this.validateNetworkState(context);
      if (!networkResult.allowed) {
        return {
          valid: false,
          error: networkResult.error,
          returnValue: context.returnError(networkResult.error || 'Network validation failed')
        };
      }
      
      // 🆕 VERBATIM: User validation from all 3 services
      const user = await db.users.get(userId);
      if (!user) {
        // 🔓 INITIAL BOOT EXCEPTION: Allow profile hydration during first boot
        const { bootStatus } = getVaultStore();
        if (bootStatus === 'IDLE' || bootStatus === 'IDENTITY_WAIT' || bootStatus === 'PROFILE_SYNC') {
          console.log('🔓 [SYNC GUARD] Initial boot detected: Allowing profile hydration path.');
          return {
            valid: true,
            userId
          };
        }
        
        const errorMsg = 'User profile missing';
        context.onError(errorMsg);
        return {
          valid: false,
          error: errorMsg,
          returnValue: context.returnError(errorMsg)
        };
      }
      
      // 🆕 VERBATIM: Security validation from SyncOrchestrator.ts:1349-1409 and PushService.ts:573-605
      const securityResult = await this.validateSecurity(user, context);
      if (!securityResult.valid) {
        return {
          valid: false,
          error: securityResult.error,
          returnValue: context.returnError(securityResult.error || 'Security validation failed')
        };
      }
      
      return {
        valid: true,
        user,
        userId
      };
      
    } catch (error) {
      const errorMsg = `Sync validation failed: ${String(error)}`;
      context.onError(errorMsg, { error });
      return {
        valid: false,
        error: errorMsg,
        returnValue: context.returnError(errorMsg)
      };
    }
  }
  
  /**
   * 🌐 VALIDATE NETWORK STATE
   * VERBATIM: Extract exact logic from PushService.ts and PullService.ts
   */
  private static async validateNetworkState(context: GuardContext): Promise<NetworkStateResult> {
    // 🆕 VERBATIM: Network mode check from PushService.ts:535 and PullService.ts:263
    const { networkMode, isSecurityLockdown } = getVaultStore();
    
    // 🆕 VERBATIM: RESTRICTED mode check from PushService.ts:537-543 and PullService.ts:264-267
    if (networkMode === 'RESTRICTED' || isSecurityLockdown) {
      // 🆕 VERBATIM: Exact error message from PushService.ts:539 and PullService.ts:265
      const errorMsg = 'App in restricted mode';
      
      if (context.serviceName === 'SyncOrchestrator') {
        // 🆕 VERBATIM: Orchestrator uses console.warn from SyncOrchestrator.ts:1353
        console.warn(`🔒 [SECURITY] Sync Blocked: RESTRICTED mode`);
      } else {
        // 🆕 VERBATIM: Services use console.error from PushService.ts:539 and PullService.ts:265
        console.error(`🔒 [${context.serviceName}] Business data sync blocked - RESTRICTED mode`);
      }
      
      return {
        allowed: false,
        mode: networkMode,
        isSecurityLockdown: true,
        error: errorMsg
      };
    }
    
    // 🆕 VERBATIM: OFFLINE/DEGRADED check from PushService.ts:549-555 and PullService.ts:270-273
    if (networkMode === 'OFFLINE' || networkMode === 'DEGRADED') {
      // 🆕 BOOT-TIME EXCEPTION: Allow initial boot when in early boot status
      const { bootStatus } = getVaultStore();
      if (bootStatus === 'IDLE' || bootStatus === 'IDENTITY_WAIT' || bootStatus === 'PROFILE_SYNC' || bootStatus === 'DATA_HYDRATION') {
        console.log(`🔓 [SYNC GUARD] Initializing network... bypassing block.`);
        return {
          allowed: true,
          mode: networkMode,
          isSecurityLockdown: false
        };
      }
      
      // 🆕 VERBATIM: Exact warning from PushService.ts:551 and PullService.ts:271
      const warnMsg = networkMode === 'OFFLINE' ? 'Sync blocked. Network is: OFFLINE' : 'Sync blocked. Network is: DEGRADED';
      
      if (context.serviceName === 'SyncOrchestrator') {
        console.warn(`🛑 [ORCHESTRATOR] ${warnMsg}`);
      } else {
        console.warn(`🛑 [${context.serviceName}] ${warnMsg}`);
      }
      
      return {
        allowed: false,
        mode: networkMode,
        isSecurityLockdown: false,
        error: warnMsg
      };
    }
    
    return {
      allowed: true,
      mode: networkMode,
      isSecurityLockdown: false
    };
  }
  
  /**
   * 🔐 VALIDATE SECURITY
   * VERBATIM: Extract exact logic from SyncOrchestrator.ts:1349-1409 and PushService.ts:573-605
   */
  private static async validateSecurity(user: any, context: GuardContext): Promise<SecurityValidationResult> {
    // 🆕 VERBATIM: License validation from SyncOrchestrator.ts:1349 and PushService.ts:573
    const licenseAccess = LicenseVault.validateAccess(user);
    if (!licenseAccess.access) {
      const errorMsg = `License access denied`;
      
      if (context.serviceName === 'SyncOrchestrator') {
        // 🆕 VERBATIM: Orchestrator detailed logging from SyncOrchestrator.ts:1353-1369
        console.warn(`🔒 [SECURITY] Sync Blocked: ${licenseAccess.reason}`);
        
        // 🆕 VERBATIM: Telemetry logging from SyncOrchestrator.ts:1355-1365
        telemetry.log({
          type: 'SECURITY',
          level: 'CRITICAL',
          message: `Lockdown triggered: INVALID_LICENSE - ${licenseAccess.reason}`,
          data: { reason: licenseAccess.reason, plan: licenseAccess.plan }
        });
        
        // 🆕 VERBATIM: Set lockdown from SyncOrchestrator.ts:1367
        getVaultStore().setSecurityLockdown(true);
      } else {
        // 🆕 VERBATIM: Service error from PushService.ts:577
        console.error(`🔒 [SECURITY] License invalid - ${context.serviceName} blocked`);
      }
      
      return {
        valid: false,
        error: errorMsg,
        lockdownTriggered: true,
        licenseAccess
      };
    }
    
    // 🆕 VERBATIM: Lockdown check from SyncOrchestrator.ts:1477 and PushService.ts:585
    const lockdownStatus = RiskManager.isLockdown(user);
    if (lockdownStatus) {
      const errorMsg = 'User in lockdown';
      
      if (context.serviceName === 'SyncOrchestrator') {
        // 🆕 VERBATIM: Orchestrator logging from SyncOrchestrator.ts:1479-1495
        console.warn(`🔒 [SECURITY] Sync Blocked: User in lockdown mode`);
        
        telemetry.log({
          type: 'SECURITY',
          level: 'CRITICAL',
          message: 'Lockdown triggered: LOCKDOWN_MODE',
          data: { evaluationMethod: 'V6.4_ASYNC' }
        });
        
        getVaultStore().setSecurityLockdown(true);
      } else {
        // 🆕 VERBATIM: Service error from PushService.ts:589
        console.error(`🔒 [SECURITY] User in lockdown - ${context.serviceName} blocked`);
      }
      
      return {
        valid: false,
        error: errorMsg,
        lockdownTriggered: true
      };
    }
    
    // 🆕 VERBATIM: Signature validation from SyncOrchestrator.ts:1377 and PushService.ts:597
    const signatureValid = await LicenseVault.verifySignature(user);
    if (!signatureValid) {
      const errorMsg = 'License signature invalid';
      
      if (context.serviceName === 'SyncOrchestrator') {
        // 🆕 VERBATIM: Orchestrator migration whitelist from SyncOrchestrator.ts:1381-1388
        if (user.isMigrated) {
          console.warn(`🔒 [SECURITY] Migrated user signature invalid - allowing access as free user`);
          // Don't set lockdown, just continue
          return { valid: true };
        }
        
        // 🆕 VERBATIM: Orchestrator logging from SyncOrchestrator.ts:1391-1405
        console.warn(`🔒 [SECURITY] Sync Blocked: License signature invalid`);
        
        telemetry.log({
          type: 'SECURITY',
          level: 'CRITICAL',
          message: 'Lockdown triggered: SIGNATURE_TAMPER',
          data: { userId: user._id }
        });
        
        getVaultStore().setSecurityLockdown(true);
      } else {
        // 🆕 VERBATIM: Service error from PushService.ts:601
        console.error(`🔒 [SECURITY] License signature invalid - ${context.serviceName} blocked`);
      }
      
      return {
        valid: false,
        error: errorMsg,
        lockdownTriggered: true
      };
    }
    
    return {
      valid: true,
      licenseAccess
    };
  }
  
  /**
   * 🚀 QUICK VALIDATION
   * Fast path validation for non-critical operations
   */
  static async quickValidation(userId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Basic user existence check
      const user = await db.users.get(userId);
      if (!user) {
        return { valid: false, error: 'User profile missing' };
      }
      
      // Basic license check
      const licenseAccess = LicenseVault.validateAccess(user);
      if (!licenseAccess.access) {
        return { valid: false, error: 'License access denied' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }
}
