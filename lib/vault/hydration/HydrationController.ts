"use client";

import { HydrationEngine } from './engine/HydrationEngine';
import { IdentitySlice } from './slices/IdentitySlice';
import { BulkSlice } from './slices/BulkSlice';
import { RealtimeSlice } from './slices/RealtimeSlice';
import { SniperSlice } from './slices/SniperSlice';
import { getVaultStore } from '../store/storeHelper';
import type { HydrationResult } from './engine/types';

/**
 * 🎯 HYDRATION CONTROLLER (V6.0) - Single Public Interface
 * 
 * This is the ONLY entry point for all hydration operations.
 * External callers (SyncOrchestrator, UI hooks) interact with this.
 * 
 * Architecture:
 * External → HydrationController → Slices → Engine → Dexie
 */
export class HydrationController {
  private static instance: HydrationController | null = null;
  private engine: HydrationEngine;
  private identitySlice: IdentitySlice;
  private bulkSlice: BulkSlice;
  private realtimeSlice: RealtimeSlice;
  private sniperSlice: SniperSlice;

  private constructor() {
    this.engine = new HydrationEngine();
    this.identitySlice = new IdentitySlice('');
    this.bulkSlice = new BulkSlice('');
    this.realtimeSlice = new RealtimeSlice('');
    this.sniperSlice = new SniperSlice('');
  }

  /**
   * 🎯 GET INSTANCE - Singleton pattern
   * Ensures only one controller exists
   */
  public static getInstance(): HydrationController {
    if (!HydrationController.instance) {
      HydrationController.instance = new HydrationController();
    }
    return HydrationController.instance;
  }

  /**
   * SET USER ID
   */
  public setUserId(userId: string): void {
    this.engine.setUserId(userId);
    this.identitySlice = new IdentitySlice(userId);
    this.bulkSlice = new BulkSlice(userId);
    this.realtimeSlice = new RealtimeSlice(userId);
    this.sniperSlice = new SniperSlice(userId);
  }

  /**
   * GET STATUS
   */
  public getStatus(): { userId: string; securityState: any } {
    return this.engine.getEngineStatus();
  }

