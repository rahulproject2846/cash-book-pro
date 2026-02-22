"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useModal } from '@/context/ModalContext';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * VAULT PRO: NATIVE NAVIGATION STACK (V12.1)
 * ------------------------------------------------
 * Intercepts browser/mobile back button to provide native app behavior.
 * Priority: Modal > ActiveBook > Default Browser Action
 */

export const useNativeNavigation = () => {
  const { isOpen, closeModal } = useModal();
  const { activeBook, setActiveBook } = getVaultStore();
  const isProcessingBackRef = useRef(false);

  // 🎯 HANDLE BACK PRESS WITH PRIORITY LOGIC
  const handleBackPress = useCallback(() => {
    // Prevent multiple simultaneous back actions
    if (isProcessingBackRef.current) {
      console.log('🚫 [NATIVE NAV] Back action already processing, ignoring');
      return;
    }

    isProcessingBackRef.current = true;

    try {
      // Priority 1: Close modal if open
      if (isOpen) {
        console.log('🔙 [NATIVE NAV] Closing modal via back button');
        closeModal();
        return;
      }

      // Priority 2: Clear active book if set
      if (activeBook) {
        console.log('🔙 [NATIVE NAV] Clearing active book via back button:', activeBook.name);
        setActiveBook(null);
        return;
      }

      // Priority 3: Let browser handle default back action
      console.log('🔙 [NATIVE NAV] No modal or active book, letting browser handle back action');
      // No prevention - let browser exit or navigate naturally
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        isProcessingBackRef.current = false;
      }, 100);
    }
  }, [isOpen, closeModal, activeBook, setActiveBook]);

  // 🎯 POPSTATE EVENT LISTENER
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('🔙 [NATIVE NAV] Popstate event detected:', event.state);
      
      // Prevent default behavior and handle our custom logic
      event.preventDefault();
      handleBackPress();
    };

    // Add popstate listener
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackPress]);

  // 🎯 PUSH STATE ON NAVIGATION CHANGES
  useEffect(() => {
    // Push state when activeBook changes
    if (activeBook) {
      const bookId = activeBook._id || activeBook.localId;
      const bookName = activeBook.name || 'Unknown Book';
      
      console.log('📍 [NATIVE NAV] Pushing book state to history:', bookName);
      window.history.pushState(
        { 
          type: 'book-view',
          bookId,
          bookName,
          timestamp: Date.now()
        }, 
        `Book: ${bookName}`, 
        `#book-${bookId}`
      );
    } else {
      // Push dashboard state when no active book
      console.log('📍 [NATIVE NAV] Pushing dashboard state to history');
      window.history.pushState(
        { 
          type: 'dashboard-view',
          timestamp: Date.now()
        }, 
        'Ledger Hub', 
        '#dashboard'
      );
    }
  }, [activeBook]);

  // 🎯 PUSH STATE ON MODAL CHANGES
  useEffect(() => {
    if (isOpen) {
      console.log('📍 [NATIVE NAV] Pushing modal state to history');
      window.history.pushState(
        { 
          type: 'modal-view',
          timestamp: Date.now()
        }, 
        'Modal', 
        '#modal'
      );
    }
  }, [isOpen]);

  // 🎯 INITIAL STATE SETUP
  useEffect(() => {
    // Set initial state on mount
    if (typeof window !== 'undefined') {
      const currentState = window.history.state;
      
      if (!currentState || !currentState.type) {
        console.log('📍 [NATIVE NAV] Setting initial dashboard state');
        window.history.replaceState(
          { 
            type: 'dashboard-view',
            timestamp: Date.now()
          }, 
          'Ledger Hub', 
          '#dashboard'
        );
      }
    }
  }, []);

  return {
    handleBackPress,
    isNavigationActive: isOpen || !!activeBook
  };
};
