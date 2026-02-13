// 🔥 GLOBAL WINDOW TYPES: Extend Window interface for global orchestrator access
declare global {
  interface Window {
    syncOrchestrator?: {
      hydrate: (userId: string) => Promise<void>;
      triggerSync: (userId?: string) => Promise<void>;
      initPusher: (pusher: any, userId: string) => void;
      logout: () => Promise<void>;
    };
  }
}

export {};
