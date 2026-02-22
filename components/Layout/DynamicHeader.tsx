"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, UserCog, 
    LogOut, ShieldCheck, BarChart3, User, Zap
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { useVaultStore } from '@/lib/vault/store/index';
import { Tooltip } from '@/components/UI/Tooltip';
import { SafeButton } from '@/components/UI/SafeButton';
import { useModal } from '@/context/ModalContext';

export const DynamicHeader = () => {
    const { t } = useTranslation();
    const [showSuperMenu, setShowSuperMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const bookIdFromUrl = searchParams.get('id');

    const headerRef = useRef<HTMLElement | null>(null);

    const {
        activeSection,
        activeBook,
        setActiveBook,
        setActiveSection,
        registerOverlay,
        unregisterOverlay,
        setDynamicHeaderHeight,
    } = useVaultState();

    const { deleteBook } = useVaultStore();

    const currentSection = activeSection || 'books';

    const safeT = (key: string, fallbackKey: string) => {
        const value = t(key);
        if (value === key) return t(fallbackKey);
        return value;
    };

    // 🎯 AUTONOMOUS MODAL ACCESS - NO MORE DEAD PROPS
    const { openModal } = useModal();

    const { theme, setTheme } = useTheme();

    const [currentUser, setCurrentUser] = useState<any>(null);
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('cashbookUser');
            if (savedUser) setCurrentUser(JSON.parse(savedUser));
        } catch {
            setCurrentUser(null);
        }
    }, []);

    // 🖼️ PROFILE IMAGE PREVIEW - HOISTED TO TOP
    const userProfilePreview = useLocalPreview(currentUser?.image);

    // 📱 DETECT MOBILE
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 🎯 AUTONOMOUS ACTION HANDLERS
    const handleFabClick = () => {
        if (activeBook) {
            openModal('addEntry', { currentBook: activeBook });
        } else {
            openModal('addBook');
        }
    };

    const handleLogout = () => {
        const { orchestrator } = require('@/lib/vault/core/SyncOrchestrator');
        orchestrator.logout();
    };

    useEffect(() => {
        if (!headerRef.current) return;
        if (typeof ResizeObserver === 'undefined') return;

        let lastHeight = -1;
        const observer = new ResizeObserver(() => {
            if (!headerRef.current) return;
            const height = headerRef.current.getBoundingClientRect().height;
            if (!Number.isFinite(height)) return;

            // Avoid render loops due to sub-pixel jitter
            const rounded = Math.round(height * 10) / 10;
            if (Math.abs(rounded - lastHeight) < 0.5) return;
            lastHeight = rounded;
            setDynamicHeaderHeight(rounded);
        });

        observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, [setDynamicHeaderHeight, bookIdFromUrl]);

    // Optimized Menu Handler (Closes menus after action)
    const handleAction = (action: () => void) => {
        setShowSuperMenu(false); 
        setShowUserMenu(false);
        if (action) action(); 
    };

    // 🎯 CENTRALIZED MENU STATE
    const openSuperMenu = () => {
        setShowSuperMenu(true);
        registerOverlay('SuperMenu');
    };

    const closeSuperMenu = () => {
        setShowSuperMenu(false);
        unregisterOverlay('SuperMenu');
    };

    const openUserMenu = () => {
        setShowUserMenu(true);
        registerOverlay('UserMenu');
    };

    const closeUserMenu = () => {
        setShowUserMenu(false);
        unregisterOverlay('UserMenu');
    };

    // 🎯 CONDITIONAL RENDERING LOGIC - AFTER ALL HOOKS
    const isBookActive = !!activeBook;
    const isGlobalView = !isBookActive;

    return (
        <motion.header 
            ref={headerRef as any}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "grid-area-header sticky top-0 z-[100] w-full bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border)]",
                "flex justify-between items-center",
                isBookActive ? "py-3 px-6" : "py-6 px-8"
            )}
        >
            <div className="flex items-center gap-4">
                {/* --- LEFT SECTION: BRANDING & TITLES --- */}
                <div className="flex items-center gap-4">
                    {/* Mobile Brand Logo */}
                    {isGlobalView && (
                        <div className="md:hidden flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/30">V</div>
                            <h1 className="text-xl font-black uppercase italic text-[var(--text-main)] tracking-tighter leading-none">
                                {t('vault_pro_split_1')}<span className="text-orange-500">{t('vault_pro_split_2')}</span>
                            </h1>
                        </div>
                    )}
                </div>

                {/* Contextual Title Logic with Morphic Transitions */}
                {isBookActive ? (
                    <motion.div 
                        layoutId={`book-title-${activeBook?._id || activeBook?.localId || 'active'}`}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="flex items-center gap-4 relative z-50"
                    >
                        <Tooltip text={t('tt_back_dashboard')}>
                            <SafeButton
                                actionId="header-back"
                                onAction={() => {
                                    setActiveBook(null);
                                    router.push('?');
                                }}
                                variant="ghost"
                                size="sm"
                                className="p-3 bg-[var(--bg-app)] border border-[var(--border)] apple-card text-[var(--text-muted)] hover:text-orange-500 shadow-sm"
                                shakeOnBlock={false}
                            >
                                <ChevronLeft size={20} strokeWidth={3}/>
                            </SafeButton>
                        </Tooltip>
                        <motion.div 
                            layoutId="book-title-content"
                            className="min-w-0"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)] truncate max-w-[150px] md:max-w-xs">
                                {activeBook?.name || t('ledger_hub')}
                            </h2>
                            <motion.div 
                                layoutId="book-status"
                                className="flex items-center gap-2 mt-1"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            >
                                <ShieldCheck size={12} className="text-green-500" strokeWidth={3} />
                                <p className="text-[9px] font-black text-green-500 uppercase tracking-[2.5px] opacity-80">
                                    {t('protocol_active')}
                                </p>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                ) : (
                    // TITLE STATE: Normal title display
                    <motion.div 
                        layoutId="header-branding"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="text-left hidden md:block"
                    >
                        <motion.h2 
                            layoutId="global-title"
                            className="text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)]"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                            {currentSection === 'books'
                                ? safeT('financial_dashboard', 'nav_dashboard')
                                : safeT(`nav_${currentSection}`, 'nav_dashboard')}
                        </motion.h2>
                        <motion.div 
                            layoutId="global-status"
                            className="flex items-center gap-2 mt-2"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] opacity-60">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                             </p>
                        </motion.div>
                    </motion.div>
                )}
            </div>
            
            {/* --- RIGHT SECTION: OS CONTROLS --- */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                
                {/* Primary Action Button (Add Entry/Vault) */}
                <Tooltip text={activeBook ? t('tt_add_entry') : t('tt_initialize_ledger')} position="bottom">
                    <SafeButton
                        actionId="header-add-entry"
                        onAction={handleFabClick}
                        variant="primary"
                        size="md"
                        className="hidden md:flex items-center gap-3 px-6 py-3.5"
                        loadingText="Adding..."
                        blockedText="System Busy"
                    >
                        <Plus size={18} strokeWidth={3.5} /> 
                        {activeBook && currentSection === 'books' ? t('btn_new_entry') : t('btn_create_vault')}
                    </SafeButton>
                </Tooltip>

                {/* Theme Toggle */}
                <Tooltip text={t('tt_toggle_theme')} position="bottom">
                    <SafeButton
                        actionId="header-theme-toggle"
                        onAction={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        variant="ghost"
                        size="sm"
                        className="p-3.5 rounded-2xl border border-[var(--bg-app)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-orange-500 shadow-sm"
                        shakeOnBlock={false}
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                    </SafeButton>
                </Tooltip>

                {/* Contextual Menus */}
                {isBookActive ? (
                    // Book Context Menu
                    <div className="relative inline-flex items-center justify-center">
                        <Tooltip text={t('tt_more_options')} position="bottom">
                            <SafeButton
                                actionId="header-menu"
                                onAction={() => setShowSuperMenu(!showSuperMenu)}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "p-3.5 rounded-2xl border transition-all shadow-sm",
                                    showSuperMenu 
                                        ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                                        : "bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500"
                                )}
                                shakeOnBlock={false}
                            >
                                <MoreVertical size={20} strokeWidth={2.5} />
                            </SafeButton>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showSuperMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499] pointer-events-none" onClick={() => setShowSuperMenu(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        className="absolute right-0 top-16 w-72 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden"
                                    >
                                        <div className="px-5 py-3 border-b border-[var(--border)] mb-1 flex items-center justify-between opacity-60">
                                            <span className="text-[8px] font-black uppercase tracking-[3px]">{t('action_quick_protocol')}</span>
                                            <Zap size={10} fill="currentColor" />
                                        </div>
                                        
                                        {[
                                            { label: 'nav_analytics', icon: BarChart3, color: 'text-blue-500', bg: 'hover:bg-blue-500/10', action: () => openModal('analytics', { currentBook: activeBook }) },
                                            { label: 'action_share_access', icon: Share2, color: 'text-purple-500', bg: 'hover:bg-purple-500/10', action: () => openModal('share', { currentBook: activeBook }) },
                                            { label: 'action_export_report', icon: Download, color: 'text-green-500', bg: 'hover:bg-green-500/10', action: () => openModal('export', { currentBook: activeBook }) },
                                            { label: 'action_edit_ledger', icon: Edit2, color: 'text-yellow-500', bg: 'hover:bg-yellow-500/10', action: () => openModal('editBook', { currentBook: activeBook }) },
                                        ].map((item) => (
                                            <button key={item.label} onClick={() => handleAction(item.action)} className={cn("w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] group", item.bg)}>
                                                <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5} /> 
                                                <span className="group-hover:text-[var(--text-main)]">{t(item.label)}</span>
                                            </button>
                                        ))}
                                        
                                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-50" />
                                        
                                        <button onClick={() => handleAction(() => {
                                            if (!activeBook) return;
                                            openModal('deleteConfirm', { 
                                              targetName: activeBook.name, 
                                              title: "modal_terminate_book_title",
                                              desc: "modal_terminate_book_desc",
                                              onConfirm: async () => {
                                                const result = await deleteBook(activeBook);
                                                if (result.success) {
                                                  router.push('/?tab=books');
                                                }
                                              }
                                            });
                                        })} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all text-left text-red-500 hover:bg-red-500/10 hover:text-red-600">
                                            <Trash2 size={18} strokeWidth={2.5} /> <span>{t('action_terminate_vault')}</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    // User Profile Menu
                    <div className="relative">
                        <Tooltip text={t('tt_account_settings')} position="bottom">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} 
                                className={cn(
                                    "w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-black",
                                    "flex items-center justify-center text-white text-lg font-black",
                                    "border border-[var(--border)] overflow-hidden transition-all active:scale-90 shadow-lg",
                                    showUserMenu ? "ring-4 ring-orange-500/20 border-orange-500" : ""
                                )}
                            >
                                {userProfilePreview.previewUrl ? (
                                    <img src={userProfilePreview.previewUrl} alt="U" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="opacity-80">{(currentUser?.username?.charAt(0) || "U").toUpperCase()}</span>
                                )}
                            </button>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499] pointer-events-none" onClick={() => setShowUserMenu(false)} />
                                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-16 w-64 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden">
                                        <button onClick={() => handleAction(() => setActiveSection('profile'))} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-blue-500/10 hover:text-blue-500">
                                            <User size={18} strokeWidth={2.5} /> <span>{t('action_account_settings')}</span>
                                        </button>
                                        <div className="mt-2 pt-2 border-t border-[var(--border)] opacity-30 mx-4" />
                                        <button onClick={() => handleAction(handleLogout)} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10 hover:text-red-600">
                                            <LogOut size={18} strokeWidth={2.5} /> <span>{t('nav_signout')}</span>
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
