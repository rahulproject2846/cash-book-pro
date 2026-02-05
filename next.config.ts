import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            // 🔥 'same-origin-allow-popups' কাজ না করলে 'unsafe-none' হলো আল্টিমেট সলিউশন
            value: 'same-origin-allow-popups', 
          },
        ],
      },
    ]
  },
};

export default nextConfig;