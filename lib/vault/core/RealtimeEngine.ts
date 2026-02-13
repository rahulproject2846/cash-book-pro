"use client";
import { db } from '@/lib/offlineDB';
import { 
    normalizeTimestamp, 
    dispatchDatabaseUpdate, 
    safeNumber, 
    safeDexieLookup, 
    isNewerRecord, 
    safeDexiePut 
} from '../core/VaultUtils';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * VAULT PRO: REALTIME ENGINE (V25.2 - UNBREAKABLE INTEGRITY)
 * ----------------------------------------------------
 * Pusher integration and real-time signal processing.
 * Fixed: Function signatures for VaultUtils.ts compliance.
 * Fixed: ID Bridge logic block and bracket integrity.
 */

export class RealtimeEngine {
  private userId: string;
  private hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>;
  private securityGate: any;
  private broadcastCallback: () => void;
  
  // 🔍 EVENT COUNTER: Track all received events for investigation
  private eventCounter: { [key: string]: number } = {};
  private lastEventTime: { [key: string]: number } = {};
  
  // 🔥 IDEMPOTENCY SHIELD: Prevent duplicate CID processing
  private processingCids = new Set<string>();
  private processingIds = new Set<string>();

  constructor(
    userId: string, 
    hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>,
    securityGate: any,
    broadcastCallback: () => void
  ) {
    this.userId = userId;
    this.hydrateCallback = hydrateCallback;
    this.securityGate = securityGate;
    this.broadcastCallback = broadcastCallback;
  }

