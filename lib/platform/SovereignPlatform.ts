/**
 * 🏛️ SOVEREIGN PLATFORM INTERFACE - Pathor Standard V1.0
 * ---------------------------------------------------
 * Abstraction layer for browser/native platform access.
 * Enables code sharing between Browser WebView and Native Shell (.exe).
 * 
 * TYPE SAFETY: No 'any' types. Uses unknown with type guards.
 * 
 * Usage:
 *   import { getPlatform } from './platform/SovereignPlatform';
 *   const platform = getPlatform();
 *   platform.storage.setItem('key', 'value');
 *   platform.events.dispatch('vault-updated', { timestamp: Date.now() });
 */

// ===== TYPE DEFINITIONS =====

/**
 * Platform types supported by Vault Pro
 */
export type PlatformType = 'browser' | 'native-windows' | 'native-macos' | 'native-linux' | 'unknown';

/**
 * Event detail base interface - all events must extend this
 */
export interface PlatformEventDetail {
  timestamp: number;
  source?: string;
}

/**
 * Identity established event
 */
export interface IdentityEstablishedDetail extends PlatformEventDetail {
  userId: string;
  username: string;
}

/**
 * Identity cleared event  
 */
export interface IdentityClearedDetail extends PlatformEventDetail {
  reason: 'logout' | 'timeout' | 'security-lockdown';
}

/**
 * Vault updated event
 */
export interface VaultUpdatedDetail extends PlatformEventDetail {
  entityType: 'book' | 'entry' | 'user' | 'settings';
  entityId?: string;
  operation: 'create' | 'update' | 'delete';
}

/**
 * Sync request event
 */
export interface SyncRequestDetail extends PlatformEventDetail {
  trigger: 'manual' | 'automatic' | 'background';
  priority: 'low' | 'normal' | 'high';
}

/**
 * Show toast event
 */
export interface ShowToastDetail extends PlatformEventDetail {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * All supported platform events - use discriminated union
 */
export type PlatformEventMap = {
  'identity-established': IdentityEstablishedDetail;
  'identity-cleared': IdentityClearedDetail;
  'identity-needs-hydration': PlatformEventDetail;
  'vault-updated': VaultUpdatedDetail;
  'sync-request': SyncRequestDetail;
  'show-toast': ShowToastDetail;
  'open-conflict-modal': PlatformEventDetail;
  'open-bulk-conflict-modal': PlatformEventDetail;
};

/**
 * Event names - discriminated union key
 */
export type PlatformEventName = keyof PlatformEventMap;

/**
 * Storage result type
 */
export interface StorageResult {
  success: boolean;
  value?: string;
  error?: string;
}

/**
 * Platform information
 */
export interface PlatformInfo {
  isNative: boolean;
  platformType: PlatformType;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Storage interface - abstract localStorage/sessionStorage
 */
export interface StorageInterface {
  getItem(key: string): StorageResult;
  setItem(key: string, value: string): StorageResult;
  removeItem(key: string): StorageResult;
  clear(): StorageResult;
}

/**
 * Events interface - abstract window.dispatchEvent
 */
export interface EventsInterface {
  dispatch<TEventName extends PlatformEventName>(
    eventName: TEventName,
    detail: PlatformEventMap[TEventName]
  ): boolean;
  
  listen<TEventName extends PlatformEventName>(
    eventName: TEventName,
    handler: (detail: PlatformEventMap[TEventName]) => void
  ): () => void;
  
  once<TEventName extends PlatformEventName>(
    eventName: TEventName,
    handler: (detail: PlatformEventMap[TEventName]) => void
  ): () => void;
}

/**
 * Main Sovereign Platform interface
 */
export interface SovereignPlatform {
  readonly storage: StorageInterface;
  readonly events: EventsInterface;
  readonly info: PlatformInfo;
  
  // Convenience methods
  isBrowser(): boolean;
  isNative(): boolean;
}