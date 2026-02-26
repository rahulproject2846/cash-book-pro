"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, normalizeTimestamp } from '../../core/VaultUtils';
import { validateBook, validateEntry } from '../../core/schemas';
import { telemetry } from '../../Telemetry';
import { getVaultStore } from '../../store/storeHelper';
import { identityManager } from '../../core/IdentityManager';

// 🛡️ API PATH MAPPING - Prevent pluralization typos
const API_PATH_MAP: Record<string, string> = {
  'BOOK': 'books',
  'ENTRY': 'entries',
  'USER': 'user/profile'
};

/**
 * 🎯 SNIPER SLICE - Single Item Hydration
 * 
 * Handles precise single-item fetching and processing
 */
export class SniperSlice {
  private userId: string = '';

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🎯 HYDRATE SINGLE ITEM - Main entry point
   */
  async hydrate(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string; isGone?: boolean; data?: any }> {
    try {
      console.log(`🎯 [SNIPER SLICE] Starting ${type} hydration for ID: ${id}`);

      // 🛡️ CID GUARD: Block CID-based API calls
      if (id.startsWith('cid_')) {
        console.warn('🛡️ [SNIPER] Blocking CID-based book fetch request');
        return { success: false, error: 'Cannot fetch book using media CID' };
      }

      // 🛡️ SECURITY GUARD: Check lockdown and profile status before processing
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      const userExists = await db.users.get(this.userId);
      
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed' || !userExists) {
        console.error('🛡️ [SNIPER SLICE] Single item hydration blocked due to Security Lockdown/Profile Failure.');
        return { 
          success: false, 
          error: 'SECURITY_LOCKDOWN: Single item hydration blocked'
        };
      }

      // 🧹 SANITIZE: Clean payload before processing
      const cleanPayload = this.cleanPayload(type, id);
      console.log(`🧹 [SNIPER SLICE] Processing ${type} for user ${this.userId}`);

      // 🔄 FETCH SINGLE ITEM: Get specific item from server
      const response = await fetch(`/api/${API_PATH_MAP[type]}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.info('👻 [SNIPER] Item gone from server, silencing ghost.');
          return { 
            success: true, 
            isGone: true, 
            data: null 
          };
        }
        throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
      }

      const result = await response.json();
      const record = result.data || result;

      if (!record) {
        console.warn(`⚠️ [SNIPER SLICE] ${type} not found for ID: ${id}`);
        return { 
          success: false, 
          error: `${type} not found for ID: ${id}`
        };
      }

      // 🛡️ VALIDATION PIPELINE: Normalize → Validate → Store
      const normalized = normalizeRecord(record, this.userId);
      if (!normalized) {
        console.error(`🚨 [VALIDATOR] ${type} normalization failed for ID: ${id}`);
        await telemetry.log({
          type: 'SECURITY',
          level: 'CRITICAL',
          message: `Sniper validation failed: ${type} normalization failed`,
          data: { id, error: 'Normalization failed', record }
        });
        return { 
          success: false, 
          error: `${type} normalization failed`
        };
      }

      const validationResult = type === 'BOOK' ? validateBook(normalized) : validateEntry(normalized);
      if (!validationResult.success) {
        console.error(`🚨 [VALIDATOR] ${type} validation failed for ID: ${id}: ${validationResult.error}`);
        await telemetry.log({
          type: 'SECURITY',
          level: 'CRITICAL',
          message: `Sniper validation failed: ${type} validation failed`,
          data: { id, error: validationResult.error, record }
        });
        return { 
          success: false, 
          error: `${type} validation failed: ${validationResult.error}`
        };
      }

      // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
      const { HydrationEngine } = await import('../engine/HydrationEngine');
      const engine = new HydrationEngine(this.userId);
      
      const commitResult = await engine.commit(type, [validationResult.data], 'sniper_hydration');
      if (!commitResult.success) {
        console.error(`❌ [SNIPER SLICE] Failed to commit ${type}: ${commitResult.error}`);
        return { 
          success: false, 
          error: `Failed to commit ${type}: ${commitResult.error}`
        };
      }

      console.log(`✅ [SNIPER SLICE] ${type} hydrated successfully: ${id}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [SNIPER SLICE] Failed to hydrate ${type} ${id}:`, error);
      return { 
        success: false, 
        error: String(error)
      };
    }
  }

  /**
   * 🧹 PAYLOAD SANITIZATION: Clean dirty data before processing
   */
  private cleanPayload(type: string, id: string): any {
    // Basic validation
    if (!type || !id) {
      throw new Error('Type and ID are required for payload sanitization');
    }

    return {
      type,
      id,
      // Add any additional fields needed for validation
      synced: 1,
      conflicted: 0
    };
  }
}
