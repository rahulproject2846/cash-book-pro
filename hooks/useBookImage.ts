import { useCallback } from 'react';
import { db, generateCID } from '@/lib/offlineDB';
import { processMedia } from '@/lib/utils/mediaProcessor';
import { useMediaStore } from '@/lib/vault/MediaStore';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import toast from 'react-hot-toast';

/**
 * 🚀 BOOK IMAGE PROCESSING HOOK
 * ------------------------------------
 * Replaces Base64 FileReader with MediaStore integration
 * for instant local preview and cloud upload
 */

export interface UseBookImageResult {
  handleImageProcess: (file: File, bookId?: string) => Promise<string>;
  handleRemoveImage: (bookId: string) => Promise<void>;
  isLoading: boolean;
}

export const useBookImage = (): UseBookImageResult => {
  const isLoading = false; // Can be expanded with loading state if needed
  const { userId } = getVaultStore(); // 🆕 Get actual user ID

  const handleImageProcess = useCallback(async (file: File, bookId?: string) => {
    try {
      // � SIZE GUARD: Reject oversized images
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        toast.error(`Image too large. Maximum size is 2MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        throw new Error(`Image size exceeds 2MB limit`);
      }
      
      // �🔍 TRACE POINT A: Input File Details
      console.log('🔍 [TRACE A] File Input Details:', {
        name: file.name,
        size: file.size,
        sizeKB: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // 🗜️ SMART COMPRESSION: Use our media processor
      const { blob, compressedSize, compressionRatio } = await processMedia(file);
      
      // 🔍 TRACE POINT A: Blob Validation
      console.log('🔍 [TRACE A] ProcessMedia Result:', {
        blobExists: !!blob,
        blobSize: blob?.size || 0,
        blobSizeKB: blob ? `${(blob.size / 1024).toFixed(2)} KB` : 'NULL',
        compressedSize,
        compressionRatio,
        blobType: blob?.type || 'UNKNOWN',
        isEmpty: blob?.size === 0
      });
      
      // 🚨 CRITICAL CHECK: Zero-byte blob detection
      if (!blob || blob.size === 0) {
        throw new Error('Processed blob is empty - cannot upload zero-byte file');
      }
      
      // 🆔 GENERATE MEDIA CID
      const mediaCid = generateCID();
      
      // 📤 SAVE TO MEDIA STORE
      const result = await db.mediaStore.add({
        cid: mediaCid,
        parentType: 'book',
        parentId: bookId || 'temp', // Will be updated after book creation
        localStatus: 'pending_upload',
        blobData: blob,
        mimeType: file.type,
        originalSize: file.size,
        compressedSize: blob.size,
        createdAt: Date.now(),
        userId: userId || 'current' // 🆕 Use actual user ID with fallback
      });
      
      // 📤 ADD TO UPLOAD QUEUE
      const mediaStore = useMediaStore.getState();
      mediaStore.addToQueue(mediaCid);
      
      // 🎯 UPDATE BOOK RECORD: Reference media CID
      if (bookId) {
        await db.books.update(bookId, { 
          image: mediaCid // Store CID reference
        });
      }
      
      toast.success('Book image uploaded successfully! Processing...');
      
      // Return the CID for immediate form update
      return mediaCid;
      
    } catch (error) {
      console.error('❌ [BOOK IMAGE] Upload failed:', error);
      toast.error('Book image upload failed');
      throw error;
    }
  }, []);

  const handleRemoveImage = useCallback(async (bookId: string) => {
    try {
      // Get current book to find media CID
      const book = await db.books.where('localId').equals(parseInt(bookId)).first();
      
      if (book?.image && book.image.startsWith('cid_')) {
        // Remove from MediaStore
        await db.mediaStore.where('cid').equals(book.image).delete();
        
        // Remove from upload queue if still pending
        const mediaStore = useMediaStore.getState();
        mediaStore.removeFromQueue(book.image);
      }
      
      // Clear book image
      await db.books.update(bookId, { image: '' });
      
      toast.success('Book image removed');
      
    } catch (error) {
      console.error('❌ [BOOK IMAGE] Removal failed:', error);
      toast.error('Failed to remove book image');
    }
  }, []);

  return {
    handleImageProcess,
    handleRemoveImage,
    isLoading
  };
};
