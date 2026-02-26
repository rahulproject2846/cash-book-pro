"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';

interface SyncProgressDetail {
  current: number;
  total: number;
  phase: 'books' | 'entries' | 'complete';
  isComplete: boolean;
}

interface SyncProgressBarProps {
  className?: string;
}

const SyncProgressBar: React.FC<SyncProgressBarProps> = ({ className }) => {
  const [progress, setProgress] = useState<SyncProgressDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleProgress = (e: CustomEvent<SyncProgressDetail>) => {
      const detail = e.detail;
      setProgress(detail);
      setIsVisible(true);

      // Auto-hide after complete with 3-second delay
      if (detail.isComplete) {
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    window.addEventListener('sync-progress', handleProgress as EventListener);
    return () => {
      window.removeEventListener('sync-progress', handleProgress as EventListener);
    };
  }, []);

  if (!isVisible || !progress) return null;

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  
  const getProgressText = () => {
    switch (progress.phase) {
      case 'books':
        return `Syncing books: ${progress.current}/${progress.total}`;
      case 'entries':
        return `Loading entries: ${progress.current}/${progress.total}`;
      case 'complete':
        return "Sync complete!";
      default:
        return `Syncing: ${progress.current}/${progress.total}`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "w-full z-9999 bg-orange-500 backdrop-blur-sm border-b border-orange-400/30 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-3">
            {/* Progress Icon */}
            {!progress.isComplete && (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            )}
            
            {/* Progress Text */}
            <span className="text-white text-sm font-medium  ">
              {getProgressText()}
            </span>
          </div>
          
          {/* Thin Progress Bar */}
          <div className="w-full h-1 bg-orange-400/30 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SyncProgressBar;
