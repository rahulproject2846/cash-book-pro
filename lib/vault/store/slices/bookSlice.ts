"use client";



import { UserManager } from '@/lib/vault/core/user/UserManager';

import { financeService } from '../../services/FinanceService';

import { BookService } from '../../services/BookService';

import { LocalEntry } from '@/lib/offlineDB';

import { snipedInSession } from '../sessionGuard';

import { immer } from 'zustand/middleware/immer';



// 📚 LIGHTWEIGHT MATRIX INTERFACE

export interface BookMatrixItem {

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

  prefetchedChunks: Record<number, any[]>; // 🆕 Prefetched page cache for zero-lag

  prefetchedEntriesCache: Record<string, any[]>; // 🆕 Prefetched entries cache for instant book details

  isInteractionLocked: boolean; // 🆕 Interaction lock state

  dashPage: number; // 🆕 Current dashboard page for pagination

}



// 📚 BOOK ACTIONS INTERFACE

export interface BookActions {

  refreshBooks: (source?: string) => Promise<boolean>;

  fetchPageChunk: (page: number, overrideMatrix?: BookMatrixItem[], source?: string, currentId?: number) => Promise<void>; // 🆕 Passive executor with optional currentId

  prefetchBookEntries: (bookId: string) => Promise<void>; // 🆕 Smart pre-fetching for zero-lag

  prefetchNextPage: (page: number) => Promise<void>; // 🆕 Prefetch next page for zero-lag

  setDashPage: (page: number) => void; // 🆕 Set current dashboard page

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

  prefetchedChunks: {}, // 🆕 Prefetched page cache for zero-lag

  prefetchedEntriesCache: {}, // 🆕 Prefetched entries cache for instant book details

  isInteractionLocked: false, // 🆕 Interaction lock state

  dashPage: 1, // 🆕 Current dashboard page for pagination



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
    const currentQuery = get().searchQuery;
    
    // Only skip if there's genuinely no change in the input state
    if (query === currentQuery) {
      return;
    }
    
    // Update state and immediately apply filters
    set({ 
      searchQuery: query,
      isUserSearching: query.length > 0,
      dashPage: 1 // 🛡️ ALWAYS reset to page 1 on new search or clear
    });
    
    // � Force the matrix to re-evaluate the new query
    get().applyFiltersAndSort();
  },



  setSortOption: (option: string) => {

    set({ sortOption: option });

    // 🛡️ [PATHOR SILENCE] DON'T call applyFiltersAndSort - it triggers destructive fetchPageChunk
    // Sort changes should be handled by explicit user action, not automatic destructive refresh
    // get().applyFiltersAndSort();

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



  // 🆕 SET DASHBOARD PAGE

  setDashPage: (page: number) => {

    set({ dashPage: page });

    // 🛡️ DNA Law 2.B: Trigger fetch for new page with correct source
    get().fetchPageChunk(page, undefined, 'PAGE_CHANGE');

  },



  // 🆕 ZERO-LAG NAVIGATION

  transitionToDashboard: (router: any) => {

    const bookService = BookService.getInstance();

    return bookService.transitionToDashboard(get, set, router);

  },



  // 🆕 CANCEL PENDING DELETION

  cancelDeletion: () => {

    const bookService = BookService.getInstance();

    return bookService.cancelDeletion(get, set);

  },



  // 🗑️ EXECUTE FINAL DELETION

  executeFinalDeletion: async (book: any, userId: string): Promise<void> => {

    const bookService = BookService.getInstance();

    return await bookService.executeFinalDeletion(get, book, userId);

  },



  // 🧭 COMPLETE DELETION AND REDIRECT

  completeDeletionAndRedirect: (router: any) => {

    const bookService = BookService.getInstance();

    return bookService.completeDeletionAndRedirect(set, router);

  },



  // 🆕 DEVICE STATE SETTER

  setIsMobile: (mobile: boolean) => {

    set({ isMobile: mobile });

  }

});

