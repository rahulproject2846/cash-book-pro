// src/lib/vault/core/MigrationManager.ts
import { db } from '@/lib/offlineDB';
import { identityManager } from './IdentityManager';

/**
 * 🏗️ DATABASE MIGRATION SYSTEM (V3.0 - Solid)
 * ---------------------------------
 * ডাটাবেস স্কিমা আপডেট এবং ডাটা মেরামতের জন্য একটি স্ট্রাকচারড সিস্টেম।
 * এটি "Broken Data" বা "Legacy Data" অটোমেটিক ফিক্স করে।
 */

// --- ১. ভার্সন কন্ট্রোল ---
export const CURRENT_DB_VERSION = 14; // 🚨 EMERGENCY HEAL: Force field repair

/**
 * 🏗️ MIGRATION MANAGER CLASS
 */
export class MigrationManager {
  private readonly VERSION_KEY = 'vault_db_version';

  /**
   * 🚨 MIGRATION V3: CONFLICT FIELDS INITIALIZATION
   * Initialize conflict tracking fields for both books and entries
   */
  private async migrationV3_AddConflictFields(): Promise<void> {
    console.log('🚨 [MIGRATION V3] Initializing conflict fields...');
    
    try {
      // Get all books and entries
      const allBooks = await db.books.toArray();
      const allEntries = await db.entries.toArray();
      
      let bookUpdateCount = 0;
      let entryUpdateCount = 0;
      
      // Initialize conflict fields for books - SAFE APPROACH
      for (const book of allBooks) {
        try {
          // Check if fields already exist
          const needsUpdate = 
            book.conflicted === undefined || 
            book.conflictReason === undefined || 
            book.serverData === undefined;
          
          if (needsUpdate) {
            // Preserve critical fields - only update conflict fields
            const updatedBook = {
              conflicted: 0,        // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
              conflictReason: '',   // 🚨 CONFLICT REASON: Empty string initially
              serverData: null      // 🚨 SERVER DATA: No server data initially
            };
            
            // Use individual update to avoid ConstraintError
            await db.books.update(book.localId!, updatedBook);
            bookUpdateCount++;
          }
        } catch (recordError) {
          console.error(`❌ [MIGRATION V3] Failed to update book CID: ${book.cid}`, recordError);
          // Continue with other records - don't let one failure stop entire migration
        }
      }
      
      // Initialize conflict fields for entries - SAFE APPROACH
      for (const entry of allEntries) {
        try {
          // Check if fields already exist
          const needsUpdate = 
            entry.conflicted === undefined || 
            entry.conflictReason === undefined || 
            entry.serverData === undefined;
          
          if (needsUpdate) {
            // Preserve critical fields - only update conflict fields
            const updatedEntry = {
              conflicted: 0,        // 🚨 CONFLICT TRACKING: 0 = no conflict, 1 = conflict detected
              conflictReason: '',   // 🚨 CONFLICT REASON: Empty string initially
              serverData: null      // 🚨 SERVER DATA: No server data initially
            };
            
            // Use individual update to avoid ConstraintError
            await db.entries.update(entry.localId!, updatedEntry);
            entryUpdateCount++;
          }
        } catch (recordError) {
          console.error(`❌ [MIGRATION V3] Failed to update entry CID: ${entry.cid}`, recordError);
          // Continue with other records - don't let one failure stop entire migration
        }
      }
      
      console.log(`✅ [MIGRATION V3] Updated ${bookUpdateCount} books with conflict fields`);
      console.log(`✅ [MIGRATION V3] Updated ${entryUpdateCount} entries with conflict fields`);
      console.log('✅ [MIGRATION V3] Conflict fields initialization completed');
      
    } catch (error) {
      console.error('❌ [MIGRATION V3] Failed to initialize conflict fields:', error);
      throw error;
    }
  }

