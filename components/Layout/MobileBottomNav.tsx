"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, BarChart2, History, Settings, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

interface BottomNavProps {
  active: string;
  setActive: (id: string) => void;
  onFabClick: () => void;
  onResetBook?: () => void;
  fabTooltip?: string;
  mainContainerRef?: React.RefObject<HTMLElement | null>;
}

export const MobileBottomNav: React.FC<BottomNavProps> = ({
  active,
  setActive,
  onFabClick,
  onResetBook,
  fabTooltip,
  mainContainerRef,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      const current = mainContainerRef?.current?.scrollTop || 0;
      setIsVisible(current < lastScrollY || current < 50);
      setLastScrollY(current);
    };
    
    const container = mainContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY, mainContainerRef]);

  const NavIcon = ({ id, icon: Icon }: { id: string; icon: any }) => {
    const isActive = active === id;
    return (
      <button 
        onClick={() => { setActive(id); if (onResetBook) onResetBook(); }} 
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-90",
          isActive ? "text-orange-500" : "text-[var(--text-muted)] opacity-60"
        )}
      >
        <Icon size={24} strokeWidth={isActive ? 3 : 2} />
        {isActive && <motion.div layoutId="activeDot" className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full" />}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
          className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
        >
          <div className="bg-[var(--bg-card)]/95 backdrop-blur-lg border border-[var(--border)] h-[72px] rounded-[35px] shadow-2xl flex items-center justify-between px-6 relative">
            <div className="flex gap-5">
              <NavIcon id="books" icon={LayoutGrid} />
              <NavIcon id="reports" icon={BarChart2} />
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2 -top-6">
              <Tooltip text={fabTooltip || t('fab_add_book')} position="left">
                <button 
                  onClick={onFabClick}
                  className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-lg relative z-20 active:scale-90 transition-transform"
                >
                  <Plus size={32} strokeWidth={4} />
                </button>
              </Tooltip>
            </div>

            <div className="flex gap-5">
              <NavIcon id="timeline" icon={History} />
              <NavIcon id="settings" icon={Settings} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileBottomNav;