  /**
   * FULL HYDRATION - Main entry point for bulk data loading
   * Implements Strict Sequential Order: Profile -> Books -> Entries
   */
  public async fullHydration(force?: boolean): Promise<HydrationResult> {
    try {
      console.log(`[CONTROLLER] Full hydration requested (force: ${force})`);
      
      // SECURITY GUARD: Check lockdown state at Controller level
      // 🛡️ SELF-HEALING EXCEPTION: Allow USER hydration to proceed even in lockdown
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
        console.warn('[CONTROLLER] System in lockdown - Attempting self-healing via USER hydration only');
        
        // 🛡️ SELF-HEALING: Try to hydrate USER profile first to break deadlock
        const identityResult = await this.identitySlice.hydrateUser();
        if (identityResult.success) {
          console.log('✅ [CONTROLLER] Self-healing successful - USER profile hydrated');
          
          // Reset lockdown state after successful user commit
          const store = getVaultStore();
          store.setSecurityLockdown(false);
          store.setEmergencyHydrationStatus('idle');
          store.setSecurityErrorMessage('');
          
          // Continue with full hydration now that we have a user
        } else {
          console.error('[CONTROLLER] Self-healing failed - Full hydration blocked');
          return { 
            success: false, 
            error: 'SECURITY_LOCKDOWN: Self-healing failed',
            source: 'full_hydration'
          };
        }
      }

      const userId = this.engine.getEngineStatus().userId;
      if (!userId) {
        return { 
          success: false, 
          error: 'No user ID available for hydration',
          source: 'full_hydration'
        };
      }

      // SEQUENTIAL HYDRATION: Strict chain of command
      
      // GATE 1: Profile First
      console.log('[CONTROLLER] Gate 1: Hydrating user profile...');
      const identityResult = await this.identitySlice.hydrateUser();
      if (!identityResult.success) {
        console.error(`[CONTROLLER] Identity hydration failed: ${identityResult.error}`);
        return { 
          success: false, 
          error: identityResult.error,
          source: 'identity_hydration'
        };
      }
      
      // Commit user profile via Engine
      const userCommitResult = await this.engine.commit('USER', [identityResult.user!], 'identity_hydration');
      if (!userCommitResult.success) {
        console.error(`[CONTROLLER] User commit failed: ${userCommitResult.error}`);
        return { 
          success: false, 
          error: `User commit failed: ${userCommitResult.error}`,
          source: 'identity_hydration'
        };
      }
      console.log('[CONTROLLER] Gate 1: User profile hydrated successfully');

      // ✅ NEW: Reset lockdown state after successful user commit
      const store = getVaultStore();
      if (store.isSecurityLockdown || store.emergencyHydrationStatus === 'failed') {
        console.log('🔓 [CONTROLLER] User profile successfully committed - Resetting lockdown state');
        store.setSecurityLockdown(false);
        store.setEmergencyHydrationStatus('idle');
        store.setSecurityErrorMessage('');
      }

      // GATE 2: Books Only After Profile
      console.log('[CONTROLLER] Gate 2: Hydrating books...');
      const booksResult = await this.bulkSlice.hydrateBooks();
      if (!booksResult.success) {
        console.error(`[CONTROLLER] Books hydration failed: ${booksResult.error}`);
        return { 
          success: false, 
          error: booksResult.error,
          source: 'books_hydration'
        };
      }
      
      // Commit books via Engine
      const booksCommitResult = await this.engine.commit('BOOK', booksResult.records || [], 'books_hydration');
      if (!booksCommitResult.success) {
        console.error(`[CONTROLLER] Books commit failed: ${booksCommitResult.error}`);
        return { 
          success: false, 
          error: `Books commit failed: ${booksCommitResult.error}`,
          source: 'books_hydration'
        };
      }
      console.log(`[CONTROLLER] Gate 2: Books hydrated successfully (${booksCommitResult.count} records)`);

      // GATE 3: Entries Only After Books
      console.log('[CONTROLLER] Gate 3: Hydrating entries...');
      const entriesResult = await this.bulkSlice.hydrateEntries();
      if (!entriesResult.success) {
        console.error(`[CONTROLLER] Entries hydration failed: ${entriesResult.error}`);
        return { 
          success: false, 
          error: entriesResult.error,
          source: 'entries_hydration'
        };
      }
      
      // Commit entries via Engine
      const entriesCommitResult = await this.engine.commit('ENTRY', entriesResult.records || [], 'entries_hydration');
      if (!entriesCommitResult.success) {
        console.error(`[CONTROLLER] Entries commit failed: ${entriesCommitResult.error}`);
        return { 
          success: false, 
          error: `Entries commit failed: ${entriesCommitResult.error}`,
          source: 'entries_hydration'
        };
      }
      console.log(`[CONTROLLER] Gate 3: Entries hydrated successfully (${entriesCommitResult.count} records)`);

      console.log(`[CONTROLLER] Full hydration complete:`, { 
        booksCount: booksCommitResult.count, 
        entriesCount: entriesCommitResult.count 
      });
      
      return { 
        success: true, 
        booksCount: booksCommitResult.count,
        entriesCount: entriesCommitResult.count,
        source: 'full_hydration'
      };

    } catch (error) {
      console.error('[CONTROLLER] Full hydration failed:', error);
      return { 
        success: false, 
        error: String(error),
        source: 'full_hydration'
      };
    }
  }

  /**
   * HYDRATE SINGLE ITEM - Sniper functionality
   */
  public async hydrateSingleItem(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[CONTROLLER] Single item hydration requested: ${type} - ${id}`);
    
    // DELEGATE TO SNIPER SLICE
    const result = await this.sniperSlice.hydrate(type, id);
    if (!result.success) {
      console.error(`[CONTROLLER] Sniper hydration failed: ${result.error}`);
      return { 
        success: false, 
        error: result.error
      };
    }

    console.log(`[CONTROLLER] Single item hydrated successfully: ${type} - ${id}`);
    return { success: true };
  }

  /**
   * HANDLE REALTIME EVENT - Pusher event processing
   */
  public async handleRealtimeEvent(eventType: string, payload: any): Promise<void> {
    console.log(`[CONTROLLER] Realtime event: ${eventType}`, payload);
    
    // DELEGATE TO REALTIME SLICE
    const result = await this.realtimeSlice.handleEvent(eventType, payload);
    if (!result.success) {
      console.error(`[CONTROLLER] Realtime event failed: ${result.error}`);
      return;
    }

    console.log(`[CONTROLLER] Realtime event processed: ${eventType}`);
  }

  /**
   * HYDRATE USER - User profile hydration
   */
  public async hydrateUser(userId: string): Promise<void> {
    console.log(`[CONTROLLER] User hydration requested: ${userId}`);
    
    // Update slices with new user ID
    this.setUserId(userId);
    
    // Use IdentitySlice for processing
    const result = await this.identitySlice.hydrateUser();
    if (result.success && result.user) {
      // Commit via Engine
      await this.engine.commit('USER', [result.user], 'user_hydration');
    }
  }

  /**
   * 🧹 CLEANUP
   */
  public cleanup(): void {
    console.log('🧹 [CONTROLLER] Cleanup completed');
  }

  /**
   * 🔧 ENGINE ACCESS - Internal access for slices
   * Only slices should use this method
   */
  public getEngine(): HydrationEngine {
    return this.engine;
  }

  /**
   * 🔄 INGEST LOCAL MUTATION - Handle user-driven local writes
   * This is the ONLY way UI components can write to the database
   * All local mutations must pass through the HydrationEngine pipeline
   */
  public async ingestLocalMutation(type: 'BOOK' | 'ENTRY', records: any[]): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
      console.log(`[CONTROLLER] Local mutation request: ${type} | Records: ${records.length} | Source: LOCAL_USER_ACTION`);
      
      // SECURITY GUARD: Check lockdown state
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed') {
        console.error('[CONTROLLER] Local mutation blocked - Security Lockdown/Profile Failure');
        return { 
          success: false, 
          error: 'SECURITY_LOCKDOWN: Local mutation blocked'
        };
      }

      const userId = this.engine.getEngineStatus().userId;
      if (!userId) {
        return { 
          success: false, 
          error: 'No user ID available for local mutation'
        };
      }

      // Commit via Engine with LOCAL_USER_ACTION source
      const result = await this.engine.commit(type, records, 'LOCAL_USER_ACTION');
      
      if (result.success) {
        console.log(`[CONTROLLER] Local mutation successful: ${result.count} records processed`);
        return { 
          success: true, 
          count: result.count 
        };
      } else {
        console.error(`[CONTROLLER] Local mutation failed: ${result.error}`);
        return { 
          success: false, 
          error: result.error 
        };
      }

    } catch (error) {
      console.error('[CONTROLLER] Local mutation failed:', error);
      return { 
        success: false, 
        error: String(error)
      };
    }
  }
}
