"use client";

/**
 * 🚀 UNIFIED MODULAR HYDRATION ENGINE (V6.0)
 * 
 * Central barrel export for all hydration-related functionality.
 * This is the single entry point for the hydration domain.
 */

// Main Controller (Public Interface)
export { HydrationController } from './HydrationController';

// Core Engine (Internal)
export { HydrationEngine } from './engine/HydrationEngine';

// Slices (Modular Components)
export { IdentitySlice } from './slices/IdentitySlice';
export { BulkSlice } from './slices/BulkSlice';
export { RealtimeSlice } from './slices/RealtimeSlice';
export { SniperSlice } from './slices/SniperSlice';

// Middleware (Processing Components)
export { Base64Migration } from './middleware/Base64Migration';

// Types and Interfaces
export type { 
  HydrationResult, 
  SecurityState,
  CommitOperation,
  ValidationConfig
} from './engine/types';

// Constants
export { 
  HYDRATION_CONSTANTS,
  COMMIT_TYPES,
  VALIDATION_SOURCES
} from './engine/constants';
