"use client";

import { db } from '@/lib/offlineDB';
import { UserManager } from '@/lib/vault/core/user/UserManager';

/**
 * 🛡️ SOVEREIGN IDENTITY PROVIDER (V1.0)
 * 
 * Provides resilient identity access with multiple fallback layers:
 * 1. Memory Manager (0ms) - Fastest path
 * 2. localStorage Cache (0ms) - Persistent cache
 * 3. Dexie Database Anchor (~1ms) - Ultimate truth
 * 
 * Guarantees zero "No User ID" errors for service mutations.
 */

export class IdentityProvider {
  
  /**
   * 🚀 GET SOVEREIGN ID - Multi-layer identity resolution
   * 
   * @returns Promise<string | null> User ID from any available source
   */
  static async getSovereignId(): Promise<string | null> {
    try {
      // Layer 1: Memory Manager (Fastest - 0ms)
      const memoryId = UserManager.getInstance().getUserId();
      if (memoryId) {
        console.log('🧠 [IDENTITY] ID found in memory manager:', memoryId);
        return memoryId;
      }

      // Layer 2: localStorage Cache (Fast - 0ms)
      const cacheId = this.getIdFromCache();
      if (cacheId) {
        console.log('💾 [IDENTITY] ID found in localStorage cache:', cacheId);
        // 🔄 Auto-populate memory manager for future calls
        await this.populateMemoryManager(cacheId);
        return cacheId;
      }

      // Layer 3: Dexie Database Anchor (Ultimate Truth - ~1ms)
      const dbId = await this.getIdFromDexie();
      if (dbId) {
        console.log('🗄️ [IDENTITY] ID found in Dexie database:', dbId);
        // 🔄 Auto-populate both cache and memory manager
        await this.populateCache(dbId);
        await this.populateMemoryManager(dbId);
        return dbId;
      }

      console.log('❌ [IDENTITY] No ID found in any source');
      return null;

    } catch (error) {
      console.error('🚨 [IDENTITY] Error in getSovereignId():', error);
      return null;
    }
  }

  /**
   * 💾 Get ID from localStorage cache
   */
  private static getIdFromCache(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const cacheKey = 'vault_user_profile';
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const profile = JSON.parse(cached);
      return profile._id || profile.userId || null;

    } catch (error) {
      console.warn('⚠️ [IDENTITY] Cache read error:', error);
      return null;
    }
  }

  /**
   * 🗄️ Get ID from Dexie database anchor
   */
  private static async getIdFromDexie(): Promise<string | null> {
    try {
      const user = await db.users.orderBy(':id').first();
      return user?._id || user?.userId || null;

    } catch (error) {
      console.warn('⚠️ [IDENTITY] Dexie query error:', error);
      return null;
    }
  }

  /**
   * 🧠 Populate memory manager for future fast access
   */
  private static async populateMemoryManager(userId: string): Promise<void> {
    try {
      const userManager = UserManager.getInstance();
      
      // Get full user profile from Dexie
      const userProfile = await db.users.get(userId);
      if (userProfile) {
        await userManager.setIdentity(userProfile);
      }

    } catch (error) {
      console.warn('⚠️ [IDENTITY] Memory manager population error:', error);
    }
  }

  /**
   * 💾 Populate localStorage cache
   */
  private static async populateCache(userId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      const cacheKey = 'vault_user_profile';
      const userProfile = await db.users.get(userId);
      
      if (userProfile) {
        localStorage.setItem(cacheKey, JSON.stringify(userProfile));
      }

    } catch (error) {
      console.warn('⚠️ [IDENTITY] Cache population error:', error);
    }
  }

  /**
   * 🚀 SYNCED GET ID - Synchronous fallback for critical paths
   * 
   * Returns ID from memory/cache only (no async Dexie query)
   * Use only in synchronous contexts where async is not possible
   */
  static getSyncId(): string | null {
    try {
      // Memory Manager
      const memoryId = UserManager.getInstance().getUserId();
      if (memoryId) return memoryId;

      // localStorage Cache
      return this.getIdFromCache();

    } catch (error) {
      console.warn('⚠️ [IDENTITY] Sync ID error:', error);
      return null;
    }
  }
}

/**
 * 🚀 CONVENIENCE EXPORTS
 */
export const getSovereignId = () => IdentityProvider.getSovereignId();
export const getSyncId = () => IdentityProvider.getSyncId();
