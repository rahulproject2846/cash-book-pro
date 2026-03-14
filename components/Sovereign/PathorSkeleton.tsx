"use client";

import React from 'react';

/**
 * 💀 PATHOR SKELETON - Universal Loading State
 * 
 * Pathor Standard V1.0: Zero-flicker hydration guard.
 * This skeleton matches both Desktop and Mobile themes (OLED/Midnight).
 * 
 * Usage:
 *   const isMounted = useHydrationGuard();
 *   if (!isMounted) return <PathorSkeleton />;
 * 
 * Properties:
 * - Matches bg-[var(--bg-app)] background
 * - Uses orange-500 accent (Vault Pro brand)
 * - Centered spinner for immediate visual feedback
 * - Works in both Desktop and Mobile contexts
 */

export const PathorSkeleton: React.FC = () => {
  return (
    <div 
      className="h-screen w-full bg-[var(--bg-app)] flex flex-col items-center justify-center"
    >
      {/* ─────────────────────────────────────────────
          BRAND ORANGE SPINNER
          Matches Vault Pro's orange accent color
      ───────────────────────────────────────────── */}
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-orange-500/30 rounded-full" />
        
        {/* Spinning indicator */}
        <div 
          className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"
          style={{
            animationDuration: '1s',
          }}
        />
        
        {/* Center dot (optional, adds depth) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full" />
      </div>

      {/* ─────────────────────────────────────────────
          LOADING TEXT (Optional)
          Can be hidden for cleaner look
      ───────────────────────────────────────────── */}
      <p className="mt-6 text-xs font-medium text-orange-500/70 tracking-widest uppercase animate-pulse">
        Loading
      </p>
    </div>
  );
};

/**
 * 💀 PATHOR MINIMAL SKELETON
 * 
 * Simpler version without text - just the spinner.
 * Use when you want minimal visual noise.
 */

export const PathorSkeletonMinimal: React.FC = () => {
  return (
    <div 
      className="h-screen w-full bg-[var(--bg-app)] flex items-center justify-center"
    >
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

/**
 * 💀 PATHOR DASHBOARD SKELETON
 * 
 * Full dashboard placeholder with sidebar/header placeholders.
 * Use during initial app load before shell selection.
 */

export const PathorDashboardSkeleton: React.FC = () => {
  return (
    <div className="h-screen w-full bg-[var(--bg-app)] flex">
      {/* Sidebar placeholder */}
      <div className="w-[280px] border-r border-[var(--border)] p-6 space-y-4">
        <div className="w-12 h-12 bg-orange-500/20 rounded-[18px]" />
        <div className="w-24 h-4 bg-[var(--text-muted)]/20 rounded" />
        <div className="space-y-2 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-14 bg-[var(--text-muted)]/10 rounded-[20px]" />
          ))}
        </div>
      </div>
      
      {/* Main content placeholder */}
      <div className="flex-1 p-6">
        {/* Header placeholder */}
        <div className="w-full h-16 bg-[var(--text-muted)]/10 rounded-xl mb-6" />
        
        {/* Content placeholder */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--text-muted)]/10 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PathorSkeleton;
