"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers';
import { Tooltip } from '@/components/UI/Tooltip';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 10 
}: PaginationProps) => {
  const { t, language } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/desktop for responsive pagination
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate items per page based on device
  const responsiveItemsPerPage = isMobile ? 16 : 15;
  const displayCurrentPage = currentPage;
  const displayTotalPages = totalPages;

  // Generate page numbers for display (max 5 visible)
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show around current
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(1, currentPage - delta); 
         i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 1) {
      rangeWithDots.push(1, '...');
    }
    rangeWithDots.push(...range);
    if (currentPage + delta < totalPages) {
      rangeWithDots.push('...', totalPages);
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "flex items-center justify-center gap-2 py-6",
        "apple-card px-6 py-3 rounded-[24px]",
        "border border-[var(--border)] bg-[var(--bg-card)]",
        "shadow-lg shadow-[var(--border)]/10"
      )}
    >
      {/* Previous Button */}
      <Tooltip text={t('tt_prev_page')} position="top">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-xl",
            "border border-[var(--border)] bg-[var(--bg-app)]",
            "transition-all duration-200 shadow-sm",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "hover:border-orange-500/40 hover:shadow-md hover:bg-[var(--bg-card)]",
            "active:scale-95"
          )}
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-[var(--text-muted)]" />
        </motion.button>
      </Tooltip>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        <AnimatePresence mode="popLayout">
          {getVisiblePages().map((page, index) => (
            <motion.div
              key={`page-${page}`}
              layoutId={`page-${page}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30,
                delay: index * 0.05 // Stagger animation
              }}
            >
              {page === '...' ? (
                <span className="px-3 py-2 text-[var(--text-muted)] opacity-50 text-sm font-medium">
                  ...
                </span>
              ) : (
                <Tooltip text={`${t('page')} ${page}`} position="top">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(page as number)}
                    disabled={page === currentPage}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold",
                      "transition-all duration-200 shadow-sm",
                      page === currentPage
                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                        : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] hover:border-orange-500/40 hover:shadow-md",
                      "disabled:cursor-not-allowed"
                    )}
                  >
                    {toBn(String(page), language)}
                  </motion.button>
                </Tooltip>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Next Button */}
      <Tooltip text={t('tt_next_page')} position="top">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-xl",
            "border border-[var(--border)] bg-[var(--bg-app)]",
            "transition-all duration-200 shadow-sm",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "hover:border-orange-500/40 hover:shadow-md hover:bg-[var(--bg-card)]",
            "active:scale-95"
          )}
        >
          <ChevronRight size={20} strokeWidth={2.5} className="text-[var(--text-muted)]" />
        </motion.button>
      </Tooltip>

      {/* Page Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-4 py-2 bg-[var(--bg-app)] rounded-xl border border-[var(--border)]/20"
      >
        <div className="text-center">
          <div className="text-xs font-black text-[var(--text-muted)]     mb-1">
            {t('showing')}
          </div>
          <div className="text-sm font-bold text-[var(--text-main)]">
            {responsiveItemsPerPage} {t('items_per_page')}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
