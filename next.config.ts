import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextBundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'clsx', 'tailwind-merge'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  modularizeImports: {
    'recharts': {
      transform: 'recharts/es6/{{member}}',
      skipDefaultConversion: true,
    },
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/site',
        permanent: false,
      },
    ]
  },
};

export default withNextBundleAnalyzer(nextConfig);
