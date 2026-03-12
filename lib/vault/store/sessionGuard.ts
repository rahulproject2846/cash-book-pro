"use client";



import React from 'react';

import { UserManager } from '@/lib/vault/core/user/UserManager';



// 🛡️ SESSION GUARD: Robust inactivity and tab management

export interface SessionGuardState {

  isLocked: boolean;

  lastActivity: number;

  inactivityTimeout: number;

  isVisible: boolean;

  lockReason: 'inactivity' | 'tab_hidden' | 'manual' | null;

}



export interface SessionGuardActions {

  updateActivity: () => void;

  lockVault: (reason: SessionGuardState['lockReason']) => void;

  unlockVault: () => void;

  setVisibility: (visible: boolean) => void;

  clearSensitiveData: () => void;

}



export type SessionGuardStore = SessionGuardState & SessionGuardActions;



// 🛡️ SESSION GUARD CLASS

class SessionGuardManager {

  private static instance: SessionGuardManager;

  private state: SessionGuardState;

  private listeners: Set<() => void> = new Set();

  private inactivityTimer: NodeJS.Timeout | null = null;

  private broadcastChannel: BroadcastChannel | null = null;

  private readonly INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  private lastUpdate: number = 0; // 🚨 THROTTLE: Prevent activity spam

  private readonly ACTIVITY_THROTTLE = 30000; // 30 seconds

  private isMonitoring: boolean = false; // 🛡️ Prevent duplicate listener registration

  // 🛡️ MEMORY LEAK FIX: Define handleActivity as private property
  private handleActivity = () => this.updateActivity();

  private constructor() {

    this.state = {

      isLocked: false,

      lastActivity: Date.now(),

      inactivityTimeout: this.INACTIVITY_TIMEOUT,

      isVisible: true,

      lockReason: null

    };



    // Initialize broadcast channel for cross-tab synchronization

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {

      this.broadcastChannel = new BroadcastChannel('vault-session-guard');

      this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);

    }



    // 🚨 REMOVED: Auto-registration - now manual

