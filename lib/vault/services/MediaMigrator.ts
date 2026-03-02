"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';
import { generateCID } from '@/lib/offlineDB';

// Type definitions for book records
interface BookRecord {
  localId?: number;
  cid: string;
  image?: string;
  vKey: number;
}

/**
 * 🧠 MEDIA MIGRATOR - Background Base64 → MediaStore Migration
 * 
 * Purpose: Convert legacy Base64 images in books table to MediaStore CID references
 * - Non-blocking batch processing
 * - Automatic cleanup of RAM-heavy Base64 strings
 * - Preserves data integrity during migration
 */

export class MediaMigrator {
  private readonly BATCH_SIZE = 20;
  private readonly DELAY_BETWEEN_BATCHES = 20;
  private userId: string = '';

  constructor() {
    this.userId = identityManager.getUserId() || '';
  }

  /**
   * 🔍 DETECT BASE64 STRING
   * Checks if a string is likely a Base64 image (not CID or URL)
   */
  private isBase64Image(image: string | undefined | null): boolean {
    if (!image || typeof image !== 'string') return false;
    
    // Skip CID references and URLs
    if (image.startsWith('cid_') || image.startsWith('http')) return false;
    
    // Check for Base64 patterns (data:image/)
    return image.startsWith('data:image/');
  }

  /**
   * 🧠 MIGRATE SINGLE BOOK
   * Converts Base64 image to MediaStore CID reference
   */
  private async migrateSingleBook(book: BookRecord): Promise<void> {
    try {
      // Processing book ${book.cid}
      
      // 1. Convert Base64 to Blob
      if (!book.image) {
        // Book ${book.cid} has no image, skipping
        return;
      }
      
      const response = await fetch(book.image);
      const blob = await response.blob();
      
      // 2. Generate CID and save to MediaStore
      const mediaCid = generateCID();
      await db.mediaStore.add({
        cid: mediaCid,
        parentType: 'book',
        parentId: String(book.localId),
        localStatus: 'pending_upload',
        blobData: blob,
        mimeType: blob.type,
        originalSize: blob.size,
        compressedSize: blob.size,
        createdAt: Date.now(),
        userId: this.userId
      });
      
      // 3. Update book record - remove Base64, add CID
      await db.books.update(book.localId!, {
        image: null,           // 🧹 Remove Base64
        mediaCid: mediaCid,    // ✅ Add CID reference
        vKey: book.vKey + 1,  // 🚨 Trigger sync
        synced: 0              // 🚨 Mark for upload
      });
      
      // Migrated book ${book.cid} -> ${mediaCid}
      
    } catch (error) {
      // Failed to migrate book ${book.cid}
      throw error;
    }
  }

  /**
   * 🚀 MIGRATE LEGACY IMAGES
   * Main entry point for background migration
   */
  async migrateLegacyImages(): Promise<{ migrated: number; errors: number }> {
    // 🛡️ USER GUARD: Only run if user is authenticated
    const userId = identityManager.getUserId();
    if (!userId) {
      console.log('[MIGRATION] No user available, skipping migration');
      return { migrated: 0, errors: 0 };
    }
    
    // Started background cleanup...
    
    try {
      // 1. Find legacy books with Base64
      const legacyBooks = await db.books
        .where('image')
        .notEqual(null)
        .and((book: BookRecord) => {
          return book.image && 
                 !book.image.startsWith('cid_') && 
                 book.image.startsWith('data:image/');
        })
        .toArray();
      
      // Found ${legacyBooks.length} books with legacy Base64
      
      let migrated = 0;
      let errors = 0;
      
      // 2. Process in small batches (non-blocking)
      for (let i = 0; i < legacyBooks.length; i += this.BATCH_SIZE) {
        const batch = legacyBooks.slice(i, i + this.BATCH_SIZE);
        
        // Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(legacyBooks.length / this.BATCH_SIZE)}
        
        // Process batch concurrently
        const results = await Promise.allSettled(
          batch.map((book: BookRecord) => this.migrateSingleBook(book))
        );
        
        // Count results
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            migrated++;
          } else {
            errors++;
            // Batch item failed
          }
        });
        
        // 4. Non-blocking delay between batches
        if (i + this.BATCH_SIZE < legacyBooks.length) {
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_BATCHES));
        }
      }
      
      // Complete: ${migrated} migrated, ${errors} errors
      
      // 5. Trigger UI refresh if migration occurred
      if (migrated > 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('vault-updated'));
        }
        // Triggered UI refresh for ${migrated} migrated books
      }
      
      return { migrated, errors };
      
    } catch (error) {
      // Background migration failed
      return { migrated: 0, errors: 1 };
    }
  }

  /**
   * 📊 GET MIGRATION STATUS
   * Check how many books still need migration
   */
  async getMigrationStatus(): Promise<{ total: number; migrated: number; remaining: number }> {
    try {
      const total = await db.books
        .where('image')
        .notEqual(null)
        .count();
      
      const remaining = await db.books
        .where('image')
        .notEqual(null)
        .and((book: BookRecord) => 
          book.image && 
          !book.image.startsWith('cid_') && 
          book.image.startsWith('data:image/')
        )
        .count();
      
      const migrated = total - remaining;
      
      return { total, migrated, remaining };
      
    } catch (error) {
      // Failed to get status
      return { total: 0, migrated: 0, remaining: 0 };
    }
  }
}

// 🚀 EXPORT SINGLETON INSTANCE
export const mediaMigrator = new MediaMigrator();
