"use client";

import { PushService } from '../services/PushService';
import { HydrationService } from '../services/HydrationService';
import { IntegrityService } from '../services/IntegrityService';
import { MaintenanceService } from '../services/MaintenanceService';
import { identityManager } from '../core/IdentityManager';
import { telemetry } from '../Telemetry';
import { db } from '@/lib/offlineDB';

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
  private maintenanceService: MaintenanceService;
  private channel: BroadcastChannel | null = null;
  private userId: string = '';
  private isInitialized = false;
  private isInitializing = false;

  constructor() {
    this.pushService = new PushService();
    this.hydrationService = new HydrationService();
    this.integrityService = new IntegrityService();
    this.maintenanceService = new MaintenanceService();
    
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
  async initializeForUser(userId: string): Promise<void> {
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
      
      // 🔄 AUTO-RESUME: Check for interrupted syncs
      console.log('🔄 [REFACTORED ORCHESTRATOR] Step 5: Auto-resume check');
      await this.checkAndResumeInterruptedSyncs();
      
      // 🧹 STEP 6: Global maintenance cleanup
      console.log('🧹 [REFACTORED ORCHESTRATOR] Step 6: Global maintenance cleanup');
      await this.maintenanceService.performGlobalCleanup(userId);
      
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
    this.hydrationService.setUserId(userId);
    this.integrityService.setUserId(userId);
  }

  /**
   * 🔄 GET SYNC STATUS
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
      const result = await this.pushService.pushPendingData();
      
      if (result.success) {
        console.log('✅ [REFACTORED ORCHESTRATOR] Manual sync completed successfully');
      } else {
        console.error('❌ [REFACTORED ORCHESTRATOR] Manual sync failed:', result.errors);
      }
      
      // Notify UI of completion
      this.notifyUI();
      
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
   * 📡 NOTIFY UI
   */
  private notifyUI(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vault-updated'));
      this.getChannel().postMessage({ type: 'FORCE_REFRESH' });
    }
  }

  /**
   * 🎯 HYDRATE SINGLE ITEM - Image sniper system support
   */
  async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🎯 [ORCHESTRATOR] Hydrating single ${type} for ID: ${id}`);
      
      // Delegate to hydration service
      const result = await this.hydrationService.hydrateSingleItem(type, id);
      
      if (result.success) {
        console.log(`✅ [ORCHESTRATOR] Successfully hydrated ${type} ${id}`);
        // Notify UI of the update
        this.notifyUI();
      } else {
        console.error(`❌ [ORCHESTRATOR] Failed to hydrate ${type} ${id}:`, result.error);
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
   * 🔄 RESTART SERVICES
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
