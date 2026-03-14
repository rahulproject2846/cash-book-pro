/**
 * 🏭 BROWSER DRIVER - Browser Platform Implementation
 * ---------------------------------------------------
 * Implements SovereignPlatform using standard browser APIs:
 * - localStorage for storage
 * - window.dispatchEvent for events
 * 
 * This is the DEFAULT implementation for browser environments.
 * Native shells will provide their own implementation.
 * 
 * Pathor Standard: Type-safe, no 'any' types.
 */

import type {
  SovereignPlatform,
  StorageInterface,
  EventsInterface,
  PlatformInfo,
  PlatformEventName,
  PlatformEventMap,
  StorageResult,
  PlatformType,
  NavigationInterface,
  NavigationState,
  LifecycleInterface,
} from './SovereignPlatform';

// ===== BROWSER STORAGE IMPLEMENTATION =====

/**
 * Browser localStorage wrapper with type-safe operations
 */
class BrowserStorage implements StorageInterface {
  private readonly storage: Storage;

  constructor() {
    // Safely get localStorage, may not exist in SSR
    this.storage = typeof window !== 'undefined' 
      ? window.localStorage 
      : ({} as Storage);
  }

  getItem(key: string): StorageResult {
    try {
      // SSR guard
      if (typeof window === 'undefined') {
        return { success: false, error: 'SSR: No localStorage available' };
      }

      const value = this.storage.getItem(key);
      return { 
        success: true, 
        value: value ?? undefined 
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown storage error';
      
      console.error('🚨 [BROWSER STORAGE] getItem failed:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  setItem(key: string, value: string): StorageResult {
    try {
      // SSR guard
      if (typeof window === 'undefined') {
        return { success: false, error: 'SSR: No localStorage available' };
      }

      this.storage.setItem(key, value);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown storage error';
      
      console.error('🚨 [BROWSER STORAGE] setItem failed:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  removeItem(key: string): StorageResult {
    try {
      // SSR guard
      if (typeof window === 'undefined') {
        return { success: false, error: 'SSR: No localStorage available' };
      }

      this.storage.removeItem(key);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown storage error';
      
      console.error('🚨 [BROWSER STORAGE] removeItem failed:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  clear(): StorageResult {
    try {
      // SSR guard
      if (typeof window === 'undefined') {
        return { success: false, error: 'SSR: No localStorage available' };
      }

      this.storage.clear();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown storage error';
      
      console.error('🚨 [BROWSER STORAGE] clear failed:', errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }
}

// ===== BROWSER EVENTS IMPLEMENTATION =====

/**
 * Browser window.dispatchEvent wrapper with type-safe operations
 */
class BrowserEvents implements EventsInterface {
  private eventTarget: EventTarget;

  constructor() {
    // Use window as event target, fall back to empty target for SSR
    this.eventTarget = typeof window !== 'undefined' 
      ? window 
      : new EventTarget();
  }

  dispatch<TEventName extends PlatformEventName>(
    eventName: TEventName,
    detail: PlatformEventMap[TEventName]
  ): boolean {
    try {
      // SSR guard
      if (typeof window === 'undefined') {
        console.warn('⚠️ [BROWSER EVENTS] SSR: Cannot dispatch event', eventName);
        return false;
      }

      const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
      });

      return this.eventTarget.dispatchEvent(event);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown event error';
      
      console.error('🚨 [BROWSER EVENTS] dispatch failed:', errorMessage);
      return false;
    }
  }

  listen<TEventName extends PlatformEventName>(
    eventName: TEventName,
    handler: (detail: PlatformEventMap[TEventName]) => void
  ): () => void {
    // SSR guard
    if (typeof window === 'undefined') {
      console.warn('⚠️ [BROWSER EVENTS] SSR: Cannot add listener for', eventName);
      return () => {};
    }

    const wrappedHandler = ((event: Event) => {
      const customEvent = event as CustomEvent;
      // Type guard: ensure detail matches expected type
      if (customEvent.detail && typeof customEvent.detail === 'object') {
        handler(customEvent.detail as PlatformEventMap[TEventName]);
      } else {
        console.warn('⚠️ [BROWSER EVENTS] Invalid event detail for', eventName);
      }
    });

    this.eventTarget.addEventListener(eventName, wrappedHandler);

    // Return cleanup function
    return () => {
      this.eventTarget.removeEventListener(eventName, wrappedHandler);
    };
  }

  once<TEventName extends PlatformEventName>(
    eventName: TEventName,
    handler: (detail: PlatformEventMap[TEventName]) => void
  ): () => void {
    // SSR guard
    if (typeof window === 'undefined') {
      console.warn('⚠️ [BROWSER EVENTS] SSR: Cannot add once listener for', eventName);
      return () => {};
    }

    let cleanup: () => void;

    const wrappedHandler = ((event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === 'object') {
        handler(customEvent.detail as PlatformEventMap[TEventName]);
        cleanup(); // Remove after first invocation
      }
    });

    this.eventTarget.addEventListener(eventName, wrappedHandler);

    // Return cleanup + self-cleanup function
    cleanup = () => {
      this.eventTarget.removeEventListener(eventName, wrappedHandler);
    };

    return cleanup;
  }
}

// ===== BROWSER PLATFORM INFO =====

/**
 * Get browser platform information
 */
function getBrowserInfo(): PlatformInfo {
  // SSR guard - return default for server
  if (typeof window === 'undefined') {
    return {
      isNative: false,
      platformType: 'unknown',
    };
  }

  // Detect platform type from user agent
  const userAgent = navigator.userAgent;
  let platformType: PlatformType = 'browser';

  if (userAgent.includes('Windows')) {
    platformType = 'native-windows';
  } else if (userAgent.includes('Macintosh')) {
    platformType = 'native-macos';
  } else if (userAgent.includes('Linux')) {
    platformType = 'native-linux';
  }

  return {
    isNative: false,
    platformType,
    userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

// ===== BROWSER NAVIGATION IMPLEMENTATION =====

/**
 * Browser window.history wrapper with type-safe operations
 */
class BrowserNavigation implements NavigationInterface {
  to(path: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }

  pushState(state: NavigationState, title?: string, url?: string): void {
    if (typeof window !== 'undefined') {
      window.history.pushState(state, title || '', url);
    }
  }

  replaceState(state: NavigationState, title?: string, url?: string): void {
    if (typeof window !== 'undefined') {
      window.history.replaceState(state, title || '', url);
    }
  }

  getState(): NavigationState | null {
    if (typeof window !== 'undefined' && window.history.state) {
      return window.history.state as NavigationState;
    }
    return null;
  }

  reload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  getHref(): string {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }

  getPathname(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  }

  scrollTo(options?: { top?: number; behavior?: 'auto' | 'smooth' }): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: options?.top ?? 0,
        behavior: options?.behavior ?? 'auto'
      });
    }
  }
}

// ===== BROWSER LIFECYCLE IMPLEMENTATION =====

/**
 * Browser window lifecycle event wrapper
 */
class BrowserLifecycle implements LifecycleInterface {
  onOnline(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }

  onOffline(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('offline', handler);
    return () => window.removeEventListener('offline', handler);
  }

  onFocus(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }

  onBlur(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('blur', handler);
    return () => window.removeEventListener('blur', handler);
  }

  onBeforeUnload(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }

  onPopState(handler: (state: NavigationState) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const wrappedHandler = (event: PopStateEvent) => {
      handler(event.state as NavigationState);
    };
    window.addEventListener('popstate', wrappedHandler);
    return () => window.removeEventListener('popstate', wrappedHandler);
  }

  private scrollLocked = false;
  private originalOverflow = '';

  lockScroll(): void {
    if (typeof window === 'undefined' || this.scrollLocked) return;
    this.originalOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    this.scrollLocked = true;
  }

  unlockScroll(): void {
    if (typeof window === 'undefined' || !this.scrollLocked) return;
    document.body.style.overflow = this.originalOverflow || '';
    this.scrollLocked = false;
  }
}

// ===== BROWSER DRIVER CLASS =====

let resizeTimeout: NodeJS.Timeout | null = null;

/**
 * Browser implementation of SovereignPlatform
 */
export class BrowserDriver implements SovereignPlatform {
  public readonly storage: StorageInterface;
  public readonly events: EventsInterface;
  public readonly navigation: NavigationInterface;
  public readonly lifecycle: LifecycleInterface;
  public readonly info: PlatformInfo;

  constructor() {
    this.storage = new BrowserStorage();
    this.events = new BrowserEvents();
    this.navigation = new BrowserNavigation();
    this.lifecycle = new BrowserLifecycle();
    this.info = getBrowserInfo();

    // 🚀 REACTIVE VIEWPORT: Listen for resize events
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }

    console.log('🏭 [BROWSER DRIVER] Initialized - Platform:', this.info.platformType);
  }

  private handleResize = () => {
    // Debounce by 100ms for performance
    if (resizeTimeout) clearTimeout(resizeTimeout);
    
    resizeTimeout = setTimeout(() => {
      if (typeof window !== 'undefined') {
        (this.info as any).viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        // Emit viewport change event for reactive hooks
        this.events.dispatch('platform-viewport-change', {
          timestamp: Date.now(),
          source: 'BrowserDriver',
        });
      }
    }, 100);
  };

  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  isNative(): boolean {
    return false;
  }
}

// ===== GLOBAL PLATFORM INSTANCE =====

let platformInstance: SovereignPlatform | null = null;

/**
 * Get the global platform instance
 * Defaults to BrowserDriver for browser environments
 * 
 * @returns SovereignPlatform instance
 */
export function getPlatform(): SovereignPlatform {
  if (!platformInstance) {
    // Initialize browser driver as default
    platformInstance = new BrowserDriver();
    console.log('🏛️ [SOVEREIGN PLATFORM] Global instance created');
  }
  return platformInstance;
}

/**
 * Set a custom platform implementation
 * Used for testing or native shell injection
 * 
 * @param platform - Custom platform implementation
 */
export function setPlatform(platform: SovereignPlatform): void {
  console.log('🏛️ [SOVEREIGN PLATFORM] Custom platform set:', platform.info.platformType);
  platformInstance = platform;
}

/**
 * Reset platform to default (BrowserDriver)
 * Mainly useful for testing
 */
export function resetPlatform(): void {
  platformInstance = null;
  console.log('🏛️ [SOVEREIGN PLATFORM] Reset to default');
}