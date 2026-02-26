"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSafeAction, ActionPriority, SafeActionResult } from '@/hooks/useSafeAction';
import { cn } from '@/lib/utils/helpers';

/**
 * VAULT PRO: ELITE SAFE BUTTON (V12.2)
 * -----------------------------------------------
 * Production-grade button with integrated Safe Action Shield.
 * Prevents double-clicks, shows loading states, and handles blocked actions.
 */

interface SafeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // 🛡️ Safe Action Configuration
  actionId: string;
  onAction: () => Promise<any> | any;
  priority?: ActionPriority;
  timeout?: number;
  allowDuringAnimation?: boolean;

  // 🎨 UI Configuration
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loadingText?: string;
  blockedText?: string;

  // 🎬 Animation Configuration
  shakeOnBlock?: boolean;
  pulseOnLoading?: boolean;
}

export type { SafeButtonProps };

export const SafeButton: React.FC<SafeButtonProps> = ({
  actionId,
  onAction,
  priority = 'normal',
  timeout,
  allowDuringAnimation = false,
  variant = 'primary',
  size = 'md',
  loadingText = 'Processing...',
  blockedText = 'System Busy',
  shakeOnBlock = true,
  pulseOnLoading = true,
  children,
  disabled,
  className,
  onClick,
  ...props
}) => {
  const { executeSafeAction, isActionInProgress } = useSafeAction();
  const [actionState, setActionState] = useState<'idle' | 'loading' | 'blocked' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<SafeActionResult | null>(null);

  const isCurrentlyInProgress = isActionInProgress(actionId);

  // 🎨 VARIANT STYLES
  const getVariantClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-300 active:scale-95";
    
    switch (variant) {
      case 'primary':
        return cn(
          baseClasses,
          "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_10px_30px_-10px_rgba(249,115,22,0.5)]",
          "disabled:bg-orange-300 disabled:shadow-none"
        );
      case 'secondary':
        return cn(
          baseClasses,
          "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main]",
          "hover:bg-[var(--bg-app)] disabled:opacity-50"
        );
      case 'danger':
        return cn(
          baseClasses,
          "bg-red-500 hover:bg-red-600 text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.5)]",
          "disabled:bg-red-300 disabled:shadow-none"
        );
      case 'ghost':
        return cn(
          baseClasses,
          "bg-transparent text-[var(--text-muted] hover:text-[var(--text-main)]",
          "disabled:opacity-30"
        );
      default:
        return baseClasses;
    }
  };

  // 📏 SIZE STYLES
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return "h-10 px-4 text-sm font-medium rounded-lg";
      case 'md':
        return "h-12 px-6 text-sm font-bold rounded-xl";
      case 'lg':
        return "h-14 px-8 text-base font-black rounded-2xl";
      default:
        return "h-12 px-6 text-sm font-bold rounded-xl";
    }
  };

  // 🎯 ACTION HANDLER
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (disabled || isCurrentlyInProgress) {
      return;
    }

    setActionState('loading');

    try {
      const result = await executeSafeAction(
        actionId,
        onAction,
        priority,
        { timeout, allowDuringAnimation }
      );

      setLastResult(result);

      if (result.isBlocked) {
        setActionState('blocked');
        // Auto-reset blocked state after 2 seconds
        setTimeout(() => setActionState('idle'), 2000);
      } else if (result.success) {
        setActionState('idle');
      } else {
        setActionState('error');
        // Auto-reset error state after 3 seconds
        setTimeout(() => setActionState('idle'), 3000);
      }
    } catch (error) {
      setActionState('error');
      setTimeout(() => setActionState('idle'), 3000);
    }
  };

  // 🎬 ANIMATION VARIANTS
  const shakeVariants = {
    idle: { x: 0 },
    shake: {
      x: [0, -4, 4, -4, 4, -2, 2, 0],
      transition: { duration: 0.5, ease: "easeInOut" as const }
    }
  };

  const pulseVariants = {
    idle: { opacity: 1 },
    pulse: {
      opacity: [1, 0.7, 1],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const }
    }
  };

  return (
    <motion.button
      // Filter out incompatible props for motion.button
      {...Object.fromEntries(
        Object.entries(props).filter(([key]) => 
          !key.startsWith('onDrag') && 
          !key.startsWith('onDrop') &&
          key !== 'onDragEnter' &&
          key !== 'onDragLeave' &&
          key !== 'onDragOver' &&
          key !== 'onDragStart' &&
          key !== 'onDragEnd'
        )
      )}
      className={cn(
        getVariantClasses(),
        getSizeClasses(),
        "apple-card font-bold    flex items-center justify-center gap-2",
        className
      )}
      disabled={disabled || isCurrentlyInProgress || actionState === 'loading'}
      onClick={handleClick}
      variants={actionState === 'blocked' && shakeOnBlock ? shakeVariants : undefined}
      animate={
        actionState === 'blocked' && shakeOnBlock ? 'shake' :
        actionState === 'loading' && pulseOnLoading ? 'pulse' : 'idle'
      }
      whileHover={{ scale: disabled || isCurrentlyInProgress ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isCurrentlyInProgress ? 1 : 0.98 }}
    >
      {/* 🎬 LOADING STATE */}
      <AnimatePresence>
        {actionState === 'loading' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 size={16} className="animate-spin" />
            <span>{loadingText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚫 BLOCKED STATE */}
      <AnimatePresence>
        {actionState === 'blocked' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-orange-500"
          >
            <span className="text-xs">{blockedText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ❌ ERROR STATE */}
      <AnimatePresence>
        {actionState === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 text-red-500"
          >
            <span className="text-xs">Error</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ NORMAL STATE */}
      <AnimatePresence>
        {actionState === 'idle' && !isCurrentlyInProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎯 PROGRESS INDICATOR */}
      {isCurrentlyInProgress && (
        <motion.div
          layoutId="progress-bar"
          className="absolute inset-0 bg-black/10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-full h-1 bg-current/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-current"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </motion.button>
  );
};
