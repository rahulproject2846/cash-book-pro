"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, User, Zap, ShieldCheck, BarChart3
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { useVaultStore } from '@/lib/vault/store/index';
import { Tooltip } from '@/components/UI/Tooltip';
import { SafeButton } from '@/components/UI/SafeButton';
import { useModal } from '@/context/ModalContext';

/**
 * 🏆 DYNAMIC HEADER V16.0 (PRODUCTION READY)
 * ----------------------------------------------------
 * Fix: Absolute Fixed Height to prevent layout jumps.
 * Identity: Reactive Store-driven Profile.
 * Polish: Premium Apple-style button spacing.
 */
export const DynamicHeader = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const headerRef = useRef<HTMLElement | null>(null);
    const { theme, setTheme } = useTheme();
    const { openModal } = useModal();

    // 🚀 STABLE STORE ACCESS
    const {
        activeSection, activeBook, setActiveBook, setActiveSection,
        registerOverlay, unregisterOverlay, setDynamicHeaderHeight,
        activeOverlays, currentUser, logout // 🛡️ Directly from store
    } = useVaultState();

    const { deleteBook } = useVaultStore();
    const currentSection = activeSection || 'books';

    // 🖼️ PROFILE IMAGE PREVIEW - Reactive to Store
    const userProfilePreview = useLocalPreview(currentUser?.image);

    // 📱 MOBILE DETECTION
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 📏 FIXED HEIGHT SYNC: ResizeObserver for child layout calculation
    useEffect(() => {
        if (!headerRef.current) return;
        const observer = new ResizeObserver(() => {
            const height = headerRef.current?.getBoundingClientRect().height || 0;
            if (height > 0) setDynamicHeaderHeight(height);
        });
        observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, [setDynamicHeaderHeight]);

    // 🎯 ACTION HANDLERS
    const handleFabClick = useCallback(() => {
        if (activeBook) {
            openModal('addEntry', { currentBook: activeBook });
        } else {
            openModal('addBook');
        }
    }, [activeBook, openModal]);

    const handleLogout = useCallback(() => {
        logout(); // 🚀 Clean store logout
    }, [logout]);

    const handleAction = useCallback((action: () => void) => {
        activeOverlays.forEach(id => unregisterOverlay(id));
        if (action) action(); 
    }, [activeOverlays, unregisterOverlay]);

    const isOverlayActive = (id: string) => activeOverlays.includes(id);

    // 🎨 UI CONSTANTS
    const isBookActive = !!activeBook;
    const royalGlide = { type: "spring", stiffness: 300, damping: 35, mass: 1 };

    return (
        <motion.header 
            ref={headerRef}
            layout
            transition={royalGlide as any}
            className={cn(
                "sticky top-0 z-[500] w-full bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border)]",
                "flex justify-between items-center transition-all duration-500",
                // 🔥 FIXED HEIGHT: Always same padding to prevent jumping
                "h-24 md:h-20 px-6 md:px-10" 
            )}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    {isBookActive ? (
                        /* --- 📚 BOOK VIEW HEADER --- */
                        <motion.div 
                            key="book-title"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={royalGlide  as any}
                            className="flex items-center gap-4 relative z-50 w-full"
                        >
                            <Tooltip text={t('tt_back_dashboard')}>
                                <SafeButton
                                    actionId="header-back"
                                    onAction={() => {
                                        setActiveBook(null);
                                        router.push('?tab=books');
                                    }}
                                    variant="ghost"
                                    className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 shadow-sm transition-all"
                                >
                                    <ChevronLeft size={20} strokeWidth={3}/>
                                </SafeButton>
                            </Tooltip>
                            <div className="min-w-0">
                                <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] leading-none truncate">
                                    {activeBook?.name}
                                </h2>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <ShieldCheck size={12} className="text-green-500" strokeWidth={3} />
                                    <p className="text-[9px] font-black text-green-500 opacity-80">
                                        {t('protocol_active')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* --- 🏠 DASHBOARD VIEW HEADER --- */
                        <motion.div 
                            key="global-title"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={royalGlide  as any}
                            className="flex flex-col text-left"
                        >
                            <h2 className="text-2xl font-black text-[var(--text-main)] leading-none">
                                {currentSection === 'books' ? t('financial_dashboard') : t(`nav_${currentSection}`)}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                <p className="text-[9px] font-bold text-[var(--text-muted)] opacity-60">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* --- RIGHT SECTION: OS CONTROLS --- */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                
                {/* ➕ PRIMARY FAB (Desktop Only) */}
                <Tooltip text={isBookActive ? t('tt_add_entry') : t('tt_initialize_ledger')} position="bottom">
                    <SafeButton
                        actionId="header-add-entry"
                        onAction={handleFabClick}
                        variant="primary"
                        className="hidden md:flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={18} strokeWidth={3.5} /> 
                        <span className="text-[11px] font-black  ">
                            {isBookActive ? t('btn_new_entry') : t('btn_create_vault')}
                        </span>
                    </SafeButton>
                </Tooltip>

                {/* 🌓 THEME TOGGLE */}
                <Tooltip text={t('tt_toggle_theme')} position="bottom">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 shadow-sm transition-all active:scale-90"
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                    </button>
                </Tooltip>

                {/* 🍔 CONTEXTUAL MENUS */}
                {isBookActive ? (
                    <div className="relative">
                        <button 
                            onClick={() => isOverlayActive('SuperMenu') ? unregisterOverlay('SuperMenu') : registerOverlay('SuperMenu')}
                            className={cn(
                                "p-4 rounded-2xl border transition-all shadow-sm",
                                isOverlayActive('SuperMenu')
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                                    : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500"
                            )}
                        >
                            <MoreVertical size={20} strokeWidth={2.5} />
                        </button>
                        
                        <AnimatePresence>
                            {isOverlayActive('SuperMenu') && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={() => unregisterOverlay('SuperMenu')} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        className="absolute right-0 top-16 w-72 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden"
                                    >
                                        {[
                                            { label: 'nav_analytics', icon: BarChart3, color: 'text-blue-500', bg: 'hover:bg-blue-500/10', action: () => openModal('analytics', { currentBook: activeBook }) },
                                            { label: 'action_share_access', icon: Share2, color: 'text-purple-500', bg: 'hover:bg-purple-500/10', action: () => openModal('share', { currentBook: activeBook }) },
                                            { label: 'action_export_report', icon: Download, color: 'text-green-500', bg: 'hover:bg-green-500/10', action: () => openModal('export', { currentBook: activeBook }) },
                                            { label: 'action_edit_ledger', icon: Edit2, color: 'text-yellow-500', bg: 'hover:bg-yellow-500/10', action: () => openModal('editBook', { currentBook: activeBook }) },
                                        ].map((item) => (
                                            <button key={item.label} onClick={() => handleAction(item.action)} className={cn("w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black   rounded-2xl transition-all text-left text-[var(--text-muted)] group", item.bg)}>
                                                <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5} /> 
                                                <span className="group-hover:text-[var(--text-main)]">{t(item.label)}</span>
                                            </button>
                                        ))}
                                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-30" />
                                        <button onClick={() => handleAction(() => {
                                            openModal('deleteConfirm', { 
                                              targetName: activeBook.name, 
                                              title: "modal_terminate_book_title",
                                              onConfirm: () => deleteBook(activeBook, router)
                                            });
                                        })} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black   rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                            <Trash2 size={18} strokeWidth={2.5} /> <span>{t('action_terminate_vault')}</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* 👤 USER PROFILE MENU */
                    <div className="relative">
                        <button 
                            onClick={() => isOverlayActive('UserMenu') ? unregisterOverlay('UserMenu') : registerOverlay('UserMenu')} 
                            className={cn(
                                "w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center border transition-all active:scale-90 shadow-lg overflow-hidden",
                                isOverlayActive('UserMenu') ? "border-orange-500 ring-4 ring-orange-500/10" : "border-[var(--border)]"
                            )}
                        >
                            {userProfilePreview.previewUrl ? (
                                <img src={userProfilePreview.previewUrl} alt="U" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-lg">{(currentUser?.username?.charAt(0) || "U").toUpperCase ()}</span>
                            )}
                        </button>
                        
                        <AnimatePresence>
                            {isOverlayActive('UserMenu') && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={() => unregisterOverlay('UserMenu')} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        className="absolute right-0 top-16 w-64 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden"
                                    >
                                        <button  onClick={() => handleAction(() => {setActiveSection('profile');  router.push('?tab=profile');})} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black   rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-orange-500/10 hover:text-orange-500">
                                            <User size={18} strokeWidth={2.5} /> <span>{t('action_account_settings')}</span>
                                        </button>
                                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-30" />
                                        <button onClick={() => handleAction(handleLogout)} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black   rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                            <Zap size={18} strokeWidth={2.5} /> <span>{t('nav_signout')}</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.header>
    );
};