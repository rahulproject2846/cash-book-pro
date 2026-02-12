"use client";

/**
 * 🔥 VAULT HOOK EXPORTER (Legacy Compatibility)
 * 
 * This file now serves as a compatibility layer that exports
 * the new modularized useVault hook from hooks/vault/index.ts
 * 
 * Benefits:
 * - Zero breaking changes: All existing imports continue to work
 * - Clean architecture: Old 1000+ line file is now empty
 * - Future-proof: All new development happens in modular system
 */
export { useVault } from './vault/index';
