"use client";

import { ModeController } from '../../system/ModeController';
import { HydrationController } from '../hydration/HydrationController';
import { IntegrityService } from '../services/IntegrityService';
import { MaintenanceService } from '../services/MaintenanceService';
import { identityManager } from '../core/IdentityManager';
import { telemetry } from '../Telemetry';
import { db } from '@/lib/offlineDB';
import { PushService } from '../services/PushService';
import { PullService } from '../services/PullService';
import { RiskManager, LicenseVault } from '../security';
import { getVaultStore } from '../store/storeHelper';

/**
 * 🚀 REFACTORED SYNC ORCHESTRATOR - Clean Architecture Implementation
 * 
 * This is the new, clean orchestrator that follows SOLID principles:
 * - Single Responsibility: Each service has one job
 * - Open/Closed: Extensible without modification
 * - Liskov Substitution: Services are interchangeable
 * - Interface Segregation: Focused interfaces
 * - Dependency Inversion: Depends on abstractions
 * 
 * Replaces the 1500+ line God Object with focused services.
 */

export class SyncOrchestratorRefactored {
  private pushService: PushService;
  private pullService: PullService;
  private hydrationController: HydrationController;
  private integrityService: IntegrityService;
  private maintenanceService: MaintenanceService;
  private channel: BroadcastChannel | null = null;
  private userId: string = '';
  private isInitialized = false;
  private isInitializing = false;
  private static isInitializing = false;
  private static initializationPromise: Promise<void> | null = null;

  constructor() {
    this.pushService = new PushService();
    this.pullService = new PullService();
    this.hydrationController = HydrationController.getInstance();
    this.integrityService = new IntegrityService();
    this.maintenanceService = new MaintenanceService();
    
    // 🔒 SYNCHRONIZED INIT: Get userId immediately to prevent race condition
    this.userId = identityManager.getUserId() || '';
    console.log('🔄 [ORCHESTRATOR] Initialized with userId:', this.userId);
    
    this.init();
  }

