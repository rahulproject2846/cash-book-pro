import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * 🧠 MODE CONTROLLER - Smart Network State Management
 * Handles network pings and intelligent state transitions
 */
export class ModeController {
  private static pingInterval: NodeJS.Timeout | null = null;
  private static isRunning = false;
  private static lastKnownState: 'OFFLINE' | 'DEGRADED' | 'SYNCING' | 'ONLINE' | 'RESTRICTED' = 'OFFLINE';
  private static isCatchingUp = false;

  /**
   * 🚀 START - Initialize network monitoring
   */
  static start(): void {
    if (ModeController.isRunning) {
      console.log('🧠 [MODE CONTROLLER] Already running, skipping...');
      return;
    }

    ModeController.isRunning = true;
    console.log(' [MODE CONTROLLER] Starting network monitoring...');

    // Initial state check
    ModeController.lastKnownState = 'OFFLINE';

    // Immediate startup ping - detect network state immediately
    ModeController.performHealthCheck();

    // Start health ping interval (every 15 seconds)
    ModeController.pingInterval = setInterval(async () => {
      await ModeController.performHealthCheck();
    }, 15000);

    // Listen for instant offline events
    if (typeof window !== 'undefined') {
      const handleOffline = () => {
        console.log('🧠 [MODE CONTROLLER] Instant offline detected');
        ModeController.updateNetworkState('OFFLINE');
      };
      
      const handleOnline = () => {
        console.log('🧠 [MODE CONTROLLER] Instant online detected - verifying...');
        // CRITICAL: Don't set ONLINE immediately, verify with real ping first
        ModeController.performHealthCheck();
      };
      
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
    }
  }

  /**
   * 🏥 STOP - Cleanup network monitoring
   */
  static stop(): void {
    if (ModeController.pingInterval) {
      clearInterval(ModeController.pingInterval);
      ModeController.pingInterval = null;
    }
    
    ModeController.isRunning = false;
    console.log('🧠 [MODE CONTROLLER] Network monitoring stopped');
  }

  /**
   * 🔍 PERFORM HEALTH CHECK - Ping server and update state
   */
  private static async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // 1. LOCAL PING: Check if local server is reachable
      const localResponse = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store', // ✅ STRICT: Prevent any caching
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!localResponse.ok) {
        throw new Error(`Local server HTTP ${localResponse.status}`);
      }

      const localLatency = Date.now() - startTime;
      console.log(`🏥 [MODE CONTROLLER] Local health check successful: ${localLatency}ms`);

      // 2. EXTERNAL PING: Check if real internet is reachable
      let externalConnected = false;
      try {
        const externalStart = Date.now();
        const externalResponse = await fetch('https://www.google.com/favicon.ico', {
          method: 'GET',
          mode: 'no-cors', // ✅ Avoid CORS issues
          cache: 'no-store', // ✅ Prevent caching
          signal: AbortSignal.timeout(3000) // 3 second timeout for external
        });
        externalConnected = true;
        const externalLatency = Date.now() - externalStart;
        console.log(`� [MODE CONTROLLER] External connectivity check successful: ${externalLatency}ms`);
      } catch (externalError) {
        console.warn(`⚠️ [MODE CONTROLLER] External connectivity failed:`, externalError);
        externalConnected = false;
      }

      // 3. STATE LOGIC: Use store as single source of truth
      const currentStoreState = getVaultStore().networkMode;
      
      if (currentStoreState === 'OFFLINE') {
        // Coming back online - transition to SYNCING first
        ModeController.updateNetworkState('SYNCING');
        console.log('🔄 [MODE CONTROLLER] Transition: OFFLINE → SYNCING');
        
        // 🚀 CATCH-UP MODE: Trigger sync when coming back online
        if (!ModeController.isCatchingUp) {
          ModeController.isCatchingUp = true;
          console.log('🚀 [MODE CONTROLLER] Starting catch-up sync...');
          
          try {
            const syncResult = await getVaultStore().triggerManualSync();
            console.log('✅ [MODE CONTROLLER] Catch-up sync completed');
            
            // 🛡️ V5.5 SECURITY VALIDATION: Check for profile/security failures
            // Note: triggerManualSync returns void, so we need to check store state directly
            const { emergencyHydrationStatus, isSecurityLockdown } = getVaultStore();
            if (emergencyHydrationStatus === 'failed' || isSecurityLockdown) {
              console.error('🛡️ [MODE CONTROLLER] Security failure detected - ACTIVATING LOCKDOWN');
              getVaultStore().setSecurityLockdown(true);
              ModeController.updateNetworkState('RESTRICTED');
              console.log('🔒 [MODE CONTROLLER] Security failure → RESTRICTED');
              return;
            }
            
            // ✅ SYNCING TRAP FIX: Immediately determine next state after sync
            if (!externalConnected) {
              // Local works but external doesn't → DEGRADED
              ModeController.updateNetworkState('DEGRADED');
              console.log('⚠️ [MODE CONTROLLER] Sync completed but external failed → DEGRADED');
            } else if (localLatency <= 1500) {
              // Both work and fast → ONLINE
              ModeController.updateNetworkState('ONLINE');
              console.log('✅ [MODE CONTROLLER] Sync completed with good latency → ONLINE');
            } else {
              // Both work but slow → DEGRADED
              ModeController.updateNetworkState('DEGRADED');
              console.log(`⚠️ [MODE CONTROLLER] Sync completed but slow (${localLatency}ms) → DEGRADED`);
            }
            
          } catch (error) {
            console.error('❌ [MODE CONTROLLER] Catch-up sync failed:', error);
            // Sync failed → stay DEGRADED
            ModeController.updateNetworkState('DEGRADED');
          } finally {
            ModeController.isCatchingUp = false;
          }
        }
      } else {
        // ✅ EXTERNAL AWARENESS: Consider both local and external connectivity
        if (!externalConnected) {
          // Local works but external doesn't → DEGRADED
          ModeController.updateNetworkState('DEGRADED');
          console.log('⚠️ [MODE CONTROLLER] Local OK but external failed → DEGRADED');
        } else if (localLatency <= 1500) {
          // Both work and fast → ONLINE
          ModeController.updateNetworkState('ONLINE');
        } else {
          // Both work but slow → DEGRADED
          ModeController.updateNetworkState('DEGRADED');
          console.log(`⚠️ [MODE CONTROLLER] Slow connection (${localLatency}ms) → DEGRADED`);
        }
      }

    } catch (error) {
      console.error('❌ [MODE CONTROLLER] Health check failed:', error);
      
      // ✅ IMMEDIATE OFFLINE: Any local failure goes straight to OFFLINE
      ModeController.updateNetworkState('OFFLINE');
      console.log('🔴 [MODE CONTROLLER] Health check failed → OFFLINE');
    }
  }

  /**
   * 🔄 UPDATE NETWORK STATE - Central state management
   */
  private static updateNetworkState(newState: 'OFFLINE' | 'DEGRADED' | 'SYNCING' | 'ONLINE' | 'RESTRICTED'): void {
    ModeController.lastKnownState = newState;
    
    const store = getVaultStore();
    store.setNetworkMode(newState);
    
    console.log(`🔄 [MODE CONTROLLER] State updated: ${newState}`);
  }

  /**
   * 📊 GET CURRENT STATE
   */
  static getCurrentState(): 'OFFLINE' | 'DEGRADED' | 'SYNCING' | 'ONLINE' | 'RESTRICTED' {
    return ModeController.lastKnownState;
  }
}
