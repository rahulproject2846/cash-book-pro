import { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '@/lib/offlineDB';

/**
 * 🚀 INSTANT LOCAL PREVIEW HOOK
 * ------------------------------------
 * Zero-Risk Refactor: Handles cid_ to blob URL conversion
 * with automatic memory cleanup on unmount
 */

export interface UseLocalPreviewResult {
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useLocalPreview = (imageSrc?: string): UseLocalPreviewResult => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 FIX: Use useRef to avoid dependency loop
  const previewUrlRef = useRef<string | null>(null);

  const fetchLocalPreview = useCallback(async (cid: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 [LOCAL PREVIEW] Fetching blob for CID: ${cid}`);
      
      // Fetch blob from mediaStore
      const mediaRecord = await db.mediaStore.where('cid').equals(cid).first();
      
      if (!mediaRecord || !mediaRecord.blobData) {
        console.warn(`⏳ [LOCAL PREVIEW] Blob not found for CID: ${cid}. This might be a remote record awaiting sync.`);
        
        // 🚀 FALLBACK: Check if parent has been updated with real URL
        try {
          // Extract parent ID from CID (remove cid_ prefix)
          const parentId = cid.replace('cid_', '');
          
          // Check books table for updated record
          const bookRecord = await db.books.where('mediaCid').equals(cid).or('image').equals(cid).first();
          if (bookRecord && bookRecord.image && bookRecord.image.startsWith('http')) {
            console.log(`🔄 [LOCAL PREVIEW] Found updated URL for CID: ${cid} -> ${bookRecord.image}`);
            setPreviewUrl(bookRecord.image);
            return;
          }
          
          // Check entries table for updated record  
          const entryRecord = await db.entries.where('mediaId').equals(cid).first();
          if (entryRecord && entryRecord.mediaId && entryRecord.mediaId.startsWith('http')) {
            console.log(`🔄 [LOCAL PREVIEW] Found updated URL for CID: ${cid} -> ${entryRecord.mediaId}`);
            setPreviewUrl(entryRecord.mediaId);
            return;
          }
        } catch (fallbackErr) {
          console.error(`❌ [LOCAL PREVIEW] Fallback check failed for CID: ${cid}`, fallbackErr);
        }
        
        setPreviewUrl(null);
        return;
      }
      
      // Create object URL for instant preview
      const url = URL.createObjectURL(mediaRecord.blobData);
      setPreviewUrl(url);
      previewUrlRef.current = url; // 🔥 FIX: Update ref
      
      console.log(`✅ [LOCAL PREVIEW] Preview ready for CID: ${cid}`);
      
    } catch (err) {
      console.error(`❌ [LOCAL PREVIEW] Failed to fetch CID: ${cid}`, err);
      setError('Preview not available');
      setPreviewUrl(null);
      previewUrlRef.current = null; // 🔥 FIX: Clear ref
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔥 FIX: Cleanup function uses ref instead of state
  const cleanup = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      console.log(`🧹 [LOCAL PREVIEW] Cleaned up object URL: ${previewUrlRef.current}`);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null); // Still update state for UI
  }, []); // 🔥 FIX: No dependencies

  // Main effect: Handle image source changes
  useEffect(() => {
    // Cleanup previous URL
    cleanup();
    
    if (!imageSrc) {
      return;
    }
    
    // 🚀 OPTIMIZATION: Check if it's already a real URL
    if (imageSrc.startsWith('http')) {
      // Regular URL (Cloudinary, Google, etc.) - use directly
      setPreviewUrl(imageSrc);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // Check if it's a CID reference
    if (imageSrc.startsWith('cid_')) {
      fetchLocalPreview(imageSrc);
    } else {
      // Empty or invalid source
      setPreviewUrl(null);
      setIsLoading(false);
      setError(null);
    }
    
    // Cleanup on unmount or dependency change
    return cleanup;
  }, [imageSrc, fetchLocalPreview]); // 🔥 FIX: Removed cleanup from dependencies

  return {
    previewUrl,
    isLoading,
    error
  };
};
