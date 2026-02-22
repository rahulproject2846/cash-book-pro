"use client";

import { db } from '@/lib/offlineDB';
import { getTimestamp } from '@/lib/shared/utils';

/**
 * 🏛️ VAULT PRO: TELEMETRY FRAMEWORK (V1.0)
 * -------------------------------------------------
 * Centralized logging system for audit trail and debugging
 * Replaces all console.log/console.error with structured telemetry
 */

export interface TelemetryEvent {
  id?: number;
  type: 'CALCULATION' | 'SYNC_ERROR' | 'HYDRATION_ERROR' | 'OPERATION' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'CRITICAL';
  message: string;
  data?: any;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

/**
 * 🎯 VAULT TELEMETRY CLASS
 * Central logging interface for all vault operations
 */
export class VaultTelemetry {
  private static instance: VaultTelemetry;
  private sessionId: string;
  private maxLocalEvents = 1000; // Keep last 1000 events locally
  
  private constructor() {
    this.sessionId = `session_${getTimestamp()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  static getInstance(): VaultTelemetry {
    if (!VaultTelemetry.instance) {
      VaultTelemetry.instance = new VaultTelemetry();
    }
    return VaultTelemetry.instance;
  }
  
  /**
   * 📝 CORE LOGGING METHOD
   * Central interface for all vault telemetry
   */
  async log(event: Omit<TelemetryEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    const telemetryEvent: TelemetryEvent = {
      ...event,
      timestamp: getTimestamp(),
      sessionId: this.sessionId
    };
    
    try {
      // Store in IndexedDB for audit trail
      await db.audits.add(telemetryEvent);
      
      // Cleanup old events to prevent storage bloat
      await this.cleanupOldEvents();
      
      // Still log to console for development (can be disabled in production)
      if (process.env.NODE_ENV === 'development') {
        this.logToConsole(telemetryEvent);
      }
    } catch (error) {
      // Fallback to console if IndexedDB fails
      console.error('Telemetry storage failed:', error);
      this.logToConsole(telemetryEvent);
    }
  }
  
  /**
   * 🧹 CLEANUP: Remove old events to prevent storage bloat
   */
  private async cleanupOldEvents(): Promise<void> {
    try {
      const count = await db.audits.count();
      if (count > this.maxLocalEvents) {
        const excessCount = count - this.maxLocalEvents;
        const oldEvents = await db.audits.orderBy('timestamp').limit(excessCount).toArray();
        const oldIds = oldEvents.map((e: any) => e.id!).filter(Boolean);
        
        if (oldIds.length > 0) {
          await db.audits.bulkDelete(oldIds);
        }
      }
    } catch (error) {
      console.warn('Telemetry cleanup failed:', error);
    }
  }
  
  /**
   * 🖥️ CONSOLE FALLBACK: Development logging
   */
  private logToConsole(event: TelemetryEvent): void {
    const prefix = `[${event.type}] ${event.level}`;
    const message = `${prefix}: ${event.message}`;
    const data = event.data || {}; // Handle undefined data gracefully
    
    switch (event.level) {
      case 'ERROR':
        console.error(message, data);
        break;
      case 'WARN':
        console.warn(message, data);
        break;
      case 'DEBUG':
        console.debug(message, data);
        break;
      default:
        console.log(message, data);
    }
  }
  
  /**
   * 📊 AUDIT RETRIEVAL: Get events for dashboard
   */
  async getAuditLog(limit: number = 100, type?: TelemetryEvent['type']): Promise<TelemetryEvent[]> {
    try {
      let query = db.audits.orderBy('timestamp').reverse().limit(limit);
      
      if (type) {
        query = query.filter((event: any) => event.type === type);
      }
      
      return await query.toArray();
    } catch (error) {
      console.error('Failed to retrieve audit log:', error);
      return [];
    }
  }
  
  /**
   * 🧹 CLEAR AUDIT: Manual cleanup for privacy/security
   */
  async clearAuditLog(): Promise<void> {
    try {
      await db.audits.clear();
    } catch (error) {
      console.error('Failed to clear audit log:', error);
    }
  }
  
  /**
   * 📈 STATISTICS: Get telemetry summary
   */
  async getTelemetryStats(): Promise<{
    totalEvents: number;
    errorCount: number;
    syncErrorCount: number;
    hydrationErrorCount: number;
    recentActivity: TelemetryEvent[];
  }> {
    try {
      const totalEvents = await db.audits.count();
      const errorCount = await db.audits.where('level').equals('ERROR').count();
      const syncErrorCount = await db.audits.where('type').equals('SYNC_ERROR').count();
      const hydrationErrorCount = await db.audits.where('type').equals('HYDRATION_ERROR').count();
      const recentActivity = await this.getAuditLog(10);
      
      return {
        totalEvents,
        errorCount,
        syncErrorCount,
        hydrationErrorCount,
        recentActivity
      };
    } catch (error) {
      console.error('Failed to get telemetry stats:', error);
      return {
        totalEvents: 0,
        errorCount: 0,
        syncErrorCount: 0,
        hydrationErrorCount: 0,
        recentActivity: []
      };
    }
  }
}

/**
 * 🎯 SINGLETON INSTANCE
 * Global access point for all telemetry
 */
export const telemetry = VaultTelemetry.getInstance();

/**
 * 🔄 CONSOLE REPLACEMENT FUNCTIONS
 * These replace direct console usage throughout the app
 */
export const logCalculation = (message: string, data?: any) => {
  telemetry.log({
    type: 'CALCULATION',
    level: 'DEBUG',
    message,
    data
  });
};

export const logSyncError = (message: string, error?: any) => {
  telemetry.log({
    type: 'SYNC_ERROR',
    level: 'ERROR',
    message,
    data: { error: error?.message || error, stack: error?.stack }
  });
};

export const logHydrationError = (message: string, error?: any) => {
  telemetry.log({
    type: 'HYDRATION_ERROR',
    level: 'ERROR',
    message,
    data: { error: error?.message || error, stack: error?.stack }
  });
};

export const logOperation = (message: string, data?: any) => {
  telemetry.log({
    type: 'OPERATION',
    level: 'INFO',
    message,
    data
  });
};

export const logVaultError = (operation: string, error: any, context?: any) => {
  telemetry.log({
    type: 'ERROR',
    level: 'ERROR',
    message: `Operation failed: ${operation}`,
    data: { error: error?.message || error, context, stack: error?.stack }
  });
};

export const logInfo = (message: string, data?: any) => {
  telemetry.log({
    type: 'INFO',
    level: 'INFO',
    message,
    data
  });
};

export const logWarn = (message: string, data?: any) => {
  telemetry.log({
    type: 'WARN',
    level: 'WARN',
    message,
    data
  });
};

export const logDebug = (message: string, data?: any) => {
  telemetry.log({
    type: 'DEBUG',
    level: 'DEBUG',
    message,
    data
  });
};