  // 🔒 SERVER-FIRST AUTHORITY: Enforce server data overwrites local state
  private async enforceServerFirstAuthority(type: 'book' | 'entry', serverData: any) {
    console.log(`🔒 SERVER-FIRST: Enforcing ${type} authority from server`, serverData);
    
    try {
      // 🔍 STRICT KEY VALIDATION
      const hasValidId = serverData._id || serverData.cid;
      const hasValidCid = serverData.cid;
      
      if (!hasValidId || !hasValidCid) {
        console.error('🔒 SERVER-FIRST: Missing required keys for lookup', {
          missingFields: { _id: !serverData._id, cid: !serverData.cid },
          serverData,
          willTriggerEmergencyHydration: true
        });
        setTimeout(() => this.hydrateCallback(this.userId), 100);
        return;
      }
      
      if (type === 'entry') {
        try {
          // 🔍 LOOKUP-FIRST STRATEGY: Find existing records before any operation
          const lookupResult = await safeDexieLookup('entries', serverData.cid, serverData._id);
          const localRecord = lookupResult.byCid || lookupResult.byId || null;
          
          if (localRecord) {
            // 🔒 CONSTRAINT PROTECTION: Compare versions using isNewerRecord(serverData, localRecord || null)
            const shouldUpdate = isNewerRecord(serverData, localRecord || null);
            
            if (shouldUpdate) {
              // 🛡️ SHADOW BUFFER SAFETY: Check if entry is currently in deleted but buffered state
              if (localRecord.isDeleted && (localRecord as any)._emergencyFlushed) {
                console.log('🔧 SKIPPING UPDATE: Entry is in ShadowBuffer deleted state');
                return;
              }
              
              // 🔧 UPDATE STRATEGY: Use update() instead of put() to preserve localId and prevent ConstraintError
              const normalizedServerData = {
                ...serverData,
                updatedAt: normalizeTimestamp(serverData.updatedAt),
                createdAt: normalizeTimestamp(serverData.createdAt),
                synced: 1
              };
              
              await db.entries.update(localRecord.localId!, normalizedServerData);
              dispatchDatabaseUpdate('server-overwrite', 'entry', normalizedServerData);
            } else {
              console.log('🔧 SKIPPING UPDATE: Local data is newer or identical');
            }
          } else {
            // 🔧 NEW RECORD: Only use safeDexiePut when no existing record found
            const normalizedServerData = {
              ...serverData,
              updatedAt: normalizeTimestamp(serverData.updatedAt),
              createdAt: normalizeTimestamp(serverData.createdAt),
              synced: 1
            };
            
            await safeDexiePut('entries', normalizedServerData, null);
            dispatchDatabaseUpdate('server-create', 'entry', normalizedServerData);
          }
        } catch (error) {
          // 🔥 CONSTRAINT ERROR HANDLING: Specifically handle ConstraintError
          if (error instanceof Error && error.name === 'ConstraintError') {
            // 🔥 SILENT GUARD: Log as INFO instead of warning
            const { logVault } = await import('@/lib/vault/core/VaultUtils');
            logVault('Realtime Guard: Duplicate signal ignored (Data already safe)', {
              cid: serverData.cid,
              _id: serverData._id,
              error: error.message
            }, 'INFO');
            return; // Skip this operation but don't crash
          }
          console.error('🔒 SERVER-FIRST ENTRY ERROR:', error);
          setTimeout(() => this.hydrateCallback(this.userId), 100);
        }
      } else if (type === 'book') {
        try {
          // 🔍 LOOKUP-FIRST STRATEGY: Find existing records before any operation
          const lookupResult = await safeDexieLookup('books', serverData.cid, serverData._id);
          const localRecord = lookupResult.byCid || lookupResult.byId || null;
          
          if (localRecord) {
            // 🔒 CONSTRAINT PROTECTION: Compare versions using isNewerRecord(serverData, localRecord || null)
            const shouldUpdate = isNewerRecord(serverData, localRecord || null);
            
            if (shouldUpdate) {
              // 🛡️ SHADOW BUFFER SAFETY: Check if book is currently in deleted state
              if (localRecord.isDeleted) {
                console.log('🔧 SKIPPING UPDATE: Book is in deleted state');
                return;
              }
              
              // 🔧 UPDATE STRATEGY: Use update() instead of put() to preserve localId and prevent ConstraintError
              const normalizedServerData = {
                ...serverData,
                updatedAt: normalizeTimestamp(serverData.updatedAt),
                createdAt: normalizeTimestamp(serverData.createdAt),
                synced: 1
              };
              
              await db.books.update(localRecord.localId!, normalizedServerData);
              dispatchDatabaseUpdate('server-overwrite', 'book', normalizedServerData);
              
              // 🔥 THE ID BRIDGE (Crucial): Update all entries where bookId equals old ID/localId
              if (localRecord.localId && serverData._id && String(localRecord.localId) !== String(serverData._id)) {
                await db.entries.where('bookId').equals(String(localRecord.localId)).modify({
                  bookId: serverData._id,
                  synced: 1,
                  updatedAt: Date.now()
                });
                
                // Also update entries that might be using old _id if it existed
                if (localRecord._id && localRecord._id !== serverData._id) {
                  await db.entries.where('bookId').equals(String(localRecord._id)).modify({
                    bookId: serverData._id,
                    synced: 1,
                    updatedAt: Date.now()
                  });
                }
                
                console.log(`🔗 ID BRIDGE: Updated book entries from bookId ${localRecord.localId}/${localRecord._id} to ${serverData._id}`);
              }
            } else {
              console.log('🔧 SKIPPING UPDATE: Local data is newer or identical');
            }
          } else {
            // 🔧 NEW RECORD: Only use safeDexiePut when no existing record found
            const normalizedServerData = {
              ...serverData,
              updatedAt: normalizeTimestamp(serverData.updatedAt),
              createdAt: normalizeTimestamp(serverData.createdAt),
              synced: 1
            };
            
            await safeDexiePut('books', normalizedServerData, null);
            dispatchDatabaseUpdate('server-create', 'book', normalizedServerData);
          }
        } catch (error) {
          // 🔥 CONSTRAINT ERROR HANDLING: Specifically handle ConstraintError
          if (error instanceof Error && error.name === 'ConstraintError') {
            console.warn('🔑 CONSTRAINT ERROR: Duplicate CID detected, skipping operation', {
              cid: serverData.cid,
              _id: serverData._id,
              error: error.message
            });
            return; // Skip this operation but don't crash
          }
          console.error('🔒 SERVER-FIRST BOOK ERROR:', error);
          setTimeout(() => this.hydrateCallback(this.userId), 100);
        }
      }
      
      window.dispatchEvent(new CustomEvent('totals-recalculate', { 
        detail: { type, serverData, timestamp: Date.now() } 
      }));
      
    } catch (error) {
      console.error('🔒 SERVER-FIRST Error:', error);
      setTimeout(() => this.hydrateCallback(this.userId), 100);
    }
  }

