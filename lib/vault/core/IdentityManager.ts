"use client";

/**
 * 🔐 IDENTITY MANAGER (V1.0 - UNIFIED IDENTITY SYSTEM)
 * ----------------------------------------------------
 * Centralized user identity management with singleton pattern
 * Provides single source of truth for userId across entire application
 * 
 * Features:
 * - Singleton pattern for global consistency
 * - In-memory state with localStorage persistence
 * - Legacy fallback for zero-downtime migration
 * - Type-safe userId validation
 * - Subscriber notifications for reactive updates
 */

export class IdentityManager {
  private static instance: IdentityManager;
  private userId: string | null = null;
  private isReady: boolean = false;
  private readyCallbacks: Set<() => void> = new Set();
  private subscribers: Set<(userId: string | null) => void> = new Set();

  /**
   * 🏗️ PRIVATE CONSTRUCTOR: Singleton pattern
   */
  private constructor() {
    // Initialize from localStorage on creation
    this.loadFromStorage();
  }

  /**
   * 🎯 GET INSTANCE: Singleton access point
   */
  static getInstance(): IdentityManager {
    if (!IdentityManager.instance) {
      IdentityManager.instance = new IdentityManager();
    }
    return IdentityManager.instance;
  }

  /**
   * � GET READY STATUS: Public access to isReady
   */
  get ready(): boolean {
    return this.isReady;
  }

  /**
   * �📥 GET USER ID: Primary method for all consumers
   */
  getUserId(): string | null {
    // Priority 1: In-memory state (fastest)
    if (this.userId !== null) {
      return this.userId;
    }

    // Priority 2: Legacy fallback (zero-downtime migration)
    return this.getLegacyUserId();
  }

  /**
   * 🔄 SET USER ID: Update identity across all systems
   */
  setUserId(userId: string | null): void {
    this.setIdentity(userId ? { _id: userId } : null);
  }

  /**
   * 🔄 SET IDENTITY: Update full user object across all systems
   */
  setIdentity(user: any | null): void {
    if (!user) {
      this.userId = null;
      this.persistToStorage(null);
      this.notifySubscribers();
      return;
    }

    // Update in-memory state
    this.userId = user._id;

    // Update localStorage for persistence
    this.persistToStorage(user._id);

    // 🚨 IDENTITY READY: Mark as ready and notify waiting callbacks
    this.isReady = true;
    this.notifyReadyCallbacks();

    // Notify all subscribers immediately
    this.notifySubscribers();

    // Debug logging for tracking
    console.log(`🔐 [IDENTITY MANAGER] Identity updated:`, {
      newUserId: user._id,
      timestamp: new Date().toISOString(),
      subscribersNotified: this.subscribers.size,
      isReady: this.isReady,
      userFields: Object.keys(user)
    });
  }

