"use client";

import { db } from '@/lib/offlineDB';
import { identityManager } from '../../core/IdentityManager';
import { snipedInSession } from '../sessionGuard';

// 📚 BOOK STATE INTERFACE
export interface BookState {
  books: any[];
  filteredBooks: any[];
  searchQuery: string;
  sortOption: string;
  isRefreshing: boolean;
  activeBook: any;
  bookId: string;
}

// 📚 BOOK ACTIONS INTERFACE
export interface BookActions {
  refreshBooks: () => Promise<boolean>;
  saveBook: (bookData: any, editTarget?: any) => Promise<{ success: boolean; book?: any; error?: Error }>;
  deleteBook: (book: any) => Promise<{ success: boolean; error?: Error }>;
  restoreBook: (book: any) => Promise<{ success: boolean; error?: Error }>;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: string) => void;
  applyFiltersAndSort: () => void;
  lazyLoadImage: (bookId: string) => Promise<void>;
  lazyLoadVisibleImages: (bookIds: string[]) => Promise<void>;
  setActiveBook: (book: any) => void;
  clearActiveBook: () => void;
  getBookBalance: (id: string) => number;
}

// 📚 COMBINED BOOK STORE TYPE
export type BookStore = BookState & BookActions;

// 🛡️ BOOK SLICE CREATOR FUNCTION
export const createBookSlice = (set: any, get: any): BookState & BookActions => ({
  // 📊 INITIAL STATE
  books: [],
  filteredBooks: [],
  searchQuery: '',
  sortOption: 'Activity',
  isRefreshing: false,
  activeBook: null,
  bookId: '',

  // 📚 REFRESH BOOKS WITH SNIPER LOGIC
  refreshBooks: async () => {
    const userId = identityManager.getUserId();
    if (!userId) return true;
    
    try {
      const books = await db.books
        .where('userId')
        .equals(String(userId))
        .and((book: any) => book.isDeleted === 0)
        .reverse()
        .sortBy('updatedAt');

      // Only set state if data actually changed significantly
      const currentBooks = get().books;
      if (JSON.stringify(currentBooks) === JSON.stringify(books)) {
        console.log('📚 [BOOK SLICE] Data unchanged, skipping update');
        return true; // Stop if data is identical
      }

      set({ books });
      get().applyFiltersAndSort();
      
      // 🧬 MASTER IMAGE CONTROLLER: Auto-trigger sniper for missing images
      const booksNeedingImages = books.filter((book: any) => 
        !book.image || (typeof book.image === 'string' && book.image.startsWith('cid_'))
      );

      if (booksNeedingImages.length > 0) {
        console.log(`🧬 [MASTER CONTROLLER] Auto-triggering sniper for ${booksNeedingImages.length} books`);
        
        // 🔥 SESSION GUARD: Only trigger sniper once per book per session
        const orchestrator = (window as any).orchestrator;
        if (orchestrator && typeof orchestrator.hydrateSingleItem === 'function') {
          booksNeedingImages.forEach((book: any) => {
            if (!snipedInSession.has(book.cid)) {
              snipedInSession.add(book.cid);
              orchestrator.hydrateSingleItem('BOOK', book.cid).catch((err: any) => {
                console.error(`❌ [SNIPER] Failed for ${book.cid}:`, err);
              });
            }
          });
        }
      }
      
      console.log('📚 [BOOK SLICE] Books refreshed:', books.length);
      return true;
    } catch (error) {
      console.error('❌ [BOOK SLICE] Books refresh failed:', error);
      return false;
    } finally {
      set({ isRefreshing: false });
    }
  },

  // 📚 SAVE BOOK
  saveBook: async (bookData: any, editTarget?: any) => {
    const userId = identityManager.getUserId();
    if (!userId) return { success: false };
    
    try {
      const bookPayload = {
        ...bookData,
        _id: editTarget?._id || bookData?._id,
        cid: editTarget?.cid || bookData?.cid || (await import('@/lib/offlineDB')).generateCID(),
        userId: String(userId),
        vKey: (editTarget?.vKey || 0) + 1,
        synced: 0,
        updatedAt: Date.now()
      };

      if (!editTarget?.createdAt) bookPayload.createdAt = Date.now();

      const { normalizeRecord } = await import('../../core/VaultUtils');
      const normalized = normalizeRecord(bookPayload, String(userId));
      if (!normalized) {
        throw new Error('Failed to normalize book data');
      }

      const { db } = await import('@/lib/offlineDB');
      let id: number;
      if (editTarget?.cid) {
        const existingRecord = await db.books.where('cid').equals(editTarget.cid).first();
        if (existingRecord) {
          normalized.localId = existingRecord.localId;
          id = await db.books.put(normalized);
        } else {
          delete normalized.localId;
          id = await db.books.put(normalized);
        }
      } else {
        delete normalized.localId;
        id = await db.books.put(normalized);
      }

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshBooks();
      
      return { success: true, book: { ...normalized, localId: id } };
    } catch (error) {
      console.error('❌ [BOOK SLICE] saveBook failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🗑️ DELETE BOOK
  deleteBook: async (book: any) => {
    const userId = identityManager.getUserId();
    if (!userId || !book?.localId) return { success: false };

    try {
      await db.books.update(Number(book.localId), { 
        isDeleted: 1, 
        synced: 0, 
        vKey: Date.now(),
        updatedAt: Date.now()
      });
      
      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();
      
      get().refreshBooks();
      
      return { success: true };
    } catch (error) {
      console.error('❌ [BOOK SLICE] deleteBook failed:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔄 RESTORE BOOK
  restoreBook: async (book: any) => {
    try {
      console.log('🔄 [BOOK SLICE] Restoring book:', book.localId);
      
      await db.books.update(Number(book.localId), {
        isDeleted: 0,
        synced: 0,
        updatedAt: Date.now(),
        vKey: Date.now()
      });

      const { orchestrator } = await import('../../core/SyncOrchestrator');
      orchestrator.triggerSync();

      get().refreshBooks();
      
      console.log('✅ [BOOK SLICE] Book restored successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [BOOK SLICE] Failed to restore book:', error);
      return { success: false, error: error as Error };
    }
  },

  // 🔍 SEARCH & SORT ACTIONS
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().applyFiltersAndSort();
  },

  setSortOption: (option: string) => {
    set({ sortOption: option });
    get().applyFiltersAndSort();
  },

  applyFiltersAndSort: () => {
    const state = get();
    const { books, searchQuery, sortOption } = state;
    
    let filtered = [...books];

    const q = (searchQuery || "").toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((book: any) => 
        (book.name || "").toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'Activity':
        filtered.sort((a: any, b: any) => {
          if ((a.isPinned || 0) !== (b.isPinned || 0)) {
            return (b.isPinned || 0) - (a.isPinned || 0);
          }
          return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        break;
      case 'Name':
        filtered.sort((a: any, b: any) => 
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case 'Balance High':
        filtered.sort((a: any, b: any) => get().getBookBalance(b._id || b.localId) - get().getBookBalance(a._id || a.localId));
        break;
      case 'Balance Low':
        filtered.sort((a: any, b: any) => get().getBookBalance(a._id || a.localId) - get().getBookBalance(b._id || b.localId));
        break;
    }

    set({ filteredBooks: filtered });
  },

  // 🎯 IMAGE MANAGEMENT
  lazyLoadImage: async (bookId: string) => {
    try {
      console.log(`🎯 [BOOK SLICE] Triggering fetch for: ${bookId}`);
      const state = get();
      const book = state.books.find((b: any) => 
        String(b._id || b.localId) === String(bookId)
      );

      if (!book) {
        console.warn('🚨 [BOOK SLICE] Book not found:', bookId);
        return;
      }

      const needsLoading = !book.image || 
        (typeof book.image === 'string' && book.image.startsWith('cid_'));

      if (!needsLoading) {
        console.log('✅ [BOOK SLICE] Image already loaded:', bookId);
        return;
      }

      // 🛡️ GUARD: Check if image is already the same to prevent refresh loop
      const existingBook = get().books.find((b: any) => b.cid === bookId);
      if (existingBook && existingBook.image === book.image) {
        console.log('🛡️ [BOOK SLICE] Image unchanged, skipping refresh:', bookId);
        return;
      }

      console.log('🎯 [BOOK SLICE] Loading image for book:', bookId);

      if (typeof window !== 'undefined' && window.orchestrator) {
        const { orchestrator } = await import('../../core/SyncOrchestrator');
        await orchestrator.hydrateSingleItem('BOOK', bookId);
        
        await get().refreshBooks();
        
        console.log('✅ [BOOK SLICE] Image loaded successfully:', bookId);
      } else {
        console.warn('🚨 [BOOK SLICE] Orchestrator not available');
      }

    } catch (error) {
      console.error('❌ [BOOK SLICE] Failed to load image:', bookId, error);
    }
  },

  lazyLoadVisibleImages: async (bookIds: string[]) => {
    console.log('🎯 [BOOK SLICE] Batch loading images for visible books:', bookIds.length);
    
    const batchSize = 3;
    for (let i = 0; i < bookIds.length; i += batchSize) {
      const batch = bookIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(bookId => get().lazyLoadImage(bookId))
      );
    }
    
    console.log('✅ [BOOK SLICE] Batch loading complete');
  },

  // 🎯 ACTIVE BOOK MANAGEMENT
  setActiveBook: (book: any) => {
    const bookId = String(book?._id || book?.localId || '');
    
    console.log('🎯 [BOOK SLICE] Active book set:', { 
      bookId, 
      bookName: book?.name
    });

    set({
      activeBook: book,
      bookId
    });
  },

  clearActiveBook: () => {
    set({
      activeBook: null,
      bookId: ''
    });
  },

  // 💰 BALANCE CALCULATION
  getBookBalance: (id: string) => {
    const state = get();
    const entries = state.allEntries?.filter((entry: any) => 
      String(entry.bookId || '') === String(id) && !entry.isDeleted
    ) || [];
    
    const income = entries
      .filter((e: any) => e.type === 'income')
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expense = entries
      .filter((e: any) => e.type === 'expense')
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    
    return income - expense;
  }
});
