"use client";

/**
 * 🔧 HYDRATION ENGINE TYPES
 * 
 * Shared types and interfaces for the hydration system
 */

export interface HydrationResult {
  success: boolean;
  error?: string;
  count?: number;
  booksCount?: number;
  entriesCount?: number;
  source?: string;
}

export interface SecurityState {
  isSecurityLockdown: boolean;
  emergencyHydrationStatus: 'idle' | 'hydrating' | 'failed' | 'success';
}

export interface CommitOperation {
  type: 'BOOK' | 'ENTRY' | 'USER';
  records: any[];
  source: string;
  operation: 'bulkPut' | 'put' | 'update' | 'bulkUpdate' | 'delete';
}

export interface ValidationConfig {
  strict: boolean;
  allowPartial: boolean;
  skipNormalization: boolean;
}
