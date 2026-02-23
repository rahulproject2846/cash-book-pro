"use client";
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { 
    Plus, BookOpen, Loader2, Zap, Wallet, Clock, ShieldCheck, RefreshCcw, ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { useBootStatus } from '@/lib/vault/store/storeHelper';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn, getTimeAgo } from '@/lib/utils/helpers';

// --- 📦 OPTIMIZED BOOK LIST ITEM WITH REACT.MEMO ---
interface BookListItemProps {
    book: any;
    onClick: (book: any) => void;
    onQuickAdd: (book: any) => void;
    balance: number;
    currencySymbol: string;
    lang: string;
    t: (key: string) => string;
    isDimmed?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

// 🎯 VIEWPORT SNIPER TRIGGER HOOK
const useViewportSniper = (bookId: string, imageSrc: string) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!elementRef.current || hasTriggered) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    
                    // 🎯 TRIGGER SNIPER FETCH IF IMAGE IS CID_ OR UNDEFINED
                    const isCid = typeof imageSrc === 'string' && imageSrc.startsWith('cid_');
                    const isMissing = !imageSrc;
                    const shouldFetch = isCid || isMissing;
                    
                    if (shouldFetch) {
                        // 🎯 SNIPER FETCH IS NOW HANDLED BY useLocalPreview HOOK
                        // Store is passive - no direct hydration calls
                        setHasTriggered(true);
                    }
                }
            },
            {
                threshold: 0.1, // Trigger when 10% visible
                rootMargin: '50px' // Start loading 50px before visible
            }
        );

        observer.observe(elementRef.current);

        return () => observer.disconnect();
    }, [bookId]);

    return { elementRef, isVisible, hasTriggered };
};

// 🎯 IMAGE STATE HOOK
const useImageState = (imageSrc: string, isVisible: boolean, hasTriggered: boolean) => {
    const { previewUrl, isLoading: isPreviewLoading, error: previewError } = useLocalPreview(imageSrc);
    
    // Determine image state
    const isCidImage = imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('cid_');
    const isHttpImage = imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('http');
    const isLoading = isVisible && isCidImage && !hasTriggered && !isHttpImage;
    const isLoaded = isHttpImage || (isCidImage && hasTriggered && previewUrl);
    const hasError = isCidImage && hasTriggered && previewError;

    return {
        previewUrl,
        isPreviewLoading,
        previewError,
        isLoading,
        isLoaded,
        hasError,
        isCidImage,
        isHttpImage
    };
};

