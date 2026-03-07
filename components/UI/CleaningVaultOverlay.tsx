"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useVaultStore } from '@/lib/vault/store';

/**
 * 🏛️ CLEANING VAULT OVERLAY - Royal UI for Sovereign Exit
 * 
 * Shows a centered orange loader with "Cleaning Vault... Securing your data nodes."
 * Controlled by isCleaningVault state from the vault store.
 */
export const CleaningVaultOverlay: React.FC = () => {
  const { isCleaningVault } = useVaultStore();

  return (
    <AnimatePresence>
      {isCleaningVault && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[99999] flex items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              delay: 0.1
            }}
            className="text-center"
          >
            {/* Royal Orange Loader */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear"
              }}
              className="flex justify-center mb-6"
            >
              <Loader2 
                size={64} 
                className="text-orange-500 drop-shadow-lg"
                strokeWidth={2.5}
              />
            </motion.div>
            
            {/* Main Title */}
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-white text-2xl font-bold mb-3 tracking-wide"
            >
              Cleaning Vault...
            </motion.h2>
            
            {/* Subtitle */}
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-white/70 text-sm max-w-xs mx-auto leading-relaxed"
            >
              Securing your data nodes
            </motion.p>
            
            {/* Progress Indicator */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              className="mt-8 h-1 bg-orange-500/30 rounded-full overflow-hidden max-w-[200px] mx-auto"
            >
              <motion.div 
                className="h-full bg-orange-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.6 }}
              />
            </motion.div>
            
            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="mt-6 flex items-center justify-center space-x-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Security Protocol Active</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
