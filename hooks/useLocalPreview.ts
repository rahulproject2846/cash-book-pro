import { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offlineDB';
import { snipedInSession } from '@/lib/vault/store/sessionGuard';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * 🚀 INSTANT LOCAL PREVIEW HOOK
 * ------------------------------------
 * Live Observer: Reacts to mediaStore changes in real-time
 * with automatic memory cleanup and failure lock
 */

export interface UseLocalPreviewResult {
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrating?: boolean;
}

export const useLocalPreview = (image?: string, mediaCid?: string): UseLocalPreviewResult => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 FIX: Use useRef to avoid dependency loop
  const previewUrlRef = useRef<string | null>(null);
  const previousImagePathRef = useRef<string | null>(null);
  
  // 🆕 LIVE OBSERVER: Watch mediaStore for real-time updates
  const imagePath = image || mediaCid || '';
  const mediaRecord = useLiveQuery(
    () => (imagePath.startsWith('cid_')) 
      ? db.mediaStore.get(imagePath) 
      : null,
    [imagePath]
  );

  // 🎯 IMMEDIATE REACTOR: Instant response to mediaRecord changes
  useEffect(() => {
    // 1. PRIORITY: Use Cloudinary URL if available (cross-device support)
    if (image && image.startsWith('http')) {
      // 🛡️ GRACEFUL CLEANUP: Clean previous URL with 5-second delay
      if (previewUrlRef.current && previewUrlRef.current !== image) {
        setTimeout(() => {
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
        }, 5000); // 🛡️ 5-second delay to prevent Zombie Blobs
      }
      
      setPreviewUrl(image);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 2. FALLBACK: Process CID with live mediaRecord
    if (!imagePath) {
      setPreviewUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 🛡️ STATE RESET FIX: Only reset when CID actually changes
    if (previousImagePathRef.current && previousImagePathRef.current !== imagePath) {
      // Graceful cleanup: 5-second delay to prevent Zombie Blobs
      if (previewUrlRef.current) {
        setTimeout(() => {
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
        }, 5000);
      }
    }
    previousImagePathRef.current = imagePath;

    // 🎯 LIVE PROCESSING: React to mediaRecord changes
    if (mediaRecord?.blobData) {
      // 🛡️ GRACEFUL CLEANUP: Only revoke after new image loads successfully
      const oldUrl = previewUrlRef.current;
      const newUrl = URL.createObjectURL(mediaRecord.blobData);
      previewUrlRef.current = newUrl;
      setPreviewUrl(newUrl);
      setIsLoading(false);
      setError(null);
      
      // Clean up old URL after successful new load
      if (oldUrl && oldUrl !== newUrl) {
        setTimeout(() => {
          URL.revokeObjectURL(oldUrl);
        }, 5000); // 🛡️ 5-second delay to prevent Zombie Blobs
      }
    } else if (imagePath.startsWith('cid_')) {
      // CID exists but blob not ready yet
      setIsLoading(true);
      setError(null);
    } else {
      // Invalid path
      setPreviewUrl(null);
      setIsLoading(false);
      setError('Invalid image path');
    }
  }, [image, mediaCid, mediaRecord]);

  // 🔥 CLEANUP: Proper memory management on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  return {
    previewUrl,
    isLoading,
    error,
    isHydrating: isLoading
  };
};
