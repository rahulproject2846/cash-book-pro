"use client";
import { telemetry } from '../Telemetry';
import type { LocalEntry, LocalBook } from '@/lib/offlineDB';

/**
 * VAULT PRO: REALTIME ENGINE (V30.1 - INDUSTRIAL GRADE PURE MESSENGER)
 * ----------------------------------------------------------------------
 * Pure signal processor with Optimistic Injection capabilities
 * Removed: All direct database operations
 * Focus: Signal reception, instant injection, and hydration triggering
 * 
 * Key Features:
 * - Pure Messenger: No direct Dexie operations
 * - Optimistic Injection: Instant data injection via callback
 * - Idempotency Shield: Duplicate prevention
 * - Industrial Error Handling: Comprehensive telemetry
 */
export class RealtimeEngine {
  private userId: string;
  private hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>;
  private injectCallback: (data: any, eventType: string) => Promise<void>;
  private securityGate: any;
  private broadcastCallback: () => void;
  
  // 🔍 EVENT COUNTER: Track all received events for monitoring
  private eventCounter: { [key: string]: number } = {};
  private lastEventTime: { [key: string]: number } = {};
  
  // 🔥 IDEMPOTENCY SHIELD: Prevent duplicate signal processing
  private processingCids = new Set<string>();
  private processingIds = new Set<string>();

  constructor(
    userId: string, 
    hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>,
    injectCallback: (data: any, eventType: string) => Promise<void>,
    securityGate: any,
    broadcastCallback: () => void
  ) {
    this.userId = userId;
    this.hydrateCallback = hydrateCallback;
    this.injectCallback = injectCallback;
    this.securityGate = securityGate;
    this.broadcastCallback = broadcastCallback;
  }

