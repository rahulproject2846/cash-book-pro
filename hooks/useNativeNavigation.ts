"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useModal } from '@/context/ModalContext';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { getPlatform } from '@/lib/platform';

/**
 * VAULT PRO: NATIVE NAVIGATION STACK (V12.1 - PATHOR V2)
 * ------------------------------------------------
 * 🏛️ SOVEREIGN: Uses platform.navigation abstraction
 * Intercepts browser/mobile back button to provide native app behavior.
 * Priority: Modal > ActiveBook > Default Browser Action
 */

export const useNativeNavigation = () => {
  const { isOpen, closeModal } = useModal();
  const { activeBook, setActiveBook } = getVaultStore();
  const isProcessingBackRef = useRef(false);
  const platform = getPlatform();

  // 🎯 HANDLE BACK PRESS WITH PRIORITY LOGIC
  const handleBackPress = useCallback(() => {
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
    } finally {
      setTimeout(() => {
        isProcessingBackRef.current = false;
      }, 100);
    }
  }, [isOpen, closeModal, activeBook, setActiveBook]);

  // 🎯 POPSTATE EVENT LISTENER - Using platform.lifecycle
  useEffect(() => {
    const cleanup = platform.lifecycle.onPopState((state) => {
      console.log('🔙 [NATIVE NAV] Popstate event detected:', state);
      handleBackPress();
    });

    return cleanup;
  }, [handleBackPress, platform]);

  // 🎯 PUSH STATE ON NAVIGATION CHANGES - Using platform.navigation
  useEffect(() => {
    if (activeBook) {
      const bookId = activeBook._id || activeBook.localId;
      const bookName = activeBook.name || 'Unknown Book';
      
      console.log('📍 [NATIVE NAV] Pushing book state to history:', bookName);
      platform.navigation.pushState(
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
      console.log('📍 [NATIVE NAV] Pushing dashboard state to history');
      platform.navigation.pushState(
        { 
          type: 'dashboard-view',
          timestamp: Date.now()
        }, 
        'Ledger Hub', 
        '#dashboard'
      );
    }
  }, [activeBook, platform]);

  // 🎯 PUSH STATE ON MODAL CHANGES
  useEffect(() => {
    if (isOpen) {
      console.log('📍 [NATIVE NAV] Pushing modal state to history');
      platform.navigation.pushState(
        { 
          type: 'modal-view',
          timestamp: Date.now()
        }, 
        'Modal', 
        '#modal'
      );
    }
  }, [isOpen, platform]);

  // 🎯 INITIAL STATE SETUP
  useEffect(() => {
    const currentState = platform.navigation.getState();
    
    if (!currentState || !currentState.type) {
      console.log('📍 [NATIVE NAV] Setting initial dashboard state');
      platform.navigation.replaceState(
        { 
          type: 'dashboard-view',
          timestamp: Date.now()
        }, 
        'Ledger Hub', 
        '#dashboard'
      );
    }
  }, [platform]);

  return {
    handleBackPress,
    isNavigationActive: isOpen || !!activeBook
  };
};
