"use client";
import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { 
    Plus, BookOpen, Loader2, Zap, Wallet, Clock, ShieldCheck, ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useTranslation } from '@/hooks/useTranslation';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn, getTimeAgo } from '@/lib/utils/helpers';
import { db } from '@/lib/offlineDB';
import { useLiveQuery } from 'dexie-react-hooks';

// --- 📦 PROPS INTERFACE ---
interface BookCardProps {
    book: any;
    onOpen: (book: any) => void;
    onQuickAdd: (book: any) => void;
    balance: number;
    currencySymbol: string;
    isDimmed?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    currentUser?: any;
}

// 🎯 VIEWPORT SNIPER TRIGGER HOOK
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

/**
 * 🏆 FINAL MASTER BOOK CARD (V16.0)
 * ----------------------------------------------------
 * Design Authority: Lead Developer's Original UI (The "Slick" Look)
 * Data Authority: Triple-Link & Full Hydration Logic
 * Performance: Viewport Sniper & Memoized Rendering
 */
const BookCard = React.memo<BookCardProps>(({ 
    book, onOpen, onQuickAdd, balance, currencySymbol, 
    isDimmed = false, onMouseEnter, onMouseLeave 
}) => {
    const { t, language } = useTranslation();
    const router = useRouter();
    
    // 🔍 REACTIVE DATABASE OBSERVER
    const liveBook = useLiveQuery(() => book.localId ? db.books.get(book.localId) : null, [book.localId]);
    const reactiveBook = liveBook || book;
    const bookId = reactiveBook._id || reactiveBook.localId || reactiveBook.cid;

    const { activeBook, isGlobalAnimating } = useVaultState();
    const [isInternalAnimating, setIsInternalAnimating] = useState(false);

    // 🛡️ TRIPLE-LINK ACTIVE CHECK
    const isActive = useMemo(() => {
        if (!activeBook) return false;
        const bId = String(bookId);
        return String(activeBook._id) === bId || String(activeBook.localId) === bId || String(activeBook.cid) === bId;
    }, [activeBook, bookId]);

    // 🎯 VIEWPORT SNIPER & IMAGE STATE
    const { elementRef, isVisible } = useViewportSniper(String(bookId), reactiveBook.image || reactiveBook.mediaCid);
    const displayImage = reactiveBook.image?.startsWith('http') ? reactiveBook.image : (reactiveBook.image || reactiveBook.mediaCid);
    const { previewUrl, isLoading: isImageLoading } = useLocalPreview(isVisible ? displayImage : null);

    const isPositive = balance >= 0;

    // 🚀 ATOMIC OPEN HANDLER
    const handleOpen = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGlobalAnimating) return;

        // 1. Save Context
        const scrollEl = document.querySelector('main');
        if (scrollEl) getVaultStore().setLastScrollPosition(scrollEl.scrollTop);

        // 2. Full Hydration for Header Authority
        const fullBook = await db.books.get(reactiveBook.localId) || reactiveBook;
        getVaultStore().setActiveBook(fullBook);
        getVaultStore().prefetchBookEntries(bookId);

        // 3. Animation & Navigation
        setIsInternalAnimating(true);
        getVaultStore().setGlobalAnimating(true);
        router.push(`?tab=books&id=${bookId}`);
        onOpen(fullBook);

        setTimeout(() => {
            setIsInternalAnimating(false);
            getVaultStore().setGlobalAnimating(false);
        }, 500);
    }, [bookId, reactiveBook, router, isGlobalAnimating, onOpen]);

    return (
        <motion.div 
            ref={elementRef}
            layoutId={`book-hero-${bookId}`}
            onClick={handleOpen}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
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
                "p-5 md:p-8 cursor-pointer overflow-hidden flex flex-col h-[210px] md:h-[280px]",
                "transition-all duration-500 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]",
                isActive ? "border-orange-500/50 shadow-orange-500/10" : "relative z-30"
            )}
            style={{ zIndex: isInternalAnimating ? 100 : 30 }}
        >
            {/* Background Studio Decor */}
            <div className="absolute -right-4 -top-4 md:-right-6 md:-top-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} className="md:w-[160px] text-orange-500" strokeWidth={1} />
            </div>

            {/* Header: Identity & Icon */}
            <div className="flex justify-between items-start relative z-10 gap-2">
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
                    <span className="text-[7.5px] md:text-[9px] font-black text-green-500 flex items-center gap-1.5 bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 w-fit shrink-0">
                        <Zap size={9} fill="currentColor" strokeWidth={0} className="animate-pulse" /> 
                        ID: {toBn(String(bookId).slice(-6).toUpperCase(), language)}
                    </span>
                    <h3 className="text-[15px] md:text-xl font-black text-[var(--text-main)] truncate group-hover:text-orange-500 transition-colors mt-0.5">
                        {reactiveBook.name}
                    </h3>
                </div>
                
                <div className="w-10 h-10 md:w-16 md:h-16 apple-card bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {displayImage && isVisible ? (
                        isImageLoading ? <Loader2 size={16} className="text-blue-500 animate-spin" /> :
                        previewUrl || displayImage.startsWith('http') ? <img src={previewUrl || displayImage} className="w-full h-full object-cover" /> :
                        <ImageIcon size={20} className="text-slate-800" />
                    ) : <Wallet size={20} className="text-orange-500 opacity-20" />}
                </div>
            </div>

            {/* Financial Stats Area */}
            <div className="mt-auto relative z-10 space-y-0.5 md:space-y-1">
                <p className="text-[7px] md:text-[9px] font-black text-[var(--text-muted)] opacity-40">
                    {t('net_asset') || "TOTAL SURPLUS"}
                </p>
                
                <div className={cn(
                    "text-[22px] md:text-3xl font-mono-finance font-black flex items-baseline gap-1",
                    isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                    <span className="text-xs md:text-base opacity-50 font-sans font-bold">{currencySymbol}</span>
                    <span className="leading-none">{toBn(Math.abs(balance).toLocaleString(), language)}</span>
                </div>
            </div>

            {/* Footer Actions & Metadata */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className="text-[6px] md:text-[7px] font-black text-[var(--text-muted)]  opacity-30">
                        {t('label_last_updated')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-orange-500 opacity-60" />
                        <span className="text-[9px] md:text-[11px] font-black text-[var(--text-main)] ">
                            {getTimeAgo(reactiveBook.updatedAt, language, t)}
                        </span>
                    </div>
                </div>

                <Tooltip text={t('tt_quick_add')}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onQuickAdd(reactiveBook); }} 
                        className="w-9 h-9 md:w-12 md:h-12 bg-[var(--bg-app)] hover:bg-orange-500 border border-[var(--border)] hover:border-orange-500/50 apple-card flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all active:scale-90 shadow-lg group/btn"
                    >
                        <Plus size={20} strokeWidth={3.5} className="group-hover/btn:rotate-90 transition-transform" />
                    </button>
                </Tooltip>
            </div>
        </motion.div>
    );
});

BookCard.displayName = 'BookCard';
export default BookCard;