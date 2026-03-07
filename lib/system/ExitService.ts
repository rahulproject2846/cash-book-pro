"use client";

import { useVaultStore } from '@/lib/vault/store';
import { SyncOrchestratorRefactored } from '@/lib/vault/core/SyncOrchestrator';
import { RealtimeEngine } from '@/lib/vault/core/RealtimeEngine';
import { UserManager } from '@/lib/vault/core/user/UserManager';
import { db } from '@/lib/offlineDB';

/**
 * 🏛️ SOVEREIGN EXIT SERVICE - Google-Standard Logout Implementation
 * 
 * Sequential Kill Order:
 * 1. UI LOCK: Set isCleaningVault: true in the store
 * 2. STOP ENGINES: Call orchestrator.forceCleanup() and realtimeEngine.forceDisconnect()
 * 3. WIPE STORE: Call useVaultStore.persist.clearStorage()
 * 4. WIPE DISK (AWAIT): await db.delete()
 * 5. WIPE IDENTITY: localStorage.clear() and sessionStorage.clear()
 * 6. WIPE CACHE: Unregister all Service Workers and clear the Cache API
 * 7. HARD EXIT: Use window.location.href = '/'
 */

let realtimeEngineInstance: RealtimeEngine | null = null;

export const setRealtimeEngineInstance = (instance: RealtimeEngine) => {
  realtimeEngineInstance = instance;
};

export async function sovereignExit(): Promise<void> {
  console.log('🏛️ [SOVEREIGN EXIT] Google-Standard logout initiated...');
  
  try {
    // 🚫 STEP 0: UI LOCK
    console.log('🔒 [STEP 0] Locking UI...');
    useVaultStore.setState({ isCleaningVault: true });
    
    // 🔄 STEP 1: STOP ENGINES
    console.log('🔪 [STEP 1] Killing background engines...');
    
    // Kill SyncOrchestrator background ghosts
    const orchestrator = new SyncOrchestratorRefactored();
    orchestrator.forceCleanup();
    
    // Kill RealtimeEngine background ghosts
    if (realtimeEngineInstance) {
      realtimeEngineInstance.forceDisconnect();
      realtimeEngineInstance = null;
    }
    
    // 🧠 STEP 2: WIPE STORE
    console.log('🧠 [STEP 2] Wiping Zustand store...');
    useVaultStore.persist.clearStorage();
    
    // 💾 STEP 3: WIPE DISK (AWAIT) - NON-NEGOTIABLE WAIT
    console.log('💾 [STEP 3] Wiping IndexedDB (awaiting completion)...');
    if (db) {
      await db.delete();
      console.log('✅ [STEP 3] IndexedDB deletion complete');
    }
    
    // 🗑️ STEP 4: WIPE IDENTITY
    console.log('🗑️ [STEP 4] Wiping browser storage...');
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ [STEP 4] Browser storage cleared');
    }
    
    // 🧹 STEP 5: WIPE CACHE
    console.log('🧹 [STEP 5] Wiping service workers and cache...');
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        // Unregister all service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('✅ [STEP 5] Service workers unregistered');
        
        // Clear all caches
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        console.log('✅ [STEP 5] Cache API cleared');
      } catch (error) {
        console.warn('⚠️ [STEP 5] Cache cleanup failed:', error);
      }
    }
    
    // 🚪 STEP 6: HARD EXIT
    console.log('🚪 [STEP 6] Hard exit - redirecting to root...');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    
    console.log('✅ [SOVEREIGN EXIT] Google-Standard logout complete');
    
  } catch (error) {
    console.error('❌ [SOVEREIGN EXIT] Failed:', error);
    
    // Fallback: Still redirect even if cleanup fails
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

/**
 * 🔒 GET CLEANING VAULT STATE
 */
export const getCleaningVaultState = () => {
  return useVaultStore.getState().isCleaningVault;
};

/**
 * 🔄 RESET CLEANING VAULT STATE (for error recovery)
 */
export const resetCleaningVaultState = () => {
  useVaultStore.setState({ isCleaningVault: false });
  console.log('🔄 [SOVEREIGN EXIT] Cleaning vault state reset');
};
