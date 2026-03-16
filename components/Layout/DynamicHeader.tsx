"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, User, Zap, ShieldCheck, BarChart3, SlidersHorizontal, Search, ArrowUpDown, UploadCloud, X,
    Settings2, Fingerprint, AlertTriangle, Shield, Activity, Wifi, Calendar, BookOpen, PencilLine
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { cn, toBn } from '@/lib/utils/helpers';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useVaultState, getVaultStore } from '@/lib/vault/store/storeHelper';
import { useVaultStore } from '@/lib/vault/store/index';
import { Tooltip } from '@/components/UI/Tooltip';
import { SafeButton } from '@/components/UI/SafeButton';
import { useModal } from '@/context/ModalContext';
import { useThemeTransition } from '@/hooks/useThemeTransition';
import { TimeRangeSelector } from '@/components/TimeRangeSelector';
import { getOrchestrator } from '@/lib/vault/core/SyncOrchestrator';

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
    const { theme } = useTheme();
    const { openModal } = useModal();
    
    // 🎨 Theme Transition Hook - Telegram-style circular reveal
    const { executeThemeTransition } = useThemeTransition();

    // 🚀 STABLE STORE ACCESS
    const {
        activeSection, activeBook, setActiveBook, setActiveSection,
        registerOverlay, unregisterOverlay, setDynamicHeaderHeight,
        activeOverlays, currentUser, logout, // 🛡️ Directly from store
        books, searchQuery, setSearchQuery, // 📚 Books & Search
        sortOption, setSortOption // 📊 Sorting
    } = useVaultState();

    const { deleteBook } = useVaultStore();
    const currentSection = activeSection || 'books';

    // 🖼️ PROFILE IMAGE PREVIEW - Reactive to Store
    const userProfilePreview = useLocalPreview(currentUser?.image, currentUser?.mediaCid);

    // 📱 MOBILE DETECTION
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 🍎 COMMAND BAR STATE
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // 📊 SECTION-SPECIFIC STATE
    const [timeRange, setTimeRange] = useState('30');
    const [systemRisk, setSystemRisk] = useState<{
        systemHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
        highRiskCount: number;
    }>({ systemHealth: 'HEALTHY', highRiskCount: 0 });
    const [lastSynced, setLastSynced] = useState<string>('');

    // Fetch system risk for Profile section
    useEffect(() => {
        if (currentSection === 'profile') {
            const fetchRisk = async () => {
                const risk = await getOrchestrator().getSystemRiskStatus();
                setSystemRisk(risk);
            };
            fetchRisk();
            const interval = setInterval(fetchRisk, 60000);
            return () => clearInterval(interval);
        }
    }, [currentSection]);

    // Fetch last synced for Settings section
    useEffect(() => {
        if (currentSection === 'settings') {
            const { lastSyncedAt } = useVaultStore.getState();
            if (lastSyncedAt && lastSyncedAt !== undefined) {
                const time = new Date(lastSyncedAt).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
                setLastSynced(time);
            }
        }
    }, [currentSection]);

    // Security badge config
    const securityBadge = useMemo(() => {
        const configs = {
            HEALTHY: { text: 'SECURE NODE', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: ShieldCheck },
            WARNING: { text: 'RISK DETECTED', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
            CRITICAL: { text: 'LOCKDOWN', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: Shield },
        };
        return configs[systemRisk.systemHealth] || configs.HEALTHY;
    }, [systemRisk.systemHealth]);

    // 📊 SORT OPTIONS
    const sortOptions = [
        { label: 'Latest Updated', value: 'Activity' },
        { label: 'Oldest', value: 'Oldest' },
        { label: 'Alphabetical (A-Z)', value: 'Alphabetical' },
        { label: 'Highest Balance', value: 'Balance' },
    ];

    // 🎨 UI CONSTANTS
    const isBookActive = !!activeBook;
    const royalGlide = { type: "spring", stiffness: 300, damping: 35, mass: 1 };
    const { language: lang } = useTranslation();

    // 🏆 SECTION CONFIG - Unified Header Configuration
    const getSectionConfig = (section: string, bookActive: boolean) => {
        const configs: Record<string, { title: string; subtitle: string; icon: any; showCommandBar: boolean; showTimeRange?: boolean; showSecurityBadge?: boolean; showSyncStatus?: boolean }> = {
            books: {
                title: 'Ledger Hub',
                subtitle: `${books.length} Active Ledgers`,
                icon: BarChart3,
                showCommandBar: !bookActive,
            },
            reports: {
                title: t('nav_reports') || 'Reports',
                subtitle: `${toBn(timeRange, lang || 'en')} Records Analyzed`,
                icon: BarChart3,
                showCommandBar: false,
                showTimeRange: true,
            },
            timeline: {
                title: 'Transaction Timeline',
                subtitle: 'All Entries',
                icon: Activity,
                showCommandBar: false,
            },
            settings: {
                title: t('nav_system') || 'System Registry',
                subtitle: 'Governance Secured',
                icon: Settings2,
                showCommandBar: false,
                showSyncStatus: true,
            },
            profile: {
                title: t('identity_hub_title') || 'Identity Vault',
                subtitle: 'Encryption Active',
                icon: Fingerprint,
                showCommandBar: false,
                showSecurityBadge: true,
            },
        };
        return configs[section] || configs.books;
    };

    const sectionConfig = getSectionConfig(currentSection, isBookActive);

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

    return (
        <motion.header 
            ref={headerRef}
            layout
            transition={royalGlide as any}
            className={cn(
                "sticky top-0 z-[500] w-full bg-[var(--bg-app)]/80 backdrop-blur-xl",
                "flex justify-between items-center transition-all duration-500",
                // 🔥 FIXED HEIGHT: Always same padding to prevent jumping
                "h-24 md:h-20 px-4 md:px-10" 
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
                            className="flex items-center gap-4 relative z-50"
                        >
                            <Tooltip text={t('tt_back_dashboard')}>
                                <SafeButton
                                    actionId="header-back"
                                    onAction={() => {
                                        setActiveBook(null);
                                        router.push('?tab=books');
                                    }}
                                    variant="ghost"
                                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95"
                                >
                                    <ChevronLeft size={18} strokeWidth={2.5}/>
                                </SafeButton>
                            </Tooltip>
                            
                            {/* Linear Title + Edit */}
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-[--text-xl] md:text-[--text-xl] font-bold text-[var(--text-main)] truncate max-w-[200px] md:max-w-md">
                                    {activeBook?.name}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openModal('editBook', { currentBook: activeBook })}
                                    className="text-[var(--text-muted)] hover:text-orange-500 transition-colors p-1"
                                >
                                    <PencilLine size={20} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        /* --- 🏠 UNIFIED SECTION HEADER --- */
                        <motion.div 
                            key={`section-${currentSection}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={royalGlide  as any}
                            className="flex items-center gap-4"
                        >
                            {/* Section Icon */}
                            <div className="hidden md:flex bg-orange-500 rounded-[22px] items-center justify-center text-white shadow-lg shrink-0 w-12 h-12">
                                <sectionConfig.icon size={20} strokeWidth={2.5} />
                            </div>
                            
                            {/* Section Title & Subtitle */}
                            <div className="flex flex-col text-left">
                                <h2 className="text-[--text-xl] md:text-[--text-xl] font-bold text-[var(--text-main)] leading-none">
                                    {sectionConfig.title}
                                </h2>
                                <p className="text-[--text-xs] font-semibold text-orange-500 mt-0.5">
                                    {sectionConfig.subtitle}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* --- RIGHT SECTION: OS CONTROLS --- */}
            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                
                {/* 🍎 UNIFIED COMMAND BAR (Books Section - Desktop) */}
                {currentSection === 'books' && !isBookActive && (
                    <div className="hidden md:flex items-center gap-3">
                        {/* 🔍 SEARCH PILL */}
                        <AnimatePresence mode="wait">
                            {!isSearchExpanded ? (
                                <motion.button
                                    key="search-closed"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => setIsSearchExpanded(true)}
                                    className="h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] px-4 flex items-center gap-3 text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95"
                                >
                                    <Search size={18} strokeWidth={2} />
                                    <span className="text-[--text-sm] font-medium">Type to search...</span>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="search-open"
                                    initial={{ opacity: 0, width: 44 }}
                                    animate={{ opacity: 1, width: 280 }}
                                    exit={{ opacity: 0, width: 44 }}
                                    className="relative h-12 flex items-center overflow-hidden rounded-full bg-[var(--bg-card)] border border-[var(--border)]"
                                >
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" strokeWidth={2} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchQuery || ''}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                        className="w-full h-full pl-12 pr-10 rounded-full bg-transparent text-[--text-sm] font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-orange-500/40 transition-all"
                                    />
                                    <button onClick={() => { setSearchQuery(''); setIsSearchExpanded(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-red-500">
                                        <X size={16} strokeWidth={2} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 📤 UPLOAD */}
                        <Tooltip text={t('tt_import_ledger')} position="bottom">
                            <button onClick={() => document.getElementById('import-file-input')?.click()} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95">
                                <UploadCloud size={18} strokeWidth={2} />
                            </button>
                        </Tooltip>

                        {/* 📊 SORT */}
                        <div className="relative">
                            <Tooltip text="Sort" position="bottom">
                                <button onClick={() => setIsSortOpen(!isSortOpen)} className={cn("h-12 w-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95", isSortOpen ? "bg-orange-500 text-white border-orange-500" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30")}>
                                    <ArrowUpDown size={18} strokeWidth={2} />
                                </button>
                            </Tooltip>
                            <AnimatePresence>
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[499]" onClick={() => setIsSortOpen(false)} />
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-14 w-48 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl z-[500] p-2 overflow-hidden">
                                            {sortOptions.map((opt) => (
                                                <button key={opt.value} onClick={() => { setSortOption(opt.value); setIsSortOpen(false); }} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-bold transition-all text-left", sortOption === opt.value ? "text-orange-500 bg-orange-500/10" : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]")}>
                                                    <span>{opt.label}</span>
                                                    {sortOption === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 🌓 THEME */}
                        <Tooltip text={t('tt_toggle_theme')} position="bottom">
                            <button onClick={(e) => executeThemeTransition(e)} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95">
                                {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                            </button>
                        </Tooltip>

                        {/* 📊 SECTION-SPECIFIC ACTIONS */}
                        {!isBookActive && currentSection !== 'books' && (
                            <div className="flex items-center gap-2">
                                {/* TIME RANGE SELECTOR (Reports) */}
                                {sectionConfig.showTimeRange && (
                                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
                                )}

                                {/* SECURITY BADGE (Profile) */}
                                {sectionConfig.showSecurityBadge && (
                                    <Tooltip text={`Integrity Level: ${systemRisk.systemHealth}`}>
                                        <div className={cn(
                                            "flex items-center gap-3 px-4 h-12 rounded-2xl border transition-all cursor-help shadow-sm",
                                            "bg-[var(--bg-card)] border-[var(--border)] hover:border-orange-500/30"
                                        )}>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[--text-xs] font-medium text-[var(--text-muted)]">ACCESS</span>
                                                <span className={cn("text-[--text-xs] font-semibold leading-none", securityBadge.color)}>
                                                    {securityBadge.text}
                                                </span>
                                            </div>
                                            <div className={cn("p-1.5 rounded-xl", securityBadge.bg)}>
                                                {React.createElement(securityBadge.icon, { size: 14, className: cn(securityBadge.color, "animate-pulse"), fill: "currentColor", strokeWidth: 0 })}
                                            </div>
                                        </div>
                                    </Tooltip>
                                )}

                                {/* SYNC STATUS (Settings) */}
                                {sectionConfig.showSyncStatus && (
                                    <div className="flex items-center gap-3 px-4 h-12 rounded-2xl border bg-[var(--bg-card)] border-[var(--border)]">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        <span className="text-[--text-xs] font-semibold text-[var(--text-muted)]">
                                            CORE ACTIVE
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 🍎 UNIFIED COMMAND BAR (Books Section - Mobile) */}
                {currentSection === 'books' && !isBookActive && (
                    <div className="md:hidden flex items-center gap-2">
                        {/* 🔍 SEARCH */}
                        <AnimatePresence mode="wait">
                            {!isSearchExpanded ? (
                                <motion.button
                                    key="search-closed"
                                    initial={{ opacity: 0, width: 44 }}
                                    animate={{ opacity: 1, width: 44 }}
                                    exit={{ opacity: 0, width: 44 }}
                                    onClick={() => setIsSearchExpanded(true)}
                                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95"
                                >
                                    <Search size={18} strokeWidth={2} />
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="search-open"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="relative h-12 flex items-center overflow-hidden flex-1"
                                >
                                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" strokeWidth={2} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchQuery || ''}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                        className="w-full h-full pl-10 pr-10 rounded-2xl bg-[var(--bg-card)] border border-orange-500/40 text-[--text-sm] font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none"
                                    />
                                    <button onClick={() => { setSearchQuery(''); setIsSearchExpanded(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-red-500">
                                        <X size={14} strokeWidth={2} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 📤 UPLOAD */}
                        <Tooltip text={t('tt_import_ledger')} position="bottom">
                            <button onClick={() => document.getElementById('import-file-input')?.click()} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95">
                                <UploadCloud size={18} strokeWidth={2} />
                            </button>
                        </Tooltip>

                        {/* 📊 SORT */}
                        <div className="relative">
                            <Tooltip text="Sort" position="bottom">
                                <button onClick={() => setIsSortOpen(!isSortOpen)} className={cn("h-12 w-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95", isSortOpen ? "bg-orange-500 text-white border-orange-500" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30")}>
                                    <ArrowUpDown size={18} strokeWidth={2} />
                                </button>
                            </Tooltip>
                            <AnimatePresence>
                                {isSortOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[499]" onClick={() => setIsSortOpen(false)} />
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-14 w-48 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl z-[500] p-2 overflow-hidden">
                                            {sortOptions.map((opt) => (
                                                <button key={opt.value} onClick={() => { setSortOption(opt.value); setIsSortOpen(false); }} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-bold transition-all text-left", sortOption === opt.value ? "text-orange-500 bg-orange-500/10" : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]")}>
                                                    <span>{opt.label}</span>
                                                    {sortOption === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
                
                {/* ➕ PRIMARY FAB (Desktop Only) - HIDDEN FOR AI STUDIO LOOK */}
                <div className="hidden">
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
                </div>

                {/* 📊 REPORTS ICON - Desktop Only - Book Details Only */}
                {isBookActive && (
                    <Tooltip text={t('nav_analytics')} position="bottom">
                        <button
                            onClick={() => openModal('analytics', { currentBook: activeBook })}
                            className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95"
                        >
                            <BarChart3 size={18} strokeWidth={2} />
                        </button>
                    </Tooltip>
                )}

                {/* 🔗 SHARE ICON - Desktop Only - Book Details Only */}
                {isBookActive && (
                    <Tooltip text={t('action_share_access')} position="bottom">
                        <button
                            onClick={() => openModal('share', { currentBook: activeBook })}
                            className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-purple-500 hover:border-purple-500/30 transition-all active:scale-95"
                        >
                            <Share2 size={18} strokeWidth={2} />
                        </button>
                    </Tooltip>
                )}

                {/* 📥 EXPORT ICON - Desktop Only - Book Details Only */}
                {isBookActive && (
                    <Tooltip text={t('action_export_report')} position="bottom">
                        <button
                            onClick={() => openModal('export', { currentBook: activeBook })}
                            className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-green-500 hover:border-green-500/30 transition-all active:scale-95"
                        >
                            <Download size={18} strokeWidth={2} />
                        </button>
                    </Tooltip>
                )}

                {/* 🌓 THEME TOGGLE - Book View - Desktop Only */}
                {isBookActive && (
                    <Tooltip text={t('tt_toggle_theme')} position="bottom">
                        <button onClick={(e) => executeThemeTransition(e)} className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30 transition-all active:scale-95">
                            {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                        </button>
                    </Tooltip>
                )}

                {/* ⚙️ SETTINGS ICON - Triggers SuperMenu */}
                {isBookActive && (
                    <div className="relative">
                        <button 
                            onClick={() => isOverlayActive('SuperMenu') ? unregisterOverlay('SuperMenu') : registerOverlay('SuperMenu')}
                            className={cn(
                                "h-12 w-12 flex items-center justify-center rounded-2xl border transition-all",
                                isOverlayActive('SuperMenu')
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                                    : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500/30"
                            )}
                        >
                            <SlidersHorizontal size={18} strokeWidth={2} />
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
                                            { label: 'nav_analytics', icon: BarChart3, color: 'text-blue-500', bg: 'hover:bg-blue-500/10', action: () => openModal('analytics', { currentBook: activeBook }), hiddenLg: true },
                                            { label: 'action_share_access', icon: Share2, color: 'text-purple-500', bg: 'hover:bg-purple-500/10', action: () => openModal('share', { currentBook: activeBook }), hiddenLg: true },
                                            { label: 'action_export_report', icon: Download, color: 'text-green-500', bg: 'hover:bg-green-500/10', action: () => openModal('export', { currentBook: activeBook }), hiddenLg: true },
                                            { label: 'tt_toggle_theme', icon: Sun, color: 'text-orange-500', bg: 'hover:bg-orange-500/10', action: () => { executeThemeTransition({ currentTarget: { getBoundingClientRect: () => ({ left: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, top: typeof window !== 'undefined' ? window.innerHeight / 2 : 0, width: 0, height: 0 }) } } as any); }, hiddenLg: false, isThemeToggle: true },
                                            { label: 'action_edit_ledger', icon: Edit2, color: 'text-yellow-500', bg: 'hover:bg-yellow-500/10', action: () => openModal('editBook', { currentBook: activeBook }), hiddenLg: false },
                                        ].map((item) => (
                                            <button key={item.label} onClick={() => handleAction(item.action)} className={cn("w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black rounded-2xl transition-all text-left text-[var(--text-muted)] group", item.bg, item.hiddenLg && "lg:hidden")}>
                                                {item.isThemeToggle ? (
                                                    theme === 'dark' 
                                                        ? <Sun size={18} className={`${item.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
                                                        : <Moon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
                                                ) : (
                                                    <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} strokeWidth={2.5} />
                                                )}
                                                <span className="group-hover:text-[var(--text-main)]">{t(item.label) === 'tt_toggle_theme' ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : t(item.label)}</span>
                                            </button>
                                        ))}
                                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-30" />
                                        <button onClick={() => handleAction(() => {
                                            openModal('deleteConfirm', { 
                                              targetName: activeBook.name, 
                                              title: "modal_terminate_book_title",
                                              onConfirm: () => deleteBook(activeBook, router)
                                            });
                                        })} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                            <Trash2 size={18} strokeWidth={2.5} /> <span>{t('action_terminate_vault')}</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* 👤 USER PROFILE MENU - Dashboard Only */}
                {!isBookActive && (
                    /* 👤 USER PROFILE MENU */
                    <div className="relative">
                        <button 
                            onClick={() => isOverlayActive('UserMenu') ? unregisterOverlay('UserMenu') : registerOverlay('UserMenu')} 
                            className={cn(
                                "w-12 h-12 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center border transition-all active:scale-90 shadow-sm overflow-hidden",
                                isOverlayActive('UserMenu') ? "border-[var(--accent)] ring-4 ring-[var(--accent)]/10" : "border-[var(--border)]"
                            )}
                        >
                            {userProfilePreview.previewUrl ? (
                                <img src={userProfilePreview.previewUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[var(--text-main)] font-black text-lg">{currentUser?.username?.charAt(0).toUpperCase()}</span>
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