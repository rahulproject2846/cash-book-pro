import type { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextBundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ১. আধুনিক অপ্টিমাইজেশন (কোনো এক্সপেরিমেন্টাল ওয়ার্নিং ছাড়াই)
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'clsx', 'tailwind-merge'],
  },

  // ২. ইমেজ প্রসেসিং ফিক্স
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // ৩. আইকন এবং লাইব্রেরি ট্রি-শেকিং
  modularizeImports: {
    'recharts': {
      transform: 'recharts/es6/{{member}}',
      skipDefaultConversion: true,
    },
  },

  // ৪. অতিরিক্ত রিকোয়েস্ট ব্লক এবং পারফরম্যান্স হেডার
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
};

export default withNextBundleAnalyzer(nextConfig);