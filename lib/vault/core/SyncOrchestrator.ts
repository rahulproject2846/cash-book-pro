"use client";

/**
 * 🚀 REFACTORED SYNC ORCHESTRATOR - Clean Architecture Implementation
 * 
 * SOLID Principles Implementation:
 * - Single Responsibility: Each service has one job
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Services are interchangeable
 * - Interface Segregation: Focused interfaces
 * - Dependency Inversion: Depends on abstractions
 */

import { ModeController } from '../../system/ModeController';
import { HydrationController } from '../hydration/HydrationController';
import { IntegrityService } from '../services/IntegrityService';
import { MaintenanceService } from '../services/MaintenanceService';
import { UserManager } from './user/UserManager';
import { telemetry } from '../Telemetry';
import { db } from '@/lib/offlineDB';
import { PushService } from '../services/PushService';
import { PullService } from '../services/PullService';
import { RiskManager, LicenseVault } from '../security';
import { getVaultStore } from '../store/storeHelper';
import { SyncGuard } from '../guards/SyncGuard';

/**
 * 🚀 REFACTORED SYNC ORCHESTRATOR - Clean Architecture Implementation
 */
export class SyncOrchestratorRefactored {
  private pushService: PushService | null = null;
  private pullService: PullService | null = null;
  private hydrationController: HydrationController;
  private integrityService: IntegrityService;
  private maintenanceService: MaintenanceService;
  private channel: BroadcastChannel | null = null;
  private isInitialized = false;
  private static isInitializing = false;
  private static initializationPromise: Promise<void> | null = null;
  private tabId = Math.random().toString(36).substr(2, 9);
  private lastRefreshTime: number = 0;
  private syncDebounceTimeout: NodeJS.Timeout | null = null;
  private pendingSyncOperations: Array<{ timestamp: number; source: string; changedCid?: string }> = [];

  private syncServiceIdentities(userId: string): void {
    this.pushService?.setUserId(userId);
    this.pullService?.setUserId(userId);
    this.hydrationController.setUserId(userId);
    this.integrityService.setUserId(userId);
  }

  private getChannel(): BroadcastChannel {
    if (!this.channel) {
      this.channel = new BroadcastChannel('vault_global_sync');
      console.log('🛡️ [ORCHESTRATOR] Created new BroadcastChannel');

      this.channel.onmessage = (event) => {
        if (event.data?.sourceTabId === this.tabId) {
          console.log('🛡️ [ORCHESTRATOR] Ignoring self-broadcast message');
          return;
        }

        if (SyncOrchestratorRefactored.isInitializing) {
          console.log('🛡️ [ORCHESTRATOR] Ignoring broadcast - sync already running');
          return;
        }

        if (event.data?.type === 'FORCE_REFRESH') {
          console.log('📡 [ORCHESTRATOR] Cross-tab refresh signal received');
          this.notifyUI('CrossTab');
        }
      };
    }

    return this.channel;
  }

  constructor() {
    this.hydrationController = HydrationController.getInstance();
    this.integrityService = new IntegrityService();
    this.maintenanceService = new MaintenanceService();

    // 🚀 IMMEDIATE SERVICE INITIALIZATION: Create services at constructor time
    // Services MUST exist from Millisecond 0 to catch all vault-updated events
    this.pushService = new PushService();
    this.pullService = new PullService();

    console.log('🔄 [ORCHESTRATOR] Initialized with immediate service creation');

    // 🆕 REACTIVE SYNC: Listen for vault-updated events
    if (typeof window !== 'undefined') {
      window.addEventListener('vault-updated', (event: any) => {
        const source = event.detail?.source || 'unknown';
        const origin = event.detail?.origin || 'unknown';
        const changedCid = event.detail?.changedCid || null;

        // 🛡️ IGNORE BACKGROUND SYNC: Only trigger for local user actions
        if ((origin === 'local-mutation' || origin === 'batch-mutation') && source === 'HydrationController') {
          // 🆕 PREVENT REFRESH SPAM: Only allow refreshBooks once per second
          const now = Date.now();
          if (now - this.lastRefreshTime < 1000) {
            console.log('🛡️ [ORCHESTRATOR] RefreshBooks spam prevented, skipping');
            return;
          }
          this.lastRefreshTime = now;

          console.log('📡 [ORCHESTRATOR] Vault update detected, queuing for debounced sync', { changedCid });

          // 🎯 ADD TO PENDING QUEUE: Track operation
          this.pendingSyncOperations.push({ 
            timestamp: Date.now(), 
            source: 'batch-mutation',
            changedCid // 🚨 SYNC TSUNAMI GUARD: Track specific CID
          });

          // DEBOUNCE: Clear existing timeout and set new 500ms delay
          if (this.syncDebounceTimeout) {
            clearTimeout(this.syncDebounceTimeout);
          }

          // 🚨 STORM SUPPRESSION: Check if push is already in-flight before scheduling
          if (this.pushService?.isSyncing) {
            console.log('🛡️ [ORCHESTRATOR] Push already in-flight, queueing for later');
            // Queue the operation but don't trigger immediate push
            this.pendingSyncOperations.push({ 
              timestamp: Date.now(), 
              source: 'batch-mutation-queued',
              changedCid 
            });
            return;
          }

          this.syncDebounceTimeout = setTimeout(() => {
            console.log(`[ORCHESTRATOR] Local mutation detected. Triggering PUSH only.`);
            this.pendingSyncOperations = []; 
            // 🚨 REMOVE OPTIONAL CHAINING: Services must exist
            if (this.pushService) {
              this.pushService.pushPendingData(changedCid);
            } else {
              console.error('🚨 [ORCHESTRATOR_FATAL] PushService object is missing during event dispatch!');
            }
          }, 800);
        }
      });
    }
  }

