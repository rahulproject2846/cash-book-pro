"use client";
import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { 
    Plus, BookOpen, Loader2, Wallet, Clock, ShieldCheck, ImageIcon, Edit3, Trash2, AlertCircle, CloudOff , CloudCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useTranslation } from '@/hooks/useTranslation';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn, getTimeAgo } from '@/lib/utils/helpers';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';

export type BookCardVariant = 'compact' | 'full';

interface BookCardProps {
    book: any;
    onOpen: (book: any) => void;
    onQuickAdd: (book: any) => void;
    onEdit?: (book: any) => void;
    onDelete?: (book: any) => void;
    balance: number;
    currencySymbol: string;
    isDimmed?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    currentUser?: any;
    variant?: BookCardVariant;
}

const useViewportSniper = (bookId: string, imageSrc: string) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!elementRef.current) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1, rootMargin: '50px' });
        observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, [bookId]);

    return { elementRef, isVisible };
};

const BookCard = React.memo<BookCardProps>(({ 
    book, onOpen, onQuickAdd, onEdit, onDelete, balance, currencySymbol, 
    isDimmed = false, onMouseEnter, onMouseLeave, variant = 'full'
}) => {
    const { t, language } = useTranslation();
    const router = useRouter();
    
    const liveBook = useLiveQuery(
      async () => {
          if (!book) return null;
          const lid = Number(book.localId);
          return await db.books
            .where('localId').equals(!isNaN(lid) ? lid : -1)
            .or('_id').equals(String(book._id || ''))
            .or('cid').equals(String(book.cid || ''))
            .first();
        },
        [book.localId, book._id, book.cid]
      );
    const reactiveBook = liveBook || book;
    const bookId = reactiveBook._id || reactiveBook.localId || reactiveBook.cid;

    const { activeBook, isGlobalAnimating } = useVaultState();
    const [isInternalAnimating, setIsInternalAnimating] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);

    const isActive = useMemo(() => {
        if (!activeBook) return false;
        return [activeBook._id, activeBook.localId, activeBook.cid].includes(bookId);
    }, [activeBook, bookId]);

    const { elementRef, isVisible } = useViewportSniper(String(bookId), (reactiveBook.image || reactiveBook.mediaCid || ''));
    const { previewUrl, isLoading: isImageLoading } = useLocalPreview(reactiveBook.image || reactiveBook.mediaCid || '');

    const isPositive = balance >= 0;
    const isCompact = variant === 'compact';

    const handleMouseEnter = useCallback(() => {
      getVaultStore().prefetchBookEntries(bookId);
      setIsCardHovered(true);
      if (onMouseEnter) onMouseEnter();
    }, [bookId, onMouseEnter]);

    const handleMouseLeave = useCallback(() => {
      setIsCardHovered(false);
      if (onMouseLeave) onMouseLeave();
    }, [onMouseLeave]);

    const handleOpen = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGlobalAnimating) return;

        const scrollEl = document.querySelector('main');
        if (scrollEl) getVaultStore().setLastScrollPosition(scrollEl.scrollTop);

        const lid = reactiveBook.localId || reactiveBook._id;
        const fullBook = await db.books.get(lid) || reactiveBook;
        getVaultStore().setActiveBook(fullBook);
        getVaultStore().prefetchBookEntries(bookId);

        setIsInternalAnimating(true);
        getVaultStore().setGlobalAnimating(true);
        router.push(`?tab=books&id=${bookId}`);
        onOpen(fullBook);

        setTimeout(() => {
            setIsInternalAnimating(false);
            getVaultStore().setGlobalAnimating(false);
        }, 500);
    }, [bookId, reactiveBook, router, isGlobalAnimating, onOpen]);

    const compactClasses = isCompact ? {
        container: "p-3 h-[160px]",
        iconWrapper: "w-8 h-8",
        iconSize: 16,
        title: "text-[12px]",
        badge: "text-[6px] px-1.5 py-0.5",
        balance: "text-[16px]",
        currency: "text-[9px]",
        meta: "text-[7px]",
        actionBtn: "w-7 h-7",
        quickAddBtn: "w-8 h-8",
        borderWidth: "border",
        gap: "gap-3",
    } : {
        container: "p-5 md:p-8 h-[210px] md:h-[280px]",
        iconWrapper: "w-10 h-10 md:w-16 md:h-16",
        iconSize: 20,
        title: "text-[15px] md:text-xl",
        badge: "text-[7.5px] md:text-[9px] px-2 py-1",
        balance: "text-[22px] md:text-3xl",
        currency: "text-xs md:text-base",
        meta: "text-[9px] md:text-[11px]",
        actionBtn: "w-8 h-8 md:w-10 md:h-10",
        quickAddBtn: "w-9 h-9 md:w-12 md:h-12",
        borderWidth: "border",
        gap: "gap-4 md:gap-6",
    };

    if (reactiveBook?.conflicted === 1) return null;

    return (
        <motion.div 
            ref={elementRef}
            layoutId={`book-hero-${bookId}`}
            onClick={handleOpen}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
                opacity: isDimmed ? 0.35 : 1, 
                y: 0,
                scale: isDimmed ? 0.94 : 1,
                filter: isDimmed ? "blur(2px) saturate(0.5) grayscale(0.5)" : "blur(0px) saturate(1)"
            }}
            whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                "group relative bg-[var(--bg-card)] apple-card border border-[var(--border)]",
                "cursor-pointer overflow-hidden flex flex-col",
                compactClasses.container,
                "transition-all duration-500 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]",
                isActive ? "border-orange-500/50 shadow-orange-500/10" : "relative z-30"
            )}
            style={{ zIndex: isInternalAnimating ? 100 : 30 }}
        >
            <div className={cn("absolute -right-4 -top-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none", isCompact ? "-right-3 -top-3" : "-right-6 -top-6")}>
                <BookOpen size={isCompact ? 80 : 130} className={cn(isCompact ? "md:w-[120px]" : "md:w-[160px]", "text-orange-500")} strokeWidth={1} />
            </div>

            <div className="flex justify-between items-start relative z-10 gap-2">
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={cn("font-black text-green-500 flex items-center gap-1.5 bg-green-500/5 rounded-lg border border-green-500/10 w-fit shrink-0", compactClasses.badge)}>
                            ID: {toBn(String(bookId).slice(-6).toUpperCase(), language)}
                        </span>
                        {reactiveBook.conflicted === 1 ? (
                            <AlertCircle size={isCompact ? 12 : 14} className="text-red-500 shrink-0" />
                        ) : reactiveBook.synced === 0 ? (
                            <CloudOff  size={isCompact ? 12 : 14} className="text-orange-500 shrink-0" />
                        ) : (
                            <CloudCheck  size={isCompact ? 12 : 14} className="text-green-500 shrink-0" />
                        )}
                    </div>
                    <h3 className={cn("font-black text-[var(--text-main)] truncate group-hover:text-orange-500 transition-colors mt-0.5", compactClasses.title)}>
                        {reactiveBook.name || t('ledger_untitled') || 'Untitled Book'}
                    </h3>
                </div>
                
                <div className={cn("apple-card bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner", compactClasses.iconWrapper)}>
                    {previewUrl && isVisible ? (
                        isImageLoading ? <Loader2 size={isCompact ? 12 : 16} className="text-blue-500 animate-spin" /> :
                        <img src={previewUrl} className="w-full h-full object-cover" />
                    ) : <Wallet size={compactClasses.iconSize} className="text-orange-500 opacity-20" />}
                </div>
            </div>

            <div className="mt-auto relative z-10 space-y-0.5 md:space-y-1">
                <p className={cn("font-black text-[var(--text-muted)] opacity-40", isCompact ? "text-[6px]" : "text-[7px] md:text-[9px]")}>
                    {t('net_asset') || "TOTAL SURPLUS"}
                </p>
                
                <div className={cn(
                    "font-mono-finance font-black flex items-baseline gap-1",
                    compactClasses.balance,
                    isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                    <span className={cn("opacity-50 font-sans font-bold", compactClasses.currency)}>{currencySymbol}</span>
                    <span className="leading-none">{toBn(Math.abs(balance).toLocaleString(), language)}</span>
                </div>
            </div>

            <div className={cn("pt-3 mt-5 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10", compactClasses.gap)}>
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className={cn("font-black text-[var(--text-muted)] opacity-30", isCompact ? "text-[5px]" : "text-[6px] md:text-[7px]")}>
                        {t('label_last_updated')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={isCompact ? 8 : 10} className="text-orange-500 opacity-60" />
                        <span className={cn("font-black text-[var(--text-main)]", compactClasses.meta)}>
                            {getTimeAgo(reactiveBook.updatedAt || Date.now(), language, t)}
                        </span>
                    </div>
                </div>

                {/* Action buttons container - absolute positioned to not affect layout */}
                <div className="absolute right-0 flex items-center gap-2">
                    {/* Edit Button - Reveals second at 1.1s */}
                    <AnimatePresence>
                        {isCardHovered && onEdit && (
                            <motion.div
                                initial={{ opacity: 0, x: 40, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ delay: 1.1, type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <Tooltip text={t('edit_book') || 'Edit Book'}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEdit(reactiveBook); }} 
                                        className={cn("bg-[var(--bg-card)] hover:bg-blue-500 border border-[var(--border)] hover:border-blue-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg", compactClasses.actionBtn)}
                                    >
                                        <Edit3 size={isCompact ? 14 : 16} strokeWidth={2} />
                                    </button>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Delete Button - Reveals first at 0.8s */}
                    <AnimatePresence>
                        {isCardHovered && onDelete && (
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.5 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.5, transition: { duration: 0.2 } }}
                                transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <Tooltip text={t('delete_book') || 'Delete Book'}>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (reactiveBook.conflicted === 1) {
                                                toast.error("Please resolve conflict before deleting");
                                                return;
                                            }
                                            onDelete(reactiveBook); 
                                        }} 
                                        className={cn("bg-[var(--bg-card)] hover:bg-red-500 border border-[var(--border)] hover:border-red-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg", compactClasses.actionBtn)}
                                    >
                                        <Trash2 size={isCompact ? 14 : 16} strokeWidth={2} />
                                    </button>
                                </Tooltip>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick Add - Always visible, static */}
                    <Tooltip text={t('tt_quick_add')}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onQuickAdd(reactiveBook); }} 
                            className={cn("bg-[var(--bg-card)] hover:bg-orange-500 border border-[var(--border)] hover:border-orange-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg group/btn", compactClasses.quickAddBtn)}
                        >
                            <Plus size={isCompact ? 16 : 20} strokeWidth={3.5} className="group-hover/btn:rotate-90 transition-transform" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </motion.div>
    );
});

BookCard.displayName = 'BookCard';
export default BookCard;
