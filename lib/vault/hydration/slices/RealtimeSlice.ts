"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, normalizeTimestamp } from '../../core/VaultUtils';
import { getTimestamp } from '@/lib/shared/utils';
import { validateBook, validateEntry } from '../../core/schemas';
import { telemetry } from '../../Telemetry';
import { getVaultStore } from '../../store/storeHelper';
import type { HydrationResult } from '../engine/types';

/**
 * 📡 REALTIME SLICE - Real-time Event Processing
 * 
 * Handles real-time events from WebSocket/Pusher
 * Contains conflict resolution and business logic from original RealtimeCommandHandler
 */
export class RealtimeSlice {
  private userId: string = '';

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 📡 HANDLE EVENT - Main entry point for real-time processing
   */
  async handleEvent(eventType: string, payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📡 [REALTIME SLICE] Processing ${eventType} for user ${this.userId}`);

      // 🛡️ SECURITY GUARD: Check lockdown and profile status before processing
      const { isSecurityLockdown, emergencyHydrationStatus } = getVaultStore();
      const userExists = await db.users.get(this.userId);
      
      if (isSecurityLockdown || emergencyHydrationStatus === 'failed' || !userExists) {
        console.error('🛡️ [REALTIME SLICE] Realtime event discarded: Profile missing or Lockdown active.');
        return { 
          success: false, 
          error: 'SECURITY_LOCKDOWN: Realtime event discarded'
        };
      }

      // 🧹 SANITIZE: Clean payload before processing
      const cleanPayload = this.cleanPayload(payload);
      console.log(`📡 [REALTIME SLICE] Processing ${eventType} for user ${this.userId}`);

      switch (eventType) {
        case 'BOOK_CREATED':
          await this.handleBookCreated(cleanPayload);
          break;
        case 'BOOK_UPDATED':
          await this.handleBookUpdated(cleanPayload);
          break;
        case 'BOOK_DELETED':
          await this.handleBookDeleted(cleanPayload);
          break;
        case 'ENTRY_CREATED':
          await this.handleEntryCreated(cleanPayload);
          break;
        case 'ENTRY_UPDATED':
          await this.handleEntryUpdated(cleanPayload);
          break;
        case 'ENTRY_DELETED':
          await this.handleEntryDeleted(cleanPayload);
          break;
        default:
          console.warn(`🚨 [REALTIME SLICE] Unknown event type: ${eventType}`);
          return { 
            success: false, 
            error: `Unknown event type: ${eventType}`
          };
      }

      return { success: true };

    } catch (error) {
      console.error(`❌ [REALTIME SLICE] Failed to process ${eventType}:`, error);
      return { 
        success: false, 
        error: String(error)
      };
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
   * 📚 BOOK CREATED: Handle new book creation
   */
  private async handleBookCreated(payload: any): Promise<void> {
    console.log(`📚 [REALTIME SLICE] Processing BOOK_CREATED: ${payload.cid}`);

    // 🛡️ VALIDATION PIPELINE: Normalize → Validate → Store
    const normalized = normalizeRecord(payload, this.userId);
    if (!normalized) {
      console.error(`🚨 [VALIDATOR] Book normalization failed for CID: ${payload.cid}`);
      await telemetry.log({
        type: 'SECURITY',
        level: 'CRITICAL',
        message: `Realtime validation failed: Book normalization failed`,
        data: { cid: payload.cid, payload }
      });
      return;
    }

    const validationResult = validateBook(normalized);
    if (!validationResult.success) {
      console.error(`🚨 [VALIDATOR] Book validation failed for CID: ${payload.cid}: ${validationResult.error}`);
      await telemetry.log({
        type: 'SECURITY',
        level: 'CRITICAL',
        message: `Realtime validation failed: ${validationResult.error}`,
        data: { cid: payload.cid, error: validationResult.error }
      });
      return;
    }

    // Use validated data
    const data = validationResult.data;
    const ts = normalizeTimestamp(data.updatedAt || getTimestamp());

    console.log(`📚 [REALTIME SLICE] Validated data name: "${data.name}"`);

    // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
    const { HydrationEngine } = await import('../engine/HydrationEngine');
    const engine = new HydrationEngine(this.userId);
    
    await engine.commit('BOOK', [data], 'realtime_book_created');
  }

  /**
   * 📚 BOOK UPDATED: Handle book updates
   */
  private async handleBookUpdated(payload: any): Promise<void> {
    console.log(`📚 [REALTIME SLICE] Processing BOOK_UPDATED: ${payload.cid}`);

    // 🔍 IDENTITY RECOVERY: Find existing record by CID
    const existingBook = payload.cid ? 
      await db.books.where('cid').equals(payload.cid).first() : null;

    // 🏷️ TOMBSTONE AWARENESS: Handle deleted events properly
    const dataWithLocalId = { 
      ...payload, 
      localId: existingBook?.localId, 
      synced: 1,
      isDeleted: Number(payload.isDeleted || 0)
    };

    const data = normalizeRecord(dataWithLocalId, this.userId);
    const ts = normalizeTimestamp(data.updatedAt || Date.now());

    // 🔕 DELETE AUTHORITY: Handle server-deleted books
    if (Number(data.isDeleted) === 1) {
      if (existingBook) {
        // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
        const { HydrationEngine } = await import('../engine/HydrationEngine');
        const engine = new HydrationEngine(this.userId);
        
        await engine.commit('BOOK', { ...data, isDeleted: 1 }, 'realtime_book_deleted');
      }
      return;
    }

    if (!existingBook) {
      // 🌟 ROBUST RESURRECTION: Recreate hard-deleted record from server payload
      if (Number(data.isDeleted) === 0) {
        // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
        const { HydrationEngine } = await import('../engine/HydrationEngine');
        const engine = new HydrationEngine(this.userId);
        
        await engine.commit('BOOK', [data], 'realtime_book_resurrected');
      }
      return;
    }

    // Case 2: Existing Record - Update if newer or on fresh login
    const isFreshLogin = !existingBook.updatedAt || (getTimestamp() - existingBook.updatedAt.getTime()) < 5000;
    const shouldUpdate = data.vKey > existingBook.vKey || isFreshLogin;
    
    if (shouldUpdate) {
      // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
      const { HydrationEngine } = await import('../engine/HydrationEngine');
      const engine = new HydrationEngine(this.userId);
      
      await engine.commit('BOOK', [data], 'realtime_book_updated');
    }
  }

  /**
   * 📚 BOOK DELETED: Handle book deletion
   */
  private async handleBookDeleted(payload: any): Promise<void> {
    console.log(`🗑️ [REALTIME SLICE] Processing BOOK_DELETED: ${payload.cid}`);

    // 🔍 IDENTITY RECOVERY: Find existing record by CID
    const existingBook = payload.cid ? 
      await db.books.where('cid').equals(payload.cid).first() : null;

    if (existingBook) {
      // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
      const { HydrationEngine } = await import('../engine/HydrationEngine');
      const engine = new HydrationEngine(this.userId);
      
      await engine.commit('BOOK', { ...payload, isDeleted: 1 }, 'realtime_book_deleted');
    }
  }

  /**
   * 📝 ENTRY CREATED: Handle new entry creation
   */
  private async handleEntryCreated(payload: any): Promise<void> {
    console.log(`📝 [REALTIME SLICE] Processing ENTRY_CREATED: ${payload.cid}`);

    //  DELEGATE TO ENGINE: Use HydrationEngine for database operations
    const { HydrationEngine } = await import('../engine/HydrationEngine');
    const engine = new HydrationEngine(this.userId);
    
    await engine.commit('ENTRY', [payload], 'realtime_entry_created');
  }

  /**
   * 📝 ENTRY UPDATED: Handle entry updates
   */
  private async handleEntryUpdated(payload: any): Promise<void> {
    console.log(`📝 [REALTIME SLICE] Processing ENTRY_UPDATED: ${payload.cid}`);

    // 🔍 IDENTITY RECOVERY: Find existing record by CID
    const existing = payload.cid ? 
      await db.entries.where('cid').equals(payload.cid).first() : null;

    // 🏷️ TOMBSTONE AWARENESS: Handle deleted events properly
    const dataWithLocalId = { 
      ...payload, 
      localId: existing?.localId, 
      synced: 1,
      isDeleted: Number(payload.isDeleted || 0)
    };

    const data = normalizeRecord(dataWithLocalId, this.userId);
    const ts = normalizeTimestamp(data.updatedAt || Date.now());

    // 🔕 DELETE AUTHORITY: Handle server-deleted entries
    if (Number(data.isDeleted) === 1) {
      if (existing) {
        // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
        const { HydrationEngine } = await import('../engine/HydrationEngine');
        const engine = new HydrationEngine(this.userId);
        
        await engine.commit('ENTRY', { ...data, isDeleted: 1 }, 'realtime_entry_deleted');
      }
      return;
    }

    if (!existing) {
      // 🌟 ROBUST RESURRECTION: Recreate hard-deleted record from server payload
      if (Number(data.isDeleted) === 0) {
        // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
        const { HydrationEngine } = await import('../engine/HydrationEngine');
        const engine = new HydrationEngine(this.userId);
        
        await engine.commit('ENTRY', [data], 'realtime_entry_resurrected');
      }
      return;
    }

    // Case 2: Existing Record - Update if newer or on fresh login
    const isFreshLogin = !existing.updatedAt || (getTimestamp() - existing.updatedAt.getTime()) < 5000;
    const shouldUpdate = data.vKey > existing.vKey || isFreshLogin;
    
    if (shouldUpdate) {
      // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
      const { HydrationEngine } = await import('../engine/HydrationEngine');
      const engine = new HydrationEngine(this.userId);
      
      await engine.commit('ENTRY', [data], 'realtime_entry_updated');
    }
  }

  /**
   * 📝 ENTRY DELETED: Handle entry deletion
   */
  private async handleEntryDeleted(payload: any): Promise<void> {
    console.log(`🗑️ [REALTIME SLICE] Processing ENTRY_DELETED: ${payload.cid}`);

    // 🔍 IDENTITY RECOVERY: Find existing record by CID
    const existing = payload.cid ? 
      await db.entries.where('cid').equals(payload.cid).first() : null;

    if (existing) {
      // 🔄 DELEGATE TO ENGINE: Use HydrationEngine for database operations
      const { HydrationEngine } = await import('../engine/HydrationEngine');
      const engine = new HydrationEngine(this.userId);
      
      await engine.commit('ENTRY', { ...payload, isDeleted: 1 }, 'realtime_entry_deleted');
    }
  }

  /**
   * 🔍 BUSINESS FIELDS COMPARISON: Compare business data for silent auto-resolve
   */
  private compareBusinessFields(existing: any, incoming: any, type: 'BOOK' | 'ENTRY'): boolean {
    try {
      if (type === 'BOOK') {
        return (
          existing.name === incoming.name &&
          existing.currency === incoming.currency &&
          existing.description === incoming.description
        );
      } else {
        return (
          existing.amount === incoming.amount &&
          existing.title === incoming.title &&
          existing.category === incoming.category &&
          existing.type === incoming.type &&
          existing.status === incoming.status
        );
      }
    } catch (error) {
      console.error(`❌ [REALTIME SLICE] Business fields comparison failed:`, error);
      return false;
    }
  }

  /**
   * 🛡️ SELECTIVE MERGE: Field-level merging to prevent data loss
   */
  private selectiveMerge(existing: any, incoming: any, type: 'BOOK' | 'ENTRY'): any {
    const merged = { ...existing };
    
    if (type === 'BOOK') {
      // Book fields: Only merge if explicitly provided and different
      if (incoming.name !== undefined && incoming.name !== existing.name) {
        merged.name = incoming.name;
      }
      if (incoming.description !== undefined && incoming.description !== existing.description) {
        merged.description = incoming.description;
      }
      if (incoming.type !== undefined && incoming.type !== existing.type) {
        merged.type = incoming.type;
      }
      if (incoming.phone !== undefined && incoming.phone !== existing.phone) {
        merged.phone = incoming.phone;
      }
      if (incoming.image !== undefined && incoming.image !== null && incoming.image !== "" && incoming.image !== existing.image) {
        merged.image = incoming.image;
      } else if (existing.image) {
        merged.image = existing.image;
      }
    } else {
      // Entry fields: Only merge if explicitly provided and different
      if (incoming.title !== undefined && incoming.title !== existing.title) {
        merged.title = incoming.title;
      }
      if (incoming.amount !== undefined && incoming.amount !== existing.amount) {
        merged.amount = incoming.amount;
      }
      if (incoming.type !== undefined && incoming.type !== existing.type) {
        merged.type = incoming.type;
      }
      if (incoming.category !== undefined && incoming.category !== existing.category) {
        merged.category = incoming.category;
      }
      if (incoming.paymentMethod !== undefined && incoming.paymentMethod !== existing.paymentMethod) {
        merged.paymentMethod = incoming.paymentMethod;
      }
      if (incoming.note !== undefined && incoming.note !== existing.note) {
        merged.note = incoming.note;
      }
      if (incoming.date !== undefined && incoming.date !== existing.date) {
        merged.date = incoming.date;
      }
      if (incoming.time !== undefined && incoming.time !== existing.time) {
        merged.time = incoming.time;
      }
      if (incoming.status !== undefined && incoming.status !== existing.status) {
        merged.status = incoming.status;
      }
    }
    
    // Always update system fields
    merged.vKey = incoming.vKey;
    merged.updatedAt = incoming.updatedAt;
    merged.synced = incoming.synced;
    
    return merged;
  }
}
