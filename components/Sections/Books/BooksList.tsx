"use client";
import React from 'react';
import { 
    Plus, BookOpen, Loader2, Zap, Wallet, Clock, ShieldCheck, RefreshCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn, toBn, getTimeAgo } from '@/lib/utils/helpers';

// --- 📦 SUB-COMPONENT: ELITE VAULT CARD ---
const BookListItem = ({ book, onClick, onQuickAdd, balance, currencySymbol, lang, t }: any) => {
    const bookId = book.reactKey || book._id || book.localId;
    const isPositive = balance >= 0;
    const { previewUrl, isLoading: isPreviewLoading, error: previewError } = useLocalPreview(book.image);

    return (
        <motion.div 
            layout 
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClick(book)}
            className={cn(
                "group relative bg-[var(--bg-card)] rounded-[35px] md:rounded-[40px] border border-[var(--border)]",
                "p-5 md:p-8 cursor-pointer overflow-hidden flex flex-col h-[210px] md:h-[280px]",
                "transition-all duration-500 shadow-xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)]"
            )}
        >
            {/* Background Studio Decor (Adjusted for Mobile Clarity) */}
            <div className="absolute -right-4 -top-4 md:-right-6 md:-top-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
                <BookOpen size={130} className="md:w-[160px] text-orange-500" strokeWidth={1} />
            </div>

            {/* Header: Identity & Icon */}
            <div className="flex justify-between items-start relative z-10 gap-2">
                <div className="flex flex-col gap-1 md:gap-1.5 min-w-0">
                    <span className="text-[7.5px] md:text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1.5 bg-green-500/5 px-2 py-1 rounded-lg border border-green-500/10 w-fit shrink-0">
                        <Zap size={9} fill="currentColor" strokeWidth={0} className="animate-pulse" /> 
                        ID: {toBn(String(bookId).slice(-6).toUpperCase(), lang)}
                    </span>
                    <h3 className="text-[15px] md:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter truncate group-hover:text-orange-500 transition-colors mt-0.5">
                        {book.name}
                    </h3>
                </div>
                
                <div className={cn(
                    "w-10 h-10 md:w-16 md:h-16 rounded-[18px] md:rounded-[28px]",
                    "bg-[var(--bg-app)] border border-[var(--border)]",
                    "flex items-center justify-center overflow-hidden shrink-0 shadow-inner"
                )}>
                    {book.image ? (
                        // 🚀 PRIORITY: Check for Cloudinary URL first (after sync)
                        book.image.startsWith('http') ? (
                            // Direct Cloudinary URL - no preview needed
                            <img src={book.image} alt="V" className="w-full h-full object-cover" />
                        ) : book.image.startsWith('cid_') ? (
                            // Handle CID images with instant preview
                            isPreviewLoading ? (
                                <Loader2 size={16} className="text-orange-500 animate-spin" />
                            ) : previewError ? (
                                <Wallet size={16} className="text-red-500 opacity-40" />
                            ) : previewUrl ? (
                                <img src={previewUrl} alt="V" className="w-full h-full object-cover" />
                            ) : (
                                <RefreshCcw size={16} className="text-blue-500 animate-spin opacity-60" />
                            )
                        ) : (
                            // Handle other/empty images
                            <Wallet size={20} className="md:w-6 text-orange-500 opacity-20 group-hover:opacity-60 transition-opacity" />
                        )
                    ) : (
                        <Wallet size={20} className="md:w-6 text-orange-500 opacity-20 group-hover:opacity-60 transition-opacity" />
                    )}
                </div>
            </div>

            {/* Financial Stats Area (Design Fix for Mobile Overlap) */}
            <div className="mt-auto relative z-10 space-y-0.5 md:space-y-1">
                <p className="text-[7px] md:text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] opacity-40">
                    {t('net_asset') || "TOTAL SURPLUS"}
                </p>
                <div className={cn(
                    "text-[22px] md:text-3xl font-mono-finance font-black tracking-tighter flex items-baseline gap-1",
                    isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                    <span className="text-xs md:text-base opacity-50 font-sans font-bold">{currencySymbol}</span>
                    <span className="leading-none">{toBn(Math.abs(balance).toLocaleString(), lang)}</span>
                </div>
            </div>

            {/* Footer Actions & Metadata */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-[var(--border)]/50 flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-0.5 md:gap-1">
                    <span className="text-[6px] md:text-[7px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-30">
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
                            "border border-[var(--border)] hover:border-orange-500/50 rounded-[14px] md:rounded-[18px]",
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
};

// --- 🛰️ MASTER COMPONENT: BOOKS LIST ---
export const BooksList = ({ 
    books = [], isLoading, onAddClick, onBookClick, onQuickAdd, getBookBalance, 
    currencySymbol = "৳"
}: any) => {
    const { t, language } = useTranslation();

    if (isLoading) return (
        <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20">
            <Loader2 className="animate-spin text-orange-500" size={48} />
            <span className="text-[10px] font-black uppercase tracking-[5px]">{t('synchronizing_hub')}</span>
        </div>
    );

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-10 mt-2 md:mt-6 md:px-8 lg:px-10">
                <AnimatePresence mode="popLayout">
                    
                    {/* 🔥 ফিক্স ১: ডাইনামিক অ্যাড কার্ড লজিক */}
                    {/* মোবাইল এ বই থাকলে এটি দেখাবে না (hidden md:flex) | বই না থাকলে সবার জন্যই দেখাবে */}
                    {(books.length === 0 || typeof window !== 'undefined') && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            whileHover={{ y: -6 }}
                            onClick={onAddClick} 
                            // কন্ডিশনাল ক্লাস: বই থাকলে মোবাইলে হাইড করো
                            className={cn(
                                "h-[210px] md:h-[280px] rounded-[35px] md:rounded-[40px] border-2 border-dashed",
                                "border-orange-500/20 hover:border-orange-500 flex flex-col items-center justify-center",
                                "text-orange-500 cursor-pointer hover:bg-orange-500/[0.02] transition-all group shrink-0",
                                books.length > 0 ? "hidden md:flex" : "flex" 
                            )}
                        >
                            <div className="w-12 h-12 md:w-20 md:h-20 rounded-[22px] md:rounded-[28px] bg-orange-500/10 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all duration-700 shadow-2xl">
                                <Plus size={36} strokeWidth={3.5} />
                            </div>
                            <span className="text-[8px] md:text-[12px] font-black uppercase tracking-[4px] text-center px-6 leading-relaxed">
                                {t('initialize_ledger') || "INITIALIZE"}
                            </span>
                        </motion.div>
                    )}

                    {/* Book List Rendering */}
                    {books?.map((b: any) => (
                        <BookListItem 
                            key={b.localId || b.reactKey || b._id} 
                            book={b} 
                            onClick={onBookClick} 
                            onQuickAdd={onQuickAdd} 
                            balance={getBookBalance(b.reactKey || b._id || b.localId)} 
                            currencySymbol={currencySymbol} 
                            lang={language}
                            t={t}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* End of Hub Footer Signal */}
            {books.length > 2 && (
                <div className="mt-16 mb-10 flex flex-col items-center opacity-5 group-hover:opacity-20 transition-all duration-1000">
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mb-4" />
                    <ShieldCheck size={20} strokeWidth={1} />
                </div>
            )}
        </div>
    );
};