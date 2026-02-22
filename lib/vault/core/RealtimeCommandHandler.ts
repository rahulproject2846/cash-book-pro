"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, normalizeTimestamp } from './VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { validateBook, validateEntry } from './schemas';
import { telemetry } from '../Telemetry';
import { HydrationController } from '../hydration/HydrationController';

/**
 * 🎯 REALTIME COMMAND HANDLER (V1.0 - Command Center Pattern)
 * -----------------------------------------------------------
 * Centralized real-time event processing with dedicated handlers
 * Moved from SyncOrchestrator to implement Command Center pattern
 * 
 * Features:
 * - Separate handlers for each event type
 * - Identity recovery via CID lookup
 * - Smart resurrection with vKey comparison
 * - Conflict resolution and silent auto-resolve
 * - Industrial error handling and logging
 */
export class RealtimeCommandHandler {
  private userId: string;
  private notifyUICallback: () => void;

  constructor(userId: string, notifyUICallback: () => void) {
    this.userId = userId;
    this.notifyUICallback = notifyUICallback;
  }

  /**
   * 🔔 UI NOTIFICATION: Trigger UI refresh
   */
  private notifyUI(): void {
    if (this.notifyUICallback) {
      this.notifyUICallback();
    }
  }

  /**
   * 🧹 PAYLOAD SANITIZATION: Clean dirty data before processing
   */
  private cleanPayload(payload: any): any {
    if (!payload) return payload;

    // 🗑️ DIRTY _ID CLEANUP: Remove empty/null _id to let Dexie handle localId
    if (payload._id === "" || payload._id === null || payload._id === undefined) {
      const { _id, ...cleanPayload } = payload;
      console.log(`🧹 [SANITIZATION] Removed dirty _id: ${_id} from payload`);
      console.log(`🧹 [SANITIZATION] Preserved name: "${cleanPayload.name || 'MISSING'}"`);
      
      // 🔍 CRITICAL FIX: Ensure name field exists
      if (!cleanPayload.name) {
        console.warn(`⚠️ [SANITIZATION] Missing name field in payload:`, cleanPayload);
        cleanPayload.name = `Unnamed Entry (${cleanPayload.cid || 'unknown'})`;
      }
      
      return cleanPayload;
    }

    // 🔢 TYPE SAFETY: Ensure isDeleted is a number
    if (payload.isDeleted !== undefined && payload.isDeleted !== null) {
      payload.isDeleted = Number(payload.isDeleted || 0);
    }

    // 🔍 CRITICAL FIX: Ensure name field exists
    if (!payload.name) {
      console.warn(`⚠️ [SANITIZATION] Missing name field in payload:`, payload);
      payload.name = `Unnamed Entry (${payload.cid || 'unknown'})`;
    }

    // 🔄 SYNC STATE: Ensure proper sync flags
    const cleanPayload = {
      ...payload,
      synced: 1,
      conflicted: 0
    };

    console.log(`🧹 [SANITIZATION] Preserved name: "${cleanPayload.name}"`);
    return cleanPayload;
  }

  /**
   * 🎯 MAIN EVENT DISPATCHER: Route events to specific handlers
   */
  async handleEvent(eventType: string, payload: any): Promise<void> {
    if (!payload || !this.userId) return;

    try {
      // 🛡️ V5.5 SECURITY GUARD: Check lockdown and profile status before processing
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      const userExists = await db.users.get(this.userId);
      
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed' || !userExists) {
        console.error('🛡️ [SECURITY] Realtime event discarded: Profile missing or Lockdown active.');
        return;
      }

      // 🧹 SANITIZE: Clean payload before processing
      const cleanPayload = this.cleanPayload(payload);
      console.log(`📡 [COMMAND CENTER] Processing ${eventType} for user ${this.userId}`);

      // 🔄 DELEGATE TO V6.0: Route all events to new architecture
      return HydrationController.getInstance().handleRealtimeEvent(eventType, cleanPayload);
      
    } catch (error) {
      console.error(`❌ [COMMAND CENTER] Failed to process ${eventType}:`, error);
    }
  }
}
