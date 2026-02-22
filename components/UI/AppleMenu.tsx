"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/helpers';
import { Zap } from 'lucide-react';

interface AppleMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  headerText?: string;
  anchor?: 'left' | 'right';
  position?: 'top' | 'bottom';
  width?: string;
}

export const AppleMenu = ({ 
  trigger, 
  children, 
  headerText,
  anchor = 'right',
  position = 'bottom',
  width = 'w-60'
}: AppleMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 🎯 APPLE STANDARD: Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { 
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🎯 APPLE SPRING: Unified animation constants
  const appleSpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8
  };

  // 🎯 POSITIONING LOGIC: Calculate placement based on anchor and position
  const getPositionClasses = () => {
    const horizontal = anchor === 'left' ? 'left-0' : 'right-0';
    const vertical = position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3';
    return `${horizontal} ${vertical}`;
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* TRIGGER */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* APPLE GLASS DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={appleSpring}
            className={cn(
              "absolute z-1000 apple-glass-heavy",
              "border border-(--border) rounded-[28px] shadow-2xl overflow-hidden",
              "backdrop-blur-3xl bg-(--bg-card)/90",
              getPositionClasses(),
              width
            )}
          >
            {/* Apple-style Header */}
            {headerText && (
              <div className="px-4 py-2.5 border-b border-(--border) mb-1.5 flex items-center justify-between opacity-40">
                <span className="text-[8px] font-black uppercase tracking-[3px]">{headerText}</span>
                <Zap size={10} fill="currentColor" strokeWidth={0} />
              </div>
            )}

            {/* Content */}
            <div className="max-h-70 overflow-y-auto no-scrollbar py-1">
              {children}
            </div>

            {/* Apple-style Footer */}
            <div className="mt-1 h-1 w-12 bg-(--border) rounded-full mx-auto opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
