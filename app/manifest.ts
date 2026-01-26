import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CashBook Pro',
    short_name: 'CashBook',
    description: 'Professional Digital Ledger for Business & Personal Finance',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070A', // আপনার Midnight থিমের সাথে মিল রেখে
    theme_color: '#F97316',      // আপনার Orange ব্র্যান্ডিং
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}