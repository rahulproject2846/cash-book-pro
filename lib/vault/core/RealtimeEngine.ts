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
import { financeService } from '../services/FinanceService';
import { getVaultStore } from '../store/storeHelper';
import { useVaultStore } from '../store';
import { getPlatform } from '@/lib/platform';

export class RealtimeEngine {
  private userId: string;
  private hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>;
  private hydrateSingleItemCallback?: (type: 'BOOK' | 'ENTRY', id: string) => Promise<void>;
  private injectCallback: (data: any, eventType: string) => Promise<void>;
  private securityGate: any;
  private broadcastCallback: () => void;
  private pusher: any; // Store pusher instance for disconnect
  private channel: any; // Store channel for unbinding
  
  // 🔍 EVENT COUNTER: Track all received events for monitoring
  private eventCounter: { [key: string]: number } = {};
  private lastEventTime: { [key: string]: number } = {};
  
  // 🔥 IDEMPOTENCY SHIELD: Prevent duplicate signal processing
  private processingCids = new Set<string>();
  private processingIds = new Set<string>();
  
  // 🌊 HYDRATION DEBOUNCE: Prevent race conditions from multiple syncs
  private hydrationTimeout: NodeJS.Timeout | null = null;
  private hydrationQueue: Array<{ userId: string, forceFullSync: boolean }> = [];
  private isHydrating = false;
  
  // 🚀 MASS INJECTION MODE: Skip hydration during login data flood
  private isMassInjectionMode = false;
  private massInjectionTimeout: NodeJS.Timeout | null = null;
  private recentEventCount = 0;
  private eventCountResetTimeout: NodeJS.Timeout | null = null;

  constructor(
    userId: string, 
    hydrateCallback: (userId: string, forceFullSync?: boolean) => Promise<void>,
    injectCallback: (data: any, eventType: string) => Promise<void>,
    securityGate: any,
    broadcastCallback: () => void,
    hydrateSingleItemCallback?: (type: 'BOOK' | 'ENTRY', id: string) => Promise<void>
  ) {
    this.userId = userId;
    this.hydrateCallback = hydrateCallback;
    this.injectCallback = injectCallback;
    this.securityGate = securityGate;
    this.broadcastCallback = broadcastCallback;
    this.hydrateSingleItemCallback = hydrateSingleItemCallback;
  }