// 🛡️ MEMOIZED BOOK LIST ITEM
const BookListItem = React.memo<BookListItemProps>(({ 
    book, 
    onClick, 
    onQuickAdd, 
    balance, 
    currencySymbol, 
    lang, 
    t,
    isDimmed = false,
    onMouseEnter,
    onMouseLeave
}) => {
    // ✅ CRITICAL: Identity & Keys - Use reactKey priority
    const bookId = book.reactKey || book._id || book.localId;
    const isPositive = balance >= 0;
    
    // 🎯 VIEWPORT SNIPER TRIGGER
    const { elementRef, isVisible, hasTriggered } = useViewportSniper(bookId, book.image || book.mediaCid);
    
    // 🎯 IMAGE STATE MANAGEMENT
    const imageState = useImageState(book.image || book.mediaCid, isVisible, hasTriggered);
    const { previewUrl, isLoading, isLoaded, hasError, isCidImage, isHttpImage } = imageState;

    // 🎨 RENDER IMAGE WITH FALLBACKS - PRESERVE CURRENT LOGIC
    const renderImage = () => {
        // HTTP Image - Direct render
        if (isHttpImage && book.image) {
            return (
                <img 
                    src={book.image} 
                    alt="Book cover" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        console.warn(`🚨 [IMAGE] Failed to load HTTP image for book ${bookId}`);
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            );
        }

        // CID Image - Sniper loading states
        if (isCidImage) {
            if (isLoading) {
                // 🎯 LOADING STATE - Subtle shimmer
                return (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
                        <div className="flex flex-col items-center gap-1">
                            <Loader2 size={16} className="text-blue-500 animate-spin" />
                            <span className="text-[8px] text-gray-500 font-medium">Loading...</span>
                        </div>
                    </div>
                );
            }

            if (isLoaded && previewUrl) {
                // ✅ LOADED STATE - Show preview
                return (
                    <img 
                        src={previewUrl} 
                        alt="Book cover" 
                        className="w-full h-full object-cover"
                    />
                );
            }

            if (hasError) {
                // ❌ ERROR STATE - Permanent fallback
                return (
                    <div className="w-full h-full flex items-center justify-center bg-red-50 border border-red-100">
                        <div className="flex flex-col items-center gap-1">
                            <ImageIcon size={16} className="text-red-400" />
                            <span className="text-[8px] text-red-500 font-medium">No Image</span>
                        </div>
                    </div>
                );
            }

            // 🎯 NOT IN VIEWPORT YET - Placeholder
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-200">
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <ImageIcon size={16} className="text-gray-400" />
                        <span className="text-[8px] text-gray-500 font-medium">Image</span>
                    </div>
                </div>
            );
        }

        // 🎯 NO IMAGE - Default placeholder
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Wallet size={20} className="md:w-6 text-orange-500 opacity-20 group-hover:opacity-60 transition-opacity" />
            </div>
        );
    };

    return (
        <motion.div 
            ref={elementRef}
            layout 
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClick(book)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={cn(
                "group relative bg-[var(--bg-card)] apple-card border border-[var(--border)]",
                "p-5 md:p-8 cursor-pointer overflow-hidden flex flex-col h-[210px] md:h-[280px]",
                "transition-all duration-500 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]",
                "relative z-30"
            )}
            data-book-id={bookId} // 🎯 FOR INTERSECTION OBSERVER
        >
            {/* Background Studio Decor */}
            <div className="absolute -right-4 -top-4 md:-right-6 md:-top-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} className="md:w-[160px] text-orange-500" strokeWidth={1} />
            </div>

            {/* Header: Identity & Icon */}
            <div className="flex justify-between items-start relative z-10 gap-2">
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
                    <span className="text-[7.5px] md:text-[9px] font-black text-green-500 uppercase tracking-tight flex items-center gap-1.5 bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 w-fit shrink-0">
                        <Zap size={9} fill="currentColor" strokeWidth={0} className="animate-pulse" /> 
                        ID: {toBn(String(bookId).slice(-6).toUpperCase(), lang)}
                    </span>
                    <h3 className="text-[15px] md:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter truncate group-hover:text-orange-500 transition-colors mt-0.5">
                        {book.name}
                    </h3>
                </div>
                
                {/* 🎯 OPTIMIZED IMAGE CONTAINER */}
                <div className={cn(
                    "w-10 h-10 md:w-16 md:h-16 apple-card",
                    "bg-[var(--bg-app)] border border-[var(--border)]",
                    "flex items-center justify-center overflow-hidden shrink-0 shadow-inner"
                )}>
                    {renderImage()}
                </div>
            </div>

            {/* ✅ PRESERVED: Financial Stats Area with Net Asset Label */}
            <div className="mt-auto relative z-10 space-y-0.5 md:space-y-1">
                {/* ✅ CRITICAL: Net Asset Label */}
                <p className="text-[7px] md:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">
                    {t('net_asset') || "TOTAL SURPLUS"}
                </p>
                
                <div className={cn(
                    "text-[22px] md:text-3xl font-mono-finance font-black tracking-tighter flex items-baseline gap-1",
                    isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                    <span className="text-xs md:text-base opacity-50 font-sans font-bold">{currencySymbol}</span>
                    <span className="leading-none">{toBn(Math.abs(balance).toLocaleString(), lang)}</span> {/* ✅ PRESERVED: toLocaleString() */}
                </div>
            </div>

            {/* Footer Actions & Metadata */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className="text-[6px] md:text-[7px] font-black text-[var(--text-muted)] uppercase tracking-tight opacity-30">
                        {t('label_last_updated')}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Clock size={10} className="text-orange-500 opacity-60" />
                        <span className="text-[9px] md:text-[11px] font-black text-[var(--text-main)] uppercase tracking-wider">
                            {getTimeAgo(book.updatedAt, lang, t)}
                        </span>
                    </div>
                </div>

                <Tooltip text={t('tt_quick_add')}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onQuickAdd(book); }} 
                        className={cn(
                            "w-9 h-9 md:w-12 md:h-12 bg-[var(--bg-app)] hover:bg-orange-500",
                            "border border-[var(--border)] hover:border-orange-500/50 apple-card",
                            "flex items-center justify-center text-[var(--text-muted)] hover:text-white",
                            "transition-all active:scale-90 shadow-lg group/btn"
                        )}
                    >
                        <Plus size={20} strokeWidth={3.5} className="group-hover/btn:rotate-90 transition-transform" />
                    </button>
                </Tooltip>
            </div>
        </motion.div>
    );
});

BookListItem.displayName = 'BookListItem';

