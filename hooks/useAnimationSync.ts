"use client";

import { useEffect, useRef, useCallback } from 'react';
import { getVaultStore } from '@/lib/vault/store/storeHelper';

/**
 * VAULT PRO: FRAMER MOTION ANIMATION SYNC (V12.2)
 * ------------------------------------------------
 * Links Framer Motion animations with the Safe Action Shield.
 * Apple-style grace period prevents accidental taps after animations.
 */

export const useAnimationSync = () => {
  const store = getVaultStore();
  const gracePeriodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const GRACE_PERIOD_MS = 100; // Apple-style grace period

  const handleAnimationStart = useCallback(() => {
    console.log('🎬 [ANIMATION SYNC] Animation started');
    
    // Clear any existing grace period timeout
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
      gracePeriodTimeoutRef.current = null;
    }
    
    // Set global animating state
    store.setGlobalAnimating(true);
  }, [store]);

  const handleAnimationComplete = useCallback(() => {
    console.log('🎬 [ANIMATION SYNC] Animation completed');
    
    // Start grace period before releasing lock
    gracePeriodTimeoutRef.current = setTimeout(() => {
      console.log('🎬 [ANIMATION SYNC] Grace period ended, releasing lock');
      store.setGlobalAnimating(false);
      gracePeriodTimeoutRef.current = null;
    }, GRACE_PERIOD_MS);
  }, [store]);

  useEffect(() => {
    // 🎯 GLOBAL ANIMATION EVENT LISTENERS
    const animationEvents = [
      'animationstart',
      'animationend',
      'transitionstart',
      'transitionend'
    ];

    const handleStart = (event: Event) => {
      // Only handle relevant animations (ignore small UI animations)
      const target = event.target as HTMLElement;
      if (target?.closest('[data-safe-action="true"]') || 
          target?.closest('.motion-container') ||
          target?.closest('[layoutid]')) {
        handleAnimationStart();
      }
    };

    const handleEnd = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target?.closest('[data-safe-action="true"]') || 
          target?.closest('.motion-container') ||
          target?.closest('[layoutid]')) {
        handleAnimationComplete();
      }
    };

    // Add event listeners
    animationEvents.forEach(eventName => {
      document.addEventListener(eventName, eventName.includes('start') ? handleStart : handleEnd, true);
    });

    // 🎯 FRAMER MOTION SPECIFIC LISTENERS
    // Listen for custom framer-motion events
    const handleFramerMotionStart = (event: CustomEvent) => {
      console.log('🎬 [ANIMATION SYNC] Framer Motion start:', event.detail);
      handleAnimationStart();
    };

    const handleFramerMotionComplete = (event: CustomEvent) => {
      console.log('🎬 [ANIMATION SYNC] Framer Motion complete:', event.detail);
      handleAnimationComplete();
    };

    // Custom event listeners for framer-motion
    document.addEventListener('framerMotionStart', handleFramerMotionStart as EventListener);
    document.addEventListener('framerMotionComplete', handleFramerMotionComplete as EventListener);

    // 🎯 MORPHIC TRANSITION DETECTION
    // Listen for layout changes that indicate morphic transitions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'layoutid') {
          const element = mutation.target as HTMLElement;
          if (element.getAttribute('layoutid')) {
            // Morphic transition detected
            handleAnimationStart();
            
            // Auto-complete after typical morphic duration
            setTimeout(() => {
              handleAnimationComplete();
            }, 400); // Typical spring animation duration
          }
        }
      });
    });

    // Start observing for layout changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['layoutid'],
      subtree: true
    });

    // Cleanup
    return () => {
      // Remove event listeners
      animationEvents.forEach(eventName => {
        document.removeEventListener(eventName, eventName.includes('start') ? handleStart : handleEnd, true);
      });
      
      document.removeEventListener('framerMotionStart', handleFramerMotionStart as EventListener);
      document.removeEventListener('framerMotionComplete', handleFramerMotionComplete as EventListener);
      
      // Clear grace period timeout
      if (gracePeriodTimeoutRef.current) {
        clearTimeout(gracePeriodTimeoutRef.current);
      }
      
      // Disconnect observer
      observer.disconnect();
    };
  }, [handleAnimationStart, handleAnimationComplete]);

  // 🎯 EXTERNAL TRIGGERS FOR MANUAL CONTROL
  const triggerAnimationStart = useCallback(() => {
    handleAnimationStart();
  }, [handleAnimationStart]);

  const triggerAnimationComplete = useCallback(() => {
    handleAnimationComplete();
  }, [handleAnimationComplete]);

  return {
    triggerAnimationStart,
    triggerAnimationComplete,
    isGlobalAnimating: store.isGlobalAnimating,
    gracePeriodMs: GRACE_PERIOD_MS
  };
};
