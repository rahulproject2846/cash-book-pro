// 🔥 GLOBAL WINDOW TYPES: Extend Window interface for global orchestrator access
declare global {
  interface Window {
    orchestrator: {
      hydrate: (userId: string) => Promise<void>;
      triggerSync: (userId?: string) => Promise<void>;
      initPusher: (pusher: any, userId: string) => void;
      logout: () => Promise<void>;
      performIntegrityCheck: (userId?: string) => Promise<void>;
      hydrateSingleItem: (type: 'BOOK' | 'ENTRY', id: string) => Promise<{ success: boolean; error?: string }>;
    };
    mediaStore: any;
  }
}

export {};