// --- 🛰️ OPTIMIZED MASTER COMPONENT: BOOKS LIST ---
interface BooksListProps {
    onAddClick: () => void;
    onBookClick: (book: any) => void;
    onQuickAdd: (book: any) => void;
    getBookBalance: (bookId: string) => number;
    currencySymbol?: string;
}

// 🛡️ MEMOIZED BOOKS LIST
const BooksList = React.memo<BooksListProps>(({ 
    onAddClick, 
    onBookClick, 
    onQuickAdd, 
    getBookBalance,
    currencySymbol = "৳"
}) => {
    const { t, language } = useTranslation();
    
    // 🎯 HOVER STATE MANAGEMENT
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    
    // 🎯 ZUSTAND STORE INTEGRATION
    const { filteredBooks, isLoading: isStoreLoading, pendingDeletion } = useVaultState();
    const { isSystemInitializing } = useBootStatus();

    // 🛡️ STABLE EVENT HANDLERS WITH useCallback
    const handleBookClick = useCallback((book: any) => {
        onBookClick(book);
    }, [onBookClick]);

    const handleQuickAdd = useCallback((book: any) => {
        onQuickAdd(book);
    }, [onQuickAdd]);

    const handleAddClick = useCallback(() => {
        onAddClick();
    }, [onAddClick]);

    // 🎯 MEMOIZED BALANCE GETTER - USE REAL STORE DATA
    const getBalance = useCallback((book: any) => {
        // ✅ REAL BALANCE: Use store's getBookBalance function
        const bookId = book.reactKey || book._id || book.localId;
        const { getBookBalance } = getVaultStore();
        return getBookBalance(String(bookId));
    }, []);

    // LOADING STATE CHECK
    if (isSystemInitializing) {
        return (
            <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <span className="text-[10px] font-black uppercase tracking-tight">{t('synchronizing_hub')}</span>
            </div>
        );
    }

    // 🕵️ VISUAL AUDIT: Log rendering books
    console.log('🕵️ [VISUAL AUDIT] Rendering Books:', filteredBooks.length);
    console.log('Current Hovered ID:', hoveredId);

    return (
        <motion.div layoutId="main-container" className="w-full relative z-20 isolate">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10 mt-2 md:mt-6 md:px-8 lg:px-10">
                <AnimatePresence>
                    
                    {/* DYNAMIC ADD CARD LOGIC */}
                    {(filteredBooks.length === 0 || typeof window !== 'undefined') && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            whileHover={{ y: -6, scale: 1.02, zIndex: 50, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddClick} 
                            className={cn(
                                "h-[210px] md:h-[280px] apple-card border-2 border-dashed relative z-30",
                                "border-orange-500/20 hover:border-orange-500 flex flex-col items-center justify-center",
                                "text-orange-500 cursor-pointer hover:bg-orange-500/[0.02] transition-all group shrink-0",
                                filteredBooks.length > 0 ? "hidden md:flex" : "flex" 
                            )}
                        >
                            <div className="w-12 h-12 md:w-20 md:h-20 apple-card bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                                <Plus size={36} strokeWidth={3.5} />
                            </div>
                            <span className="text-[8px] md:text-[12px] font-black uppercase tracking-tight text-center px-6 leading-relaxed">
                                {t('initialize_ledger') || "INITIALIZE"}
                            </span>
                        </motion.div>
                    )}

                    {/* 🎯 OPTIMIZED BOOK LIST RENDERING - PRESERVE KEY LOGIC */}
                    {filteredBooks?.map((b: any, index: number) => {
                        const bookId = b._id || b.localId || `temp-key-${index}`;
                        return (
                            <BookListItem 
                                key={bookId}
                                book={b} 
                                onClick={handleBookClick} 
                                onQuickAdd={handleQuickAdd} 
                                balance={getBalance(b)} // ✅ PRESERVED: Complex balance logic
                                currencySymbol={currencySymbol} 
                                lang={language}
                                t={t}
                                isDimmed={hoveredId !== null && hoveredId !== bookId || (pendingDeletion?.bookId === bookId)}
                                onMouseEnter={() => setHoveredId(bookId)}
                                onMouseLeave={() => setHoveredId(null)}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* End of Hub Footer Signal */}
            <div className="mt-16 mb-10 flex flex-col items-center opacity-5 group-hover:opacity-20 transition-all duration-1000">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-4" />
                <ShieldCheck size={20} strokeWidth={1} />
            </div>
        </motion.div>
    );
});

BooksList.displayName = 'BooksList';

export { BooksList, BookListItem };
