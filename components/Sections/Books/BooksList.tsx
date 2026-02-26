"use client";
import React, { useState, useCallback } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import BookCard from './BookCard'; // 🚀 আমরা এখন আলাদা ফাইল ব্যবহার করব

interface BooksListProps {
    onAddClick: () => void;
    onBookClick: (book: any) => void;
    onQuickAdd: (book: any) => void;
    getBookBalance: (bookId: string) => number;
    currencySymbol?: string;
}

const BooksList = React.memo<BooksListProps>(({ 
    onAddClick, 
    onBookClick, 
    onQuickAdd, 
    currencySymbol = "৳"
}) => {
    const { t, language } = useTranslation();
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { filteredBooks, activeBook } = useVaultState();

    // 🎯 BALANCE GETTER
    const getBalance = useCallback((book: any) => {
        const bookId = book.localId || book._id || book.cid;
        return getVaultStore().getBookBalance(String(bookId));
    }, []);

    return (
        <motion.div 
            layoutId="main-container" 
            className="w-full relative z-20 isolate"
            initial="hidden"
            animate="show"
        >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10 mt-2 md:mt-6 md:px-8 lg:px-10">
                <AnimatePresence>
                    
                    {/* ➕ START NEW LEDGER CARD */}
                    {!activeBook && (
                        <motion.div 
                            key="dummy-add-card"
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            whileHover={{ y: -6, scale: 1.02, zIndex: 50 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onAddClick} 
                            className={cn(
                                "h-[210px] md:h-[280px] apple-card border-2 border-dashed relative z-30",
                                "border-orange-500/20 hover:border-orange-500 flex flex-col items-center justify-center",
                                "text-orange-500 cursor-pointer hover:bg-orange-500/[0.02] transition-all group shrink-0"
                            )}
                        >
                            <div className="w-12 h-12 md:w-20 md:h-20 apple-card bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                                <Plus size={36} strokeWidth={3.5} />
                            </div>
                            <span className="text-[8px] md:text-[12px] font-black     text-center px-6 leading-relaxed">
                                {t('initialize_ledger') || "START NEW LEDGER"}
                            </span>
                        </motion.div>
                    )}

                    {/* 📚 THE MASTER BOOK CARDS */}
                    {filteredBooks?.map((b: any, index: number) => {
                        const bookKey = b.cid ? `book-${b.cid}` : `book-local-${b.localId || index}`;
                        return (
                            <BookCard 
                                key={bookKey}
                                book={b} 
                                onOpen={onBookClick} 
                                onQuickAdd={onQuickAdd}
                                balance={getBalance(b)}
                                currencySymbol={currencySymbol} 
                                isDimmed={hoveredId !== null && hoveredId !== bookKey}
                                onMouseEnter={() => setHoveredId(bookKey)}
                                onMouseLeave={() => setHoveredId(null)}
                                currentUser={null} // Will be handled by store inside BookCard
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* END SIGNAL */}
            <div className="mt-16 mb-10 flex flex-col items-center opacity-5 group-hover:opacity-20 transition-all duration-1000">
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-4" />
                <ShieldCheck size={20} strokeWidth={1} />
            </div>
        </motion.div>
    );
});

BooksList.displayName = 'BooksList';
export { BooksList };