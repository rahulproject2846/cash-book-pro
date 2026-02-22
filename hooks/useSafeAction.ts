"use client";

import { useCallback } from 'react';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * VAULT PRO: ELITE SAFE ACTION SHIELD (V12.2)
 * ------------------------------------------------
 * Production-grade action protector with Apple/Google/PayPal security standards.
 * Prevents race conditions, duplicate actions, and ensures data integrity.
 */

export type ActionPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SafeActionResult {
  success: boolean;
  data?: any;
  error?: Error;
  isBlocked?: boolean;
  blockReason?: 'security-lockdown' | 'animation-in-progress' | 'duplicate-action';
}

export const useSafeAction = () => {
  const store = getVaultStore();

  const executeSafeAction = useCallback(async (
    actionId: string,
    asyncFn: () => Promise<any>,
    priority: ActionPriority = 'normal',
    options?: {
      timeout?: number;
      allowDuringAnimation?: boolean;
    }
  ): Promise<SafeActionResult> => {
    // 🚨 PRIORITY 1: Security Lockdown Check (BLOCK EVERYTHING)
    if (store.isSecurityLockdown) {
      console.log('🚫 [SAFE ACTION] BLOCKED - Security lockdown active');
      return { 
        success: false, 
        error: new Error('App in security lockdown'),
        isBlocked: true,
        blockReason: 'security-lockdown'
      };
    }

    // 🚨 PRIORITY 2: Animation Lock Check (BLOCK unless high priority)
    if (store.isGlobalAnimating && priority !== 'high' && !options?.allowDuringAnimation) {
      console.warn('⚠️ [SAFE ACTION] BLOCKED - System busy during animation');
      return { 
        success: false, 
        error: new Error('System busy - animation in progress'),
        isBlocked: true,
        blockReason: 'animation-in-progress'
      };
    }

    // 🚨 PRIORITY 3: Duplicate Action Check (Double-click protection)
    if (store.isActionInProgress(actionId)) {
      console.log(`🚫 [SAFE ACTION] BLOCKED - Duplicate action: ${actionId}`);
      return { 
        success: false, 
        error: new Error('Action already in progress'),
        isBlocked: true,
        blockReason: 'duplicate-action'
      };
    }

    // 🎯 REGISTER ACTION
    store.registerAction(actionId);

    try {
      // ⏱️ TIMEOUT PROTECTION (Default: 10 seconds)
      const timeoutMs = options?.timeout || 10000;
      const timeoutPromise = new Promise<SafeActionResult>((_, reject) => {
        setTimeout(() => reject(new Error('Action timeout')), timeoutMs);
      });

      // 🚀 EXECUTE ACTION WITH TIMEOUT
      const result = await Promise.race([
        asyncFn(),
        timeoutPromise
      ]);

      console.log(`✅ [SAFE ACTION] Completed: ${actionId}`);
      return { success: true, data: result };

    } catch (error) {
      console.error(`❌ [SAFE ACTION] Failed: ${actionId}`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    } finally {
      // 🎯 UNREGISTER ACTION
      store.unregisterAction(actionId);
    }
  }, [store]);

  const isActionInProgress = useCallback((actionId: string) => {
    return store.isActionInProgress(actionId);
  }, [store]);

  const getActiveActions = useCallback(() => {
    return [...(store.activeActions || [])];
  }, [store]);

  return {
    executeSafeAction,
    isActionInProgress,
    getActiveActions,
    isGlobalAnimating: store.isGlobalAnimating,
    isSecurityLockdown: store.isSecurityLockdown
  };
};
