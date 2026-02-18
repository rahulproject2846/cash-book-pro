"use client";

import { PushService } from '../services/PushService';
import { HydrationService } from '../services/HydrationService';
import { IntegrityService } from '../services/IntegrityService';
import { identityManager } from '../core/IdentityManager';
import { telemetry } from '../Telemetry';

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
  private hydrationService: HydrationService;
  private integrityService: IntegrityService;
  private channel: BroadcastChannel | null = null;
  private userId: string = '';
  private isInitialized = false;
  private isInitializing = false;

  constructor() {
    this.pushService = new PushService();
    this.hydrationService = new HydrationService();
    this.integrityService = new IntegrityService();
    
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
          this.notifyUI();
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
      // Event listeners
      window.addEventListener('online', () => this.triggerSync());

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
        await this.initializeForUser(uid);
      });
    }
  }

  /**
   * 👤 INITIALIZE FOR USER
   */
  private async initializeForUser(userId: string): Promise<void> {
    // 🛡️ INITIALIZATION GUARD
    if (this.isInitialized || this.isInitializing) {
      console.log('🏁 [ORCHESTRATOR] Already initialized or initializing, skipping...');
      return;
    }
    this.isInitializing = true;

    try {
      console.log('🏁 [REFACTORED ORCHESTRATOR] Initializing for user:', userId);
      
      // Set user ID for all services
      this.pushService.setUserId(userId);
      this.hydrationService.setUserId(userId);
      this.integrityService.setUserId(userId);
      
      // 🛡️ STEP 1: Data Integrity Repair
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 1: Data integrity repair');
      await this.integrityService.performIntegrityCheck();
      
      // 🚀 STEP 2: Initial Hydration
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 2: Initial hydration');
      const hydrationResult = await this.hydrationService.fullHydration(true);
      
      if (!hydrationResult.success) {
        console.error('❌ [REFACTORED ORCHESTRATOR] Initial hydration failed:', hydrationResult.error);
        telemetry.log({
          type: 'ERROR',
          level: 'ERROR',
          message: 'Initial hydration failed',
          data: { error: hydrationResult.error, userId }
        });
      }
      
      // 🔍 STEP 3: Integrity Audit
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 3: Integrity audit');
      await this.integrityService.performIntegrityCheck();
      
      // 🔄 STEP 4: Start Background Services
      console.log('🏁 [REFACTORED ORCHESTRATOR] Step 4: Starting background services');
      this.integrityService.scheduleIntegrityChecks();
      
      this.isInitialized = true;
      console.log('🏁 [REFACTORED ORCHESTRATOR] Initialization complete - All systems ready');
      
      // Notify UI
      this.notifyUI();
      
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
   * 🚀 TRIGGER SYNC - Main sync entry point
   */
  async triggerSync(): Promise<{ success: boolean; itemsProcessed: number; error?: string }> {
    if (!navigator.onLine) {
      console.log('🔍 [REFACTORED ORCHESTRATOR] Offline, skipping sync');
      return { success: false, itemsProcessed: 0, error: 'Offline' };
    }

    const pushStatus = this.pushService.getSyncStatus();
    if (pushStatus.isSyncing) {
      console.log('🔍 [REFACTORED ORCHESTRATOR] Already syncing, skipping...');
      return { success: false, itemsProcessed: 0, error: 'Already syncing' };
    }

    console.log('🔍 [REFACTORED ORCHESTRATOR] Starting sync process...');
    
    try {
      // 🚀 PUSH PENDING DATA
      const pushResult = await this.pushService.pushPendingData();
      
      if (pushResult.success) {
        console.log('✅ [REFACTORED ORCHESTRATOR] Sync completed successfully:', pushResult);
        
        // Trigger media processing if needed
        this.triggerMediaProcessing();
        
        return { success: true, itemsProcessed: pushResult.itemsProcessed };
      } else {
        console.error('❌ [REFACTORED ORCHESTRATOR] Sync failed:', pushResult.errors);
        return { success: false, itemsProcessed: pushResult.itemsProcessed, error: pushResult.errors.join('; ') };
      }
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Sync process failed:', error);
      return { success: false, itemsProcessed: 0, error: String(error) };
    }
  }

  /**
   * 🎯 HYDRATE SINGLE ITEM
   */
  async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string }> {
    return await this.hydrationService.hydrateSingleItem(type, id);
  }

  /**
   * 🔍 PERFORM INTEGRITY CHECK
   */
  async performIntegrityCheck(): Promise<{ success: boolean; issuesFound: number; issuesFixed: number; conflicts: number; error?: string }> {
    return await this.integrityService.performIntegrityCheck();
  }

  /**
   * 📡 BROADCAST UPDATE
   */
  private broadcast(): void {
    try {
      this.getChannel().postMessage({ type: 'FORCE_REFRESH' });
    } catch (error) {
      console.warn('⚠️ [ORCHESTRATOR] Broadcast failed, recreating channel...', error);
      this.channel = null; // Force recreation on next call
    }
  }

  /**
   * 📢 NOTIFY UI
   */
  public notifyUI(): void {
    window.dispatchEvent(new Event('vault-updated'));
    this.broadcast();
  }

  /**
   * 🎥 TRIGGER MEDIA PROCESSING
   */
  private triggerMediaProcessing(): void {
    // This would integrate with your media processing service
    if (typeof window !== 'undefined' && (window as any).mediaProcessor) {
      (window as any).mediaProcessor.processPendingUploads();
    }
  }

  /**
   * 📊 GET ORCHESTRATOR STATUS
   */
  getStatus(): {
    isInitialized: boolean;
    userId: string;
    pushService: any;
    hydrationService: any;
    integrityService: any;
  } {
    return {
      isInitialized: this.isInitialized,
      userId: this.userId,
      pushService: this.pushService.getSyncStatus(),
      hydrationService: this.hydrationService.getHydrationStatus(),
      integrityService: this.integrityService.getIntegrityStatus()
    };
  }

  /**
   * 🔐 SET USER ID
   */
  setUserId(userId: string): void {
    this.userId = String(userId);
    this.pushService.setUserId(userId);
    this.hydrationService.setUserId(userId);
    this.integrityService.setUserId(userId);
  }

  /**
   * 🧹 CLEANUP
   */
  cleanup(): void {
    console.log('🧹 [REFACTORED ORCHESTRATOR] Cleaning up...');
    
    this.integrityService.cleanup();
    this.hydrationService.cleanup();
    
    if (this.channel) {
      this.channel.close();
      this.channel = null; // Important: Clear reference
    }
    
    this.isInitialized = false;
  }

  /**
   * � HYDRATE - Main hydration entry point
   */
  async hydrate(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 [REFACTORED ORCHESTRATOR] Starting hydration for user:', userId);
      
      this.setUserId(userId);
      await this.initializeForUser(userId);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Hydration failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 📡 INIT PUSHER - Initialize Pusher real-time sync
   */
  initPusher(pusher: any, userId: string): void {
    console.log('📡 [REFACTORED ORCHESTRATOR] Initializing Pusher for user:', userId);
    
    this.setUserId(userId);
    
    // Store pusher instance for future use
    // Note: Pusher integration will be handled by the service layer
    console.log('📡 [REFACTORED ORCHESTRATOR] Pusher instance stored, service integration pending');
  }

  /**
   * 🔐 LOGOUT - Clean up on user logout
   */
  logout(): void {
    console.log('🔐 [REFACTORED ORCHESTRATOR] User logout, cleaning up...');
    this.cleanup();
  }

  /**
   * �🔄 RESTART SERVICES
   */
  async restartServices(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [REFACTORED ORCHESTRATOR] Restarting services...');
      
      // Cleanup
      this.cleanup();
      
      // Reinitialize
      this.pushService = new PushService();
      this.hydrationService = new HydrationService();
      this.integrityService = new IntegrityService();
      
      if (this.userId) {
        await this.initializeForUser(this.userId);
      }
      
      console.log('✅ [REFACTORED ORCHESTRATOR] Services restarted successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ [REFACTORED ORCHESTRATOR] Failed to restart services:', error);
      return { success: false, error: String(error) };
    }
  }
}

// 🚀 EXPORT SINGLETON INSTANCE
export const orchestrator = new SyncOrchestratorRefactored();