  /**
   * 🔔 INITIALIZATION: Setup Pusher channel subscriptions
   */
  async initPusher(pusher: any) {
    if (!pusher || !this.userId) return;

    try {
      const channel = pusher.subscribe(`vault-channel-${this.userId}`);
      
      // 📡 BOOK SIGNALS: Listen for all book-related events
      channel.bind('BOOK_CREATED', (data: any) => this.handleRealtimeEvent('BOOK_CREATED', data));
      channel.bind('BOOK_UPDATED', (data: any) => this.handleRealtimeEvent('BOOK_UPDATED', data));
      channel.bind('BOOK_DELETED', (data: any) => this.handleRealtimeEvent('BOOK_DELETED', data));
      
      // 📝 ENTRY SIGNALS: Listen for all entry-related events
      channel.bind('ENTRY_CREATED', (data: any) => this.handleRealtimeEvent('ENTRY_CREATED', data));
      channel.bind('ENTRY_UPDATED', (data: any) => this.handleRealtimeEvent('ENTRY_UPDATED', data));
      channel.bind('ENTRY_DELETED', (data: any) => this.handleRealtimeEvent('ENTRY_DELETED', data));
      
      // 🚨 SECURITY SIGNALS: Listen for security-related events
      channel.bind('USER_DEACTIVATED', (data: any) => this.handleSecurityEvent('USER_DEACTIVATED', data));
      channel.bind('USER_BANNED', (data: any) => this.handleSecurityEvent('USER_BANNED', data));
      
      console.log('🔔 RealtimeEngine: Pusher channels initialized for user:', this.userId);
      
      // 📊 TELEMETRY: Log initialization success
      telemetry.log({
        type: 'INFO',
        level: 'INFO',
        message: `RealtimeEngine initialized for user: ${this.userId}`
      });
      
    } catch (error) {
      console.error('❌ RealtimeEngine: Failed to initialize Pusher:', error);
      
      // 📊 ERROR TELEMETRY: Log initialization failure
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: `RealtimeEngine initialization failed: ${error}`
      });
    }
  }

  /**
   * 🚨 SECURITY EVENT HANDLER: Immediate threat response
   */
  private handleSecurityEvent(eventType: string, data: any) {
    console.warn(`🚨 Security Event Received: ${eventType}`, data);
    
    // � TELEMETRY: Log security event
    telemetry.log({
      type: 'WARN',
      level: 'WARN',
      message: `Security event received: ${eventType}`
    });
    
    // �� IMMEDIATE RESPONSE: Trigger emergency wipe
    this.securityGate.performEmergencyWipe();
  }

  /**
   * 📡 REALTIME EVENT HANDLER: Pure signal delegation with Optimistic Injection
   */
  private async handleRealtimeEvent(eventType: string, data: any) {
    try {
      // 🔍 EVENT TRACKING: Monitor signal patterns
      this.eventCounter[eventType] = (this.eventCounter[eventType] || 0) + 1;
      this.lastEventTime[eventType] = Date.now();
      
      // 🔥 IDEMPOTENCY CHECK: Prevent duplicate processing
      const eventCid = data.cid || data._id;
      const eventId = data.id || data._id;
      
      if (eventCid && this.processingCids.has(eventCid)) {
        console.log(`🔄 Skipping duplicate CID: ${eventCid} | Window: 15s`);
        return;
      }
      
      if (eventId && this.processingIds.has(String(eventId))) {
        console.log(`🔄 Skipping duplicate ID: ${eventId} | Window: 15s`);
        return;
      }
      
      console.log(`📡 [PUSHER EVENT RECEIVED] ${eventType}`, data.cid, `Processing CIDs: ${this.processingCids.size}`, `Processing IDs: ${this.processingIds.size}`);
      
      // 📊 TELEMETRY: Log signal reception
      telemetry.log({
        type: 'INFO',
        level: 'INFO',
        message: `Signal Received: ${eventType} - CID: ${eventCid || 'N/A'} | Processing: ${this.processingCids.size + 1} items`
      });
      
      console.log(`📡 Realtime Signal: ${eventType} - CID: ${eventCid || 'N/A'}`);
      
      // Mark as processing to prevent duplicates
      if (eventCid) this.processingCids.add(eventCid);
      if (eventId) this.processingIds.add(String(eventId));
      
      // 🚀 OPTIMISTIC INJECTION: Instant data injection
      console.log(`💉 [OPTIMISTIC INJECTION] Injecting ${eventType} data`);
      await this.injectCallback(eventType, data);
      
      // 🔄 HYDRATION TRIGGER: Ensure full data consistency
      console.log(`🔄 [HYDRATION TRIGGER] Full sync after ${eventType}`);
      await this.hydrateCallback(this.userId, false);
      
      // 📡 BROADCAST: Trigger UI refresh
      this.broadcastCallback();
      
      // 🧹 CLEANUP: Remove from processing sets after handling
      setTimeout(() => {
        if (eventCid) this.processingCids.delete(eventCid);
        if (eventId) this.processingIds.delete(String(eventId));
        console.log(`🧹 [IDEMPOTENCY CLEANUP] Removed CID: ${eventCid}, ID: ${eventId} | Remaining: ${this.processingCids.size} CIDs, ${this.processingIds.size} IDs`);
      }, 15000); // 15 second cleanup window for better sync loop protection
      
    } catch (error) {
      console.error(`❌ Realtime Event Error (${eventType}):`, error);
      
      // 📊 ERROR TELEMETRY: Log processing errors
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: `Realtime Event Error: ${eventType} - ${error}`
      });
    }
  }

  /**
   * 📊 EVENT STATISTICS: Get processing statistics
   */
  getEventStats() {
    return {
      eventCounter: this.eventCounter,
      lastEventTime: this.lastEventTime,
      processingCids: this.processingCids.size,
      processingIds: this.processingIds.size
    };
  }

  /**
   * 🧹 CLEANUP: Prevent memory leaks
   */
  destroy() {
    this.processingCids.clear();
    this.processingIds.clear();
    console.log('🧹 RealtimeEngine: Cleanup completed');
    
    // 📊 TELEMETRY: Log cleanup
    telemetry.log({
      type: 'INFO',
      level: 'INFO',
      message: 'RealtimeEngine cleanup completed'
    });
  }
}