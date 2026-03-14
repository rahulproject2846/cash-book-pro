"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDeviceType } from '@/hooks/useDeviceType';
import { getPlatform } from '@/lib/platform';
import { createPortal } from 'react-dom';

interface UnifiedModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const springTransition = {
  type: 'spring' as const,
  damping: 30,
  stiffness: 400
};

export const UnifiedModalWrapper: React.FC<UnifiedModalWrapperProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const deviceType = useDeviceType();
  const platform = getPlatform();
  
  const isMobile = deviceType === 'mobile' || deviceType === 'tablet';

  useEffect(() => {
    if (isOpen) {
      platform.lifecycle.lockScroll();
    } else {
      platform.lifecycle.unlockScroll();
    }
    
    return () => {
      platform.lifecycle.unlockScroll();
    };
  }, [isOpen, platform]);

  if (!isOpen) return null;

  const backdrop = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xl z-0"
    />
  );

  const container = (
    <div 
      className={isMobile 
        ? 'fixed inset-0 z-[999999] flex justify-center overflow-hidden transition-all items-end p-0'
        : 'fixed inset-0 z-[999999] flex justify-center overflow-hidden transition-all items-center p-4'
      }
    >
      {backdrop}
      
      <motion.div
        layout
        initial={isMobile 
          ? { y: '100%', opacity: 0 } 
          : { scale: 0.95, opacity: 0 }
        }
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={isMobile 
          ? { y: '100%', opacity: 0 } 
          : { scale: 0.95, opacity: 0 }
        }
        transition={springTransition}
        onClick={(e) => e.stopPropagation()}
        className={isMobile 
          ? 'bg-[var(--bg-card)] w-full border-x-0 border-t-0 border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden rounded-t-[45px] max-w-full h-auto'
          : 'bg-[var(--bg-card)] w-full border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden rounded-[20px] max-w-lg w-full'
        }
      >
        {/* Visual Handle for Mobile */}
        {isMobile && (
          <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />
        )}

        {/* Content - Pure container, no padding, no buttons */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  
  return createPortal(container, document.body);
};

export default UnifiedModalWrapper;
