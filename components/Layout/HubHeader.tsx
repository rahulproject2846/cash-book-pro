"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, LucideIcon } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const  toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

interface HubHeaderProps {
    title: string;
    subtitle: string; // যেমন: "12 ACTIVE PROTOCOLS"
    icon: LucideIcon;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    children?: React.ReactNode; // ডানের বাটনগুলোর জন্য (Sort, Export etc.)
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
    const fastTransition = { type: "tween", ease: "easeInOut", duration: 0.3 } as const;

    // ১. স্ক্রল ইফেক্ট লজিক
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ২. ডাইনামিক প্যাডিং ও নেগেটিভ মার্জিন (Elite UI Fix)
    const appPaddingX = 'px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)]';
    const appPaddingNegativeX = 'mx-[-1.25rem] md:mx-[-2.5rem]';

    return (
        <div className={`sticky top-[4.5rem] md:top-20 z-[300] bg-[var(--bg-app)]/80 backdrop-blur-xl transition-all duration-300 w-auto ${appPaddingNegativeX} mb-4 ${isScrolled ? 'shadow-xl border-b border-[var(--border)]' : 'border-b border-transparent'}`}>
            
            <div className={`py-4 ${appPaddingX}`}>
                <div className="flex items-center justify-between gap-3 h-12 relative w-full">
                    
                    {/* --- LEFT: IDENTITY SECTION --- */}
                    <motion.div 
                        initial={false}
                        animate={{ 
                            opacity: isSearchExpanded ? 0 : 1,
                            display: isSearchExpanded ? 'none' : 'flex' 
                        }}
                        transition={{ duration: 0.1 }}
                        className="items-center gap-4 min-w-0"
                    >
                        <div className={`hidden md:flex w-12 h-12 bg-orange-500 rounded-[22px] items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isScrolled ? 'w-10 h-10 rounded-[16px] text-sm' : ''}`}>
                            <Icon size={isScrolled ? 20 : 24} strokeWidth={2.5} />
                        </div>
                        <div className="truncate transition-all duration-300">
                            <h2 className={`text-xl md:text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none transition-all ${isScrolled ? 'text-lg md:text-xl' : ''}`}>{title}</h2>
                            <p className="text-[8px] md:text-[9px] font-black text-orange-500 uppercase tracking-[2px] mt-1">
                                {subtitle}
                            </p>
                        </div>
                    </motion.div>

                    {/* --- RIGHT: COMMANDS & SEARCH --- */}
                    <div className={`flex items-center gap-2 ${isSearchExpanded ? 'flex-1' : 'flex-1 justify-end'}`}>
                        
                        {/* Desktop Search */}
                        {showSearch && onSearchChange && (
                            <div className="hidden md:block relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                <input 
                                    placeholder={t('search_placeholder')} 
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className={`w-full h-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] pl-12 pr-4 text-[10px] font-bold uppercase outline-none focus:border-orange-500/40 shadow-inner text-[var(--text-main)] transition-all ${isScrolled ? 'h-10 text-[9px]' : ''}`}
                                />
                            </div>
                        )}

                        {/* Mobile Expandable Search */}
                        <AnimatePresence>
                            {isSearchExpanded && showSearch && onSearchChange && (
                                <motion.div 
                                    initial={{ width: 0, opacity: 0 }} 
                                    animate={{ width: "100%", opacity: 1 }} 
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={fastTransition}
                                    className="md:hidden relative flex-1"
                                >
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                    <input 
                                        autoFocus
                                        placeholder={t('search_placeholder')} 
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="w-full h-12 bg-[var(--bg-card)] border border-orange-500/40 rounded-[22px] pl-12 pr-12 text-[11px] font-bold uppercase outline-none shadow-2xl text-[var(--text-main)]"
                                    />
                                    <button onClick={() => { setIsSearchExpanded(false); onSearchChange(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--bg-app)] rounded-full text-red-500 active:scale-90">
                                        <X size={16} strokeWidth={3} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Custom Buttons Slot (Sort, Export, etc.) */}
                        <div className={`flex items-center gap-2 shrink-0 ${isSearchExpanded ? 'hidden' : 'flex'}`}>
                            {showSearch && (
                                <button onClick={() => setIsSearchExpanded(true)} className="md:hidden h-11 w-11 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 active:scale-90 transition-all">
                                    <Search size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            {children} {/* ডাইনামিক বাটন এখানে বসবে */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};