  /**
   * 🛡️ SERVICE IDENTITY PROPAGATION - Set userId for existing services
   */
  private async ensureServicesInitialized(): Promise<void> {
    const freshUserId = UserManager.getInstance().getUserId();
    if (freshUserId && this.pushService && this.pullService) {
      // Services already exist in constructor, just set their userId
      this.syncServiceIdentities(freshUserId);
      console.log('✅ [ORCHESTRATOR] Service identities set with userId:', freshUserId);
    } else if (!freshUserId) {
      console.warn('🛡️ [ORCHESTRATOR] Cannot set service identities - no userId available');
    }
  }

  /**
   * 🚀 GATE-BASED INITIALIZATION - Sequential Chain of Command
   */
  private async performGateBasedInitialization(userId?: string): Promise<void> {
    // 🚨 LOGIN PAGE GUARD: Prevent background sync during login
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      console.log('🚨 [ORCHESTRATOR] Login page detected - preventing background services');
      return;
    }
    
    const store = getVaultStore();
    
    try {
      // 🛡️ WAIT FOR IDENTITY MANAGER TO BE READY
      console.log('⏳ [ORCHESTRATOR] Initializing UserManager...');
      await UserManager.getInstance().init();
      console.log('✅ [ORCHESTRATOR] UserManager initialization complete');
      
      // 🆕 SYNC GUARD: Centralized validation
      const guardResult = await SyncGuard.validateSyncAccess({
        serviceName: 'SyncOrchestrator',
        operation: 'initialize',
        onError: async (msg, details) => {
          console.warn(`🔒 [SECURITY] Sync Alert: ${msg}`);
          // Only lockdown for license failure or tampering
          if (details?.licenseAccess?.status === 'REJECTED') {
            getVaultStore().setSecurityLockdown(true);
          } else {
            console.log('🛡️ [ORCHESTRATOR] Minor sync issue detected, continuing without lockdown.');
          }
        },
        returnError: () => undefined
      });
      if (!guardResult.valid) {
        console.warn('🔒 [ORCHESTRATOR] Initialization blocked by security validation');
        return;
      }
      
      // 🆕 GET VALIDATED USER ID FROM SYNC GUARD
      userId = guardResult.userId || UserManager.getInstance().getUserId() || '';
      
      // 🔄 UNIFIED SERVICE PROPAGATION: Set userId for all services IMMEDIATELY
      const orchestratorUserId = UserManager.getInstance().getUserId();
      if (orchestratorUserId) {
        this.syncServiceIdentities(orchestratorUserId);
      }
      
      // 🆕 GATE 1: Wait for Identity
      store.setBootStatus('IDENTITY_WAIT');
      console.log('🔄 [ORCHESTRATOR] Gate 1: Waiting for identity...');
      
      const identityUserId = await UserManager.getInstance().waitForIdentity();
      console.log('✅ [ORCHESTRATOR] Gate 1: Identity ready:', identityUserId);

      // 🛡️ LAZY SERVICE INITIALIZATION: Create services only after identity confirmed
      await this.ensureServicesInitialized();

      // 🛡️ GATE 2: Profile Sync + Store Update
      store.setBootStatus('PROFILE_SYNC');
      console.log('🔄 [ORCHESTRATOR] Gate 2: Fetching user profile...');
      
      // 🧠 MODE CONTROLLER: Start network monitoring IMMEDIATELY for profile hydration
      ModeController.start();
      console.log('🧠 [ORCHESTRATOR] ModeController started - Network monitoring active');
      
      // 🚨 CRITICAL FIX: Fetch full user profile from Dexie and update Zustand store
      const gateUserId = UserManager.getInstance().getUserId();
      const user = await db.users.get(gateUserId || '');
      if (!user || !user.username || user.plan === undefined) {
        console.log('🔧 [ORCHESTRATOR] User profile missing or incomplete, hydrating...');
        try {
          await this.hydrationController.hydrateUser(orchestratorUserId || '');
          
          console.log('✅ [ORCHESTRATOR] Gate 2: Profile hydrated');
          
          // 🚨 FORCE LOGIN SUCCESS: Always call loginSuccess after hydration
          const updatedUser = await db.users.get(gateUserId || '');
          console.log('🚨 [ORCHESTRATOR] Gate 2: Updating Zustand store with user profile:', { userId: updatedUser?._id, username: updatedUser?.username });
          
          // 🛡️ USERNAME GUARD: Verify username exists before calling loginSuccess
          if (!updatedUser?.username) {
            console.error('🚨 [ORCHESTRATOR] CRITICAL: Hydration failed to provide username - forcing final attempt');
            try {
              // Force final hydration attempt
              await this.hydrationController.hydrateUser(orchestratorUserId || '');
              const finalUser = await db.users.get(gateUserId || '');
              if (finalUser?.username) {
                console.log('🚨 [ORCHESTRATOR] Final hydration successful, calling loginSuccess');
                await store.loginSuccess(finalUser);
              } else {
                console.error('🚨 [ORCHESTRATOR] CRITICAL FAILURE: All hydration attempts failed - CANNOT call loginSuccess without username');
                return;
              }
            } catch (finalError) {
              console.error('🚨 [ORCHESTRATOR] CRITICAL FAILURE: Final hydration attempt failed:', finalError);
              return;
            }
          } else {
            await store.loginSuccess(updatedUser);
          }
        } catch (error) {
          // 🧠 SMART ERROR CLASSIFICATION: Distinguish recoverable from critical errors
          const errorStr = String(error);
          const is404Error = errorStr.includes('404') || 
                         errorStr.includes('Profile not found') ||
                         errorStr.includes('Failed to fetch user profile');
          const isNetworkError = errorStr.includes('fetch') || 
                               errorStr.includes('ECONNREFUSED') ||
                               errorStr.includes('NetworkError') ||
                               errorStr.includes('timeout');
          const isServerError = errorStr.includes('500') || 
                              errorStr.includes('Internal Server Error');
          const isCryptoError = errorStr.includes('CRITICAL_CRYPTOGRAPHIC_ERROR') ||
                               errorStr.includes('VAULT_CLIENT_SECRET');
          
          if (is404Error) {
            // 🛡️ SOFT FAILURE: Allow Self-Healing without lockdown
            console.warn('⚠️ [ORCHESTRATOR] 404 detected, allowing Self-Healing without lockdown.');
            return;
          }
          
          if (isNetworkError) {
            // 🌐 NETWORK FAILURE: Temporary issue, no lockdown needed
            console.warn('⚠️ [ORCHESTRATOR] Network error detected, will retry later.');
            return;
          }
          
          if (isCryptoError) {
            // 🔐 CRYPTOGRAPHIC ERROR: Missing security key - show specialized toast
            console.warn('⚠️ [ORCHESTRATOR] Security key missing - Running in local mode only');
            store.setBootStatus('READY'); // Allow boot to continue
            store.setSecurityErrorMessage('Security Key Missing - Running in local mode only');
            
            // Show specialized toast
            if (typeof window !== 'undefined') {
              const toastEvent = new CustomEvent('show-toast', {
                detail: {
                  type: 'warning',
                  title: 'Security Key Missing',
                  message: 'Running in local mode only. Set VAULT_CLIENT_SECRET for full functionality.',
                  duration: 5000
                }
              });
              window.dispatchEvent(toastEvent);
            }
            return; // Continue boot without lockdown
          }
          
          // 🛡️ CRITICAL ERROR: Only lockdown for server errors or security issues
          store.setBootStatus('IDLE');
          store.setEmergencyHydrationStatus('failed');
          store.setSecurityLockdown(true);
          store.setSecurityErrorMessage('Critical error: Server error. Lockdown activated.');
          throw error;
        }
      } else {
        console.log('✅ [ORCHESTRATOR] Gate 2: User profile found, updating Zustand store');
        console.log('🚨 [ORCHESTRATOR] Gate 2: Updating Zustand store with user profile:', { userId: user._id, username: user.username });
        
        // 🛡️ EMPTY STRING GUARD: Prevent empty username overwrite
        if (user && user.username && user.username !== '') {
          await store.loginSuccess(user);
        } else {
          console.warn('🛡️ [ORCHESTRATOR] Blocking empty username overwrite to preserve UI integrity');
        }
      }

      // 🛡️ GATE 3: Data Hydration
      store.setBootStatus('DATA_HYDRATION');
      console.log('🔄 [ORCHESTRATOR] Gate 3: Starting sequential hydration...');
      
      // 🌁 BRIDGE THE IDENTITY GAP
      const bridgeUserId = UserManager.getInstance().getUserId();
      if (bridgeUserId) {
        this.pushService?.setUserId(bridgeUserId);
        this.pullService?.setUserId(bridgeUserId);
        this.hydrationController.setUserId(bridgeUserId);
        this.integrityService.setUserId(bridgeUserId);
      }
      getVaultStore().setSecurityLockdown(false);
      
      const hydrationResult = await this.hydrationController.fullHydration(true);
      if (!hydrationResult.success) {
        console.warn('⚠️ [ORCHESTRATOR] Hydration failed, continuing boot with degraded functionality:', hydrationResult.error);
      } else {
        console.log('✅ [ORCHESTRATOR] Gate 3: Data hydration complete');
      }

      // 🔄 RAM SYNCHRONIZATION: Pull all books and entries from Dexie into Zustand store
      console.log('🔄 [ORCHESTRATOR] Synchronizing RAM from Dexie...');
      await store.refreshData();
      console.log('✅ [ORCHESTRATOR] RAM synchronization complete');

      // 🔄 BACKGROUND PULL: Trigger data pull after Gate 3 hydration is complete
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [ORCHESTRATOR] Triggering background data pull...');
      }
      
