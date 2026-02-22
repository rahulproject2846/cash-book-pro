"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../core/IdentityManager';

/**
 * 🧹 MEDIA STORE GARBAGE COLLECTOR - Production Ready Cleanup
 * 
 * Purpose: Prevent IndexedDB bloat by cleaning up orphaned and failed media blobs
 * - Automatic cleanup of orphaned blobs (30+ days old, not referenced by any book)
 * - Automatic cleanup of failed uploads (7+ days old)
 * - Storage space recovery and reporting
 * - Safe, non-blocking batch processing
 */

export class MediaStoreGarbageCollector {
  private readonly ORPHANED_DAYS = 30;  // 30 days for orphaned blobs
  private readonly FAILED_DAYS = 7;    // 7 days for failed uploads
  private readonly BATCH_SIZE = 50;     // Process in batches to avoid blocking

  constructor() {
    // Auto-initialize with current user ID
  }

  /**
   * 🧹 CLEAN ORPHANED BLOBS
   * Remove blobs not referenced by any book for 30+ days
   */
  async cleanupOrphanedBlobs(): Promise<{ cleaned: number; freedSpace: number }> {
    console.log('🧹 [GARBAGE COLLECTOR] Starting orphaned blob cleanup...');
    
    const cutoffDate = Date.now() - (this.ORPHANED_DAYS * 24 * 60 * 60 * 1000);
    
    // Get all blobs older than cutoff
    const oldBlobs = await db.mediaStore
      .where('createdAt')
      .below(cutoffDate)
      .toArray();
    
    let cleaned = 0;
    let freedSpace = 0;
    
    console.log(`🔍 [GARBAGE COLLECTOR] Found ${oldBlobs.length} blobs older than ${this.ORPHANED_DAYS} days`);
    
    // Process in batches to avoid blocking
    for (let i = 0; i < oldBlobs.length; i += this.BATCH_SIZE) {
      const batch = oldBlobs.slice(i, i + this.BATCH_SIZE);
      
      for (const blob of batch) {
        try {
          // Check if blob is referenced by any book
          const isReferenced = await db.books
            .where('image')
            .equals(blob.cid)
            .or('mediaCid')
            .equals(blob.cid)
            .count();
          
          if (isReferenced === 0) {
            // 🗑️ DELETE ORPHANED BLOB
            await db.mediaStore.delete(blob.localId!);
            cleaned++;
            freedSpace += blob.compressedSize || 0;
            
            console.log(`🧹 [GARBAGE COLLECTOR] Deleted orphaned blob: ${blob.cid} (${((blob.compressedSize || 0) / 1024).toFixed(2)}KB)`);
          }
        } catch (error) {
          console.error(`❌ [GARBAGE COLLECTOR] Error processing blob ${blob.cid}:`, error);
        }
      }
      
      // Small delay between batches to prevent blocking
      if (i + this.BATCH_SIZE < oldBlobs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ [GARBAGE COLLECTOR] Orphaned cleanup: ${cleaned} blobs freed, ${(freedSpace / 1024 / 1024).toFixed(2)}MB recovered`);
    
    return { cleaned, freedSpace };
  }

  /**
   * 🧹 CLEAN FAILED UPLOADS
   * Remove blobs that failed to upload for 7+ days
   */
  async cleanupFailedUploads(): Promise<{ cleaned: number; freedSpace: number }> {
    console.log('🧹 [GARBAGE COLLECTOR] Starting failed upload cleanup...');
    
    const cutoffDate = Date.now() - (this.FAILED_DAYS * 24 * 60 * 60 * 1000);
    
    const failedBlobs = await db.mediaStore
      .where('localStatus')
      .equals('failed')
      .and((blob: any) => blob.createdAt < cutoffDate)
      .toArray();
    
    let cleaned = 0;
    let freedSpace = 0;
    
    console.log(`🔍 [GARBAGE COLLECTOR] Found ${failedBlobs.length} failed blobs older than ${this.FAILED_DAYS} days`);
    
    // Process in batches
    for (let i = 0; i < failedBlobs.length; i += this.BATCH_SIZE) {
      const batch = failedBlobs.slice(i, i + this.BATCH_SIZE);
      
      for (const blob of batch) {
        try {
          await db.mediaStore.delete(blob.localId!);
          cleaned++;
          freedSpace += blob.compressedSize || 0;
          
          console.log(`🧹 [GARBAGE COLLECTOR] Deleted failed blob: ${blob.cid} (${((blob.compressedSize || 0) / 1024).toFixed(2)}KB)`);
        } catch (error) {
          console.error(`❌ [GARBAGE COLLECTOR] Error deleting failed blob ${blob.cid}:`, error);
        }
      }
      
      // Small delay between batches
      if (i + this.BATCH_SIZE < failedBlobs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    console.log(`✅ [GARBAGE COLLECTOR] Failed cleanup: ${cleaned} blobs freed, ${(freedSpace / 1024 / 1024).toFixed(2)}MB recovered`);
    
    return { cleaned, freedSpace };
  }

  /**
   * 📊 GET STORAGE STATS
   * Get current storage usage and statistics
   */
  async getStorageStats(): Promise<{
    totalBlobs: number;
    totalSize: number;
    pendingUploads: number;
    failedUploads: number;
    uploadedBlobs: number;
    averageSize: number;
  }> {
    try {
      const allBlobs = await db.mediaStore.toArray();
      const totalSize = allBlobs.reduce((sum: number, blob: any) => sum + (blob.compressedSize || 0), 0);
      const pendingUploads = allBlobs.filter((blob: any) => blob.localStatus === 'pending_upload').length;
      const failedUploads = allBlobs.filter((blob: any) => blob.localStatus === 'failed').length;
      const uploadedBlobs = allBlobs.filter((blob: any) => blob.localStatus === 'uploaded').length;
      const averageSize = allBlobs.length > 0 ? totalSize / allBlobs.length : 0;

      return {
        totalBlobs: allBlobs.length,
        totalSize,
        pendingUploads,
        failedUploads,
        uploadedBlobs,
        averageSize
      };
    } catch (error) {
      console.error('❌ [GARBAGE COLLECTOR] Error getting storage stats:', error);
      return {
        totalBlobs: 0,
        totalSize: 0,
        pendingUploads: 0,
        failedUploads: 0,
        uploadedBlobs: 0,
        averageSize: 0
      };
    }
  }

  /**
   * 🚀 RUN FULL CLEANUP
   * Execute both cleanup routines and return comprehensive results
   */
  async runFullCleanup(): Promise<{
    totalCleaned: number;
    totalFreedSpace: number;
    orphanedResult: { cleaned: number; freedSpace: number };
    failedResult: { cleaned: number; freedSpace: number };
    storageStats: any;
  }> {
    console.log('🧹 [GARBAGE COLLECTOR] Starting full cleanup...');
    
    const startTime = Date.now();
    
    // Get initial stats
    const initialStats = await this.getStorageStats();
    
    // Run cleanup routines
    const orphanedResult = await this.cleanupOrphanedBlobs();
    const failedResult = await this.cleanupFailedUploads();
    
    // Get final stats
    const finalStats = await this.getStorageStats();
    
    const totalCleaned = orphanedResult.cleaned + failedResult.cleaned;
    const totalFreedSpace = orphanedResult.freedSpace + failedResult.freedSpace;
    const duration = Date.now() - startTime;
    
    console.log(`✅ [GARBAGE COLLECTOR] Full cleanup complete in ${duration}ms:`);
    console.log(`   📊 Total cleaned: ${totalCleaned} blobs`);
    console.log(`   💾 Space freed: ${(totalFreedSpace / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   📈 Storage before: ${initialStats.totalBlobs} blobs, ${(initialStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   📉 Storage after: ${finalStats.totalBlobs} blobs, ${(finalStats.totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    return { 
      totalCleaned, 
      totalFreedSpace, 
      orphanedResult, 
      failedResult, 
      storageStats: finalStats 
    };
  }

  /**
   * 🔍 HEALTH CHECK
   * Check for potential storage issues
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const stats = await this.getStorageStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for excessive failed uploads
    if (stats.failedUploads > 10) {
      issues.push(`High number of failed uploads: ${stats.failedUploads}`);
      recommendations.push('Consider running cleanup to remove failed uploads');
    }

    // Check for large storage usage
    const sizeInMB = stats.totalSize / 1024 / 1024;
    if (sizeInMB > 100) {
      issues.push(`High storage usage: ${sizeInMB.toFixed(2)}MB`);
      recommendations.push('Consider running cleanup to free up space');
    }

    // Check for many pending uploads
    if (stats.pendingUploads > 20) {
      issues.push(`Many pending uploads: ${stats.pendingUploads}`);
      recommendations.push('Check network connection and upload queue');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// 🚀 EXPORT SINGLETON INSTANCE
export const mediaGarbageCollector = new MediaStoreGarbageCollector();
