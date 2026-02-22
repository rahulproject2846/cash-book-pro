"use client";

import { db } from '@/lib/offlineDB';
import { generateCID } from '@/lib/offlineDB';

/**
 * 🧠 BASE64 MIGRATION MIDDLEWARE
 * 
 * Converts Base64 images to MediaStore CID references
 * Preserves data integrity during migration
 */
export class Base64Migration {
  private userId: string = '';

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * 🔍 DETECT BASE64 STRING
   * Checks if a string is likely a Base64 image (not CID or URL)
   */
  private isBase64Image(image: string | undefined | null): boolean {
    if (!image || typeof image !== 'string') return false;
    
    // Skip CID references and URLs
    if (image.startsWith('cid_') || image.startsWith('http')) return false;
    
    // Check for Base64 patterns (data:image/ or long strings)
    return image.startsWith('data:image/') || image.length > 1000;
  }

  /**
   * 🧠 MIGRATE BASE64 TO MEDIASTORE
   * Converts Base64 image to MediaStore CID reference
   */
  async migrateBase64ToMediaStore(image: string, bookId: string): Promise<string> {
    try {
      console.log(`🧠 [BASE64 MIGRATION] Migrating Base64 to MediaStore for book ${bookId}`);
      
      // 1. Generate CID
      const mediaCid = generateCID();
      
      // 2. Convert Base64 to Blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // 3. Save to MediaStore
      await db.mediaStore.add({
        cid: mediaCid,
        parentType: 'book',
        parentId: bookId,
        localStatus: 'pending_upload',
        blobData: blob,
        mimeType: blob.type,
        originalSize: blob.size,
        compressedSize: blob.size,
        createdAt: Date.now(),
        userId: this.userId
      });
      
      console.log(`✅ [BASE64 MIGRATION] Migrated Base64 to MediaStore: ${bookId} -> ${mediaCid}`);
      return mediaCid;
      
    } catch (error) {
      console.error(`❌ [BASE64 MIGRATION] Failed to migrate Base64 for book ${bookId}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 PROCESS IMAGE WITH MIGRATION
   * Handles image preservation and Base64 migration
   */
  async processImage(image: string | undefined | null, existingImage: string | undefined, bookId: string): Promise<string | undefined> {
    // Preserve local image if server data is missing it
    const isServerImageEmpty = image === null || image === undefined || image === "";
    let imageToPreserve = (isServerImageEmpty && existingImage) ? existingImage : image;
    
    // Never overwrite valid local data with empty server data
    if (isServerImageEmpty && existingImage && existingImage !== "") {
      console.log(`🛡️ [BASE64 MIGRATION] Preserving local image for book ${bookId}: ${existingImage}`);
      imageToPreserve = existingImage;
    }
    
    // Migrate Base64 to MediaStore
    if (imageToPreserve && this.isBase64Image(imageToPreserve)) {
      console.log(`🧠 [BASE64 MIGRATION] Detected Base64 image for book ${bookId}, migrating to MediaStore`);
      const resolvedBookId = bookId || 'temp';
      imageToPreserve = await this.migrateBase64ToMediaStore(imageToPreserve, resolvedBookId);
    }

    return imageToPreserve || undefined;
  }
}
