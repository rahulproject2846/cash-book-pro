"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { useVaultStore } from '@/lib/vault/store';

/**
 * 🔄 UNDO TOAST COMPONENT (8-Second Delayed Delete)
 * --------------------------------------------------------
 * Apple Native Standard: Stiff animations with progress bar countdown
 * Shows when book deletion is pending and allows undo for 8 seconds
 */
export const UndoToast: React.FC = () => {
  const { pendingDeletion, cancelDeletion } = useVaultStore();
  const [remainingTime, setRemainingTime] = useState(0);

  // Calculate remaining time
  useEffect(() => {
    if (!pendingDeletion) {
      setRemainingTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((pendingDeletion.expiresAt - now) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pendingDeletion]);

  if (!pendingDeletion || remainingTime === 0) return null;

  const progress = (remainingTime / 8) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          mass: 0.8
        }}
        className="fixed bottom-4 right-4 z-[9999] bg-yellow-500/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 shadow-2xl min-w-[320px] max-w-[400px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
              <RotateCcw className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-yellow-400 text-sm font-medium">
              Book will be deleted in {remainingTime}s
            </span>
          </div>
          <button
            onClick={cancelDeletion}
            className="w-6 h-6 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors flex items-center justify-center text-yellow-400/60 hover:text-yellow-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-yellow-500/20 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-yellow-500 rounded-full"
            initial={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>

        {/* Undo Button */}
        <button
          onClick={cancelDeletion}
          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Undo Deletion
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