  /**
   * 🏗️ MIGRATION V4: STRUCTURAL HEALING - Force heal isDeleted field
   * Heal all legacy records missing isDeleted, synced, and conflicted fields
   */
  private async migrationV4_ForceHealFields(): Promise<void> {
    console.log('🏗️ [MIGRATION V4] Force healing missing fields...');
    
    try {
      // Get ALL records using toCollection() - NO WHERE CLAUSE
      const allBooks = await db.books.toCollection().toArray();
      const allEntries = await db.entries.toCollection().toArray();
      
      let bookHealCount = 0;
      let entryHealCount = 0;
      
      // Get current user ID from IdentityManager with graceful null handling
      const currentUserId = identityManager.getUserId();
      
      console.log(`🏗️ [MIGRATION V4] Using currentUserId: ${currentUserId}`);
      
      // Heal books - FORCE HEAL ALL MISSING FIELDS
      for (const book of allBooks) {
        try {
          const needsHealing = 
            book.isDeleted === undefined || 
            book.isDeleted === null ||
            book.synced === undefined || 
            book.synced === null ||
            book.conflicted === undefined || 
            book.conflicted === null ||
            !book.userId || 
            book.userId === 'admin' ||
            book.userId === 'undefined' ||
            !book.localId;
          
          if (needsHealing) {
            const healingData = {
              isDeleted: Number(book.isDeleted || 0),  // Force to 0 if undefined/null
              synced: book.synced !== undefined ? book.synced : 1,  // Legacy books are synced
              conflicted: book.conflicted !== undefined ? book.conflicted : 0,  // No conflicts
              userId: book.userId && book.userId !== 'admin' && book.userId !== 'undefined' 
                ? book.userId 
                : currentUserId  // CRITICAL: Fix missing/invalid userId
            };
            
            // CRITICAL: Use _id as fallback for localId if missing
            const recordId = book.localId || book._id;
            if (!recordId) {
              console.warn(`⚠️ [MIGRATION V4] Book missing both localId and _id:`, book);
              continue; // Skip if no ID available
            }
            
            await db.books.update(recordId, healingData);
            bookHealCount++;
            console.log(`🔧 [MIGRATION V4] Healed book CID: ${book.cid}`, healingData);
          }
        } catch (recordError) {
          console.error(`❌ [MIGRATION V4] Failed to heal book CID: ${book.cid}`, recordError);
        }
      }
      
      // Heal entries - FORCE HEAL ALL MISSING FIELDS
      for (const entry of allEntries) {
        try {
          const needsHealing = 
            entry.isDeleted === undefined || 
            entry.isDeleted === null ||
            entry.synced === undefined || 
            entry.synced === null ||
            entry.conflicted === undefined || 
            entry.conflicted === null;
          
          if (needsHealing) {
            const healingData = {
              isDeleted: Number(entry.isDeleted || 0),  // Force to 0 if undefined/null
              synced: entry.synced !== undefined ? entry.synced : 1,  // Legacy entries are synced
              conflicted: entry.conflicted !== undefined ? entry.conflicted : 0  // No conflicts
            };
            
            await db.entries.update(entry.localId!, healingData);
            entryHealCount++;
            console.log(`🔧 [MIGRATION V4] Healed entry CID: ${entry.cid}`, healingData);
          }
        } catch (recordError) {
          console.error(`❌ [MIGRATION V4] Failed to heal entry CID: ${entry.cid}`, recordError);
        }
      }
      
      console.log(`✅ [MIGRATION V4] Healed ${bookHealCount} books with missing fields`);
      console.log(`✅ [MIGRATION V4] Healed ${entryHealCount} entries with missing fields`);
      console.log('✅ [MIGRATION V4] Structural healing completed');
      
      // 🚨 TRIGGER UI REFRESH: Force UI to update after healing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vault-updated'));
        console.log('🚨 [MIGRATION V4] UI refresh triggered after healing');
      }
      
    } catch (error) {
      console.error('❌ [MIGRATION V4] Failed to heal fields:', error);
      throw error;
    }
  }

  /**
   * 🚨 MIGRATION V5: EMERGENCY HEAL - Force field repair
   * Emergency healing using modify() for immediate visibility
   */
  private async migrationV5_EmergencyHeal(): Promise<void> {
    console.log('🚨 [MIGRATION V5] Emergency healing all records...');
    
    try {
      // Get current user ID from IdentityManager with graceful null handling
      const currentUserId = identityManager.getUserId();
      
      console.log(`🚨 [MIGRATION V5] Using currentUserId: ${currentUserId}`);
      
      let bookHealCount = 0;
      let entryHealCount = 0;
      
      // Emergency heal books - use modify() for direct field updates
      await db.books.toCollection().modify((book: any) => {
        let needsUpdate = false;
        
        // Force heal isDeleted
        if (book.isDeleted === undefined || book.isDeleted === null) {
          book.isDeleted = 0;
          needsUpdate = true;
        }
        
        // Force heal synced
        if (book.synced === undefined || book.synced === null) {
          book.synced = 1;
          needsUpdate = true;
        }
        
        // Force heal conflicted
        if (book.conflicted === undefined || book.conflicted === null) {
          book.conflicted = 0;
          needsUpdate = true;
        }
        
        // Force heal userId
        if (book.userId === 'admin' || !book.userId) {
          book.userId = currentUserId || 'user-default';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          bookHealCount++;
          console.log(`🔧 [MIGRATION V5] Healed book CID: ${book.cid}`, {
            isDeleted: book.isDeleted,
            synced: book.synced,
            conflicted: book.conflicted,
            userId: book.userId
          });
        }
      });
      
      // Emergency heal entries - use modify() for direct field updates
      await db.entries.toCollection().modify((entry: any) => {
        let needsUpdate = false;
        
        // Force heal isDeleted
        if (entry.isDeleted === undefined || entry.isDeleted === null) {
          entry.isDeleted = 0;
          needsUpdate = true;
        }
        
        // Force heal synced
        if (entry.synced === undefined || entry.synced === null) {
          entry.synced = 1;
          needsUpdate = true;
        }
        
        // Force heal conflicted
        if (entry.conflicted === undefined || entry.conflicted === null) {
          entry.conflicted = 0;
          needsUpdate = true;
        }
        
        // Force heal userId
        if (entry.userId === 'admin' || !entry.userId) {
          entry.userId = currentUserId || 'user-default';
          needsUpdate = true;
        }
        
        // � STRICT INTEGRITY: REMOVED automatic orphaned entry assignment
        // Previous logic automatically assigned orphaned entries to first available book
        // This caused entries from deleted books to appear under new books
        // Now entries with missing bookId will be rejected by normalizeRecord
        console.log('🔒 [STRICT INTEGRITY] Orphaned entry recovery disabled - entries must have valid bookId');
        
        // 🔥 REMOVED: Orphaned entry recovery logic
        // if (!entry.bookId || entry.bookId === 'undefined' || entry.bookId === '') {
        //   const firstBook = db.books.where('userId').equals(currentUserId || 'user-default').first();
        //   if (firstBook) {
        //     entry.bookId = firstBook._id || firstBook.cid;
        //     needsUpdate = true;
        //     console.log('🔧 [ORPHAN RECOVERY] Assigned book to entry:', {
        //       entryCid: entry.cid,
        //       assignedBookId: entry.bookId,
        //       bookName: firstBook.name
        //     });
        //   } else {
        //     console.warn('⚠️ [ORPHAN RECOVERY] No books found for user, cannot assign bookId:', {
        //       entryCid: entry.cid,
        //       userId: currentUserId
        //     });
        //   }
        // }
        
        if (needsUpdate) {
          entryHealCount++;
          console.log(`🔧 [MIGRATION V5] Healed entry CID: ${entry.cid}`, {
            isDeleted: entry.isDeleted,
            synced: entry.synced,
            conflicted: entry.conflicted,
            userId: entry.userId
          });
        }
      });
      
      console.log(`✅ [MIGRATION V5] Emergency healed ${bookHealCount} books`);
      console.log(`✅ [MIGRATION V5] Emergency healed ${entryHealCount} entries`);
      console.log('✅ [MIGRATION V5] Emergency healing completed');
      
      // 🚨 TRIGGER UI REFRESH: Force UI to update after healing
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vault-updated'));
        console.log('🚨 [MIGRATION V5] UI refresh triggered after emergency healing');
      }
      
    } catch (error) {
      console.error('❌ [MIGRATION V5] Failed emergency healing:', error);
      throw error;
    }
  }

  /**
   * �� RUN ALL MIGRATIONS: ক্রমানুসারে পেন্ডিং মাইগ্রেশন রান করে
   * @param currentUserId - বর্তমান লগইন করা ইউজারের আইডি (মালিকানা ঠিক করার জন্য)
   */
  async runMigrations(currentUserId: string): Promise<void> {
    try {
      const currentVersion = this.getCurrentVersion();
      
      // 🔥 MIGRATION PERSISTENCE: Skip if already at current version
      if (currentVersion >= CURRENT_DB_VERSION) {
        console.log(`✅ [MIGRATION] Already at version ${CURRENT_DB_VERSION}, skipping migrations`);
        return;
      }
      
      console.group(`🏗️ [MIGRATION] Updating from v${currentVersion} to v${CURRENT_DB_VERSION}`);

      // ১. মাইগ্রেশন V1: মালিকানা ফিক্স (Ownership Fix)
      if (currentVersion < 1) {
        await this.migrationV1_FixUserIds(currentUserId);
      }

      // ২. মাইগ্রেশন V2: নতুন ফিল্ড অ্যাড করা (Missing Fields)
      if (currentVersion < 2) {
        await this.migrationV2_AddNewFields();
      }

      // ২. মাইগ্রেশন V3: CONFLICT FIELDS INITIALIZATION
      if (currentVersion < 3) {
        await this.migrationV3_AddConflictFields();
      }

      // ৩. মাইগ্রেশন V4: STRUCTURAL HEALING - Force heal isDeleted field
      if (currentVersion < 4) {
        await this.migrationV4_ForceHealFields();
      }

      // ৪. মাইগ্রেশন V5: EMERGENCY HEAL - Force field repair
      if (currentVersion < 5) {
        await this.migrationV5_EmergencyHeal();
      }

      // ভার্সন আপডেট করা
      this.setVersion(CURRENT_DB_VERSION);
      console.log(`✅ [MIGRATION] Database updated to version ${CURRENT_DB_VERSION}`);
      console.groupEnd();

    } catch (error) {
      console.error('❌ [MIGRATION] Failed:', error);
      // মাইগ্রেশন ফেইল করলে আমরা ভার্সন আপডেট করি না, যাতে পরের বার আবার চেষ্টা করে
    }
  }

  // --- 🛠️ INTERNAL MIGRATION SCRIPTS ---

  /**
   * 🔄 V1: Admin বা ভুল আইডির ডাটা বর্তমান ইউজারের নামে করে দেওয়া
   */
  private async migrationV1_FixUserIds(uid: string): Promise<void> {
    console.log('🔧 [MIGRATION V1] Fixing User IDs & Ownership...');
    
    // Books Fix: "admin" বা নাল আইডিগুলো ঠিক করা
    const booksModified = await db.books.toCollection().modify((book: any) => {
      if (!book.userId || book.userId === 'admin' || book.userId === 'undefined') {
        book.userId = uid;
        book.synced = 0; // সার্ভারে পাঠানোর জন্য ফ্ল্যাগ করা
      }
    });

    // Entries Fix: মালিকানা ঠিক করা
    const entriesModified = await db.entries.toCollection().modify((entry: any) => {
      if (!entry.userId || entry.userId === 'admin' || entry.userId === 'undefined') {
        entry.userId = uid;
        entry.synced = 0; // সার্ভারে পাঠানোর জন্য ফ্ল্যাগ করা
      }
    });

    if (booksModified > 0 || entriesModified > 0) {
      console.log(`✅ [V1 SUCCESS] Fixed ownership for ${booksModified} books and ${entriesModified} entries.`);
    }
  }

  /**
   * 🔄 V2: নতুন ফিল্ড (type, category, status) ডিফল্ট ভ্যালু দিয়ে পূরণ করা
   */
  private async migrationV2_AddNewFields(): Promise<void> {
    console.log('🔧 [MIGRATION V2] Filling missing fields...');

    // Books Fix: type, isPublic, phone যোগ করা
    await db.books.toCollection().modify((book: any)=> {
      if (!book.type) book.type = 'general';
      if (book.isPublic === undefined) book.isPublic = false; // boolean check
      if (!book.phone) book.phone = '';
    });

    // Entries Fix: category, paymentMethod, status যোগ করা
    await db.entries.toCollection().modify((entry: any) => {
      if (!entry.category) entry.category = 'general';
      if (!entry.paymentMethod) entry.paymentMethod = 'cash';
      if (!entry.status) entry.status = 'completed';
      
      // isDeleted যদি বুলিয়ান false থাকে, তবে 0 করে দেওয়া
      if (entry.isDeleted === undefined || entry.isDeleted === null) entry.isDeleted = 0;
      if (entry.isDeleted === false) entry.isDeleted = 0; // Boolean fix
      if (entry.isDeleted === true) entry.isDeleted = 1;  // Boolean fix
    });

    console.log('✅ [V2 SUCCESS] All records normalized with default fields.');
  }

  // --- 📊 HELPERS ---

  private getCurrentVersion(): number {
    const stored = localStorage.getItem(this.VERSION_KEY);
    return stored ? parseInt(stored, 10) : 0;
  }

  private setVersion(version: number): void {
    localStorage.setItem(this.VERSION_KEY, version.toString());
  }

  /**
   * 🔄 RESET (For Debugging): ভার্সন রিসেট করে আবার মাইগ্রেশন রান করানোর জন্য
   */
  public resetMigrations(): void {
    localStorage.removeItem(this.VERSION_KEY);
    console.log('🔄 [MIGRATION] Reset triggered. Reload to run migrations again.');
  }
}

export const migrationManager = new MigrationManager();