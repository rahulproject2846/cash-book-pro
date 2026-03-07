"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, normalizeTimestamp } from '../../core/VaultUtils';
import { validateBook, validateEntry } from '../../core/schemas';
import { telemetry } from '../../Telemetry';
import { getVaultStore } from '../../store/storeHelper';
import { UserManager } from '../../core/user/UserManager';

// 🛡️ API PATH MAPPING - Prevent pluralization typos
const API_PATH_MAP: Record<string, string> = {
  'BOOK': 'books',
  'ENTRY': 'entries',
  'USER': 'user/profile'
};

// 🎯 SNIPER CONFIGURATION
const MAX_RETRY_LIMIT = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * 🎯 SNIPER SLICE - Single Item Hydration
 * 
 * Handles precise single-item fetching and processing
 */
export class SniperSlice {
  private userId: string = '';
  private retryCountMap: Map<string, number> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🎯 HYDRATE SINGLE ITEM - Main entry point
   */
  async hydrate(type: 'BOOK' | 'ENTRY', id: string): Promise<{ success: boolean; error?: string; isGone?: boolean; data?: any }> {
    try {
      console.log(`🎯 [SNIPER SLICE] Starting ${type} hydration for ID: ${id}`);

      // 🛡️ CID GUARD: Allow CID-based lookups for images specifically
      const isMediaLookup = id.startsWith('cid_') && type === 'BOOK';
      if (id.startsWith('cid_') && !isMediaLookup) {
        console.warn('🛡️ [SNIPER] Blocking CID-based API call for non-media lookup');
        return { success: false, error: 'Cannot fetch item using media CID' };
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

      // 🔄 RETRY LOGIC: Check retry count
      const retryKey = `${type}-${id}`;
      const currentRetryCount = this.retryCountMap.get(retryKey) || 0;
      if (currentRetryCount >= MAX_RETRY_LIMIT) {
        console.error(`🚨 [SNIPER] Max retry limit reached for ${type} ${id}`);
        this.retryCountMap.delete(retryKey);
        return { 
          success: false, 
          error: `Max retry limit (${MAX_RETRY_LIMIT}) reached`
        };
      }

      // 🧹 SANITIZE: Clean payload before processing
      const cleanPayload = this.cleanPayload(type, id);
      console.log(`🧹 [SNIPER SLICE] Processing ${type} for user ${this.userId}`);

      // 🔄 FETCH SINGLE ITEM: Get specific item from server
      let response: Response;
      if (isMediaLookup) {
        // 🎯 MEDIA LOOKUP: Special handling for CID-based image fetch
        response = await fetch(`/api/media/${id}`);
      } else {
        response = await fetch(`/api/${API_PATH_MAP[type]}/${id}`);
      }

      if (!response.ok) {
        if (response.status === 404) {
          console.info('👻 [SNIPER] Item gone from server, silencing ghost.');
          this.retryCountMap.delete(retryKey);
          return { 
            success: true, 
            isGone: true, 
            data: null 
          };
        }
        
        // 🔄 RETRY LOGIC: Handle network errors with retry
        if (response.status >= 500 || response.status === 0) {
          const newRetryCount = currentRetryCount + 1;
          this.retryCountMap.set(retryKey, newRetryCount);
          
          const delay = RETRY_DELAY_BASE * Math.pow(2, newRetryCount - 1); // Exponential backoff
          console.warn(`🔄 [SNIPER] Retry ${newRetryCount}/${MAX_RETRY_LIMIT} for ${type} ${id} after ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.hydrate(type, id); // Recursive retry
        }
        
        throw new Error(`Failed to fetch ${type}: ${response.statusText}`);
      }

      const result = await response.json();
      const record = result.data || result;

      if (!record) {
        console.warn(`⚠️ [SNIPER SLICE] ${type} not found for ID: ${id}`);
        this.retryCountMap.delete(retryKey);
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
        this.retryCountMap.delete(retryKey);
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
        this.retryCountMap.delete(retryKey);
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
        this.retryCountMap.delete(retryKey);
        return { 
          success: false, 
          error: `Failed to commit ${type}: ${commitResult.error}`
        };
      }

      // 🎯 IMAGE RECOVERY: Attempt to fetch image blob if mediaCid exists
      if (type === 'BOOK' && validationResult.data.mediaCid && !isMediaLookup) {
        console.log(`🎯 [SNIPER] Attempting image recovery for mediaCid: ${validationResult.data.mediaCid}`);
        const imageResult = await this.hydrate('BOOK', validationResult.data.mediaCid);
        if (!imageResult.success) {
          console.warn(`⚠️ [SNIPER] Image recovery failed for mediaCid: ${validationResult.data.mediaCid}`);
          // Don't fail the main hydration, just log the warning
        }
      }

      // ✅ SUCCESS: Clear retry count and return success
      this.retryCountMap.delete(retryKey);
      console.log(`✅ [SNIPER SLICE] ${type} hydrated successfully: ${id}`);
      return { success: true, data: validationResult.data };

    } catch (error) {
      console.error(`❌ [SNIPER SLICE] Failed to hydrate ${type} ${id}:`, error);
      
      // 🔄 RETRY LOGIC: Handle unexpected errors
      const retryKey = `${type}-${id}`;
      const currentRetryCount = this.retryCountMap.get(retryKey) || 0;
      
      if (currentRetryCount < MAX_RETRY_LIMIT) {
        const newRetryCount = currentRetryCount + 1;
        this.retryCountMap.set(retryKey, newRetryCount);
        
        const delay = RETRY_DELAY_BASE * Math.pow(2, newRetryCount - 1);
        console.warn(`🔄 [SNIPER] Error retry ${newRetryCount}/${MAX_RETRY_LIMIT} for ${type} ${id} after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.hydrate(type, id);
      }
      
      this.retryCountMap.delete(retryKey);
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

  /**
   * 🧹 CLEANUP: Clear retry counters
   */
  public cleanup(): void {
    this.retryCountMap.clear();
    console.log('🧹 [SNIPER SLICE] Retry counters cleared');
  }
}
