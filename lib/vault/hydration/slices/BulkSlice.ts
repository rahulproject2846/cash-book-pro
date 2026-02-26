"use client";

import { db } from '@/lib/offlineDB';
import { normalizeRecord } from '../../core/VaultUtils';
import { validateBook, validateEntry } from '../../core/schemas';
import { Base64Migration } from '../middleware/Base64Migration';
import type { HydrationResult } from '../engine/types';
import { getVaultStore } from '../../store/storeHelper';

/**
 * 📚 BULK SLICE - Books and Entries Bulk Hydration
 * 
 * Handles bulk data fetching and processing
 * Returns processed records to Controller instead of direct DB writes
 */
export class BulkSlice {
  private userId: string = '';
  private readonly BOOKS_BATCH_SIZE = 10;
  private readonly ENTRIES_BATCH_SIZE = 20;
  private base64Migration: Base64Migration;

  constructor(userId: string) {
    this.userId = userId;
    this.base64Migration = new Base64Migration(userId);
  }

  /**
   * 📚 HYDRATE BOOKS
   * Fetches and processes books, returns array of processed records
   */
  async hydrateBooks(): Promise<{ success: boolean; records?: any[]; error?: string }> {
    try {
      console.log('📚 [BULK SLICE] Fetching books from server...');
      
      const response = await fetch(`/api/books?userId=${encodeURIComponent(this.userId)}&limit=1000`);
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      
      const result = await response.json();
      const books = result.data || result.books || [];
      
      // 🔄 BATCH PROCESSING
      const allProcessedRecords: any[] = [];
      let processedCount = 0;
      
      for (let i = 0; i < books.length; i += this.BOOKS_BATCH_SIZE) {
        const batch = books.slice(i, i + this.BOOKS_BATCH_SIZE);
        const batchRecords: any[] = [];
        
        for (const book of batch) {
          try {
            // 🔍 CHECK-BEFORE-PUT: Check if local record exists to preserve data
            const existing = await db.books.where('cid').equals(book.cid).first();
            
            // 🔄 IMAGE PROCESSING: Handle Base64 migration via middleware
            const imageToPreserve = await this.base64Migration.processImage(
              book.image, 
              existing?.image, 
              existing?.localId || book.localId || 'temp'
            );
            
            // 3. Normalize with processed image (now CID or null)
            const normalized = normalizeRecord({
              ...book,
              image: imageToPreserve, // ✅ NOW STORES CID, NOT BASE64
              userId: String(this.userId),
              synced: 1,
              isDeleted: book.isDeleted || 0
            }, this.userId);
            
            // 🛡️ SCHEMA GUARD: Validate normalized data before storing
            const validationResult = validateBook(normalized);
            if (!validationResult.success) {
              console.error(`❌ [BULK SLICE] Skipping corrupted book data after normalization: ${validationResult.error}`);
              continue; // Skip this record but continue with batch
            }
            
            // Preserve localId if it exists to ensure bulkPut updates the correct record
            if (existing?.localId) {
              normalized.localId = existing.localId;
            }

            batchRecords.push(normalized);
            processedCount++;
          } catch (error) {
            console.error(`❌ [BULK SLICE] Failed to process book ${book.cid}:`, error);
          }
        }

        allProcessedRecords.push(...batchRecords);
        
        // Small delay to prevent overwhelming
        if (i + this.BOOKS_BATCH_SIZE < books.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`📚 [BULK SLICE] Books processing complete: ${processedCount}/${books.length}`);
      return { 
        success: true, 
        records: allProcessedRecords,
        error: undefined 
      };
      
    } catch (error) {
      console.error('❌ [BULK SLICE] Books hydration failed:', error);
      return { 
        success: false, 
        error: String(error)
      };
    }
  }

  /**
   * 📝 HYDRATE ENTRIES
   * Fetches and processes entries, returns array of processed records
   */
  async hydrateEntries(): Promise<{ success: boolean; records?: any[]; error?: string }> {
    try {
      console.log('📝 [BULK SLICE] Fetching entries from server...');
      
      // 🚀 FORCE FULL HYDRATION: Use /api/entries/all with since=0 for complete data
      const response = await fetch(`/api/entries/all?userId=${encodeURIComponent(this.userId)}&limit=5000&since=0`);
      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.statusText}`);
      }
      
      const result = await response.json();
      const entries = result.data || result.entries || [];
      
      // BATCH PROCESSING
      const allProcessedRecords: any[] = [];
      let processedCount = 0;
      
      for (let i = 0; i < entries.length; i += this.ENTRIES_BATCH_SIZE) {
        const batch = entries.slice(i, i + this.ENTRIES_BATCH_SIZE);
        const batchRecords: any[] = [];
        
        for (const entry of batch) {
          try {
            //  CHECK-BEFORE-PUT: Check if local record exists to preserve data
            const existing = await db.entries.where('cid').equals(entry.cid).first();
            
            // Normalize and store
            const normalized = normalizeRecord({
              ...entry,
              userId: String(this.userId),
              synced: 1, // Server data is synced
              isDeleted: entry.isDeleted || 0
            }, this.userId);
            
            // 🛡️ SCHEMA GUARD: Validate normalized data before storing
            const validationResult = validateEntry(normalized);
            if (!validationResult.success) {
              console.error(`❌ [BULK SLICE] Skipping corrupted entry data after normalization: ${validationResult.error}`);
              continue; // Skip this record but continue with batch
            }
            
            // Preserve localId if it exists to ensure bulkPut updates correct record
            if (existing?.localId) {
              normalized.localId = existing.localId;
            }

            batchRecords.push(normalized);
            processedCount++;
          } catch (error) {
            console.error(`❌ [BULK SLICE] Failed to process entry ${entry.cid}:`, error);
          }
        }

        allProcessedRecords.push(...batchRecords);
        
        // Small delay to prevent overwhelming
        if (i + this.ENTRIES_BATCH_SIZE < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`📝 [BULK SLICE] Entries processing complete: ${processedCount}/${entries.length}`);
      return { 
        success: true, 
        records: allProcessedRecords,
        error: undefined 
      };
      
    } catch (error) {
      console.error('❌ [BULK SLICE] Entries hydration failed:', error);
      return { 
        success: false, 
        error: String(error)
      };
    }
  }
}
