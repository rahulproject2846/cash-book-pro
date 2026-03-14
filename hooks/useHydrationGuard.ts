"use client";

import { useState, useEffect } from 'react';

/**
 * 🛡️ HYDRATION GUARD - Mount State Management
 * 
 * Pathor Standard V1.0: Prevents SSR hydration mismatch and eliminates flicker
 * during UI transitions (especially important for Desktop/Mobile separation).
 * 
 * Usage:
 *   const isMounted = useHydrationGuard();
 *   if (!isMounted) return null; // or skeleton
 */

export function useHydrationGuard(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

/**
 * 🛡️ HYDRATION GUARD WITH DELAY - For sensitive UI transitions
 * 
 * Adds a small delay to ensure browser has fully rendered
 * Useful for complex animations or dual-view switches
 */
export function useHydrationGuardWithDelay(delayMs: number = 100): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return isMounted;
}

/**
 * 🛡️ SELECTOR HYDRATION GUARD - For conditional rendering
 * 
 * Returns true after mount, but allows custom condition checking
 */
export function useHydrationSelector<T>(
  selector: (mounted: boolean) => T,
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(defaultValue);
  const isMounted = useHydrationGuard();

  useEffect(() => {
    setValue(selector(isMounted));
  }, [isMounted, selector]);

  return value;
}
