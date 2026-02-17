"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord, normalizeTimestamp } from './VaultUtils';

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

    // � DEBUG: Log payload structure for debugging
    console.log(`🧹 [SANITIZATION DEBUG] Incoming payload structure:`, {
      _id: payload._id,
      name: payload.name,
      cid: payload.cid,
      vKey: payload.vKey,
      isDeleted: payload.isDeleted,
      keys: Object.keys(payload)
    });

    // �🗑️ DIRTY _ID CLEANUP: Remove empty/null _id to let Dexie handle localId
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
      // 🧹 SANITIZE: Clean payload before processing
      const cleanPayload = this.cleanPayload(payload);
      console.log(`📡 [COMMAND CENTER] Processing ${eventType} for user ${this.userId}`);

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
          console.warn(`🚨 [COMMAND CENTER] Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`❌ [COMMAND CENTER] Failed to process ${eventType}:`, error);
    }
  }

  /**
   * BOOK CREATED: Handle new book creation
   */
  private async handleBookCreated(payload: any): Promise<void> {
    console.log(` [BOOK CREATED] Processing CID: ${payload.cid}`);
    console.log(` [BOOK CREATED] Original payload name: "${payload.name}"`);

    // TRANSACTION SAFETY: Wrap in transaction to prevent race conditions
    await db.transaction('rw', db.books, async () => {
      // IDENTITY RECOVERY: Find existing record by CID
      const existingBook = payload.cid ? 
        await db.books.where('cid').equals(payload.cid).first() : null;

      const data = normalizeRecord(payload, this.userId);
      const ts = normalizeTimestamp(data.updatedAt || Date.now());

      console.log(` [BOOK CREATED] Normalized data name: "${data.name}"`);
      console.log(` [BOOK CREATED] About to save to Dexie with name: "${data.name}"`);

      // REALTIME GUARD: Smart Hydration Logic
      if (!existingBook) {
        // Case 1: New Record - Use add() for clean insertion
        await db.books.add({ ...data, updatedAt: ts });
        console.log(` [BOOK CREATED] Smart merge CID: ${data.cid} | Status: New | Name: "${data.name}"`);
        this.notifyUI();
      } else {
        // 🔒 PROTECT NEW CREATIONS: Block deletion of optimistic creations
        if (existingBook.synced === 0 && Number(data.isDeleted) === 1) {
          console.log(`🛡️ [PROTECTION] Blocking deletion of optimistic creation CID: ${data.cid} | Local synced: 0 | Server isDeleted: 1`);
          return; // 🚫 BLOCK: Do not delete our new creation with stale server data
        }
        
        // Case 2: Existing Record - Update if newer or on fresh login
        const isFreshLogin = !existingBook.updatedAt || (Date.now() - existingBook.updatedAt.getTime()) < 5000;
        const shouldUpdate = data.vKey > existingBook.vKey || isFreshLogin;
        
        if (shouldUpdate) {
          await db.books.update(existingBook.localId!, { ...data, updatedAt: ts });
          console.log(` [BOOK CREATED] Smart merge CID: ${data.cid} | Status: Updated | Reason: ${isFreshLogin ? 'Fresh Login' : 'Newer vKey'} | Name: "${data.name}"`);
          this.notifyUI();
        } else {
          console.log(` [BOOK CREATED] Smart merge CID: ${data.cid} | Status: Skipped (vKey not newer) | Name: "${data.name}" | Local vKey: ${existingBook.vKey} | Remote vKey: ${data.vKey}`);
        }
      }
    });
  }

  /**
   * 📚 BOOK UPDATED: Handle book updates
   */
  private async handleBookUpdated(payload: any): Promise<void> {
    console.log(`📚 [BOOK UPDATED] Processing CID: ${payload.cid}`);

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
        // � PROTECT NEW CREATIONS: Block deletion of optimistic creations
        if (existingBook.synced === 0) {
          console.log(`🛡️ [PROTECTION] Blocking deletion of optimistic creation in BOOK_UPDATED CID: ${data.cid} | Local synced: 0 | Server isDeleted: 1`);
          return; // 🚫 BLOCK: Do not delete our new creation with stale server data
        }
        
        // �🗑️ CASCADE DELETE: Remove book and all associated entries
        console.log(`🗑️ [BOOK DELETED] Removing deleted book and all entries for CID: ${data.cid}`);
        
        // Robust Deletion: Match by MongoDB _id OR the temporary CID
        const deletedEntriesCount = await db.entries
          .where('[bookId+userId]').equals([existingBook._id, this.userId]) // 1. Match by final _id
          .or('[bookId+userId]').equals([existingBook.cid, this.userId])   // 2. Match by temporary CID
          .delete();
        
        console.log(`🗑️ [CASCADE DELETE] Removed ${deletedEntriesCount} entries for book ${data.cid} (_id: ${existingBook._id}, cid: ${existingBook.cid})`);
        
        // Hard delete the book from Dexie
        await db.books.delete(existingBook.localId!);
        
        console.log(`🗑️ [BOOK DELETED] Cascade complete: Book ${data.cid} and all ${deletedEntriesCount} entries removed`);
        this.notifyUI();
      }
      return; // Exit early for deleted books
    }

    if (!existingBook) {
      // 🌟 ROBUST RESURRECTION: Recreate hard-deleted record from server payload
      if (Number(data.isDeleted) === 0) {
        console.log(`🌟 [RESURRECTION] Recreating deleted book CID: ${data.cid}`);
        await db.books.put({
          ...data,
          localId: await this.generateLocalId(),
          synced: 1,
          conflicted: 0,
          updatedAt: ts
        });
        console.log(`✅ [RESURRECTION] Book ${data.cid} restored from server payload`);
        this.notifyUI();
        return;
      }
      
      // Case 1: New Record - Insert as synced
      await db.books.put({ ...data, updatedAt: ts });
      console.log(`📡 [BOOK UPDATED] Smart merge CID: ${data.cid} | Status: New`);
      this.notifyUI();
    } else if (existingBook.synced === 0) {
      // Case 2: Protect Unsynced Work - Check for silent auto-resolve first
      if (Number(existingBook.isDeleted) === 1 && Number(data.isDeleted) === 0) {
        // 🌟 LEGITIMATE RESURRECTION: Allow restoration if server vKey is higher
        if (data.vKey > existingBook.vKey) {
          await db.books.update(existingBook.localId!, { ...data, updatedAt: ts });
          console.log(`🌟 [BOOK UPDATED] Legitimate resurrection for CID: ${data.cid}`);
          this.notifyUI();
        } else {
          console.log(`💀 [BOOK UPDATED] Blocking stale resurrection for CID: ${data.cid}`);
        }
      } else {
        // 🔕 SILENT AUTO-RESOLVE: Compare business data fields before flagging conflict
        const businessFieldsMatch = this.compareBusinessFields(existingBook, data, 'BOOK');
        
        if (businessFieldsMatch) {
          // 🤫 SILENT RESOLVE: Data identical, just update vKey and sync status
          await db.books.update(existingBook.localId!, { 
            vKey: data.vKey, 
            synced: 1,
            conflicted: 0,
            conflictReason: '',
            serverData: null,
            updatedAt: ts
          });
          console.log(`🤫 [BOOK UPDATED] Silent auto-resolve for CID: ${data.cid}`);
          this.notifyUI();
        } else {
          // 🚨 CONFLICT: Data differs, use selective merge to preserve field-level changes
          const selectiveMerged = this.selectiveMerge(existingBook, data, 'BOOK');
          await db.books.update(existingBook.localId!, {
            ...selectiveMerged,
            conflicted: 1,
            conflictReason: 'FIELD_LEVEL_CONFLICT',
            serverData: data,
            updatedAt: ts
          });
          console.log(`🚨 [BOOK UPDATED] Field-level conflict detected for CID: ${data.cid} - Selective merge applied`);
          this.notifyUI();
        }
      }
    } else {
      // Case 3: Update Synced Record - Use selective merge to preserve field changes
      // 🔧 BOOK EDIT PERSISTENCE: Always update if vKey is equal or newer
      if (data.vKey >= existingBook.vKey) {
        const selectiveMerged = this.selectiveMerge(existingBook, data, 'BOOK');
        await db.books.update(existingBook.localId!, { ...selectiveMerged, updatedAt: ts });
        console.log(`📡 [BOOK UPDATED] Smart merge CID: ${data.cid} | Status: Updated (Selective Merge) | vKey: ${data.vKey} >= ${existingBook.vKey}`);
        this.notifyUI();
      } else {
        console.log(`📡 [BOOK UPDATED] Smart merge CID: ${data.cid} | Status: Skipped (vKey not newer) | Local: ${existingBook.vKey} > Remote: ${data.vKey}`);
      }
    }
  }

  /**
   * 📚 BOOK DELETED: Handle book deletion
   */
  private async handleBookDeleted(payload: any): Promise<void> {
    console.log(`🗑️ [BOOK DELETED] Processing CID: ${payload.cid}`);

    // 🔍 IDENTITY RECOVERY: Find existing record by CID
    const existingBook = payload.cid ? 
      await db.books.where('cid').equals(payload.cid).first() : null;

    if (existingBook) {
      // 🚨 SMART EJECTION: Capture book info BEFORE deletion for debugging
      console.log(`🚨 [SMART EJECTION] About to delete book:`, {
        _id: existingBook._id,
        localId: existingBook.localId,
        name: existingBook.name,
        cid: existingBook.cid
      });
      
      // � SMART EJECTION: Dispatch event BEFORE deletion to prevent race condition
      if (typeof window !== 'undefined') {
        const bookIdForEvent = payload._id || payload.bookId || existingBook._id;
        console.log(`🚨 [SMART EJECTION] Dispatching VAULT_BOOK_DELETED with bookId:`, bookIdForEvent);
        
        window.dispatchEvent(new CustomEvent('VAULT_BOOK_DELETED', { 
          detail: { bookId: bookIdForEvent } 
        }));
        console.log(`🚨 [SMART EJECTION] Dispatched VAULT_BOOK_DELETED for book: ${bookIdForEvent}`);
      }
      
      // ⏱️ SMALL DELAY: Give React rendering cycle time to process the event
      await new Promise(r => setTimeout(r, 50));
      
      // 🗑️ CASCADE DELETE: Remove book and all associated entries
      console.log(`🗑️ [BOOK DELETED] Removing deleted book and all entries for CID: ${payload.cid}`);
      
      // Robust Deletion: Match by MongoDB _id OR the temporary CID
      const deletedEntriesCount = await db.entries
        .where('[bookId+userId]').equals([existingBook._id, this.userId]) // 1. Match by final _id
        .or('[bookId+userId]').equals([existingBook.cid, this.userId])   // 2. Match by temporary CID
        .delete();
      
      console.log(`🗑️ [CASCADE DELETE] Removed ${deletedEntriesCount} entries for book ${payload.cid} (_id: ${existingBook._id}, cid: ${existingBook.cid})`);
      
      // Hard delete the book from Dexie
      await db.books.delete(existingBook.localId!);
      
      console.log(`🗑️ [BOOK DELETED] Cascade complete: Book ${payload.cid} and all ${deletedEntriesCount} entries removed`);
      
      this.notifyUI();
      
      // 🔍 IMMEDIATE VERIFICATION: Trigger integrity check to verify counts match instantly
      if (typeof window !== 'undefined' && window.orchestrator) {
        console.log(`🔍 [IMMEDIATE VERIFICATION] Triggering integrity check after book deletion`);
        setTimeout(() => {
          window.orchestrator?.performIntegrityCheck?.(this.userId);
        }, 100); // Small delay to ensure Dexie writes complete
      }
    } else {
      console.log(`🗑️ [BOOK DELETED] Book not found for CID: ${payload.cid}`);
    }
  }

  /**
   * 📝 ENTRY CREATED: Handle new entry creation
   */
  private async handleEntryCreated(payload: any): Promise<void> {
    console.log(`📝 [ENTRY CREATED] Processing CID: ${payload.cid}`);

    // 🔒 TRANSACTION SAFETY: Wrap in transaction to prevent race conditions
    await db.transaction('rw', db.entries, async () => {
      // 🔍 IDENTITY RECOVERY: Find existing record by CID
      const existing = payload.cid ? 
        await db.entries.where('cid').equals(payload.cid).first() : null;

      const data = normalizeRecord(payload, this.userId);
      const ts = normalizeTimestamp(data.updatedAt || Date.now());

      // 📡 [REALTIME GUARD] Smart Hydration Logic
      if (!existing) {
        // Case 1: New Record - Use add() for clean insertion
        await db.entries.add({ ...data, updatedAt: ts });
        console.log(`📡 [ENTRY CREATED] Smart merge CID: ${data.cid} | Status: New`);
        this.notifyUI();
      } else {
        // Case 2: Existing Record - Update if newer or on fresh login
        const isFreshLogin = !existing.updatedAt || (Date.now() - existing.updatedAt.getTime()) < 5000;
        const shouldUpdate = data.vKey > existing.vKey || isFreshLogin;
        
        if (shouldUpdate) {
          await db.entries.update(existing.localId!, { ...data, updatedAt: ts });
          console.log(`📡 [ENTRY CREATED] Smart merge CID: ${data.cid} | Status: Updated | Reason: ${isFreshLogin ? 'Fresh Login' : 'Newer vKey'}`);
          this.notifyUI();
        } else {
          console.log(`📡 [ENTRY CREATED] Smart merge CID: ${data.cid} | Status: Skipped (vKey not newer) | Local vKey: ${existing.vKey} | Remote vKey: ${data.vKey}`);
        }
      }
    });
  }

  /**
   * 📝 ENTRY UPDATED: Handle entry updates
   */
  private async handleEntryUpdated(payload: any): Promise<void> {
    console.log(`📝 [ENTRY UPDATED] Processing CID: ${payload.cid}`);

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
        await db.entries.delete(existing.localId!);
        console.log(`🗑️ [ENTRY DELETED] Hard deleted entry CID: ${data.cid}`);
        this.notifyUI();
      }
      return; // Exit early for deleted entries
    }

    if (!existing) {
      // 🌟 ROBUST RESURRECTION: Recreate hard-deleted record from server payload
      if (Number(data.isDeleted) === 0) {
        console.log(`🌟 [RESURRECTION] Recreating deleted entry CID: ${data.cid}`);
        await db.entries.put({
          ...data,
          localId: await this.generateLocalId(),
          synced: 1,
          conflicted: 0,
          updatedAt: ts
        });
        console.log(`✅ [RESURRECTION] Entry ${data.cid} restored from server payload`);
        this.notifyUI();
        return;
      }
      
      // Case 1: New Record - Insert as synced
      await db.entries.put({ ...data, updatedAt: ts });
      console.log(`📡 [ENTRY UPDATED] Smart merge CID: ${data.cid} | Status: New`);
      this.notifyUI();
    } else if (existing.synced === 0) {
      // Case 2: Protect Unsynced Work - Check for silent auto-resolve first
      if (Number(existing.isDeleted) === 1 && Number(data.isDeleted) === 0) {
        // 🌟 LEGITIMATE RESURRECTION: Allow restoration if server vKey is higher
        if (data.vKey > existing.vKey) {
          await db.entries.update(existing.localId!, { ...data, updatedAt: ts });
          console.log(`🌟 [ENTRY UPDATED] Legitimate resurrection for CID: ${data.cid}`);
          this.notifyUI();
        } else {
          console.log(`💀 [ENTRY UPDATED] Blocking stale resurrection for CID: ${data.cid}`);
        }
      } else {
        // 🔕 SILENT AUTO-RESOLVE: Compare business data fields before flagging conflict
        const businessFieldsMatch = this.compareBusinessFields(existing, data, 'ENTRY');
        
        if (businessFieldsMatch) {
          // 🤫 SILENT RESOLVE: Data identical, just update vKey and sync status
          await db.entries.update(existing.localId!, { 
            vKey: data.vKey, 
            synced: 1,
            conflicted: 0,
            conflictReason: '',
            serverData: null,
            updatedAt: ts
          });
          console.log(`🤫 [ENTRY UPDATED] Silent auto-resolve for CID: ${data.cid}`);
          this.notifyUI();
        } else {
          // 🚨 CONFLICT: Data differs, use selective merge to preserve field-level changes
          const selectiveMerged = this.selectiveMerge(existing, data, 'ENTRY');
          await db.entries.update(existing.localId!, {
            ...selectiveMerged,
            conflicted: 1,
            conflictReason: 'FIELD_LEVEL_CONFLICT',
            serverData: data,
            updatedAt: ts
          });
          console.log(`🚨 [ENTRY UPDATED] Field-level conflict detected for CID: ${data.cid} - Selective merge applied`);
          this.notifyUI();
        }
      }
    } else {
      // Case 3: Update Synced Record - Use selective merge to preserve field changes
      if (data.vKey >= existing.vKey) {
        const selectiveMerged = this.selectiveMerge(existing, data, 'ENTRY');
        await db.entries.update(existing.localId!, { ...selectiveMerged, updatedAt: ts });
        console.log(`📡 [ENTRY UPDATED] Smart merge CID: ${data.cid} | Status: Updated (Selective Merge)`);
        this.notifyUI();
      } else {
        console.log(`📡 [ENTRY UPDATED] Smart merge CID: ${data.cid} | Status: Skipped (vKey not newer)`);
      }
    }
  }

  /**
   * 📝 ENTRY DELETED: Handle entry deletion
   */
  private async handleEntryDeleted(payload: any): Promise<void> {
    console.log(`🗑️ [ENTRY DELETED] Processing CID: ${payload.cid}`);

    // 🔍 STRICT DELETION: Delete by entry's own CID directly - no bookId dependency
    const existing = payload.cid ? 
      await db.entries.where('cid').equals(payload.cid).first() : null;

    if (existing) {
      await db.entries.delete(existing.localId!);
      console.log(`🗑️ [ENTRY DELETED] Hard deleted entry CID: ${payload.cid} | Local ID: ${existing.localId}`);
      
      // 🚨 FORCE UI REFRESH: Dispatch specific event for immediate update across all devices
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('VAULT_ENTRY_DELETED', { 
          detail: { cid: payload.cid } 
        }));
        console.log(`🚨 [ENTRY DELETED] Dispatched VAULT_ENTRY_DELETED for entry: ${payload.cid}`);
      }
      
      this.notifyUI();
      
      // 🔍 IMMEDIATE VERIFICATION: Trigger integrity check to verify counts match instantly
      if (typeof window !== 'undefined' && window.orchestrator) {
        console.log(`🔍 [IMMEDIATE VERIFICATION] Triggering integrity check after entry deletion`);
        setTimeout(() => {
          window.orchestrator?.performIntegrityCheck?.(this.userId);
        }, 100); // Small delay to ensure Dexie writes complete
      }
    } else {
      console.log(`🗑️ [ENTRY DELETED] Entry not found for CID: ${payload.cid}`);
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
      console.error(`❌ [COMMAND CENTER] Business fields comparison failed:`, error);
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
      if (incoming.image !== undefined && incoming.image !== existing.image) {
        merged.image = incoming.image;
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

  /**
   * 🔧 GENERATE LOCAL ID: Helper for resurrection logic
   */
  private async generateLocalId(): Promise<number> {
    // Generate a unique local ID for resurrection
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}