      // 🛡️ SERVICE SETUP: Set user IDs BEFORE triggering pull
      const serviceUserId = UserManager.getInstance().getUserId();
      if (serviceUserId) {
        this.pushService?.setUserId(serviceUserId);
        this.pullService?.setUserId(serviceUserId);
        this.integrityService.setUserId(serviceUserId);
      }
      
      try {
        // 🛡️ DOUBLE-PULL PROTECTION: Check if pull is already in progress
        const pullStatus = this.pullService?.getPullStatus();
        if (pullStatus?.isPulling) {
          console.log('🛡️ [ORCHESTRATOR] Pull already in progress, skipping...');
          return;
        }
        
        // 🚀 FLASH-PASS: Local data check for instant boot
        const localCount = await db.books.count();
        if (localCount > 0) {
          // ⚡ RETURNING USER: Skip blocking pull, sync in background
          console.log('⚡ [ORCHESTRATOR] Flash-Pass: Local data found, sync moved to background.');
          
          // Fire pull without await - non-blocking
          this.pullService?.pullPendingData().then(pullResult => {
            if (pullResult && pullResult.success) {
              console.log('✅ [ORCHESTRATOR] Background pull completed successfully');
              // 🔄 BACKGROUND UI REFRESH: Update UI silently after background sync
              store.refreshBooks('BACKGROUND_SYNC');
            } else {
              console.warn('⚠️ [ORCHESTRATOR] Background pull blocked/failed:', pullResult?.errors || 'Unknown security block');
            }
          }).catch(error => {
            console.warn('⚠️ [ORCHESTRATOR] Background pull failed, continuing boot:', error);
          });
        } else {
          // ⏳ FIRST-TIME USER: Wait for server pull
          console.log('⏳ [ORCHESTRATOR] Cold-Start: No local data, waiting for server pull.');
          
          // 🛡️ RACE CONDITION PROTECTION: Wait for stable identity before pull
          const userId = UserManager.getInstance().getUserId();
          if (!userId) {
            console.warn('⚠️ [ORCHESTRATOR] User ID not available, deferring server pull...');
            return;
          }
          
          const pullResult = await this.pullService?.pullPendingData();
          if (pullResult && pullResult.success) {
            console.log('✅ [ORCHESTRATOR] Background pull completed successfully');
          } else {
            console.warn('⚠️ [ORCHESTRATOR] Background pull blocked/failed:', pullResult?.errors || 'Unknown security block');
          }
        }
      } catch (error) {
        console.warn('⚠️ [ORCHESTRATOR] Background pull failed, continuing boot:', error);
      }

