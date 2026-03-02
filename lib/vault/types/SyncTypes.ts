"use client";

/**
 * 🔧 SYNC TYPES - Type Safety Layer for Holy Grail Cash-Book Robot
 * 
 * Prevents 100+ syntax errors by providing unified interfaces
 * across all sync services (Push, Pull, Orchestrator)
 */

// 🆕 IMPORT EXISTING: HydrationResult from hydration engine
import { HydrationResult } from '../hydration/engine/types';

/**
 * 📊 SYNC RESULT INTERFACE
 * Standard return type for all sync operations
 */
export interface SyncResult {
  success: boolean;
  itemsProcessed?: number;
  errors?: string[];
  data?: any;
  duration?: number;
}

/**
 * 📈 SYNC STATS INTERFACE
 * Unified sync statistics tracking
 */
export interface SyncStats {
  totalSynced: number;
  totalFailed: number;
  lastSyncDuration: number | null;
  startTime?: number;
  endTime?: number;
  networkMode?: string;
  userId?: string;
}

/**
 * 🛡️ GUARD RESULT INTERFACE
 * Flexible return type for security validation
 */
export interface GuardResult<T = any> {
  valid: boolean;
  user?: T;
  userId?: string;
  error?: string;
  // 🆕 FLEXIBLE RETURN: Support different service return types
  returnValue?: SyncResult | void;
}

/**
 * 🎯 GUARD CONTEXT INTERFACE
 * Context-aware error handling for different services
 */
export interface GuardContext {
  serviceName: 'PushService' | 'PullService' | 'SyncOrchestrator';
  onError: (message: string, details?: any) => void | Promise<void>;
  returnError: (message: string) => SyncResult | void;
}

/**
 * 🔐 SECURITY VALIDATION RESULT
 * Internal result for license and signature checks
 */
export interface SecurityValidationResult {
  valid: boolean;
  error?: string;
  lockdownTriggered?: boolean;
  licenseAccess?: {
    access: boolean;
    reason?: string;
    plan: string;
  };
}

/**
 * 🌐 NETWORK STATE INTERFACE
 * Network mode validation result
 */
export interface NetworkStateResult {
  allowed: boolean;
  mode: string;
  isSecurityLockdown: boolean;
  error?: string;
}

/**
 * 🔄 SYNC OPERATION TYPE
 * Enum for different sync operation types
 */
export enum SyncOperationType {
  PUSH = 'PUSH',
  PULL = 'PULL',
  TELEMETRY = 'TELEMETRY',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG'
}

/**
 * 🚨 SYNC ERROR TYPES
 * Standardized error codes for sync operations
 */
export enum SyncErrorCode {
  NETWORK_RESTRICTED = 'NETWORK_RESTRICTED',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  USER_MISSING = 'USER_MISSING',
  LICENSE_DENIED = 'LICENSE_DENIED',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  ALREADY_SYNCING = 'ALREADY_SYNCING',
  GLOBAL_LOCK_ACTIVE = 'GLOBAL_LOCK_ACTIVE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 📋 SYNC OPERATION METADATA
 * Metadata for tracking sync operations
 */
export interface SyncOperationMetadata {
  operationType: SyncOperationType;
  source: string;
  timestamp: number;
  userId: string;
  tabId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}