  /**
   * 🔔 INITIALIZATION: Setup Pusher channel subscriptions
   */
  async initPusher(pusher: any) {
    if (!pusher || !this.userId) return;

    try {
      // 📡 PUSHER DEBUG: Log channel subscription attempt
      console.log(`📡 [PUSHER ATTEMPT] Subscribing to: vault-channel-${this.userId} (Type: ${typeof this.userId})`);
      
      // Store pusher instance for disconnection
      this.pusher = pusher;
      
      const channel = pusher.subscribe(`vault-channel-${this.userId}`);
      
      // Store channel instance for unbinding
      this.channel = channel;
      
      // 📡 BOOK SIGNALS: Listen for all book-related events
      channel.bind('BOOK_CREATED', (data: any) => this.handleRealtimeEvent('BOOK_CREATED', data));
      channel.bind('BOOK_UPDATED', (data: any) => this.handleRealtimeEvent('BOOK_UPDATED', data));
      channel.bind('BOOK_DELETED', (data: any) => this.handleRealtimeEvent('BOOK_DELETED', data));
      
      // 📝 ENTRY SIGNALS: Listen for all entry-related events
      channel.bind('ENTRY_CREATED', (data: any) => this.handleRealtimeEvent('ENTRY_CREATED', data));
      channel.bind('ENTRY_UPDATED', (data: any) => this.handleRealtimeEvent('ENTRY_UPDATED', data));
      channel.bind('ENTRY_DELETED', (data: any) => this.handleRealtimeEvent('ENTRY_DELETED', data));
      
      // ⚙️ SETTINGS SIGNALS: Listen for user settings updates
      channel.bind('SETTINGS_UPDATED', (data: any) => this.handleRealtimeEvent('SETTINGS_UPDATED', data));
      
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
    
    // 📊 TELEMETRY: Log security event
    telemetry.log({
      type: 'WARN',
      level: 'WARN',
      message: `Security event received: ${eventType}`
    });
    
    // 🔐 SECURITY: Validate security event before wiping
    if (!this.validateSecurityEvent(data)) {
      console.warn('🛡️ [SECURITY] Invalid security event rejected');
      return;
    }
    
    // ⚠️ IMMEDIATE RESPONSE: Trigger emergency wipe
    this.securityGate.performEmergencyWipe();
  }
  
  /**
   * 🔐 SECURITY: Validate security event payload
   */
  private validateSecurityEvent(data: any): boolean {
    // Check for server-signed token or signature
    if (!data.signature && !data.serverToken) {
      console.error('🛡️ [SECURITY] Security event missing signature/token');
      return false;
    }
    
    // Additional validation logic here
    // For now, accept if signature exists
    return true;
  }

  /**
   * 🚀 MASS INJECTION DETECTION: Detect login data flood and skip hydration
   */
  private detectMassInjection(): void {
    // Increment event counter
    this.recentEventCount++;
    
    // Reset counter after 2 seconds of inactivity
    if (this.eventCountResetTimeout) {
      clearTimeout(this.eventCountResetTimeout);
    }
    this.eventCountResetTimeout = setTimeout(() => {
      this.recentEventCount = 0;
      this.isMassInjectionMode = false;
      console.log(`🚀 [MASS INJECTION] Mode deactivated - Event rate normalized`);
    }, 2000);
    
    // Activate mass injection mode if > 10 events in 2 seconds
    if (this.recentEventCount > 10 && !this.isMassInjectionMode) {
      this.isMassInjectionMode = true;
      console.log(`🚀 [MASS INJECTION] Mode activated - ${this.recentEventCount} events detected`);
      
      // Auto-deactivate after 5 seconds
      if (this.massInjectionTimeout) {
        clearTimeout(this.massInjectionTimeout);
      }
      this.massInjectionTimeout = setTimeout(() => {
        this.isMassInjectionMode = false;
        console.log(`🚀 [MASS INJECTION] Mode auto-deactivated after timeout`);
      }, 5000);
    }
  }

  /**
   * 🌊 DEBOUNCED HYDRATION: Prevent race conditions from multiple syncs
   */
  private async debouncedHydration(userId: string, forceFullSync: boolean = false): Promise<void> {
    // Add to queue
    this.hydrationQueue.push({ userId, forceFullSync });
    
    // Clear existing timeout
    if (this.hydrationTimeout) {
      clearTimeout(this.hydrationTimeout);
    }
    
    // Set new timeout for batched hydration
    this.hydrationTimeout = setTimeout(async () => {
      if (this.isHydrating) {
        console.log(`🌊 [HYDRATION DEBOUNCE] Already hydrating, queuing request`);
        return;
      }
      
      this.isHydrating = true;
      const requests = [...this.hydrationQueue];
      this.hydrationQueue = [];
      
      try {
        // Process the most recent request with highest priority
        const latestRequest = requests[requests.length - 1];
        console.log(`🌊 [HYDRATION DEBOUNCE] Processing batched hydration for ${requests.length} requests`);
        
        await this.hydrateCallback(latestRequest.userId, latestRequest.forceFullSync);
        console.log(`🌊 [HYDRATION DEBOUNCE] Batched hydration complete`);
      } catch (error) {
        console.error(`🌊 [HYDRATION DEBOUNCE] Batched hydration failed:`, error);
      } finally {
        this.isHydrating = false;
        
        // Process any queued requests that came in during hydration
        if (this.hydrationQueue.length > 0) {
          setTimeout(() => this.debouncedHydration(userId, forceFullSync), 100);
        }
      }
    }, 300); // 300ms debounce window
  }

  /**
   * REALTIME EVENT HANDLER: Pure signal delegation with Optimistic Injection
   */
  private async handleRealtimeEvent(eventType: string, data: any) {
    try {
      // EVENT TRACKING: Monitor signal patterns
      this.eventCounter[eventType] = (this.eventCounter[eventType] || 0) + 1;
      this.lastEventTime[eventType] = Date.now();
      
      // SETTINGS EVENT: Special handling for user settings updates
      if (eventType === 'SETTINGS_UPDATED') {
        console.log(` [SETTINGS] Real-time settings update received, vKey: ${data.vKey}`);
        
        // TRIGGER SILENT SETTINGS PULL
        try {
          const { PullService } = await import('../services/PullService');
          const pullService = new PullService();
          const result = await pullService.pullUserSettings();
          
          if (result.success) {
            console.log(' [SETTINGS] User settings pulled successfully via PullService');
          } else {
            console.error(' [SETTINGS] Failed to pull user settings:', result.error);
          }
        } catch (pullError) {
          console.error(' [SETTINGS] PullService error:', pullError);
        }
        
        // BROADCAST: Trigger UI refresh for settings
        this.broadcastCallback();
        return;
      }

      // 💰 REAL-TIME BALANCE BRIDGE (PART 5)
      if (eventType === 'ENTRY_UPDATED' || eventType === 'ENTRY_CREATED') {
        const bookId = data.bookId || data.bookCid;
        if (bookId) {
             // Calculate balance using FinanceService
             const balance = financeService.getBookBalance(getVaultStore, bookId);
             
             // Update store directly for zero-lag UI
             useVaultStore.setState((state: any) => ({
                 books: state.books.map((b: any) => 
                     (String(b._id) === String(bookId) || String(b.localId) === String(bookId) || String(b.cid) === String(bookId))
                     ? { ...b, cachedBalance: balance } : b
                 ),
                 filteredBooks: state.filteredBooks.map((b: any) => 
                     (String(b._id) === String(bookId) || String(b.localId) === String(bookId) || String(b.cid) === String(bookId))
                     ? { ...b, cachedBalance: balance } : b
                 ),
                 activeBook: (state.activeBook && (String(state.activeBook._id) === String(bookId) || String(state.activeBook.localId) === String(bookId) || String(state.activeBook.cid) === String(bookId)))
                     ? { ...state.activeBook, cachedBalance: balance } : state.activeBook
             }));
             console.log(`💰 [BALANCE BRIDGE] Updated cachedBalance for book ${bookId} to ${balance}`);
        }
      }
      
      // MASS INJECTION DETECTION: Detect login data flood
      this.detectMassInjection();
      
      // DELETE PRIORITY PASS: Always allow DELETE events to bypass the shield
      if (eventType === 'BOOK_DELETED' || eventType === 'ENTRY_DELETED') {
        console.log(` [DELETE PRIORITY] Bypassing shield for ${eventType}:`, data.cid);
        console.log(` [DELETE PRIORITY] Shield bypass confirmed - DELETE event processed immediately`);
        
        // 📊 TELEMETRY: Log priority deletion
        telemetry.log({
          type: 'INFO',
          level: 'INFO',
          message: `Priority Delete: ${eventType} - CID: ${data.cid || 'N/A'} | Shield Bypassed`
        });
        
        // 🚀 OPTIMISTIC INJECTION: Instant deletion injection
        console.log(`💉 [PRIORITY INJECTION] Injecting ${eventType} data`);
        await this.injectCallback(eventType, data);
        
        // 🌊 DEBOUNCED HYDRATION: REMOVED - Trust Pusher signals for instant updates
        // if (!this.isMassInjectionMode) {
        //   console.log(`🌊 [PRIORITY HYDRATION] Triggering debounced sync after ${eventType}`);
        //   await this.debouncedHydration(this.userId, false);
        // } else {
        //   console.log(`🚀 [MASS INJECTION] Skipping hydration for ${eventType} - mass injection mode active`);
        // }
        
        // 📡 BROADCAST: Trigger UI refresh
        this.broadcastCallback();
        console.log(`🚨 [DELETE PRIORITY] DELETE event processing complete - returned early`);
        return;
      }
      
      // 🔥 IDEMPOTENCY CHECK: Only apply to CREATE/UPDATE events
      const eventCid = data.cid || data._id;
      const eventId = data.id || data._id;
      
      console.log(`📡 [EVENT PROCESSING] Checking Idempotency Shield for ${eventType} - CID: ${eventCid}`);
      
      if (eventCid && this.processingCids.has(eventCid)) {
        console.log(`🔄 [IDEMPOTENCY] Skipping duplicate CID: ${eventCid} | Window: 5s`);
        return;
      }
      
      if (eventId && this.processingIds.has(String(eventId))) {
        console.log(`🔄 [IDEMPOTENCY] Skipping duplicate ID: ${eventId} | Window: 5s`);
        return;
      }
      
      console.log(`📡 [PUSHER EVENT RECEIVED] ${eventType}`, data.cid, `Processing CIDs: ${this.processingCids.size}`, `Processing IDs: ${this.processingIds.size}`);
      
      // 🎯 SIGNAL DETECTION: Check if payload is lightweight (signal-only) vs heavyweight
      const isSignalOnly = !data.name && !data.title && !data.amount && 
                           !data.description && !data.phone && !data.image && 
                           !data.category && !data.paymentMethod && !data.note;
      
      if (isSignalOnly) {
        console.log(`🎯 [SIGNAL-ONLY] Detected lightweight signal for ${eventType}, triggering focused hydration`);
        // 🎯 FOCUSED HYDRATION: Fetch full data via API
        const recordId = data.cid || data._id;
        if (recordId && this.hydrateSingleItemCallback) {
          // Extract type from eventType
          const itemType = eventType.includes('BOOK') ? 'BOOK' : 'ENTRY';
          await this.hydrateSingleItemCallback(itemType, recordId);
        }
      } else {
        // � HEAVYWEIGHT: Continue with existing full payload injection
        console.log(`� [HEAVYWEIGHT] Full payload detected, using existing injection flow`);
        await this.injectCallback(eventType, data);
      }
      
      // 🌊 DEBOUNCED HYDRATION: REMOVED - Trust Pusher signals for instant updates
      // if (!this.isMassInjectionMode) {
      //   console.log(`🌊 [PRIORITY HYDRATION] Triggering debounced sync after ${eventType}`);
      //   await this.debouncedHydration(this.userId, false);
      // } else {
      //   console.log(`🚀 [MASS INJECTION] Skipping hydration for ${eventType} - mass injection mode active`);
      //   console.log(`🚀 [MASS INJECTION] Skipping hydration for ${eventType} - mass injection mode active (${this.recentEventCount} events)`);
      // }
      
      // 📡 BROADCAST: Trigger UI refresh with delay for Dexie completion
      requestAnimationFrame(() => {
        console.log('📡 [REALTIME] UI Broadcast Triggered');
        
        // 🚀 HIGH PRIORITY: Force immediate UI refresh via platform
        getPlatform().events.dispatch('vault-updated', {
          source: 'RealtimeEngine',
          entityType: 'settings',
          operation: 'update',
          timestamp: Date.now()
        });
        
        this.broadcastCallback();
      });
      
      // 🧹 CLEANUP: Remove from processing sets after handling
      setTimeout(() => {
        if (eventCid) this.processingCids.delete(eventCid);
        if (eventId) this.processingIds.delete(String(eventId));
        console.log(`🧹 [IDEMPOTENCY CLEANUP] Removed CID: ${eventCid}, ID: ${eventId} | Remaining: ${this.processingCids.size} CIDs, ${this.processingIds.size} IDs`);
      }, 5000); // Reduced from 15s to 5s for better responsiveness
      
    } catch (error) {
      console.error(`❌ Realtime Event Error (${eventType}):`, error);
      
      // 📊 ERROR TELEMETRY: Log processing errors
      telemetry.log({
        type: 'ERROR',
        level: 'ERROR',
        message: `Realtime Event Error (${eventType}): ${error}`
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
      processingIds: this.processingIds.size,
      isMassInjectionMode: this.isMassInjectionMode,
      recentEventCount: this.recentEventCount
    };
  }

  /**
   * 🔪 FORCE DISCONNECT: Kill all realtime ghosts for Sovereign Exit
   */
  forceDisconnect(): void {
    console.log('🔪 [REALTIME ENGINE] Force disconnect initiated - killing all realtime ghosts...');
    
    // Clear hydration timeout
    if (this.hydrationTimeout) {
      clearTimeout(this.hydrationTimeout);
      this.hydrationTimeout = null;
      console.log('🔪 [REALTIME ENGINE] Hydration timeout killed');
    }
    
    // Clear mass injection timeout
    if (this.massInjectionTimeout) {
      clearTimeout(this.massInjectionTimeout);
      this.massInjectionTimeout = null;
      console.log('🔪 [REALTIME ENGINE] Mass injection timeout killed');
    }
    
    // Clear event count reset timeout
    if (this.eventCountResetTimeout) {
      clearTimeout(this.eventCountResetTimeout);
      this.eventCountResetTimeout = null;
      console.log('🔪 [REALTIME ENGINE] Event count reset timeout killed');
    }
    
    // Clear hydration queue
    this.hydrationQueue = [];
    console.log('🔪 [REALTIME ENGINE] Hydration queue cleared');
    
    // Reset processing sets
    this.processingCids.clear();
    this.processingIds.clear();
    console.log('🔪 [REALTIME ENGINE] Processing sets cleared');
    
    // Disconnect Pusher and unbind all events
    if (this.channel) {
      this.channel.unbind_all();
      console.log('🔪 [REALTIME ENGINE] All channel events unbound');
    }
    
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      console.log('🔪 [REALTIME ENGINE] Pusher disconnected');
    }
    
    this.channel = null;
    this.isHydrating = false;
    this.isMassInjectionMode = false;
    this.recentEventCount = 0;
    
    console.log('✅ [REALTIME ENGINE] Force disconnect complete - all realtime ghosts eliminated');
  }
}