      console.log('🔄 [ORCHESTRATOR] Final check: Waiting for books to hydrate...');
      await store.refreshBooks('INITIAL_BOOT');
      store.setBootStatus('READY');
      
      // 🔄 INDEXEDDB SETTLE: Allow small delay for DB to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      // 🔄 COUNTERS REFRESH: Already handled by refreshData in Gate 3
      // await store.refreshCounters(); // REMOVED - Redundant call
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [ORCHESTRATOR] UI counters refreshed after hydration');
        console.log('✅ [ORCHESTRATOR] Gate 4: Boot sequence complete - System READY');
      }

      // 🛡️ LOCKDOWN RESET: Ensure any old lockdown is cleared
      store.setSecurityLockdown(false);
      console.log('🔓 [ORCHESTRATOR] Lockdown cleared - System fully operational');
      
      // 🚀 BRUTE-FORCE INTERACTION RESET: Clear any stuck overlays
      store.clearOverlays();
      document.body.style.pointerEvents = 'auto';
      console.log('🔓 [ORCHESTRATOR] Interaction reset - All overlays cleared');
      console.log('🔄 [ORCHESTRATOR] Boot sequence complete - UI should be responsive');

      // 🚀 PARALLEL SERVICE STARTUP: Initialize all background services concurrently
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [ORCHESTRATOR] Starting background services...');
      }
      
      const serviceResults = await Promise.allSettled([
        // 🛡️ DEFERRED MAINTENANCE: Move out of critical boot path
        setTimeout(() => this.integrityService?.performIntegrityCheck(), 15000), // 15 seconds delay
        setTimeout(() => this.maintenanceService?.performGlobalCleanup(serviceUserId || ''), 10000) // 10 seconds delay
      ]);
      
      // Check for any service failures
      const failedServices = serviceResults.filter(result => result.status === 'rejected');
      if (failedServices.length > 0) {
        console.warn('⚠️ [ORCHESTRATOR] Some background services failed:', failedServices);
      }
      
      // Schedule integrity checks after initial check
      this.integrityService.scheduleIntegrityChecks();
      console.log('🏁 [ORCHESTRATOR] All systems ready - Chain of Command complete');
      
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Gate-based initialization failed:', error);
      const store = getVaultStore();
      const errorStr = String(error);
      
      // 🧠 LOG TO TELEMETRY
      try {
        const { telemetry } = await import('../Telemetry');
        await telemetry.log({
          type: 'ERROR',
          level: 'ERROR',
          message: `Gate-based initialization failed: ${errorStr}`,
          data: { error: errorStr, stack: error instanceof Error ? error.stack : undefined }
        });
      } catch (telemetryError) {
        console.warn('Failed to log to telemetry:', telemetryError);
      }
      
      // 🛡️ SMART LOCKDOWN: Only lockdown for critical security issues
      if (errorStr.includes('SECURITY') || errorStr.includes('TAMPERING')) {
        store.setBootStatus('IDLE');
        store.setEmergencyHydrationStatus('failed');
        store.setSecurityLockdown(true);
        store.setSecurityErrorMessage('Critical security error detected. Lockdown activated.');
      } else {
        // 🚀 DEGRADED MODE: Continue boot for non-critical errors
        store.setBootStatus('READY');
        store.setSecurityErrorMessage('System started in degraded mode due to initialization error.');
        console.log('🛡️ [ORCHESTRATOR] Continuing in degraded mode - non-critical error detected');
      }
    }
  }

  /**
   * 🚀 TRIGGER SYNC - Main sync orchestration method
   */
  async triggerSync(options?: { mode?: 'PUSH_ONLY' | 'FULL' }): Promise<void> {
    try {
      // 🛡️ SYNC GUARD: Validate before proceeding
      const guardResult = await SyncGuard.validateSyncAccess({
        serviceName: 'SyncOrchestrator',
        operation: 'triggerSync',
        onError: async (msg, details) => {
          console.warn(`🔒 [SECURITY] Sync Blocked: ${msg}`);
          if (details && details.licenseAccess) {
            await telemetry.log({
              type: 'SECURITY',
              level: 'CRITICAL',
              message: `Lockdown triggered: INVALID_LICENSE - ${details.licenseAccess.reason}`,
              data: { reason: details.licenseAccess.reason, plan: details.licenseAccess.plan }
            });
          }
          getVaultStore().setSecurityLockdown(true);
        },
        returnError: () => undefined
      });
      
      if (!guardResult.valid) {
        console.warn('� [ORCHESTRATOR] Sync blocked by security validation');
        return;
      }
      
      // 🆕 GET VALIDATED USER ID FROM SYNC GUARD
      const freshUserId = guardResult.userId || UserManager.getInstance().getUserId() || '';
      if (!freshUserId) {
        console.warn('⚠️ [ORCHESTRATOR] No userId available for sync');
        return;
      }
      
      // 🔄 UNIFIED SERVICE PROPAGATION: Set userId for all services IMMEDIATELY
      this.syncServiceIdentities(freshUserId);
      
      const store = getVaultStore();
      console.log('🔄 [ORCHESTRATOR] Starting sequential sync...');
      
      // 🛡️ PULL FIRST: Always pull latest data before pushing
      if (options?.mode !== 'PUSH_ONLY') {
        const pullStatus = this.pullService?.getPullStatus();
        if (pullStatus?.isPulling) {
          console.log('🛡️ [ORCHESTRATOR] Pull already in progress, skipping...');
          return;
        }
        
        const pullResult = await this.pullService?.pullPendingData();
        if (pullResult && pullResult.success) {
          console.log('✅ [ORCHESTRATOR] Pull completed successfully');
          // 🔄 BACKGROUND UI REFRESH: Update UI after pull
          store.refreshBooks('SYNC_PULL');
        } else {
          console.warn('⚠️ [ORCHESTRATOR] Pull blocked/failed:', pullResult?.errors || 'Unknown security block');
          return;
        }
      }
      
      // � PUSH SECOND: Push local changes to server
      const pushResult = await this.pushService?.pushPendingData();
      if (pushResult && pushResult.success) {
        console.log('✅ [ORCHESTRATOR] Push completed successfully');
        // 🔄 BACKGROUND UI REFRESH: Update UI after push
        store.refreshBooks('SYNC_PUSH');
      } else {
        console.warn('⚠️ [ORCHESTRATOR] Push blocked/failed:', pushResult?.errors || 'Unknown security block');
      }
      
      console.log('✅ [ORCHESTRATOR] Sequential sync completed successfully');
      
      // Notify UI
      this.notifyUI('SyncOrchestrator');
      
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Manual sync failed:', error);
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'Manual sync failed',
        data: { error: String(error), userId: UserManager.getInstance().getUserId() }
      });
    }
  }

  /**
   * 📡 NOTIFY UI - Origin-aware event dispatching
   */
  private notifyUI(origin?: string): void {
    if (typeof window !== 'undefined') {
      // ✅ DISPATCH WITH tabId TO PREVENT SELF-LOOP
      window.dispatchEvent(new CustomEvent('vault-updated', { 
        detail: { 
          source: origin || 'SyncOrchestrator',
          origin: origin || 'SyncOrchestrator',
          tabId: this.tabId
        } 
      }));
      
      // Only broadcast to other tabs if not self-originated
      if (origin !== 'UI_REFRESH') {
        this.getChannel().postMessage({ 
          type: 'FORCE_REFRESH',
          source: 'SyncOrchestrator',
          origin: origin || 'SyncOrchestrator',
          sourceTabId: this.tabId
        });
      }
    }
  }

  /**
   * 🧹 CLEANUP: Prevent memory leaks
   */
  private cleanup(): void {
    // Clear debounce timeout
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
      this.syncDebounceTimeout = null;
    }
    
    // Clear pending operations
    this.pendingSyncOperations = [];
    
    // Close broadcast channel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    console.log('🧹 [ORCHESTRATOR] Cleanup completed');
  }

  /**
   * 🔐 LOGOUT: Clean up on user logout
   */
  logout(): void {
    console.log('🔐 [REFACTORED ORCHESTRATOR] User logout, cleaning up...');
    this.cleanup();
    
    // 🛡️ V5.5 SECURITY: Clear user profile to prevent next login bypass
    db.users.clear().then(() => {
      console.log('🧹 [ORCHESTRATOR] User profile cleared from Dexie');
    }).catch((error: any) => {
      console.error('❌ [ORCHESTRATOR] Failed to clear user profile:', error);
    });
  }

  /**
   * 🔪 FORCE CLEANUP: Kill all background ghosts for Sovereign Exit
   */
  forceCleanup(): void {
    console.log('🔪 [ORCHESTRATOR] Force cleanup initiated - killing all background ghosts...');
    
    // Clear sync debounce timeout
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
      this.syncDebounceTimeout = null;
      console.log('🔪 [ORCHESTRATOR] Sync debounce timeout killed');
    }
    
    // Clear pending operations
    this.pendingSyncOperations = [];
    console.log('🔪 [ORCHESTRATOR] Pending sync operations cleared');
    
    // Kill integrity service scheduled checks
    this.integrityService?.stopIntegrityChecks();
    console.log('🔪 [ORCHESTRATOR] Integrity service checks killed');
    
    // Close broadcast channel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
      console.log('🔪 [ORCHESTRATOR] Broadcast channel closed');
    }
    
    console.log('✅ [ORCHESTRATOR] Force cleanup complete - all background ghosts eliminated');
  }

  /**
   * � INITIALIZE FOR USER - Public method for external calls
   */
  async initializeForUser(userId: string): Promise<void> {
    await this.performGateBasedInitialization(userId);
  }

  /**
   * 📊 GET SYSTEM RISK STATUS - Admin dashboard analytics
   */
  public async getSystemRiskStatus(): Promise<{
    systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    highRiskCount: number;
  }> {
    try {
      const [highRiskCount, riskDistribution] = await Promise.all([
        RiskManager.getHighRiskUserCount(),
        RiskManager.getRiskDistribution()
      ]);
      
      const systemHealth = highRiskCount > 100 ? 'CRITICAL' : 
                         highRiskCount > 50 ? 'WARNING' : 'HEALTHY';
      
      return {
        systemHealth,
        highRiskCount
      };
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Failed to get system risk status:', error);
      return {
        systemHealth: 'CRITICAL',
        highRiskCount: 0
      };
    }
  }

  /**
   * 🔄 CHECK AND RESUME INTERRUPTED SYNCS
   */
  private async checkAndResumeInterruptedSyncs(): Promise<void> {
    try {
      console.log('🔄 [REFACTORED ORCHESTRATOR] Checking for interrupted syncs...');
      
      // Check for unsynced books
      const unsyncedBooks = await db.books.where('synced').equals(0).toArray();
      const unsyncedEntries = await db.entries.where('synced').equals(0).toArray();
      const totalUnsynced = unsyncedBooks.length + unsyncedEntries.length;
      
      if (totalUnsynced > 0) {
        console.log(`🔄 [REFACTORED ORCHESTRATOR] Found ${totalUnsynced} unsynced items, resuming sync...`);
        console.log(`📚 Books: ${unsyncedBooks.length}, 📝 Entries: ${unsyncedEntries.length}`);
        
        // Trigger automatic sync to resume interrupted operations
        const result = await this.pushService?.pushPendingData();
        if (result?.success) {
          console.log('✅ [REFACTORED ORCHESTRATOR] Auto-resume sync completed successfully');
        } else {
          console.error('❌ [REFACTORED ORCHESTRATOR] Auto-resume sync failed:', result?.errors);
        }
      } else {
        console.log('✅ [REFACTORED ORCHESTRATOR] No interrupted syncs found');
      }
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Auto-resume check failed:', error);
    }
  }

  /**
   * 🚀 EXPORT SINGLETON INSTANCE
   */
}

// 🚀 LAZY GETTER - Break circular dependency by deferring instantiation
let orchestratorInstance: SyncOrchestratorRefactored | null = null;
export const getOrchestrator = () => {
  if (!orchestratorInstance) {
    orchestratorInstance = new SyncOrchestratorRefactored();
  }
  return orchestratorInstance;
};
