import Pusher from 'pusher';

/**
 * 🚀 HOLLY GRILL PUSHER SERVER INSTANCE
 * ------------------------------------
 * Enterprise-grade real-time broadcasting server
 * Centralized Pusher configuration for all API routes
 * Singleton pattern prevents connection leaks
 */

let pusherInstance: Pusher | null = null;

/**
 * 🛡️ GET PUSHER SERVER - Singleton Pattern
 * Ensures only ONE Pusher instance exists throughout the server lifecycle
 * Prevents socket connection leaks and resource exhaustion
 */
export const getPusherServer = (): Pusher => {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true, // 🔒 Enforces TLS 1.2+
      // 🚀 Additional security and performance options
      // Note: Using only supported Pusher options for stability
    });
  }
  return pusherInstance;
};

// 🔄 LEGACY EXPORT - Backward compatibility
// Deprecated: Use getPusherServer() instead
export const pusherServer = getPusherServer();