  /**
   * 🚀 INIT PUSHER: Setup real-time signal processing
   */
  initPusher(pusher: any) {
    if (!pusher || !this.userId) return;
    const channel = pusher.subscribe(`vault_channel_${this.userId}`);
    
    channel.bind('sync_signal', async (data: any) => {
            const dataType = typeof data;
            this.eventCounter[data.type] = (this.eventCounter[data.type] || 0) + 1;
            this.lastEventTime[data.type] = Date.now();
            
            // � IDEMPOTENCY SHIELD: Check if CID is already being processed
            const eventCid = data.payload?.cid || data.cid || data.entry?.cid || data.book?.cid;
            const eventId = data.payload?._id || data._id || data.entry?._id || data.book?._id;
            
            if (eventCid && this.processingCids.has(eventCid)) {
              console.log('🛡️ [IDEMPOTENCY] Skipping duplicate CID processing:', {
                cid: eventCid,
                id: eventId,
                type: data.type,
                timeSinceLastEvent: Date.now() - this.lastEventTime[data.type]
              });
              return; // Silently drop duplicate
            }
            
            if (eventId && this.processingIds.has(String(eventId))) {
              console.log('🛡️ [IDEMPOTENCY] Skipping duplicate ID processing:', {
                id: eventId,
                cid: eventCid,
                type: data.type,
                timeSinceLastEvent: Date.now() - this.lastEventTime[data.type]
              });
              return; // Silently drop duplicate
            }
            
            // Add to processing sets
            if (eventCid) this.processingCids.add(eventCid);
            if (eventId) this.processingIds.add(String(eventId));
            
            // �🔧 BRUTE FORCE PAYLOAD EXTRACTION: Normalizing incoming signals
            console.log('🔧 RAW DATA INVESTIGATION:', {
                fullRawData: JSON.parse(JSON.stringify(data)),
                dataType: dataType,
                hasPayload: !!data.payload,
                hasData: !!data.data
            });
            
            let eventType = data.type;
            let payload = data.payload;
            
            // 🛠️ NORMALIZATION SYMBOL: Extracting eventType and payload from fallbacks
            if (!payload) {
                if (data.data?.payload) {
                    payload = data.data.payload;
                    eventType = data.data.type || data.type;
                } else if (data && typeof data === 'object' && (data._id || data.cid)) {
                    payload = data;
                    eventType = data.type;
                } else if (data.entry) {
                    payload = data.entry;
                    eventType = 'ENTRY_UPDATE';
                } else if (data.book) {
                    payload = data.book;
                    eventType = 'BOOK_UPDATE';
                } else if (dataType === 'string') {
                    try {
                        const parsedData = JSON.parse(data);
                        payload = parsedData.payload || parsedData.entry || parsedData.book || parsedData;
                        eventType = parsedData.type || data.type;
                    } catch (e) {
                        console.error('🔧 JSON PARSING FALLBACK FAILED');
                    }
                }
            }
            
            if (!payload || typeof payload !== 'object') {
                if (eventType && (eventType.includes('ENTRY') || eventType.includes('BOOK'))) {
                    setTimeout(() => this.hydrateCallback(this.userId), 100);
                }
                return;
            }
            
            console.log('🔍 RAW PUSHER EVENT RECEIVED:', { eventType, extractedPayload: payload });

            switch (eventType) {
                case 'USER_DEACTIVATED':
                    this.securityGate.logout();
                    break;
                
                case 'BOOK_DELETED':
                    if (data.id) {
                        await db.books.delete(data.id);
                        await this.broadcastCallback();
                        window.dispatchEvent(new CustomEvent('resource-deleted', { 
                            detail: { type: 'book', id: data.id } 
                        }));
                    }
                    break;
                
                case 'ENTRY_DELETED':
                    const safeId = safeNumber(data.id);
                    if (safeId > 0) {
                        const entry = await db.entries.get(safeId);
                        await db.entries.delete(safeId);
                        dispatchDatabaseUpdate('delete', 'entry', { localId: safeId, entry });
                        await this.broadcastCallback();
                        
                        if (entry?.bookId) {
                            const lookupResult = await safeDexieLookup('books', undefined, entry.bookId);
                            const book = lookupResult.byCid || lookupResult.byId;
                            if (book?.localId) {
                                await db.books.update(book.localId, { 
                                    updatedAt: Date.now(), 
                                    vKey: (book.vKey || 0) + 1 
                                });
                            }
                        }
                    }
                    break;
                
                case 'ENTRY_CREATE':
                case 'ENTRY_UPDATE':
                    await this.enforceServerFirstAuthority('entry', payload);
                    await this.broadcastCallback();
                    break;
                
                case 'BOOK_UPDATE':
                    await this.enforceServerFirstAuthority('book', payload);
                    await this.broadcastCallback();
                    break;
                
                default:
                    this.hydrateCallback(this.userId);
                    break;
            }
            
            // 🔥 IDEMPOTENCY CLEANUP: Remove from processing sets after handling
            if (eventCid) this.processingCids.delete(eventCid);
            if (eventId) this.processingIds.delete(String(eventId));
            
            window.dispatchEvent(new Event('vault-updated'));
    });
  }
}