  /**
   * 🛡️ GET CHANNEL - Self-healing channel getter
   */
  private getChannel(): BroadcastChannel {
    if (!this.channel) {
      this.channel = new BroadcastChannel('vault_global_sync');
      console.log('🛡️ [ORCHESTRATOR] Created new BroadcastChannel');
      
      // Attach: refresh listener whenever a new channel is created
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'FORCE_REFRESH') {
          console.log('📡 [ORCHESTRATOR] Cross-tab refresh signal received');
          this.notifyUI('CrossTab');
        }
      };
    }
    return this.channel;
  }

  /**
   * INITIALIZATION
   */
  private async init(): Promise<void> {
    if (typeof window !== 'undefined') {
      // 🕵️‍♂️ SECURITY CHECK: Time Tampering
      const isTampered = RiskManager.checkTimeTampering();
      if (isTampered) {
          console.error('🚨 [SECURITY] Critical: Time tampering detected!');
          // Future: We can ban the user here. For now, just log.
      }

      // SELF-HEALING BROADCAST CHANNEL
      this.getChannel();
      
      // Identity management
      identityManager.subscribe(async (uid) => {
        console.log('[REFACTORED ORCHESTRATOR] Identity changed, initializing sequence');
        
        if (!uid) {
          this.userId = '';
          console.log('🔐 [REFACTORED ORCHESTRATOR] User logged out, stopping services');
          this.cleanup();
          return;
        }
        
        this.userId = uid;
        
        // �️ GLOBAL LOCK: Prevent multiple initialization sequences
        if (SyncOrchestratorRefactored.isInitializing) {
          console.log('� [ORCHESTRATOR] Already initializing, waiting...');
          return SyncOrchestratorRefactored.initializationPromise;
        }

        // �️ SET GLOBAL LOCK
        SyncOrchestratorRefactored.isInitializing = true;
        SyncOrchestratorRefactored.initializationPromise = this.performGateBasedInitialization(uid);
        
        try {
          await SyncOrchestratorRefactored.initializationPromise;
        } finally {
          // 🛡️ RELEASE GLOBAL LOCK
          SyncOrchestratorRefactored.isInitializing = false;
          SyncOrchestratorRefactored.initializationPromise = null;
        }
      });
    }
  }

  /**
   * 🚀 GATE-BASED INITIALIZATION - Sequential Chain of Command
   */
  private async performGateBasedInitialization(userId?: string): Promise<void> {
    const store = getVaultStore();
    
    try {
      // 🛡️ WAIT FOR IDENTITY MANAGER TO BE READY
      if (!identityManager.ready) {
        console.log('⏳ [ORCHESTRATOR] IdentityManager not ready, waiting...');
        await new Promise<void>(resolve => {
          identityManager.onReady(() => resolve());
          // Timeout after 2 seconds as safety
          setTimeout(resolve, 2000);
        });
      }
      
      // �� IDENTITY RECOVERY FALLBACK
      if (!userId && !this.userId) {
        this.userId = identityManager.getUserId() || '';
        console.log('🔄 [ORCHESTRATOR] Recovered missing userId from IdentityManager');
      }
      
      // 🛡️ COLD-START IDENTITY RECOVERY
      let activeId = userId || this.userId || identityManager.getUserId();
      
      if (!activeId) {
        console.log('⏳ [ORCHESTRATOR] ID missing on cold start, retrying...');
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 200));
          activeId = identityManager.getUserId();
          if (activeId) {
            this.userId = activeId;
            console.log(`✅ [ORCHESTRATOR] ID recovered on attempt ${i + 1}`);
            break;
          }
        }
      }
      
      if (!activeId) {
        console.error('❌ [ORCHESTRATOR] Critical: Still no user ID after recovery attempt.');
        throw new Error("Hydration failed: No user ID available for hydration");
      }
      
      // �️ GATE 1: Wait for Identity - ROBUST ID RECOVERY
      store.setBootStatus('IDENTITY_WAIT');
      console.log('🔄 [ORCHESTRATOR] Gate 1: Waiting for identity...');
      
      // 🔧 IDENTITY RECOVERY: Multiple fallback strategies
      let effectiveUserId = activeId;
      
      if (!effectiveUserId) {
        effectiveUserId = identityManager.getUserId() || '';
        console.log('🔄 [ORCHESTRATOR] Retrieved ID from IdentityManager:', effectiveUserId);
      }
      
      if (!effectiveUserId) {
        effectiveUserId = localStorage.getItem('cashbook-identity') || '';
        console.log('🔄 [ORCHESTRATOR] Retrieved ID from localStorage:', effectiveUserId);
      }
      
      if (!effectiveUserId) {
        // 🔄 RETRY STRATEGY: Wait 500ms and try again
        console.warn('⚠️ [ORCHESTRATOR] No ID found, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));
        effectiveUserId = identityManager.getUserId() || localStorage.getItem('cashbook-identity') || '';
        console.log('🔄 [ORCHESTRATOR] Retry ID:', effectiveUserId);
      }
      
      if (!effectiveUserId) {
        throw new Error('No user ID available for hydration after all recovery attempts');
      }
      
      // Update the userId for the rest of the process
      userId = effectiveUserId;
      
      const identityUserId = await identityManager.waitForIdentity();
      console.log('✅ [ORCHESTRATOR] Gate 1: Identity ready:', identityUserId);


      // �🛡️ GATE 2: Profile Sync + Lazy Fix
      store.setBootStatus('PROFILE_SYNC');
      console.log('🔄 [ORCHESTRATOR] Gate 2: Checking user profile...');
      
      const user = await db.users.get(userId);
      if (!user || user.plan === undefined) {
        console.log('🔧 [ORCHESTRATOR] User profile missing or incomplete, hydrating...');
        try {
          await this.hydrationController.hydrateUser(userId);
          
          // Apply Lazy Fix for legacy schema
          await db.users.update(userId, {
            plan: 'free',
            offlineExpiry: 0,
            riskScore: 0,
            receiptId: null
          });
          console.log('✅ [ORCHESTRATOR] Gate 2: Profile hydrated and lazy fix applied');
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
          
          if (is404Error) {
            // 🛡️ SOFT FAILURE: Allow Self-Healing without lockdown
            console.warn('⚠️ [ORCHESTRATOR] 404 detected, allowing Self-Healing without lockdown.');
            // Don't set lockdown, let default profile creation handle it
            return; // Continue to Gate 3
          }
          
          if (isNetworkError) {
            // 🌐 NETWORK FAILURE: Temporary issue, no lockdown needed
            console.warn('⚠️ [ORCHESTRATOR] Network error detected, will retry later.');
            return; // Continue to Gate 3, system will retry
          }
          
          // 🛡️ CRITICAL ERROR: Only lockdown for server errors or security issues
          const store = getVaultStore();
          store.setSecurityLockdown(true);
          store.setBootStatus('IDLE');
          store.setEmergencyHydrationStatus('failed');
          store.setSecurityErrorMessage(`Critical error: ${isServerError ? 'Server error' : 'Security violation'}. Lockdown activated.`);
          throw error; // Re-throw to trigger main catch block
        }
      }

      // 🛡️ GATE 3: Data Hydration
      store.setBootStatus('DATA_HYDRATION');
      console.log('🔄 [ORCHESTRATOR] Gate 3: Starting sequential hydration...');
      
      // 🌁 BRIDGE THE IDENTITY GAP
      this.hydrationController.setUserId(activeId); 
      getVaultStore().setSecurityLockdown(false); // Force clear old alarms
      
      const hydrationResult = await this.hydrationController.fullHydration(true);
      if (!hydrationResult.success) {
        console.warn('⚠️ [ORCHESTRATOR] Hydration failed, continuing boot with degraded functionality:', hydrationResult.error);
        // Don't crash - continue to next gate with degraded functionality
      } else {
        console.log('✅ [ORCHESTRATOR] Gate 3: Data hydration complete');
      }

      // 🔄 BACKGROUND PULL: Trigger data pull after Gate 3 hydration is complete
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [ORCHESTRATOR] Triggering background data pull...');
      }
      
      // 🛡️ SERVICE SETUP: Set user IDs BEFORE triggering pull (Critical Fix)
      this.pushService.setUserId(userId);
      this.pullService.setUserId(userId);
      this.integrityService.setUserId(userId);
      
      try {
        // 🛡️ DOUBLE-PULL PROTECTION: Check if pull is already in progress
        const pullStatus = this.pullService.getPullStatus();
        if (pullStatus.isPulling) {
          console.log('🛡️ [ORCHESTRATOR] Pull already in progress, skipping...');
          return;
        }
        
        const pullResult = await this.pullService.pullPendingData();
        if (pullResult && pullResult.success) {
          console.log('✅ [ORCHESTRATOR] Background pull completed successfully');
        } else {
          console.warn('⚠️ [ORCHESTRATOR] Background pull blocked/failed:', pullResult?.errors || 'Unknown security block');
        }
      } catch (error) {
        console.warn('⚠️ [ORCHESTRATOR] Background pull failed, continuing boot:', error);
        // Don't fail boot if pull fails, just continue
      }

      // 🛡️ GATE 4: Ready State
      store.setBootStatus('READY');
      
      // 🔄 INDEXEDDB SETTLE: Allow small delay for DB to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await store.refreshCounters();
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
      
      // FORCE SPINNER KILL: Ensure UI is unlocked
      // Note: setIsLoading doesn't exist in store, but the UI spinner is controlled by bootStatus
      console.log(' [ORCHESTRATOR] Boot sequence complete - UI should be responsive');

      // SERVICE INTERLOCK: Only start services after boot is complete
      if (process.env.NODE_ENV === 'development') {
        console.log(' [ORCHESTRATOR] Starting background services...');
      }
      
      // 🚀 PARALLEL SERVICE STARTUP: Initialize all background services concurrently
      const serviceResults = await Promise.allSettled([
        this.integrityService.performIntegrityCheck(),
        this.checkAndResumeInterruptedSyncs(),
        this.maintenanceService.performGlobalCleanup(userId)
      ]);
      
      // Check for any service failures
      const failedServices = serviceResults.filter(result => result.status === 'rejected');
      if (failedServices.length > 0) {
        console.warn('⚠️ [ORCHESTRATOR] Some background services failed:', failedServices);
      }
      
      // Schedule integrity checks after initial check
      this.integrityService.scheduleIntegrityChecks();
      
      // 🧠 MODE CONTROLLER: Start network monitoring AFTER boot complete
      ModeController.start();
      
      console.log('🏁 [ORCHESTRATOR] All systems ready - Chain of Command complete');
      
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Gate-based initialization failed:', error);
      store.setBootStatus('IDLE');
      store.setEmergencyHydrationStatus('failed');
      store.setSecurityLockdown(true);
      store.setSecurityErrorMessage('Boot sequence failed. Please refresh the page.');
    }
  }

  /**
   * 👤 INITIALIZE FOR USER
   */
  async initializeForUser(userId: string): Promise<void> {
    // 🛡️ STATIC LOCK: Prevent multiple initialization sequences globally
    if (SyncOrchestratorRefactored.isInitializing) {
      console.log(`[LOCK] Already initializing for user: ${userId}, returning existing promise.`);
      return SyncOrchestratorRefactored.initializationPromise!;
    }
    
    // 🛡️ INITIALIZATION GUARD
    if (this.isInitialized || this.isInitializing) {
      console.log('🏁 [ORCHESTRATOR] Already initialized or initializing, skipping...');
      return;
    }
    
    // 🛡️ SET STATIC LOCK
    SyncOrchestratorRefactored.isInitializing = true;
    SyncOrchestratorRefactored.initializationPromise = this.performInitializeForUser(userId);
    
    try {
      await SyncOrchestratorRefactored.initializationPromise;
    } finally {
      // 🛡️ RELEASE STATIC LOCK
      SyncOrchestratorRefactored.isInitializing = false;
      SyncOrchestratorRefactored.initializationPromise = null;
    }
  }

  private async performInitializeForUser(userId: string): Promise<void> {

    try {
      console.log('🏁 [REFACTORED ORCHESTRATOR] Initializing for user:', userId);
      
      // Set user ID for all services
      this.pushService.setUserId(userId);
      this.hydrationController.setUserId(userId);
      this.integrityService.setUserId(userId);
      
      // 🛡️ STEP 1: Data Integrity Repair
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 1: Data integrity repair');
      await this.integrityService.performIntegrityCheck();
      
      // �️ STEP 2: Initial Hydration
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 2: Initial hydration');
      
      // 🛡️ FINAL SECURITY CHECK: Abort if lockdown is active
      const { isSecurityLockdown } = getVaultStore();
      if (isSecurityLockdown) {
        console.log('🛡️ [SECURITY] Hydration blocked - App in lockdown mode');
        return; // ⛔ STOP ALL INITIALIZATION
      }
      
      const hydrationResult = await this.hydrationController.fullHydration(true);
      
      if (!hydrationResult.success) {
        console.error('❌ [REFACTORED ORCHESTRATOR] Initial hydration failed:', hydrationResult.error);
        telemetry.log({
          type: 'ERROR',
          level: 'ERROR',
          message: 'Initial hydration failed',
          data: { error: hydrationResult.error, userId }
        });
        
        // 🛡️ CRITICAL FIX: Immediate abort on hydration failure
        const store = getVaultStore();
        store.setSecurityLockdown(true);
        store.setBootStatus('IDLE');
        store.setSecurityErrorMessage('Hydration failed. Security lockdown activated.');
        return; // ⛔ STOP ALL INITIALIZATION
      }
      
      // 🔍 STEP 3: Integrity Audit
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 3: Integrity audit');
      await this.integrityService.performIntegrityCheck();
      
      // 🔄 STEP 4: Start Background Services
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 4: Starting background services');
      this.integrityService.scheduleIntegrityChecks();
      
      // 🔄 AUTO-RESUME: Check for interrupted syncs
      console.log('🔄 [REFACTORED ORCHESTRATOR] Step 5: Auto-resume check');
      await this.checkAndResumeInterruptedSyncs();
      
      // 🧹 STEP 6: Global maintenance cleanup
      console.log('🧹 [REFACTORED ORCHESTRATOR] Step 6: Global maintenance cleanup');
      await this.maintenanceService.performGlobalCleanup(userId);
      
      this.isInitialized = true;
      console.log('🏁 [REFACTORED ORCHESTRATOR] Initialization complete - All systems ready');
      
      // Notify UI
      this.notifyUI('SyncOrchestrator');
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Initialization failed:', error);
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'Orchestrator initialization failed',
        data: { error: String(error), userId }
      });
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * 🔄 AUTO-RESUME: Check for interrupted syncs and resume them
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
        const result = await this.pushService.pushPendingData();
        
        if (result.success) {
          console.log('✅ [REFACTORED ORCHESTRATOR] Auto-resume sync completed successfully');
        } else {
          console.error('❌ [REFACTORED ORCHESTRATOR] Auto-resume sync failed:', result.errors);
        }
      } else {
        console.log('✅ [REFACTORED ORCHESTRATOR] No interrupted syncs found');
      }
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Auto-resume check failed:', error);
    }
  }

  /**
   * � SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
    this.pushService.setUserId(userId);
    this.hydrationController.setUserId(userId);
    this.integrityService.setUserId(userId);
  }

  /**
   * � GET SYSTEM RISK STATUS (V6.4)
   * Provides admin dashboard with real-time risk analytics
   */
  static async getSystemRiskStatus(): Promise<{
    highRiskCount: number;
    riskDistribution: { low: number; medium: number; high: number; critical: number };
    systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  }> {
    try {
      const [highRiskCount, riskDistribution] = await Promise.all([
        RiskManager.getHighRiskUserCount(),
        RiskManager.getRiskDistribution()
      ]);
      
      const systemHealth = highRiskCount > 100 ? 'CRITICAL' : 
                       highRiskCount > 50 ? 'WARNING' : 'HEALTHY';
      
      console.log('📊 [ADMIN] System risk status calculated:', {
        highRiskCount,
        riskDistribution,
        systemHealth
      });
      
      return {
        highRiskCount,
        riskDistribution,
        systemHealth
      };
      
    } catch (error) {
      console.error('🔒 [ADMIN] Failed to get system risk status:', error);
      return {
        highRiskCount: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        systemHealth: 'CRITICAL'
      };
    }
  }

  /**
   * �� GET SYNC STATUS
   */
  getSyncStatus(): { isInitialized: boolean; isInitializing: boolean; userId: string } {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      userId: this.userId
    };
  }

  /**
   * �🚀 TRIGGER SYNC
   */
  async triggerSync(): Promise<void> {
    try {
      console.log('🚀 [REFACTORED ORCHESTRATOR] Manual sync triggered');
      
      // 🔒 SECURITY GUARD: Check lockdown state first
      const { isSecurityLockdown } = getVaultStore();
      if (isSecurityLockdown) {
        console.log('🔒 [SECURITY] Sync blocked - App in RESTRICTED mode');
        // Only sync telemetry evidence, not business data
        await this.pushService.syncTelemetry();
        return; // ⛔ STOP BUSINESS SYNC
      }
      
      // 🔒 SECURITY GUARD: Fetch user and validate
      const user = await db.users.get(this.userId);
      if (!user) {
        console.error('🔒 [SECURITY] User profile not found in IndexedDB. Sync blocked for safety.');
        return; // ⛔ STOP EVERYTHING
      }
      if (user) {
        // 1. Check License & Expiry
        const license = LicenseVault.validateAccess(user);
        if (!license.access) {
            console.warn(`🔒 [SECURITY] Sync Blocked: ${license.reason}`);
            await telemetry.log({
              type: 'SECURITY',
              level: 'CRITICAL',
              message: `Lockdown triggered: INVALID_LICENSE - ${license.reason}`,
              data: { reason: license.reason, plan: license.plan }
            });
            getVaultStore().setSecurityLockdown(true);
            return; // ⛔ STOP SYNC
        }

        // 2. Check Signature Tampering
        const signatureValid = await LicenseVault.verifySignature(user);
        if (!signatureValid) {
          // 🛡️ MIGRATION WHITELIST: Don't lockdown migrated users
          if (user.isMigrated) {
            console.warn(`🔒 [SECURITY] Migrated user signature invalid - allowing access as free user`);
            // Don't set lockdown, just continue
          } else {
            console.warn(`🔒 [SECURITY] Sync Blocked: License signature invalid`);
            await telemetry.log({
              type: 'SECURITY',
              level: 'CRITICAL',
              message: 'Lockdown triggered: SIGNATURE_TAMPER'
            });
            getVaultStore().setSecurityLockdown(true);
            return; // ⛔ STOP SYNC
          }
        }

        // 3. 🚀 V6.4 HYBRID RISK EVALUATION
        let riskScore = 0;
        let isLockdown = false;
        let evaluationMethod = 'V6.3_SYNC';

        try {
          // ⚡ V6.4 FAST PATH (Async Index)
          const riskEval = await RiskManager.evaluateRiskAsync(this.userId);
          riskScore = riskEval.score;
          isLockdown = riskEval.isLockdown;
          evaluationMethod = 'V6.4_ASYNC';
        } catch (asyncError) {
          // 🛡️ FALLBACK PATH (Sync Object)
          console.warn('⚠️ [SYNC] V6.4 Async Risk Check Failed, reverting to V6.3 Sync:', asyncError);
          riskScore = RiskManager.calculateRiskScore(user);
          isLockdown = riskScore > 80; // Hardcoded threshold for fallback
          evaluationMethod = 'V6.3_SYNC_FALLBACK';
        }

        if (isLockdown) {
          console.warn(`🔒 [SECURITY] V6.4 Sync Blocked: High Risk Score (${riskScore}) - Method: ${evaluationMethod}`);
          await telemetry.log({
            type: 'SECURITY',
            level: 'CRITICAL',
            message: `Lockdown triggered: HIGH_RISK_SCORE_V6.4`,
            data: { riskScore, evaluationMethod }
          });
          getVaultStore().setSecurityLockdown(true);
          return; // ⛔ STOP SYNC
        }

        // 4. Check Lockdown Enforcement
        if (RiskManager.isLockdown(user)) {
            console.warn(`🔒 [SECURITY] Sync Blocked: User in lockdown mode - Method: ${evaluationMethod}`);
            await telemetry.log({
              type: 'SECURITY',
              level: 'CRITICAL',
              message: 'Lockdown triggered: LOCKDOWN_MODE_V6.4',
              data: { evaluationMethod }
            });
            getVaultStore().setSecurityLockdown(true);
            return; // ⛔ STOP SYNC
        }
      }
      // 🔄 STEP 3: Trigger fresh sync
      await this.handleManualSyncFlow();
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Manual sync failed:', error);
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'Manual sync failed',
        data: { error: String(error), userId: this.userId }
      });
    }
  }

  /**
   * 🔄 HANDLE MANUAL SYNC FLOW - Dedicated method for manual sync orchestration
   */
  private async handleManualSyncFlow(): Promise<void> {
    try {
      console.log('🔄 [ORCHESTRATOR] Starting manual sync flow...');
      
      // Trigger manual sync from store
      const { triggerManualSync } = getVaultStore();
      await triggerManualSync();
      
      // Push pending data
      const result = await this.pushService.pushPendingData();
      
      // Update sync progress in store
      const { setSyncProgress } = getVaultStore();
      if (result.success) {
        setSyncProgress({
          total: result.itemsProcessed || 0,
          processed: result.itemsProcessed || 0,
          percentage: 100,
          eta: 0
        });
        console.log('✅ [REFACTORED ORCHESTRATOR] Manual sync completed successfully');
      } else {
        setSyncProgress({
          total: 0,
          processed: 0,
          percentage: 0,
          eta: 0
        });
        console.error('❌ [REFACTORED ORCHESTRATOR] Manual sync failed:', result.errors);
      }
      
      // Notify UI of completion
      this.notifyUI('HydrationService');
      
    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Manual sync flow failed:', error);
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: 'Manual sync flow failed',
        data: { error: String(error), userId: this.userId }
      });
    }
  }

  /**
   * 📡 NOTIFY UI - Origin-aware event dispatching
   */
  private notifyUI(origin?: string): void {
    if (typeof window !== 'undefined') {
      // 🎯 ORIGIN AWARE: Pass source to prevent loops
      window.dispatchEvent(new CustomEvent('vault-updated', {
        detail: { 
          source: origin || 'SyncOrchestrator',
          timestamp: Date.now()
        }
      }));
      
      // Only broadcast to other tabs if not self-originated
      if (origin !== 'UI_REFRESH') {
        this.getChannel().postMessage({ 
          type: 'FORCE_REFRESH',
          source: 'SyncOrchestrator',
          origin: origin || 'SyncOrchestrator'
        });
      }
    }
  }

  /**
   * 🎯 HYDRATE SINGLE ITEM - Image sniper system support
   */
  async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🎯 [ORCHESTRATOR] Hydrating single ${type} for ID: ${id}`);
      
      // Delegate to hydration controller
      const result = await this.hydrationController.hydrateSingleItem(type, id);
      
      if (result.success) {
        console.log(`✅ [ORCHESTRATOR] Successfully hydrated ${type} ${id}`);
        // Notify UI of the update
        this.notifyUI('HydrationService');
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ [ORCHESTRATOR] Hydrate single item failed for ${type} ${id}:`, error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 🧹 CLEANUP
   */
  private cleanup(): void {
    this.isInitialized = false;
    
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    
    console.log('🧹 [REFACTORED ORCHESTRATOR] Cleanup complete');
  }


  /**
   * 🔐 LOGOUT - Clean up on user logout
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

}

// 🚀 EXPORT SINGLETON INSTANCE
export const orchestrator = new SyncOrchestratorRefactored();
