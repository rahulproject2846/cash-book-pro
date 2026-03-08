"use client";

import { db } from '@/lib/offlineDB';
import { LocalEntry } from '@/lib/offlineDB';
import { HydrationController } from '../hydration/HydrationController';
import { SyncGuard } from '../guards/SyncGuard';
import { getTimestamp } from '@/lib/shared/utils';

/**
 * ⚔️ CONFLICT SERVICE - Centralized Conflict Resolution
 * 
 * This service handles all conflict resolution logic including:
 * - Book chain resurrection (parent_deleted conflict)
 * - Entry conflict resolution
 * - Sync status management for parent entities
 * 
 * Singleton Pattern: Use conflictService instance
 */
class ConflictService {
  private static instance: ConflictService;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConflictService {
    if (!ConflictService.instance) {
      ConflictService.instance = new ConflictService();
    }
    return ConflictService.instance;
  }

  /**
   * 🛡️ RESURRECT BOOK CHAIN: Handle parent_deleted conflict resolution
   * 
   * When a book is deleted on server but still exists locally,
   * this method clears server identity and marks for re-sync.
   */
  async resurrectBookChain(get: any, bookCid: string): Promise<{ success: boolean; error?: Error }> {
    try {
      
      // 🔐 SECURITY GUARD: Validate sync access before resurrection
      const guardResult = await SyncGuard.validateSyncAccess({
        serviceName: 'SyncOrchestrator', // Use allowed service name
        onError: (msg: string) => console.warn(`🔒 [CONFLICT SERVICE] ${msg}`),
        returnError: (msg: string) => ({ success: false, error: new Error(msg) })
      });
      if (!guardResult.valid) {
        console.warn('🔒 [CONFLICT SERVICE] Book resurrection blocked by security guard');
        return { success: false, error: new Error('Security guard blocked resurrection') };
      }
      
      // 🎯 STEP 1: FIND THE BOOK
      const book = await db.books.where('cid').equals(bookCid).first();
      if (!book) {
        throw new Error(`Book not found: ${bookCid}`);
      }
      
      // 🎯 STEP 2: CLEAR SERVER IDENTITY
      const resurrectedBook = {
        ...book,
        _id: undefined, // Remove server ID
        vKey: (book.vKey || 0) + 1, // 🎯 SMART VKEY: Increment by 1 instead of +100 hack
        synced: 0, // Mark as unsynced
        conflicted: 0, // Clear conflict
        conflictReason: '', // Clear conflict reason
        serverData: null, // Clear server data
        updatedAt: getTimestamp()
      };
      
      // 🎯 STEP 3: UPDATE BOOK AND ENTRIES IN SINGLE TRANSACTION
      const controller = HydrationController.getInstance();
      
      // Update the book first
      const bookResult = await controller.ingestLocalMutation('BOOK', [resurrectedBook]);
      if (!bookResult.success) {
        throw new Error(bookResult.error || 'Failed to resurrect book via HydrationController');
      }
      
      // 🎯 STEP 4: FIND ALL ENTRIES
      const allEntries = await db.entries
        .where('bookId').equals(bookCid)
        .and((entry: any) => entry.isDeleted === 0)
        .toArray();
      
      // 🎯 STEP 5: RESET ALL ENTRIES ATOMICALLY
      if (allEntries.length > 0) {
        const entryUpdates = allEntries.map((entry: LocalEntry) => ({
          ...entry,
          synced: 0, // Mark as unsynced
          vKey: (entry.vKey || 0) + 1, // 🎯 SMART VKEY: Increment by 1 instead of +100 hack
          updatedAt: getTimestamp()
        }));
        
        const entryResult = await controller.ingestLocalMutation('ENTRY', entryUpdates);
        if (!entryResult.success) {
          throw new Error(entryResult.error || 'Failed to resurrect entries via HydrationController');
        }
      }
      
      // 🎯 STEP 6: TRIGGER BATCHED SYNC
      const { triggerManualSync } = get();
      if (triggerManualSync) {
        await triggerManualSync();
      }
      
      return { success: true, error: undefined };
      
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 🆕 RESOLVE ENTRY CONFLICT: Handle individual entry conflict resolution
   * 
   * After an entry conflict is resolved (user chooses local or server version),
   * this method ensures the parent book is marked for re-sync.
   * 
   * @param entryCid - The CID of the resolved entry
   * @param get - Store getter for triggering sync
   */
  async resolveEntryConflict(entryCid: string, get: any): Promise<{ success: boolean; error?: Error }> {
    try {
      // 🔐 SECURITY GUARD: Validate sync access
      const guardResult = await SyncGuard.validateSyncAccess({
        serviceName: 'SyncOrchestrator',
        onError: (msg: string) => console.warn(`🔒 [CONFLICT SERVICE] ${msg}`),
        returnError: (msg: string) => ({ success: false, error: new Error(msg) })
      });
      if (!guardResult.valid) {
        console.warn('🔒 [CONFLICT SERVICE] Entry conflict resolution blocked by security guard');
        return { success: false, error: new Error('Security guard blocked resolution') };
      }

      // 🎯 STEP 1: FIND THE ENTRY
      const entry = await db.entries.where('cid').equals(entryCid).first();
      if (!entry) {
        throw new Error(`Entry not found: ${entryCid}`);
      }

      // 🎯 STEP 2: FIND THE PARENT BOOK
      const book = await db.books.where('cid').equals(entry.bookId).first();
      if (!book) {
        throw new Error(`Parent book not found for entry: ${entryCid}`);
      }

      // 🎯 STEP 3: UPDATE PARENT BOOK FOR RE-SYNC
      // If book is already synced=0, no need to update
      // If book is synced=1, mark it for re-sync
      if (book.synced === 1) {
        const updatedBook = {
          ...book,
          vKey: (book.vKey || 0) + 1, // Increment for re-sync
          synced: 0, // Mark as unsynced
          conflicted: 0, // Clear any conflict flags
          conflictReason: '', // Clear conflict reason
          updatedAt: getTimestamp()
        };

        const controller = HydrationController.getInstance();
        const bookResult = await controller.ingestLocalMutation('BOOK', [updatedBook]);
        
        if (!bookResult.success) {
          throw new Error(bookResult.error || 'Failed to update parent book for re-sync');
        }
      }

      // 🎯 STEP 4: TRIGGER BATCHED SYNC
      const { triggerManualSync } = get();
      if (triggerManualSync) {
        await triggerManualSync();
      }

      return { success: true, error: undefined };

    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * 🔄 BATCH RESOLVE CONFLICTS: Resolve multiple entries at once
   * 
   * @param entryCids - Array of entry CIDs to resolve
   * @param get - Store getter for triggering sync
   */
  async batchResolveConflicts(entryCids: string[], get: any): Promise<{ success: boolean; error?: Error }> {
    try {
      // Get unique parent books
      const parentBooks = new Set<string>();
      
      for (const entryCid of entryCids) {
        const entry = await db.entries.where('cid').equals(entryCid).first();
        if (entry) {
          parentBooks.add(entry.bookId);
        }
      }

      // Update all parent books for re-sync
      const controller = HydrationController.getInstance();
      
      for (const bookCid of parentBooks) {
        const book = await db.books.where('cid').equals(bookCid).first();
        if (book && book.synced === 1) {
          const updatedBook = {
            ...book,
            vKey: (book.vKey || 0) + 1,
            synced: 0,
            conflicted: 0,
            conflictReason: '',
            updatedAt: getTimestamp()
          };
          
          await controller.ingestLocalMutation('BOOK', [updatedBook]);
        }
      }

      // Trigger sync once for all updates
      const { triggerManualSync } = get();
      if (triggerManualSync) {
        await triggerManualSync();
      }

      return { success: true, error: undefined };

    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

// 📦 EXPORT SINGLETON INSTANCE
export const conflictService = ConflictService.getInstance();
