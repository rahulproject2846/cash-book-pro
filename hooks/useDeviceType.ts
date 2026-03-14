"use client";

import { useState, useEffect } from 'react';
import { getPlatform } from '@/lib/platform';

/**
 * 📱 DEVICE TYPE HOOK - Pathor Standard V1.0
 * 
 * Uses SovereignPlatform abstraction for device detection.
 * MOBILE-FIRST: Defaults to 'mobile' if platform not ready.
 * No window fallback - pure platform abstraction.
 * 
 * Types:
 *   - 'mobile': width < 768px
 *   - 'tablet': 768px <= width < 1024px  
 *   - 'desktop': width >= 1024px
 * 
 * Usage:
 *   const deviceType = useDeviceType();
 *   if (deviceType === 'mobile') { ... }
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

function getDeviceTypeFromWidth(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

export function useDeviceType(): DeviceType {
  // 🔒 MOBILE-FIRST: Default to 'mobile' until platform is ready
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');

  useEffect(() => {
    const platform = getPlatform();
    
    const detectDevice = () => {
      // 🏛️ SOVEREIGN: Use ONLY platform.info.viewport.width
      if (platform.info?.viewport?.width) {
        const width = platform.info.viewport.width;
        setDeviceType(getDeviceTypeFromWidth(width));
      }
      // 🏛️ MOBILE-FIRST: If no viewport, stay on 'mobile' (already set as default)
    };

    // Initial detection
    detectDevice();

    // 🏛️ REACTIVE: Listen for platform viewport changes
    const cleanup = platform.events.listen('platform-viewport-change', () => {
      detectDevice();
    });

    return cleanup;
  }, []);

  return deviceType;
}

/**
 * 📱 IS MOBILE HOOK - Boolean convenience wrapper
 * 
 * Usage:
 *   const isMobile = useIsMobile();
 *   if (isMobile) { ... }
 */
export function useIsMobile(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'mobile';
}

/**
 * 📱 IS DESKTOP HOOK - Boolean convenience wrapper
 * 
 * Usage:
 *   const isDesktop = useIsDesktop();
 *   if (isDesktop) { ... }
 */
export function useIsDesktop(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'desktop';
}

/**
 * 📱 IS TABLET HOOK - Boolean convenience wrapper
 */
export function useIsTablet(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'tablet';
}

/**
 * 📱 USE BREAKPOINT - For custom breakpoint monitoring
 * MOBILE-FIRST: Returns false until platform is ready
 */
export function useBreakpoint(breakpoint: number): boolean {
  const [isAbove, setIsAbove] = useState(false);

  useEffect(() => {
    const platform = getPlatform();
    
    const checkBreakpoint = () => {
      // 🏛️ SOVEREIGN: Use ONLY platform.info.viewport.width
      if (platform.info?.viewport?.width) {
        setIsAbove(platform.info.viewport.width >= breakpoint);
      }
      // 🏛️ MOBILE-FIRST: If no viewport, stay false (already set as default)
    };

    checkBreakpoint();
  }, [breakpoint]);

  return isAbove;
}