  /**
   * SUBSCRIBE: React components can listen to changes
   */
  subscribe(callback: (userId: string | null) => void): () => void {
    this.subscribers.add(callback);

    // Store previous userId to detect changes
    const previousUserId = this.userId;
    
    // Immediately call with current userId
    callback(this.getUserId());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * � ON READY: Wait for identity to be loaded before starting operations
   */
onReady(callback: () => void): () => void {
    if (this.isReady) {
        callback();
    } else {
        this.readyCallbacks.add(callback);
    }
    
    // Return unsubscribe function
    return () => {
        this.readyCallbacks.delete(callback);
    };
}

  /**
   * 🔔 NOTIFY READY CALLBACKS: Execute all waiting callbacks
   */
  private notifyReadyCallbacks(): void {
    this.readyCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('🔐 [IDENTITY MANAGER] Ready callback failed:', error);
      }
    });
    this.readyCallbacks.clear();
  }

  /**
   * ��️ LOAD FROM STORAGE: Initialize from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.userId = null;
      this.isReady = false;
      return;
    }

    try {
      const saved = localStorage.getItem('cashbookUser');
      if (saved) {
        const userData = JSON.parse(saved);
        this.userId = userData._id || null;
        console.log(`🔐 [IDENTITY MANAGER] Loaded from storage:`, {
          userId: this.userId,
          source: 'localStorage'
        });
      }
      
      // 🚨 MARK AS READY AND NOTIFY CALLBACKS
      this.isReady = true;
      this.notifyReadyCallbacks();
      
    } catch (error) {
      console.error('🔐 [IDENTITY MANAGER] Failed to load from storage:', error);
      this.isReady = false;
    }
  }

  /**
   * 💾 PERSIST TO STORAGE: Save to localStorage
   */
  private persistToStorage(userId: string | null): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Get existing user data to preserve other fields
      const existingData = localStorage.getItem('cashbookUser');
      const userData = existingData ? JSON.parse(existingData) : {};

      // Update only the _id field
      if (userId) {
        userData._id = userId;
        localStorage.setItem('cashbookUser', JSON.stringify(userData));
      } else {
        // If userId is null, remove the user data
        localStorage.removeItem('cashbookUser');
      }

      console.log(`🔐 [IDENTITY MANAGER] Persisted to storage:`, {
        userId: userId,
        action: userId ? 'updated' : 'removed'
      });
    } catch (error) {
      console.error('🔐 [IDENTITY MANAGER] Failed to persist to storage:', error);
    }
  }

  /**
   * 🔄 LEGACY FALLBACK: Zero-downtime migration support
   */
  private getLegacyUserId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const saved = localStorage.getItem('cashbookUser');
      if (saved) {
        const userData = JSON.parse(saved);
        const legacyUserId = userData._id || null;
        
        console.log(`🔐 [IDENTITY MANAGER] Legacy fallback used:`, {
          legacyUserId,
          reason: 'in-memory-null'
        });
        
        return legacyUserId;
      }
    } catch (error) {
      console.error('🔐 [IDENTITY MANAGER] Legacy fallback failed:', error);
    }

    return null;
  }

  /**
   * 📢 NOTIFY SUBSCRIBERS: Broadcast changes to all listeners
   */
  private notifySubscribers(): void {
    const currentUserId = this.getUserId();
    
    // Notify all subscribers with the updated userId
    this.subscribers.forEach(callback => {
      try {
        callback(currentUserId);
      } catch (error) {
        console.error('🔐 [IDENTITY MANAGER] Subscriber notification failed:', error);
      }
    });

    console.log(`🔐 [IDENTITY MANAGER] Notified ${this.subscribers.size} subscribers:`, {
      userId: currentUserId
    });
  }

  /**
   * 🧹 CLEAR IDENTITY: Logout functionality
   */
  clearIdentity(): void {
    this.setUserId(null);
    
    // Clear in-memory state
    this.userId = null;
    
    console.log(`🔐 [IDENTITY MANAGER] Identity cleared:`, {
      timestamp: new Date().toISOString(),
      subscribersNotified: this.subscribers.size
    });
  }

  /**
   * 🔍 VALIDATE USER ID: Ensure proper format
   */
  static validateUserId(userId: any): string | null {
    if (typeof userId === 'string' && userId.trim().length > 0) {
      return userId.trim();
    }
    
    if (typeof userId === 'number') {
      return String(userId);
    }
    
    return null;
  }

  /**
   * 📊 GET STATUS: Current identity state information
   */
  getStatus(): {
    userId: string | null;
    hasIdentity: boolean;
    subscriberCount: number;
    timestamp: string;
  } {
    return {
      userId: this.getUserId(),
      hasIdentity: this.userId !== null,
      subscriberCount: this.subscribers.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * ⏳ WAIT FOR IDENTITY: Promise-based identity readiness
   */
  async waitForIdentity(): Promise<string> {
    return new Promise((resolve, reject) => {
      // If already ready with valid userId, resolve immediately
      if (this.isReady && this.userId) {
        resolve(this.userId);
        return;
      }
      
      // Set timeout for safety
      const timeout = setTimeout(() => {
        reject(new Error('Identity timeout after 1 second'));
      }, 1000);
      
      // Wait for ready state
      const checkReady = () => {
        if (this.isReady && this.userId) {
          clearTimeout(timeout);
          resolve(this.userId);
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }
}

// Export singleton instance for easy access
export const identityManager = IdentityManager.getInstance();

// Export type for TypeScript consumers
export type IdentitySubscriber = (userId: string | null) => void;
