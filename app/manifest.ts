import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vault Pro | Secure Digital Ledger',
    short_name: 'Vault Pro',
    description: 'Professional Financial OS for secure business and personal wealth tracking.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait', // মোবাইল অ্যাপ ফিল দেওয়ার জন্য ফিক্সড পোর্ট্রেট মোড
    background_color: '#0F0F0F', // আপনার নতুন Studio Grey ব্যাকগ্রাউন্ডের সাথে সিংক্রোনাইজড
    theme_color: '#F97316',      // আপনার ব্র্যান্ড অরেঞ্জ কালার
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
        purpose: 'maskable', // অ্যান্ড্রয়েডে আইকন যাতে গোল বা চারকোণা সুন্দরভাবে দেখায়
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}