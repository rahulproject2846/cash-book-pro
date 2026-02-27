"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, RotateCcw, CloudOff } from 'lucide-react';
import { useVaultStore } from '@/lib/vault/store';
import { cn } from '@/lib/utils/helpers';

export interface AppleToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'undo' | 'sync-delay';
  message: string;
  duration?: number;
  countdown?: number;
  onUndo?: () => void;
  onRetry?: () => void;
}

export const AppleToast: React.FC<AppleToastProps> = ({ 
  id, type, message, duration = 3000, countdown, onUndo, onRetry 
}) => {
  const [progress, setProgress] = useState(100);
  // হুক সবসময় টপ-লেভেলে থাকতে হবে
  // ✅ হুক সবসময় টপ-লেভেলে থাকতে হবে
  const { hideToast } = useVaultStore();
  
  // 🚀 TURBO MODE DETECTION
  const isTurboMode = typeof window !== 'undefined' && 
    document.body.classList.contains('turbo-active');
  
  // 🎨 THEME-AWARE AURA COLORS
  const getAuraColors = () => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const isMidnight = typeof document !== 'undefined' && document.documentElement.classList.contains('midnight-mode');
    
    switch (type) {
      case 'success':
        return isMidnight ? {
          background: 'rgba(34, 197, 94, 0.15)',
          border: 'rgba(34, 197, 94, 0.3)',
          glow: '0 0 40px rgba(34, 197, 94, 0.6)',
          text: '#22c55e'
        } : isDark ? {
          background: 'rgba(34, 197, 94, 0.2)',
          border: 'rgba(34, 197, 94, 0.4)',
          glow: '0 0 30px rgba(34, 197, 94, 0.3)',
          text: '#4ade80'
        } : {
          background: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.2)',
          glow: '0 0 20px rgba(34, 197, 94, 0.2)',
          text: '#16a34a'
        };
      
      case 'error':
        return isMidnight ? {
          background: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          glow: '0 0 40px rgba(239, 68, 68, 0.6)',
          text: '#dc2626'
        } : isDark ? {
          background: 'rgba(239, 68, 68, 0.2)',
          border: 'rgba(239, 68, 68, 0.4)',
          glow: '0 0 30px rgba(239, 68, 68, 0.3)',
          text: '#f87171'
        } : {
          background: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.2)',
          glow: '0 0 20px rgba(239, 68, 68, 0.2)',
          text: '#ef4444'
        };
      
      case 'sync-delay':
        return {
          background: 'rgba(59, 130, 246, 0.15)',
          border: 'rgba(59, 130, 246, 0.3)',
          glow: '0 0 20px rgba(59, 130, 246, 0.3)',
          text: '#3b82f6'
        };
      
      default: // undo/warning/sync-delay
        return {
          background: 'rgba(251, 191, 36, 0.15)',
          border: 'rgba(251, 191, 36, 0.3)',
          glow: '0 0 20px rgba(251, 191, 36, 0.3)',
          text: '#f59e0b'
        };
    }
  };
  
  const colors = getAuraColors();
  
  // 🔄 CIRCULAR COUNTDOWN EFFECT (6s countdown + 1s grace period)
  useEffect(() => {
    if (countdown !== undefined) {
      const startTime = Date.now();
      const animationDuration = countdown * 1000; // 6 seconds animation
      const totalDuration = (countdown + 1) * 1000; // 7 seconds total (6s + 1s grace)
      const targetProgress = 0;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        
        // Animate to 0 over countdown seconds, then stay at 0 for 1 second grace period
        let progress;
        if (elapsed < animationDuration) {
          // Active countdown phase: animate from 100 to 0 as float
          progress = Math.max(0, 100 - (elapsed / animationDuration) * 100);
        } else {
          // Grace period: stay at 0
          progress = 0;
        }
        
        setProgress(progress);
        
        // Continue animation for total duration (6s + 1s grace)
        if (elapsed < totalDuration) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [countdown]);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUndo) onUndo();
    if (onRetry) onRetry();
    hideToast(id); // ✅ এখানে আর হুক কল হচ্ছে না, উপরে ডিফাইন করা ফাংশন কল হচ্ছে
  };

  return (
    <motion.div
      initial={{ y: 150, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 150, scale: 0.8 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }}
      className={cn(
        "pointer-events-auto z-10000 px-6 py-4 rounded-3xl max-w-md w-full cursor-pointer",
        "backdrop-blur-md border shadow-2xl hover:scale-105 transition-transform",
        "active:scale-95 select-none bg-white/10 dark:bg-black/40"
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        boxShadow: !isTurboMode ? colors.glow : 'none',
      }}
      onClick={handleAction}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="shrink-0">
          {type === 'success' && <CheckCircle size={24} style={{ color: colors.text }} />}
          {type === 'error' && <AlertTriangle size={24} style={{ color: colors.text }} />}
          {type === 'warning' && <AlertTriangle size={24} style={{ color: colors.text }} />}
          {type === 'undo' && <RotateCcw size={24} style={{ color: colors.text }} />}
          {type === 'sync-delay' && <CloudOff size={24} style={{ color: colors.text }} />}
        </div>
        
        {/* Message */}
        <div className="flex-1">
          <p className="text-sm font-medium leading-tight" style={{ color: colors.text }}>
            {message}
          </p>
          {type === 'undo' && (
            <p className="text-[10px]     opacity-60 mt-1 font-bold" style={{ color: colors.text }}>
              Tap to cancel deletion
            </p>
          )}
        </div>
        
        {/* Circular Progress for Undo */}
        {countdown !== undefined && (
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%" cy="50%" r="20"
                stroke={colors.text}
                strokeWidth="3"
                fill="none"
                strokeDasharray="126"
                strokeDashoffset={126 - (126 * progress) / 100}
                opacity="0.8"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: colors.text }}>
                {Math.ceil((progress / 100) * countdown)}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};