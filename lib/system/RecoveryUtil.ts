"use client";

import { db } from '@/lib/offlineDB';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { UserManager } from '@/lib/vault/core/user/UserManager';

/**

 * NUCLEAR RECOVERY UTILITY - The Fail-Safe
 * 🔄 NUCLEAR RECOVERY UTILITY - The Fail-Safe

 * 

 * This utility provides a complete reset mechanism for corrupted state.

 * Should only be used as last resort when user is stuck in unrecoverable state.

 */



/**

 * 🚨 NUCLEAR RESET - Complete app reset and rehydration

 * 

 * WARNING: This will delete ALL local data and restart the application.

 * Only use this when the app is completely stuck and cannot recover.

 */

export async function nuclearReset(): Promise<void> {

  try {

    // 🛡️ SAFETY CHECK: Confirm user intent

    const userConfirmed = confirm(

      '⚠️ NUCLEAR RESET WARNING ⚠️\n\n' +

      'This will:\n' +

      '• Delete ALL local data (books, entries, settings)\n' +

      '• Clear browser storage\n' +

      '• Restart the application\n' +

      '• Re-sync from server\n\n' +

      'Are you sure you want to proceed? This cannot be undone.'

    );



    if (!userConfirmed) {

      console.log('🛡️ [NUCLEAR RESET] User cancelled nuclear reset');

      return;

    }



    console.log('🚨 [NUCLEAR RESET] Starting complete app reset...');



    // 🗑️ STEP 1: Clear IndexedDB

    if (db) {

      console.log('🗑️ [NUCLEAR RESET] Deleting IndexedDB...');

      await db.delete();

      console.log('✅ [NUCLEAR RESET] IndexedDB deleted');

    }



    // 🗑️ STEP 2: Clear localStorage and session storage

    if (typeof window !== 'undefined') {

      console.log('🗑️ [NUCLEAR RESET] Clearing browser storage...');

      localStorage.clear();

      sessionStorage.clear();

      console.log('✅ [NUCLEAR RESET] Browser storage cleared');

    }



    // 🗑️ STEP 3: Clear Service Workers

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {

      try {

        console.log('🗑️ [NUCLEAR RESET] Unregistering service workers...');

        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.all(registrations.map(reg => reg.unregister()));

        console.log('✅ [NUCLEAR RESET] Service workers unregistered');

      } catch (error) {

        console.warn('⚠️ [NUCLEAR RESET] Failed to unregister service workers:', error);

      }

    }



    // 🗑️ STEP 4: Clear Cache API

    if (typeof window !== 'undefined' && 'caches' in window) {

      try {

        console.log('🗑️ [NUCLEAR RESET] Clearing cache API...');

        const cacheNames = await caches.keys();

        await Promise.all(cacheNames.map(name => caches.delete(name)));

        console.log('✅ [NUCLEAR RESET] Cache API cleared');

      } catch (error) {

        console.warn('⚠️ [NUCLEAR RESET] Failed to clear caches:', error);

      }

    }



    // 🔄 STEP 5: Force page reload

    console.log('🔄 [NUCLEAR RESET] Reloading application...');

    

    // Small delay to ensure cleanup completes

    setTimeout(() => {

      if (typeof window !== 'undefined') {

        window.location.reload();

      }

    }, 500);



  } catch (error) {

    console.error('❌ [NUCLEAR RESET] Failed to reset application:', error);

    

    // �️ SAFE NUCLEAR RESET - Centralized authoritative reset method

    await safeNuclearReset();

  }

}



/**

 * 🛡️ SAFE NUCLEAR RESET - Centralized authoritative reset method

 */

export async function safeNuclearReset(): Promise<void> {

  console.log('🛡️ [RECOVERY] Starting safe nuclear reset...');

  

  try {

    // Step 1: Clear database (use imported db with singleton pattern)

    if (db) {

      await db.delete();

      console.log('🧹 [RECOVERY] Database deleted successfully');

    }

    // Step 2: Clear identity
    if (typeof window !== 'undefined') {
      UserManager.getInstance().clearAll();
      console.log('🧹 [RECOVERY] Identity cleared');
    }

    // Step 3: Clear localStorage
    if (typeof window !== 'undefined') {

      localStorage.removeItem('cashbookUser');

      console.log('🧹 [RECOVERY] LocalStorage cleared');

    }

    

    // Step 4: Small delay to ensure cleanup completes

    await new Promise(resolve => setTimeout(resolve, 100));

    

    // Step 5: Redirect to login

    if (typeof window !== 'undefined') {

      window.location.href = '/';

    }

    

  } catch (error) {

    console.error('❌ [RECOVERY] Safe nuclear reset failed:', error);

    // Emergency fallback

    if (typeof window !== 'undefined') {

      window.location.href = '/';

    }

  }

}



/**

 * 🛡️ SAFE RECOVERY CHECK - Determine if nuclear reset is needed

 * 

 * @returns {boolean} Whether nuclear reset should be offered

 */

export function shouldOfferNuclearReset(): boolean {

  try {

    const { isSecurityLockdown, syncStatus, conflicts } = getVaultStore();

    

    // Offer reset if:

    // 1. Security lockdown for more than 30 seconds

    // 2. Sync stuck in 'syncing' state for extended period

    // 3. High number of unresolved conflicts

    

    const lockdownTooLong = isSecurityLockdown && 

      Date.now() - (getVaultStore().lastSyncedAt || 0) > 30000;

    

    const syncStuck = syncStatus === 'syncing' && 

      Date.now() - (getVaultStore().lastSyncedAt || 0) > 60000;

    

    const tooManyConflicts = conflicts.length > 10;

    

    return lockdownTooLong || syncStuck || tooManyConflicts;

    

  } catch (error) {

    console.warn('⚠️ [NUCLEAR RESET] Failed to check recovery conditions:', error);

    return false;

  }

}



/**

 * 🔄 SOFT RECOVERY - Attempt to recover without nuclear reset

 * 

 * @returns {boolean} Whether soft recovery was successful

 */

export async function attemptSoftRecovery(): Promise<boolean> {

  try {

    console.log('🔄 [SOFT RECOVERY] Attempting soft recovery...');

    

    // 🔄 STEP 1: Clear sync state

    const { setSyncStatus, setSecurityLockdown } = getVaultStore();

    setSyncStatus('idle');

    setSecurityLockdown(false);

    

    // 🔄 STEP 2: Clear conflicts

    const { resolveConflict } = getVaultStore();

    const conflicts = getVaultStore().conflicts;

    conflicts.forEach(conflict => {

      resolveConflict(conflict.id);

    });

    

    // 🔄 STEP 3: Trigger fresh sync

    const { triggerManualSync } = getVaultStore();

    await triggerManualSync();

    

    console.log('✅ [SOFT RECOVERY] Soft recovery completed successfully');

    return true;

    

  } catch (error) {

    console.error('❌ [SOFT RECOVERY] Soft recovery failed:', error);

    return false;

  }

}

