/**
 * 🏛️ SOVEREIGN PLATFORM - Barrel Export
 * ---------------------------------------
 * Unified exports for platform abstraction layer
 */

export type {
  PlatformType,
  PlatformEventName,
  PlatformEventMap,
  PlatformEventDetail,
  IdentityEstablishedDetail,
  IdentityClearedDetail,
  VaultUpdatedDetail,
  SyncRequestDetail,
  ShowToastDetail,
  StorageResult,
  StorageInterface,
  EventsInterface,
  PlatformInfo,
  SovereignPlatform,
} from './SovereignPlatform';

export { 
  BrowserDriver,
  getPlatform,
  setPlatform,
  resetPlatform,
} from './BrowserDriver';