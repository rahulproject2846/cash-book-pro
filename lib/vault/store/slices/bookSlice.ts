"use client";



import { getTimestamp } from '@/lib/shared/utils';

import { identityManager } from '../../core/IdentityManager';

import { db } from '@/lib/offlineDB';

import Dexie from 'dexie';

import { financeService } from '../../services/FinanceService';

import { BookService } from '../../services/BookService';

import { LocalEntry } from '@/lib/offlineDB';

import { snipedInSession } from '../sessionGuard';

import { immer } from 'zustand/middleware/immer';

import { HydrationController } from '../../hydration/HydrationController';



// 📚 LIGHTWEIGHT MATRIX INTERFACE

interface BookMatrixItem {

  localId: string;

  userId: string;

  _id: string;

  cid: string;

  name: string;

  image: string;

  mediaCid: string;

  isPinned: number;

  updatedAt: number;

  cachedBalance?: number;

}



// 📚 BOOK STATE INTERFACE

export interface BookState {

  books: any[];

  filteredBooks: any[];

  allBookIds: BookMatrixItem[]; // 🆕 Lightweight matrix for performance

  filteredBookMatrix: BookMatrixItem[]; // 🆕 Filtered matrix for current search/sort

  totalBookCount: number; // 🆕 Total count for pagination UI

  searchQuery: string;

  sortOption: string;

  isRefreshing: boolean;

  activeBook: any;

  bookId: string;

  lastScrollPosition: number; // 🆕 SCROLL MEMORY

  pendingDeletion: { bookId: string; timeoutId: any; expiresAt: number } | null; // 🆕 9-SECOND DELAYED DELETE

  lastSearchId: number; // 🆕 Race condition guard

  isUserSearching: boolean; // 🆕 Search priority state for background sync protection

  isMobile: boolean; // 🆕 Device state for responsive UI

  prefetchedChunks: Map<number, any[]>; // 🆕 Prefetched page cache for zero-lag

  prefetchedEntriesCache: Map<string, any[]>; // 🆕 Prefetched entries cache for instant book details

  isInteractionLocked: boolean; // 🆕 Interaction lock state

}



// 📚 BOOK ACTIONS INTERFACE

export interface BookActions {

  refreshBooks: (source?: string) => Promise<boolean>;

  fetchPageChunk: (page: number, overrideMatrix?: BookMatrixItem[], source?: string, currentId?: number) => Promise<void>; // 🆕 Passive executor with optional currentId

  prefetchBookEntries: (bookId: string) => Promise<void>; // 🆕 Smart pre-fetching for zero-lag

  prefetchNextPage: (page: number) => Promise<void>; // 🆕 Prefetch next page for zero-lag

  saveBook: (bookData: any, editTarget?: any) => Promise<{ success: boolean; book?: any; error?: Error }>;

  deleteBook: (book: any, router: any) => Promise<{ success: boolean; error?: Error }>;

  restoreBook: (book: any) => Promise<{ success: boolean; error?: Error }>;

  setSearchQuery: (query: string) => void;

  setSortOption: (option: string) => void;

  applyFiltersAndSort: (overrideMatrix?: BookMatrixItem[]) => Promise<void>;

  setActiveBook: (book: any) => Promise<void>;

  clearActiveBook: () => void;

  getBookBalance: (id: string) => number;

  resurrectBookChain: (bookCid: string) => Promise<{ success: boolean; error?: Error }>;

  setLastScrollPosition: (pos: number) => void; // 🆕 SCROLL MEMORY

  transitionToDashboard: (router: any) => void; // 🆕 Zero-lag navigation

  cancelDeletion: () => void; // 🆕 CANCEL PENDING DELETION

  completeDeletionAndRedirect: (router: any) => void; // 🆕 COMPLETE DELETION AND REDIRECT

  executeFinalDeletion: (book: any, userId: string) => Promise<void>; // 🆕 EXECUTE FINAL DELETION

  syncMatrixItem: (bookId: string) => Promise<void>; // 🆕 MATRIX SYNC FOR ACTIVITY SORT

