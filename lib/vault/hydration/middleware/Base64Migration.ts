"use client";
import { db, generateCID } from '@/lib/offlineDB';

export class Base64Migration {
  private userId: string = '';

  constructor(userId: string) {
    this.userId = userId;
  }

  private isBase64Image(image: any): boolean {
    if (!image || typeof image !== 'string') return false;
    return image.startsWith('data:image/') || (image.length > 1000 && !image.startsWith('http'));
  }

  async migrateBase64ToMediaStore(image: string, bookId: string): Promise<string> {
    try {
      const mediaCid = generateCID();
      const response = await fetch(image);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      
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
      
      return mediaCid;
    } catch (error) {
      console.error(`⚠️ [MIGRATION ERROR] Skipping corrupted image for ${bookId}`);
      return ''; // Return empty to prevent loop
    }
  }

  async processImage(image: any, existingImage: any, bookId: string): Promise<string | undefined> {
    const isServerImageEmpty = !image || image === "";
    let imageToPreserve = (isServerImageEmpty && existingImage) ? existingImage : image;
    
    if (imageToPreserve && this.isBase64Image(imageToPreserve)) {
      const resolvedId = bookId || 'temp';
      const newCid = await this.migrateBase64ToMediaStore(imageToPreserve, resolvedId);
      return newCid || undefined;
    }

    return imageToPreserve || undefined;
  }
}