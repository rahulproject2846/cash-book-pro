"use client";

/**
 * ⚙️ HYDRATION ENGINE CONSTANTS
 * 
 * Configuration and constants for the hydration system
 */

export const HYDRATION_CONSTANTS = {
  BATCH_SIZES: {
    BOOKS: 10,
    ENTRIES: 20
  },
  TIMEOUTS: {
    FETCH: 30000,
    VALIDATION: 5000
  },
  RETRY_LIMITS: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MS: 1000
  }
} as const;

export const COMMIT_TYPES = {
  BULK_PUT: 'bulkPut',
  PUT: 'put',
  UPDATE: 'update',
  BULK_UPDATE: 'bulkUpdate',
  DELETE: 'delete'
} as const;

export const VALIDATION_SOURCES = {
  BULK_HYDRATION: 'bulk_hydration',
  REALTIME_EVENT: 'realtime_event',
  SNIPER_FETCH: 'sniper_fetch',
  IDENTITY_SYNC: 'identity_sync',
  GHOST_RECOVERY: 'ghost_recovery'
} as const;