  setIsMobile: (mobile: boolean) => void; // 🆕 Device state setter

}



// 📚 COMBINED BOOK STORE TYPE

export type BookStore = BookState & BookActions;



// 🛡️ BOOK SLICE CREATOR FUNCTION

export const createBookSlice = (set: any, get: any, api: any): BookState & BookActions => ({

  // 📊 INITIAL STATE

  books: [],

  filteredBooks: [],

  allBookIds: [], // 🆕 Lightweight matrix for performance

  filteredBookMatrix: [], // 🆕 Filtered matrix for current search/sort

  totalBookCount: 0, // 🆕 Total count for pagination UI

  searchQuery: '',

  sortOption: 'Activity', // 🛡️ ACTIVITY DEFAULT: Always sort by recent activity

  isRefreshing: false,

  activeBook: null,

  bookId: '',

  lastScrollPosition: 0,

  pendingDeletion: null, // 🆕 9-SECOND DELAYED DELETE

  lastSearchId: 0, // 🆕 Race condition guard

  isUserSearching: false, // 🆕 Search priority state for background sync protection

  isMobile: false, // 🆕 Device state for responsive UI

  prefetchedChunks: new Map(), // 🆕 Prefetched page cache for zero-lag

  prefetchedEntriesCache: new Map(), // 🆕 Prefetched entries cache for instant book details

  isInteractionLocked: false, // 🆕 Interaction lock state



  // 🔄 REFRESH BOOKS WITH LIGHTWEIGHT MATRIX

  refreshBooks: async (source?: string) => {

    const bookService = BookService.getInstance();

    return await bookService.refreshBooks(get, set, source);

  },



  // 🆕 CHUNK FETCHING FOR PERFORMANCE

  fetchPageChunk: async (page: number, overrideMatrix?: BookMatrixItem[], source?: string, currentId?: number) => {

    const bookService = BookService.getInstance();

    return await bookService.fetchPageChunk(get, set, page, overrideMatrix, source, currentId);

  },



  // 📚 SAVE BOOK

  saveBook: async (bookData: any, editTarget?: any) => {

    const bookService = BookService.getInstance();

    return await bookService.saveBook(get, set, bookData, editTarget);

  },



  // 🗑️ DELETE BOOK

  deleteBook: async (book: any, router: any) => {

    const bookService = BookService.getInstance();

    return await bookService.deleteBook(get, set, book, router);

  },



  // 🔄 RESTORE BOOK

  restoreBook: async (book: any) => {

    const bookService = BookService.getInstance();

    return await bookService.restoreBook(get, set, book);

  },



  // 🔍 SEARCH & SORT ACTIONS

  setSearchQuery: (query: string) => {

    console.log("STORE: searchQuery updated to:", query);

    set({ 

      searchQuery: query,

      isUserSearching: query.length > 0 // 🆕 Set search priority state

    });

    get().applyFiltersAndSort();

  },



  setSortOption: (option: string) => {

    set({ sortOption: option });

    get().applyFiltersAndSort();

  },



  applyFiltersAndSort: async (matrixOverride?: BookMatrixItem[]) => {

    const bookService = BookService.getInstance();

    return await bookService.applyFiltersAndSort(get, set, matrixOverride);

  },





  // 🎯 ACTIVE BOOK MANAGEMENT

  setActiveBook: async (book: any) => {

    const bookService = BookService.getInstance();

    return await bookService.setActiveBook(get, set, book);

  },



  clearActiveBook: () => {

    set({

      activeBook: null,

      bookId: ''

    });

  },



  // 💰 BALANCE CALCULATION

  getBookBalance: (id: string) => {

    return financeService.getBookBalance(get, id);

  },



  // 🛡️ RESURRECT BOOK CHAIN: Handle parent_deleted conflict resolution

  resurrectBookChain: async (bookCid: string) => {

    const bookService = BookService.getInstance();

    return await bookService.resurrectBookChain(get, bookCid);

  },



  // � SCROLL MEMORY

  setLastScrollPosition: (pos: number) => {

    const bookService = BookService.getInstance();

    bookService.setLastScrollPosition(set, pos);

  },



  // 🔄 MATRIX SYNC ACTION

  syncMatrixItem: async (bookId: string): Promise<void> => {

    const bookService = BookService.getInstance();

    return await bookService.syncMatrixItem(get, set, bookId);

  },



  // 🆕 SMART PRE-FETCHING FOR ZERO-LAG

  prefetchBookEntries: async (bookId: string) => {

    const bookService = BookService.getInstance();

    return await bookService.prefetchBookEntries(get, set, bookId);

  },



  // 🆕 PREFETCH NEXT PAGE FOR ZERO-LAG

  prefetchNextPage: async (page: number) => {

    const bookService = BookService.getInstance();

    return await bookService.prefetchNextPage(get, set, page);

  },



  // 🆕 ZERO-LAG NAVIGATION

  transitionToDashboard: (router: any) => {

    // a. Save current scroll position if available

    const scrollEl = document.querySelector('main[layoutId="main-container"]');

    if (scrollEl) {

      get().setLastScrollPosition(scrollEl.scrollTop);

    }

    

    // b. Trigger navigation

    if (router) {

      router.push('/?tab=books');

    }

    

    // c. Wait 300ms (allow transition animation)

    setTimeout(() => {

      // d. THEN set activeBook: null

      get().clearActiveBook();

    }, 300);

  },



  // 🆕 CANCEL PENDING DELETION

  cancelDeletion: () => {

    const { pendingDeletion } = get();

    if (pendingDeletion?.timeoutId) {

      clearTimeout(pendingDeletion.timeoutId);

    }

    set({ pendingDeletion: null });

  },



  // 🗑️ EXECUTE FINAL DELETION

  executeFinalDeletion: async (book: any, userId: string): Promise<void> => {

    const bookId = String(book._id || book.localId);

    

    try {

      

      // Create delete payload with mandatory name field

      const deletePayload = {

        _id: book._id,

        localId: book.localId,

        cid: book.cid,

        name: book.name || 'Deleted Ledger', // ✅ MANDATORY for Validator

        userId: String(userId || get().userId || book.userId || ''),

        isDeleted: 1,

        synced: 0,

        vKey: Number(book.vKey || 0) + 1,

        updatedAt: getTimestamp()

      };

      

      // a. Execute Dexie Transaction (Book + Entries marked isDeleted: 1)

      await db.transaction('rw', db.books, db.entries, db.users, async () => {

        // Mark book as deleted

        await db.books.put(deletePayload);

        

        // Cascade delete all entries for this book

        await db.entries

          .where('bookId')

          .equals(bookId)

          .modify({ isDeleted: 1, synced: 0, updatedAt: getTimestamp() });

        

      });

      

      // b. Fire sync event to trigger 7-second auto-sync

      if (typeof window !== 'undefined') {

        window.dispatchEvent(new CustomEvent('vault-updated', { 

          detail: { source: 'HydrationController', origin: 'batch-mutation' } 

        }));

      }

      

      // c. Call get().refreshBooks() to update the local list

      get().refreshBooks();

      

      // d. Set get().setActiveBook(null) to clear the current view state

      get().clearActiveBook();

      

    } catch (error) {

      throw error;

    }

  },



  // 🧭 COMPLETE DELETION AND REDIRECT

  completeDeletionAndRedirect: (router: any) => {

    try {

      if (typeof window !== 'undefined') {

        if (router) {

          // Using Next.js router for soft navigation

          router.push('/?tab=books');

        } else {

          // 🚫 NO HARD RELOAD: Throw error instead of window.location

          throw new Error('Router instance required for soft navigation');

        }

      }

    } finally {

      // Ensure UI is unlocked even if navigation fails

      set({ isInteractionLocked: false });

    }

  },



  // 🆕 DEVICE STATE SETTER

  setIsMobile: (mobile: boolean) => {

    set({ isMobile: mobile });

  }

});

