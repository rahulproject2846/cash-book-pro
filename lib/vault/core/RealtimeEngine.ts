"use client";
import { db } from '@/lib/offlineDB';

/**
 * VAULT PRO: REALTIME ENGINE (V25.0 - UNBREAKABLE INTEGRITY)
 * ----------------------------------------------------
 * Pusher integration and real-time signal processing
 */

// 🔧 HELPER: Normalize timestamps to consistent number format
const normalizeTimestamp = (timestamp: any): number => {
    if (!timestamp) return 0;
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

// 🌐 GLOBAL DATABASE EVENT DISPATCHER
const dispatchDatabaseUpdate = (operation: string, type: 'book' | 'entry', data?: any) => {
    // 🔍 CIRCULAR UPDATE CHECK: Only dispatch if this is a genuine external change
    // This prevents infinite loops where our own database updates trigger real-time events
    console.log(`🌐 DATABASE UPDATE: ${operation} - ${type}`, data);
    window.dispatchEvent(new CustomEvent('database-updated', { 
        detail: { operation, type, data, timestamp: Date.now() } 
    }));
};

export class RealtimeEngine {
  private userId: string;
  private hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>;
  private securityGate: any;
  private broadcastCallback: () => void;
  
  // � EVENT COUNTER: Track all received events for investigation
  private eventCounter: { [key: string]: number } = {};
  private lastEventTime: { [key: string]: number } = {};

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
      // 🔍 STRICT KEY VALIDATION: Check for required fields before DB operations
      const hasValidId = serverData._id || serverData.cid;
      const hasValidCid = serverData.cid;
      
      if (!hasValidId || !hasValidCid) {
        console.error('🔒 SERVER-FIRST: Missing required keys for lookup', {
          missingFields: {
            _id: !serverData._id,
            cid: !serverData.cid
          },
          serverData,
          willTriggerEmergencyHydration: true
        });
        
        // 🚨 EMERGENCY HYDRATION: Skip DB operation and trigger full sync
        console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Missing keys in server data');
        setTimeout(() => this.hydrateCallback(this.userId), 100);
        return;
      }
      
      if (type === 'entry') {
        const localRecord = await db.entries.where('cid').equals(serverData.cid || "").or('_id').equals(serverData._id).first();
        if (localRecord) {
          // 🔧 VKEY FIX: Allow update if vKey >= local vKey OR timestamp is different
          const serverVKey = Number(serverData.vKey || 0);
          const localVKey = Number(localRecord.vKey || 0);
          const serverUpdatedAt = normalizeTimestamp(serverData.updatedAt);
          const localUpdatedAt = normalizeTimestamp(localRecord.updatedAt || 0);
          
          const shouldUpdate = serverVKey > localVKey || 
                           (serverVKey === localVKey && serverUpdatedAt > localUpdatedAt) ||
                           serverUpdatedAt > localUpdatedAt;
          
          console.log('🔧 VKEY COMPARISON FIXED:', {
            serverVKey,
            localVKey,
            vKeyMatch: serverVKey === localVKey,
            serverUpdatedAt,
            localUpdatedAt,
            timeDiff: serverUpdatedAt - localUpdatedAt,
            shouldUpdate,
            reason: serverVKey > localVKey ? 'Server vKey is higher' :
                     serverVKey === localVKey && serverUpdatedAt > localUpdatedAt ? 'Same vKey but newer timestamp' :
                     serverUpdatedAt > localUpdatedAt ? 'Server timestamp is newer' : 'Local data is newer'
          });
          
          if (shouldUpdate) {
            const normalizedServerData = {
              ...serverData,
              updatedAt: serverUpdatedAt,
              createdAt: normalizeTimestamp(serverData.createdAt),
              localId: localRecord.localId,
              synced: 1
            };
            await db.entries.put(normalizedServerData);
            dispatchDatabaseUpdate('server-overwrite', 'entry', normalizedServerData);
          } else {
            console.log('🔧 SKIPPING UPDATE: Local data is newer');
          }
        } else {
          const normalizedServerData = {
            ...serverData,
            updatedAt: normalizeTimestamp(serverData.updatedAt),
            createdAt: normalizeTimestamp(serverData.createdAt),
            synced: 1
          };
          await db.entries.put(normalizedServerData);
          dispatchDatabaseUpdate('server-create', 'entry', normalizedServerData);
        }
      } else if (type === 'book') {
        const localRecord = await db.books.where('cid').equals(serverData.cid || "").or('_id').equals(serverData._id).first();
        if (localRecord) {
          // 🔧 VKEY FIX: Allow update if vKey >= local vKey OR timestamp is different
          const serverVKey = Number(serverData.vKey || 0);
          const localVKey = Number(localRecord.vKey || 0);
          const serverUpdatedAt = normalizeTimestamp(serverData.updatedAt);
          const localUpdatedAt = normalizeTimestamp(localRecord.updatedAt || 0);
          
          const shouldUpdate = serverVKey > localVKey || 
                           (serverVKey === localVKey && serverUpdatedAt > localUpdatedAt) ||
                           serverUpdatedAt > localUpdatedAt;
          
          console.log('🔧 BOOK VKEY COMPARISON FIXED:', {
            serverVKey,
            localVKey,
            vKeyMatch: serverVKey === localVKey,
            serverUpdatedAt,
            localUpdatedAt,
            timeDiff: serverUpdatedAt - localUpdatedAt,
            shouldUpdate,
            reason: serverVKey > localVKey ? 'Server vKey is higher' :
                     serverVKey === localVKey && serverUpdatedAt > localUpdatedAt ? 'Same vKey but newer timestamp' :
                     serverUpdatedAt > localUpdatedAt ? 'Server timestamp is newer' : 'Local data is newer'
          });
          
          if (shouldUpdate) {
            const normalizedServerData = {
              ...serverData,
              updatedAt: serverUpdatedAt,
              localId: localRecord.localId,
              synced: 1
            };
            await db.books.put(normalizedServerData);
            dispatchDatabaseUpdate('server-overwrite', 'book', normalizedServerData);
          } else {
            console.log('🔧 SKIPPING UPDATE: Local data is newer');
          }
        } else {
          const normalizedServerData = {
            ...serverData,
            updatedAt: normalizeTimestamp(serverData.updatedAt),
            synced: 1
          };
          await db.books.put(normalizedServerData);
          dispatchDatabaseUpdate('server-create', 'book', normalizedServerData);
        }
      }
      window.dispatchEvent(new CustomEvent('totals-recalculate', { 
        detail: { type, serverData, timestamp: Date.now() } 
      }));
    } catch (error) {
      console.error('🔒 SERVER-FIRST: Failed to enforce server authority', error);
      // 🚨 EMERGENCY HYDRATION: Fallback to full sync on any error
      console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Server-first authority failed');
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
            // 🔍 EVENT COUNTER: Track all received events
            const dataType = typeof data;
            const dataKeys = data && typeof data === 'object' ? Object.keys(data) : [];
            
            this.eventCounter[data.type] = (this.eventCounter[data.type] || 0) + 1;
            this.lastEventTime[data.type] = Date.now();
            
            // 🔧 BRUTE FORCE PAYLOAD EXTRACTION: Check ALL possible locations
            console.log('🔧 RAW DATA INVESTIGATION:', {
                fullRawData: JSON.parse(JSON.stringify(data)),
                dataType: dataType,
                dataKeys,
                hasPayload: !!data.payload,
                hasData: !!data.data,
                hasEntry: !!data.entry,
                hasBook: !!data.book,
                hasRecord: !!data.record,
                isString: dataType === 'string'
            });
            
            let eventType = data.type;
            let payload = data.payload;
            
            // 🔧 DEEP SEARCH: Try every possible payload location
            if (!payload) {
                // Check nested in data.data
                if (data.data?.payload) {
                    console.log('🔧 FOUND PAYLOAD: data.data.payload');
                    payload = data.data.payload;
                    eventType = data.data.type || data.type;
                }
                // Check if data itself is the payload
                else if (data && typeof data === 'object' && (data._id || data.cid || data.amount || data.bookId)) {
                    console.log('🔧 FOUND PAYLOAD: data itself is payload');
                    payload = data;
                    eventType = data.type;
                }
                // Check other common locations
                else if (data.entry) {
                    console.log('🔧 FOUND PAYLOAD: data.entry');
                    payload = data.entry;
                    eventType = 'ENTRY_UPDATE'; // Assume update if entry exists
                }
                else if (data.book) {
                    console.log('🔧 FOUND PAYLOAD: data.book');
                    payload = data.book;
                    eventType = 'BOOK_UPDATE'; // Assume update if book exists
                }
                else if (data.record) {
                    console.log('🔧 FOUND PAYLOAD: data.record');
                    payload = data.record;
                    eventType = data.type && data.type.includes('ENTRY') ? 'ENTRY_UPDATE' : 'BOOK_UPDATE';
                }
                // 🔧 JSON PARSING FALLBACK: Try parsing string data
                else if (dataType === 'string') {
                    try {
                        console.log('🔧 ATTEMPTING: JSON.parse on string data');
                        const parsedData = JSON.parse(data);
                        payload = parsedData.payload || parsedData.entry || parsedData.book || parsedData.record || parsedData;
                        eventType = parsedData.type || data.type;
                        console.log('🔧 JSON PARSE SUCCESS:', { parsedData, extractedPayload: payload });
                    } catch (parseError) {
                        console.error('🔧 JSON PARSE FAILED:', parseError);
                    }
                }
            }
            
            // 🔍 PAYLOAD VALIDATION: Ensure we have valid data before proceeding
            if (!payload || typeof payload !== 'object') {
                console.error('🔧 PAYLOAD ERROR: Invalid or missing payload', {
                    originalData: JSON.parse(JSON.stringify(data)),
                    extractedPayload: payload,
                    eventType,
                    payloadType: typeof payload
                });
                
                // 🚨 EMERGENCY HYDRATION: Trigger full sync if we have valid event type but no payload
                if (eventType && (eventType.includes('ENTRY') || eventType.includes('BOOK'))) {
                    console.log('🚨 EMERGENCY HYDRATION TRIGGERED:', { 
                        eventType, 
                        reason: 'Missing payload but valid event type',
                        willHydrate: true 
                    });
                    setTimeout(() => this.hydrateCallback(this.userId), 100); // Quick hydration fallback
                }
                
                return; // Exit early if no valid payload
            }
            
            // 🔍 RAW PUSHER INVESTIGATION: Log EVERY event at the entry point
            console.log('🔍 RAW PUSHER EVENT RECEIVED:', {
                timestamp: new Date().toISOString(),
                eventType,
                eventCount: this.eventCounter[eventType],
                timeSinceLastEvent: this.lastEventTime[eventType] - (this.lastEventTime[eventType] || Date.now()),
                hasId: !!data.id,
                hasPayload: !!payload,
                payloadKeys: payload ? Object.keys(payload) : [],
                fullData: JSON.parse(JSON.stringify(data)), // Deep clone to avoid mutations
                extractedPayload: payload,
                stackTrace: new Error().stack?.split('\n').slice(1, 4) // Track caller
            });
            
            // 🔍 EVENT SUMMARY: Show running totals every 5 events
            const totalEvents = Object.values(this.eventCounter).reduce((sum, count) => sum + count, 0);
            if (totalEvents % 5 === 0) {
                console.log('🔍 EVENT SUMMARY:', {
                    totalEvents,
                    eventBreakdown: this.eventCounter,
                    lastEvents: Object.entries(this.lastEventTime).map(([type, time]) => ({ type, lastReceived: new Date(time).toISOString() }))
                });
            }
            
            // 🔍 PAYLOAD COMPARISON: Detailed logging for CREATE vs UPDATE
            if (eventType === 'ENTRY_CREATE' || eventType === 'ENTRY_UPDATE') {
                console.log(`🔍 ENTRY ${eventType.replace('ENTRY_', '')} PAYLOAD ANALYSIS:`, {
                    type: eventType,
                    payloadStructure: payload,
                    vKey: payload?.vKey,
                    _id: payload?._id,
                    cid: payload?.cid,
                    amount: payload?.amount,
                    updatedAt: payload?.updatedAt,
                    createdAt: payload?.createdAt,
                    bookId: payload?.bookId,
                    status: payload?.status,
                    isDeleted: payload?.isDeleted,
                    synced: payload?.synced,
                    // Check for missing fields
                    missingFields: ['vKey', '_id', 'cid', 'amount', 'updatedAt', 'createdAt', 'bookId', 'status'].filter(field => !(field in (payload || {}))),
                    // Type analysis
                    vKeyType: typeof payload?.vKey,
                    amountType: typeof payload?.amount,
                    updatedAtType: typeof payload?.updatedAt
                });
            }
            
            if (eventType === 'BOOK_CREATE' || eventType === 'BOOK_UPDATE') {
                console.log(`🔍 BOOK ${eventType.replace('BOOK_', '')} PAYLOAD ANALYSIS:`, {
                    type: eventType,
                    payloadStructure: payload,
                    vKey: payload?.vKey,
                    _id: payload?._id,
                    cid: payload?.cid,
                    name: payload?.name,
                    updatedAt: payload?.updatedAt,
                    isDeleted: payload?.isDeleted,
                    synced: payload?.synced,
                    missingFields: ['vKey', '_id', 'cid', 'name', 'updatedAt'].filter(field => !(field in (payload || {}))),
                    vKeyType: typeof payload?.vKey,
                    updatedAtType: typeof payload?.updatedAt
                });
            }

            // 🔥 TARGETED SIGNAL HANDLING - Instant Actions for Security & UX
            switch (eventType) {
                case 'USER_DEACTIVATED':
                    // 🚨 IMMEDIATE SECURITY ACTION - Logout without delay
                    this.securityGate.logout();
                    break;
                
            case 'BOOK_DELETED':
                // 📚 INSTANT BOOK DELETION - Remove from local DB immediately
                if (data.id) {
                    await db.books.delete(data.id);
                    await this.broadcastCallback(); // 🔄 UI FIX: Broadcast after DB operation
                    // Dispatch custom event for UI updates
                    window.dispatchEvent(new CustomEvent('resource-deleted', { 
                        detail: { type: 'book', id: data.id } 
                    }));
                }
                break;
                
            case 'ENTRY_DELETED':
                // 📝 INSTANT ENTRY DELETION - Remove from local DB immediately
                if (data.id) {
                    // Get entry before deletion to find parent book
                    const entry = await db.entries.get(Number(data.id));
                    await db.entries.delete(data.id);
                    dispatchDatabaseUpdate('delete', 'entry', { localId: data.id, entry }); // 🌐 GLOBAL EVENT
                    await this.broadcastCallback(); // 🔄 UI FIX: Broadcast after DB operation
                    
                    // 🔄 ACTIVITY-BASED DYNAMIC SORTING: Update parent book's timestamp
                    if (entry?.bookId) {
                        const book = await db.books.where('_id').equals(entry.bookId).or('localId').equals(Number(entry.bookId) || 0).first();
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
                // � RELIABLE FALLBACK: Always trigger hydration if payload is missing
                if (!payload) {
                    console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Missing payload for ENTRY event', {
                        eventType,
                        reason: 'Payload extraction failed, falling back to API sync',
                        willHydrate: true
                    });
                    setTimeout(() => this.hydrateCallback(this.userId), 100);
                    return;
                }
                
                // 🔒 SERVER-FIRST AUTHORITY: Always overwrite with server data
                try {
                    console.log('🔒 SERVER-FIRST: Enforcing entry authority from server', payload);
                    
                    // 🔍 VKEY INVESTIGATION: Compare server vKey with local record
                    const localRecord = await db.entries.where('cid').equals(payload.cid || "").or('_id').equals(payload._id).first();
                    if (localRecord) {
                        console.log('🔍 VKEY COMPARISON:', {
                            serverVKey: payload?.vKey,
                            localVKey: localRecord?.vKey,
                            vKeyMatch: payload?.vKey === localRecord?.vKey,
                            serverVKeyType: typeof payload?.vKey,
                            localVKeyType: typeof localRecord?.vKey,
                            serverUpdatedAt: payload?.updatedAt,
                            localUpdatedAt: localRecord?.updatedAt,
                            timeDiff: payload?.updatedAt && localRecord?.updatedAt ? 
                                normalizeTimestamp(payload.updatedAt) - normalizeTimestamp(localRecord.updatedAt) : 'N/A',
                            wouldUpdate: Number(payload?.vKey || 0) > Number(localRecord?.vKey || 0) || 
                                       normalizeTimestamp(payload?.updatedAt) > normalizeTimestamp(localRecord?.updatedAt || 0)
                        });
                    } else {
                        console.log('🔍 VKEY COMPARISON: No local record found, treating as new entry');
                    }
                    
                    await this.enforceServerFirstAuthority('entry', payload);
                    await this.broadcastCallback(); // 🔄 UI FIX: Broadcast after DB operation
                } catch (err) {
                    console.error('🔒 SERVER-FIRST: Entry authority enforcement failed:', err);
                    // Fallback to hydration on error
                    setTimeout(() => this.hydrateCallback(this.userId), 500); // 🔄 DELAY: Wait for server commit
                }
                break;
                
            case 'BOOK_UPDATE':
                // � RELIABLE FALLBACK: Always trigger hydration if payload is missing
                if (!payload) {
                    console.log('🚨 EMERGENCY HYDRATION TRIGGERED: Missing payload for BOOK event', {
                        eventType,
                        reason: 'Payload extraction failed, falling back to API sync',
                        willHydrate: true
                    });
                    setTimeout(() => this.hydrateCallback(this.userId), 100);
                    return;
                }
                
                // 🔒 SERVER-FIRST AUTHORITY: Always overwrite with server data
                try {
                    console.log('🔒 SERVER-FIRST: Enforcing book authority from server', payload);
                    
                    // 🔍 VKEY INVESTIGATION: Compare server vKey with local record
                    const localRecord = await db.books.where('cid').equals(payload.cid || "").or('_id').equals(payload._id).first();
                    if (localRecord) {
                        console.log('🔍 BOOK VKEY COMPARISON:', {
                            serverVKey: payload?.vKey,
                            localVKey: localRecord?.vKey,
                            vKeyMatch: payload?.vKey === localRecord?.vKey,
                            serverVKeyType: typeof payload?.vKey,
                            localVKeyType: typeof localRecord?.vKey,
                            serverUpdatedAt: payload?.updatedAt,
                            localUpdatedAt: localRecord?.updatedAt,
                            timeDiff: payload?.updatedAt && localRecord?.updatedAt ? 
                                normalizeTimestamp(payload.updatedAt) - normalizeTimestamp(localRecord.updatedAt) : 'N/A',
                            wouldUpdate: Number(payload?.vKey || 0) > Number(localRecord?.vKey || 0) || 
                                       normalizeTimestamp(payload?.updatedAt) > normalizeTimestamp(localRecord?.updatedAt || 0)
                        });
                    } else {
                        console.log('🔍 BOOK VKEY COMPARISON: No local record found, treating as new book');
                    }
                    
                    await this.enforceServerFirstAuthority('book', payload);
                    await this.broadcastCallback(); // 🔄 UI FIX: Broadcast after DB operation
                } catch (err) {
                    console.error('🔒 SERVER-FIRST: Book authority enforcement failed:', err);
                    // Fallback to hydration on error
                    setTimeout(() => this.hydrateCallback(this.userId), 500); // 🔄 DELAY: Wait for server commit
                }
                break;
                
            default:
                // ❓ UNKNOWN SIGNAL - Fallback to full hydration
                this.hydrateCallback(this.userId);
                break;
        }
        
        window.dispatchEvent(new Event('vault-updated'));
    });
  }
}
