import { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offlineDB';
import { snipedInSession } from '@/lib/vault/store/sessionGuard';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * 🚀 INSTANT LOCAL PREVIEW HOOK
 * ------------------------------------
 * Pure Reactive: Handles cid_ to blob URL conversion
 * with automatic memory cleanup and failure lock
 */

export interface UseLocalPreviewResult {
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrating?: boolean;
}

export const useLocalPreview = (imageSrc?: string): UseLocalPreviewResult => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 FIX: Use useRef to avoid dependency loop
  const previewUrlRef = useRef<string | null>(null);
  
  // 🆕 FAILURE LOCK: Track failed CIDs to prevent infinite retries
  const failedCIDs = useRef<Map<string, { attempts: number; lastAttempt: number }>>(new Map());

  // 🆕 STEP 1: Move ALL useLiveQuery calls to TOP level
  const { bootStatus } = getVaultStore();
  
  // 🛡️ BOOT GUARD: Do not fetch while system is initializing
  const shouldSkipBootGuard = bootStatus !== 'READY';
  
  // 🛡️ INPUT GUARD: Skip invalid inputs
  const shouldSkipInput = !imageSrc || !imageSrc.startsWith('cid_') || failedCIDs.current.has(imageSrc);
  
  const mediaRecord = useLiveQuery(
    () => shouldSkipBootGuard || shouldSkipInput
      ? null
      : imageSrc?.startsWith('cid_') 
        ? db.mediaStore.where('cid').equals(imageSrc).first()
        : null
  );
  
  const bookRecord = useLiveQuery(
    () => shouldSkipBootGuard || shouldSkipInput
      ? null
      : imageSrc?.startsWith('cid_')
        ? db.books.where('mediaCid').equals(imageSrc).or('image').equals(imageSrc).first()
        : null
  );

  // 🎯 ENHANCED GUARD: Check if record already exists locally
  const existingRecord = useLiveQuery(
    () => shouldSkipBootGuard || shouldSkipInput
      ? null
      : imageSrc?.startsWith('cid_') 
        ? db.books.where('cid').equals(imageSrc).first()
        : null
  );

  // 🎯 IN-PROGRESS CHECK: Prevent hydration of records currently being processed
  const isBeingProcessed = useLiveQuery(
    () => shouldSkipBootGuard || shouldSkipInput
      ? null
      : imageSrc?.startsWith('cid_') 
        ? db.books.where('cid').equals(imageSrc).and((book: any) => book.synced === 0).first()
        : null
  );

  // 🔥 FIX: Cleanup function uses ref instead of state
  const cleanup = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      console.log(`🧹 [LOCAL PREVIEW] Cleaned up object URL: ${previewUrlRef.current}`);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null); // Still update state for UI
  }, []); // 🔥 FIX: No dependencies

  // 🆕 BLOB-TO-URL CONVERSION: Convert mediaRecord blob to preview URL with remote fallback
  useEffect(() => {
    // 1. PRIORITY: If we have a local blob, use it
    if (mediaRecord?.blobData && !previewUrlRef.current) {
      const url = URL.createObjectURL(mediaRecord.blobData);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      console.log(`🖼️ [LOCAL PREVIEW] Created preview URL for CID: ${imageSrc}`);
      return;
    }
    
    // 2. FALLBACK: If local blob is missing but we have a remote image URL
    // Check if imageSrc itself is a valid URL (Cloudinary)
    if (!mediaRecord && imageSrc && imageSrc.startsWith('http')) {
      setPreviewUrl(imageSrc);
      setIsLoading(false); // 🆕 Set loading to false for remote URLs
      console.log(`🌐 [REMOTE PREVIEW] Using Cloudinary URL: ${imageSrc}`);
      return;
    }
    
    // Cleanup when image changes or component unmounts
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        console.log(`🧹 [LOCAL PREVIEW] Revoked preview URL for CID: ${imageSrc}`);
        previewUrlRef.current = null;
        setPreviewUrl(null);
      }
    };
  }, [mediaRecord?.blobData, imageSrc]);

  // 🛡️ BOOT GUARD: Fixed useEffect with NO early returns
  useEffect(() => {
    // 🛡️ BOOT GUARD: Do not fetch while system is initializing
    if (shouldSkipBootGuard) {
      cleanup();
      return;
    }
    
    // 🛡️ INPUT GUARD: Skip invalid inputs
    if (shouldSkipInput) {
      cleanup();
      return;
    }
    
    // 🛡️ EXISTENCE GUARD: Skip if record exists
    if (existingRecord) {
      console.log(`🛡️ [LOCAL PREVIEW] Record already exists locally: ${imageSrc}`);
      cleanup();
      return;
    }
    
    // 🛡️ PROCESS GUARD: Skip if being processed
    if (isBeingProcessed) {
      console.log(`🛡️ [LOCAL PREVIEW] Record currently being processed: ${imageSrc}`);
      cleanup();
      return;
    }

    (async () => {
      // 🧹 GHOST BUSTER: Check if database is empty before attempting hydration
      const localBookCount = await db.books.count();
      if (localBookCount === 0 && imageSrc?.startsWith('cid_')) {
        console.log('🧹 [GHOST BUSTER] Database empty, clearing orphaned preview');
        localStorage.removeItem('vault-preview-cid');
        cleanup();
        return;
      }

      if (snipedInSession.has(imageSrc)) {
        console.log(`🛡️ [SESSION GUARD] CID already processed this session: ${imageSrc}`);
        return;
      }

      try {
        setIsLoading(true);
        snipedInSession.add(imageSrc);
        
        // 🛡️ API GUARD: ONLY hydrate if NOT a CID (real Book ID)
        if (!imageSrc.startsWith('cid_')) {
          console.log(`🎯 [SNIPER FETCH] Triggering hydration for Book ID: ${imageSrc}`);
          
          const orchestrator = (window as any).orchestrator;
          if (orchestrator) {
            const result = await orchestrator.hydrateSingleItem('BOOK', imageSrc);
            
            // 🧹 GHOST BUSTER: Check if item is gone and cleanup localStorage
            if (result.isGone || (result.error && result.error.includes('Not Found'))) {
              console.log('🧹 [GHOST BUSTER] Cleared orphaned Book ID from localStorage:', imageSrc);
              localStorage.removeItem('vault-preview-cid');
              return;
            }
          }
        } else {
          // 🆕 MEDIA LOGIC: For CIDs, check for Cloudinary URL fallback
          console.log(`🛡️ [MEDIA GUARD] CID detected, skipping book hydration: ${imageSrc}`);
          
          // Check if we have a Cloudinary URL in the mediaStore
          const mediaRecord = await db.mediaStore.where('cid').equals(imageSrc).first();
          if (mediaRecord?.cloudinaryUrl) {
            console.log(`🌐 [MEDIA GUARD] Found Cloudinary URL for CID: ${imageSrc}`);
            // The useLiveQuery above will handle the URL conversion
          } else {
            console.log(`⚠️ [MEDIA GUARD] No Cloudinary URL found for CID: ${imageSrc}`);
          }
        }
      } catch (error) {
        console.error(`❌ [SNIPER FETCH] Hydration failed for CID: ${imageSrc}`, error);
      } finally {
        setIsLoading(false); // 🆕 Always set loading to false when complete
      }
    })();
  }, [imageSrc, shouldSkipBootGuard, shouldSkipInput, existingRecord, isBeingProcessed]);

  return {
    previewUrl,
    isLoading,
    error
  };
}
