import { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offlineDB';
import { snipedInSession } from '@/lib/vault/store/sessionGuard';

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
  const mediaRecord = useLiveQuery(
    () => imageSrc?.startsWith('cid_') 
      ? db.mediaStore.where('cid').equals(imageSrc).first()
      : null
  );
  
  const bookRecord = useLiveQuery(
    () => imageSrc?.startsWith('cid_')
      ? db.books.where('mediaCid').equals(imageSrc).or('image').equals(imageSrc).first()
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

  // 🆕 STEP 2: Single useEffect to handle all logic
  useEffect(() => {
    // Cleanup previous URL
    cleanup();
    
    if (!imageSrc || !imageSrc.startsWith('cid_')) {
      if (!imageSrc) {
        setPreviewUrl(null);
        setIsLoading(false);
        setError(null);
      } else if (imageSrc.startsWith('http')) {
        // Direct URL, no need for preview
        setPreviewUrl(imageSrc);
        setIsLoading(false);
        setError(null);
      } else {
        // Invalid or unsupported format
        setPreviewUrl(null);
        setIsLoading(false);
        setError('Unsupported image format');
      }
      return;
    }

    // 🆕 STEP 3: Handle reactive logic
    // 1. If we already have a Blob, use it
    if (mediaRecord?.blobData) {
      const url = URL.createObjectURL(mediaRecord.blobData);
      setPreviewUrl(url);
      previewUrlRef.current = url;
      setIsLoading(false);
      setError(null);
      
      // 🆕 SUCCESS: Clear failure lock
      failedCIDs.current.delete(imageSrc);
      console.log(`✅ [LOCAL PREVIEW] Preview ready for CID: ${imageSrc}`);
      return;
    }

    // 2. If we have a Cloudinary URL, use it
    if (bookRecord?.image?.startsWith('http')) {
      setPreviewUrl(bookRecord.image);
      setIsLoading(false);
      setError(null);
      
      // 🆕 SUCCESS: Clear failure lock
      failedCIDs.current.delete(imageSrc);
      console.log(`✅ [LOCAL PREVIEW] Using Cloudinary URL for CID: ${imageSrc}`);
      return;
    }

    // 3. If missing, trigger Sniper Fetch with Failure Lock guard
    // 🆕 FIX: Use FULL CID as key for consistency
    const failureInfo = failedCIDs.current.get(imageSrc);
    
    if (!mediaRecord && !isLoading && bookRecord?.synced === 1 && (!failureInfo || failureInfo.attempts < 3)) {
      setIsLoading(true);
      setError(null);
      
      // 🛡️ SESSION GUARD: Prevent duplicate sniper fetches
      if (!snipedInSession.has(imageSrc)) {
        snipedInSession.add(imageSrc);
        
        // 🆕 EXPONENTIAL BACK-OFF: Calculate delay
        const delay = Math.min(1000 * Math.pow(2, failureInfo?.attempts || 0), 8000);
        
        // Trigger sniper fetch asynchronously
        (async () => {
          // Wait before retry
          await new Promise<void>(resolve => setTimeout(resolve, delay));
          
          try {
            if (typeof window !== 'undefined' && window.orchestrator) {
              const orchestrator = window.orchestrator as { 
                hydrateSingleItem: (type: 'BOOK' | 'ENTRY', id: string) => Promise<{ success: boolean; error?: string }> 
              };
              // 🆕 FIX: Use FULL CID for API call (no stripping)
              await orchestrator.hydrateSingleItem('BOOK', imageSrc);
              console.log(`🔄 [LOCAL PREVIEW] Sniper Fetch triggered for CID: ${imageSrc}`);
            }
          } catch (sniperErr: unknown) {
            console.error(`❌ [LOCAL PREVIEW] Sniper Fetch failed for CID: ${imageSrc}`, sniperErr);
            setError('Failed to fetch preview');
            
            // 🛡️ GHOST BUSTER: Check for 404/Not Found errors
            const errorMessage = sniperErr instanceof Error ? sniperErr.message : String(sniperErr);
            if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
              console.log(`🛡️ [GHOST BUSTER] Marking book as non-existent on server to stop loop: ${imageSrc}`);
              
              // Find and update the ghost book to prevent future attempts
              try {
                const ghostBook = await db.books.where('image').equals(imageSrc).or('mediaCid').equals(imageSrc).first();
                if (ghostBook) {
                  await db.books.update(ghostBook.localId!, {
                    image: null,
                    mediaCid: null,
                    updatedAt: Date.now()
                  });
                  console.log(`🛡️ [GHOST BUSTER] Cleared image references for ghost book: ${ghostBook.cid}`);
                }
              } catch (dbErr) {
                console.error(`❌ [GHOST BUSTER] Failed to update ghost book:`, dbErr);
              }
            }
          } finally {
            // 🆕 UPDATE FAILURE TRACKING with FULL CID as key
            const current = failedCIDs.current.get(imageSrc) || { attempts: 0, lastAttempt: 0 };
            failedCIDs.current.set(imageSrc, { 
              attempts: current.attempts + 1, 
              lastAttempt: Date.now() 
            });
            setIsLoading(false);
          }
        })();
      } else {
        console.log(`🛡️ [SESSION GUARD] CID already processed this session: ${imageSrc}`);
      }
    }
  }, [imageSrc, mediaRecord, bookRecord, isLoading, cleanup]);

  return {
    previewUrl,
    isLoading,
    error
  };
};
