import Pusher from 'pusher';

/**
 * 🚀 HOLLY GRILL PUSHER SERVER INSTANCE
 * ------------------------------------
 * Enterprise-grade real-time broadcasting server
 * Centralized Pusher configuration for all API routes
 */

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
});

export { pusherServer };
