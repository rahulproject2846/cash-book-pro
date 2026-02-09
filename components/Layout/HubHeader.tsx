"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন cn utility

interface HubHeaderProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    children?: React.ReactNode;
    showSearch?: boolean;
}

export const HubHeader = ({ 
    title, subtitle, icon: Icon, 
    searchQuery = "", onSearchChange, 
    children, showSearch = true 
}: HubHeaderProps) => {
    const { t } = useTranslation();
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false); 

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={cn(
            "sticky top-[4.5rem] md:top-20 z-[300] bg-[var(--bg-app)]/80 backdrop-blur-xl transition-all duration-300 w-auto mb-4",
            "mx-[-1.25rem] md:mx-[-2.5rem]", // Negative margins
            isScrolled && "shadow-xl border-b border-[var(--border)]"
        )}>
            <div className={cn("py-4 px-[1.25rem] md:px-[2.5rem]")}>
                <div className="flex items-center justify-between gap-3 h-12 relative w-full">
                    
                    {/* LEFT: IDENTITY */}
                    <motion.div 
                        animate={{ opacity: isSearchExpanded ? 0 : 1 }}
                        className={cn("items-center gap-4 min-w-0", isSearchExpanded ? "hidden" : "flex")}
                    >
                        <div className={cn(
                            "hidden md:flex bg-orange-500 rounded-[22px] items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300",
                            isScrolled ? "w-10 h-10 rounded-[16px]" : "w-12 h-12"
                        )}>
                            <Icon size={isScrolled ? 20 : 24} strokeWidth={2.5} />
                        </div>
                        <div className="truncate transition-all duration-300">
                            <h2 className={cn(
                                "font-black text-[var(--text-main)] uppercase tracking-tighter leading-none transition-all",
                                isScrolled ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                            )}>{title}</h2>
                            <p className="text-[8px] md:text-[9px] font-black text-orange-500 uppercase tracking-[2px] mt-1">
                                {subtitle}
                            </p>
                        </div>
                    </motion.div>

                    {/* RIGHT: COMMANDS & SEARCH */}
                    <div className={cn("flex items-center gap-2", isSearchExpanded ? "flex-1" : "flex-1 justify-end")}>
                        {showSearch && onSearchChange && (
                            <div className="hidden md:block relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                <input 
                                    placeholder={t('search_placeholder')} 
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className={cn(
                                        "w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] pl-12 pr-4 text-[10px] font-bold uppercase outline-none focus:border-orange-500/40 shadow-inner text-[var(--text-main)] transition-all",
                                        isScrolled ? "h-10 text-[9px]" : "h-11"
                                    )}
                                />
                            </div>
                        )}

                        {/* Mobile Expandable Search */}
                        <AnimatePresence>
                            {isSearchExpanded && showSearch && (
                                <motion.div 
                                    initial={{ width: 0, opacity: 0 }} 
                                    animate={{ width: "100%", opacity: 1 }} 
                                    exit={{ width: 0, opacity: 0 }}
                                    className="md:hidden relative flex-1"
                                >
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                    <input 
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                        className="w-full h-12 bg-[var(--bg-card)] border border-orange-500/40 rounded-[22px] pl-12 pr-12 text-[11px] font-bold uppercase outline-none text-[var(--text-main)]"
                                    />
                                    <button onClick={() => { setIsSearchExpanded(false); onSearchChange?.(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--bg-app)] rounded-full text-red-500">
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={cn("flex items-center gap-2 shrink-0", isSearchExpanded && "hidden")}>
                            {showSearch && (
                                <button onClick={() => setIsSearchExpanded(true)} className="md:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]">
                                    <Search size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};