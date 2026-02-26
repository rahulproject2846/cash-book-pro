"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LucideIcon, Check, ArrowDownUp, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { AppleMenu } from '@/components/UI/AppleMenu';

interface HubHeaderProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    children?: React.ReactNode;
    showSearch?: boolean;
    sortOption?: string;
    sortOptions?: string[];
    onSortChange?: (val: string) => void;
    hideIdentity?: boolean;
    fullWidthSearch?: boolean;
}

export const HubHeader = ({ 
    title, subtitle, icon: Icon, 
    searchQuery = "", onSearchChange, 
    children, showSearch = true,
    sortOption, sortOptions, onSortChange,
    hideIdentity = false, fullWidthSearch = false
}: HubHeaderProps) => {
    const { t } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchHasFocus, setSearchHasFocus] = useState(false);

    const { isSearchOpen, toggleSearch, dynamicHeaderHeight } = useVaultState();

    // SCROLL DETECTION
    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (!scrollContainer) return;

        const handleScroll = () => {
            setIsScrolled(scrollContainer.scrollTop > 10);
        };

        handleScroll();
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    // SEARCH PERSISTENCE LOGIC
    const handleSearchBlur = useCallback(() => {
        setSearchHasFocus(false);
        // Only close if user explicitly dismisses (iOS behavior)
        if (!searchQuery) {
            toggleSearch(false);
        }
    }, [searchQuery, toggleSearch]);

    const handleSearchFocus = useCallback(() => {
        setSearchHasFocus(true);
    }, []);

    return (
        <div 
            className={cn(
                "sticky z-[400] bg-(--bg-app)/80 backdrop-blur-xl transition-all duration-300 w-auto mb-4",
                "mx-[-1.25rem] md:mx-[-2.5rem]", // Negative margins
                isScrolled && "shadow-xl border-b border-(--border)"
            )}
            style={{ 
                top: `-1px` // Seam tuck under DynamicHeader border
            }}
        >
            <div className={cn("py-4 px-[1.25rem] md:px-[2.5rem]")}>
                <div className="flex items-center justify-between gap-3 h-12 relative w-full">
                    
                    {/* LEFT: IDENTITY */}
                    {!hideIdentity && (
                        <motion.div 
                            animate={{ opacity: isSearchOpen ? 0 : 1 }}
                            className={cn("items-center gap-4 min-w-0", isSearchOpen ? "hidden" : "flex")}
                        >
                            <div className={cn(
                                "hidden md:flex bg-orange-500 rounded-[22px] items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300",
                                isScrolled ? "w-10 h-10 rounded-[16px]" : "w-12 h-12"
                            )}>
                                <Icon size={isScrolled ? 20 : 24} strokeWidth={2.5} />
                            </div>
                            <div className="truncate transition-all duration-300">
                                <h2 className={cn(
                                    "font-black text-(--text-main) leading-none transition-all",
                                    isScrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                                )}>{title}</h2>
                                <p className="text-[8px] md:text-[9px] font-black text-orange-500    mt-1">
                                    {subtitle}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* RIGHT: COMMANDS & MORPHIC SEARCH */}
                    <div className={cn("flex items-center gap-2", isSearchOpen ? "flex-1" : "flex-1 justify-end")}>
                        {showSearch && onSearchChange && (
                            <div className={cn("hidden md:block relative", fullWidthSearch ? "flex-1" : "flex-1 max-w-md")}>
                                <motion.div
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500"
                                >
                                    <Search size={18} />
                                </motion.div>
                                <input 
                                    placeholder={t('search_placeholder')} 
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    onFocus={handleSearchFocus}
                                    onBlur={handleSearchBlur}
                                    className={cn(
                                        "w-full bg-(--bg-card) border border-(--border) rounded-[22px] pl-12 pr-4 text-[10px] font-bold   outline-none focus:border-orange-500/40 shadow-inner text-(--text-main) transition-all",
                                        isScrolled ? "h-10 text-[9px]" : "h-11"
                                    )}
                                />
                            </div>
                        )}
                        
                        {/* MOBILE MORPHIC SEARCH - THE WOW MOMENT */}
                        <AnimatePresence>
                            {!isSearchOpen ? (
                                // SEARCH ICON STATE - Morphic Source
                                <motion.button
                                    layoutId="hub-search-container"  
                                    onClick={() => toggleSearch(true)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={{ 
                                        rotate: [0, 5, -5, 0], // Subtle wiggle
                                        transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
                                    }}
                                    className="md:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-(--bg-card) border border-(--border) text-(--text-muted)"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    <Search size={20} strokeWidth={2.5} />
                                </motion.button>
                            ) : (
                                // SEARCH INPUT STATE - Morphic Target
                                <motion.div
                                    layoutId="hub-search-container"  
                                    className="md:hidden relative flex-1"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    <motion.div
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" 
                                        layoutId="hub-search-icon-wrapper"
                                    >
                                        <Search size={18} />
                                    </motion.div>
                                    <input
                                        autoFocus={isSearchOpen && !searchHasFocus}
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        onFocus={handleSearchFocus}
                                        onBlur={handleSearchBlur}
                                        placeholder={t('search_placeholder')}
                                        className="w-full h-12 bg-(--bg-card) border border-orange-500/40 rounded-[22px] pl-12 pr-12 text-[11px] font-bold   outline-none text-(--text-main)"
                                    />
                                    {/* Apple-style Clear Button */}
                                    <motion.button
                                        layoutId="hub-search-clear"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => { onSearchChange?.(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-(--bg-app) rounded-full text-red-500"
                                    >
                                        <X size={16} strokeWidth={3} />
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className={cn("flex items-center gap-2 shrink-0", isSearchOpen && "hidden")}>
                            {/* UNIFIED APPLE MENU - SORT */}
                            {sortOption && sortOptions && onSortChange && (
                                <AppleMenu
                                    trigger={
                                        <button 
                                            className={cn(
                                                "h-11 w-11 lg:w-auto lg:px-4 flex items-center justify-center lg:justify-between",
                                                "bg-(--bg-card) border border-(--border) rounded-[20px] transition-all",
                                                "active:scale-95 outline-none shadow-sm",
                                                "text-(--text-muted) hover:border-orange-500/30 hover:text-(--text-main)"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className="transition-colors"
                                                >
                                                    <ArrowDownUp size={16} strokeWidth={2.5} className="opacity-60" />
                                                </motion.div>
                                                <span className="hidden lg:block text-[10px] font-black     truncate max-w-25">
                                                    {sortOption}
                                                </span>
                                            </div>
                                        </button>
                                    }
                                    headerText="ORDERING PROTOCOL"
                                    width="w-48"
                                >
                                    {sortOptions.map((opt) => {
                                        const isSelected = sortOption.toLowerCase() === opt.toLowerCase();
                                        return (
                                            <button
                                                key={opt}
                                                onClick={() => onSortChange(opt)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all mb-1 last:mb-0",
                                                    "text-[10px] font-black    ",
                                                    isSelected 
                                                        ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                        : "text-(--text-muted) hover:bg-(--bg-app) hover:text-(--text-main)"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isSelected && <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" />}
                                                    {opt}
                                                </div>
                                                {isSelected && <Check size={14} strokeWidth={3} className="text-orange-500" />}
                                            </button>
                                        );
                                    })}
                                </AppleMenu>
                            )}
                            
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};