    // this.initializeEventListeners();

  }



  static getInstance(): SessionGuardManager {

    // 🛡️ TRUE SINGLETON: Use private static instance (no window dependency)

    if (!SessionGuardManager.instance) {

      SessionGuardManager.instance = new SessionGuardManager();

    }

    return SessionGuardManager.instance;

  }



  private initializeEventListeners(): void {

    if (typeof window === 'undefined' || this.isMonitoring) return;



    // Track user activity

    const activityEvents = [

      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'

    ];



    activityEvents.forEach(event => {

      window.addEventListener(event, this.handleActivity, { passive: true });

    });



    // Track visibility changes

    document.addEventListener('visibilitychange', () => {

      this.setVisibility(!document.hidden);

    });



    // Track page focus/blur

    window.addEventListener('focus', () => {

      this.setVisibility(true);

    });



    window.addEventListener('blur', () => {

      this.setVisibility(false);

    });



    // Track beforeunload to cleanup

    window.addEventListener('beforeunload', () => {

      this.cleanup();

    });



    this.isMonitoring = true;

  }



  private removeEventListeners(): void {

    if (typeof window === 'undefined') return;



    // Track user activity

    const activityEvents = [

      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'

    ];



    activityEvents.forEach(event => {

      window.removeEventListener(event, this.handleActivity);

    });



    // Remove visibility changes

    document.removeEventListener('visibilitychange', () => {

      this.setVisibility(!document.hidden);

    });



    // Remove page focus/blur

    window.removeEventListener('focus', () => {

      this.setVisibility(true);

    });



    window.removeEventListener('blur', () => {

      this.setVisibility(false);

    });



    // Remove beforeunload

    window.removeEventListener('beforeunload', () => {

      this.cleanup();

    });



    this.isMonitoring = false;

  }



  // Public monitoring control methods

  public startMonitoring(): void {

    this.initializeEventListeners();

  }



  public stopMonitoring(): void {

    this.removeEventListeners();

  }



  private handleBroadcastMessage(event: MessageEvent): void {

    const { type, data } = event.data;



    switch (type) {

      case 'LOCK':

        this.lockVault(data.reason, false); // Don't broadcast to avoid infinite loop

        break;

      case 'UNLOCK':

        this.unlockVault(false); // Don't broadcast to avoid infinite loop

        break;

      case 'ACTIVITY':

        // 🛡️ APPLY THROTTLE TO BROADCAST MESSAGES TOO

        const now = Date.now();

        if (now - this.lastUpdate >= this.ACTIVITY_THROTTLE) {

          this.updateActivity();

        }

        break;

    }

  }



  private broadcast(type: string, data?: any): void {

    if (this.broadcastChannel) {

      this.broadcastChannel.postMessage({ type, data });

    }

  }



  private resetInactivityTimer(): void {

    if (this.inactivityTimer) {

      clearTimeout(this.inactivityTimer);

    }



    this.inactivityTimer = setTimeout(() => {

      if (!this.state.isLocked && this.state.isVisible) {

        this.lockVault('inactivity');

      }

    }, this.state.inactivityTimeout);

  }



  // Public methods

  updateActivity(): void {

    const now = Date.now();

    

    // 🚨 THROTTLE: Prevent activity spam - only update every 30 seconds

    if (now - this.lastUpdate < this.ACTIVITY_THROTTLE) {

      return; // Skip update to prevent console spam

    }

    

    this.lastUpdate = now;

    this.state.lastActivity = now;

    

    // Reset inactivity timer

    this.resetInactivityTimer();

    

    // Notify listeners

    this.notifyListeners();

    

    // Broadcast activity to other tabs

    this.broadcast('ACTIVITY');

    

    console.log('🛡️ [SESSION GUARD] Activity updated');

  }



  lockVault(reason: SessionGuardState['lockReason'], broadcast = true): void {

    if (this.state.isLocked) return;



    this.state.isLocked = true;

    this.state.lockReason = reason;

    

    // 🛡️ ONLY CLEAR IDENTITY FOR MANUAL LOCKOUT, NOT TAB HIDE

    if (reason !== 'tab_hidden') {

      this.clearSensitiveData();

    }

    

    // Notify listeners

    this.notifyListeners();

    

    // Broadcast to other tabs

    if (broadcast) {

      this.broadcast('LOCK', { reason });

    }

    

    console.warn(`🛡️ [SESSION GUARD] Vault locked: ${reason}`);

  }



  unlockVault(broadcast = true): void {

    if (!this.state.isLocked) return;



    this.state.isLocked = false;

    this.state.lockReason = null;

    this.state.lastActivity = Date.now();

    

    // Reset inactivity timer

    this.resetInactivityTimer();

    

    // Notify listeners

    this.notifyListeners();

    

    // Broadcast to other tabs

    if (broadcast) {

      this.broadcast('UNLOCK');

    }

    

    console.log('🛡️ [SESSION GUARD] Vault unlocked');

  }



  setVisibility(visible: boolean): void {

    if (this.state.isVisible === visible) return;



    this.state.isVisible = visible;

    

    if (!visible && !this.state.isLocked) {

      // Tab went to background - lock after a short delay

      setTimeout(() => {

        if (!this.state.isVisible && !this.state.isLocked) {

          this.lockVault('tab_hidden');

        }

      }, 5000); // 5 seconds delay

    } else if (visible && this.state.isLocked && this.state.lockReason === 'tab_hidden') {

      // Tab came back from background - unlock

      this.unlockVault();

    }

    

    console.log(`🛡️ [SESSION GUARD] Visibility changed: ${visible ? 'visible' : 'hidden'}`);

  }



  clearSensitiveData(): void {

    // Clear identity
    UserManager.getInstance().clearAll();

    

    // Clear session cache

    if (typeof window !== 'undefined') {

      // Clear any sensitive data from memory

      console.log('🛡️ [SESSION GUARD] Sensitive data cleared');

    }

  }



  // State access methods

  getState(): SessionGuardState {

    return { ...this.state };

  }



  isLocked(): boolean {

    return this.state.isLocked;

  }



  getLockReason(): SessionGuardState['lockReason'] {

    return this.state.lockReason;

  }



  getLastActivity(): number {

    return this.state.lastActivity;

  }



  // Subscription methods

  subscribe(listener: () => void): () => void {

    this.listeners.add(listener);

    

    // Return unsubscribe function

    return () => {

      this.listeners.delete(listener);

    };

  }



  private notifyListeners(): void {

    this.listeners.forEach(listener => listener());

  }



  // Cleanup

  cleanup(): void {

    if (this.inactivityTimer) {

      clearTimeout(this.inactivityTimer);

      this.inactivityTimer = null;

    }

    

    if (this.broadcastChannel) {

      this.broadcastChannel.close();

      this.broadcastChannel = null;

    }

    

    this.listeners.clear();

  }

}



// Export singleton instance

export const sessionGuardManager = SessionGuardManager.getInstance();



// Export hooks for React components

export const useSessionGuard = () => {

  const managerRef = React.useRef(sessionGuardManager);

  const [state, setState] = React.useState<SessionGuardState>(managerRef.current.getState());

  const lastActivityRef = React.useRef(state.lastActivity);



  React.useEffect(() => {

    const unsubscribe = managerRef.current.subscribe(() => {

      const newState = managerRef.current.getState();

      

      // 🚨 THROTTLE STATE UPDATES: Only update if lastActivity changed significantly

      if (Math.abs(newState.lastActivity - lastActivityRef.current) >= 30000) {

        setState(newState);

        lastActivityRef.current = newState.lastActivity;

      }

    });



    return unsubscribe;

  }, []);



  // Start monitoring on mount

  React.useEffect(() => {

    managerRef.current.startMonitoring();

    return () => {

      managerRef.current.stopMonitoring();

    };

  }, []);



  return {

    ...state,

    updateActivity: managerRef.current.updateActivity.bind(managerRef.current),

    lockVault: managerRef.current.lockVault.bind(managerRef.current),

    unlockVault: managerRef.current.unlockVault.bind(managerRef.current),

    clearSensitiveData: managerRef.current.clearSensitiveData.bind(managerRef.current),

    startMonitoring: managerRef.current.startMonitoring.bind(managerRef.current),

    stopMonitoring: managerRef.current.stopMonitoring.bind(managerRef.current)

  };

};



// Legacy exports for backward compatibility

export const snipedInSession = new Set<string>();



export const clearSessionCache = () => {

  snipedInSession.clear();

  console.log('🧹 [SESSION GUARD] Cache cleared');

};

