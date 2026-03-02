"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, History, LayoutGrid, Fingerprint, ShieldCheck
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader';
import { useVaultStore } from '@/lib/vault/store';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { useGuidance } from '@/hooks/useGuidance';
import { cn } from '@/lib/utils/helpers';
import SyncProgressBar from '@/components/UI/SyncProgressBar'; // Global Progress Bar
import { ConflictBackgroundService } from '@/lib/vault/ConflictBackgroundService';
import { useRouter } from 'next/navigation';
import { useVaultState } from '@/lib/vault/store/storeHelper';
import { useModal } from '@/context/ModalContext';

const NAV_ITEMS: Array<{ id: string; name: string; icon: any }> = [
    { id: 'books', name: 'nav_dashboard', icon: LayoutGrid },
    { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
    { id: 'timeline', name: 'nav_timeline', icon: History },
    { id: 'settings', name: 'nav_system', icon: Settings },
];

// --- Types ---
interface DashboardLayoutProps {
    children: React.ReactNode;
}

// --- 1. Sidebar Component (Optimized Blur) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook, isCompact }: any) => {
    const { t } = useTranslation();
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 90 : 280 }}
            transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0", 
                // Optimization: Reduced blur for faster rendering
                "border-r border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md",
                "z-[200] transition-all duration-300 ease-out"
            )}
        >
            <button 
                onClick={() => setCollapsed(!collapsed)} 
                className={cn(
                    "absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full",
                    "bg-orange-500 border-4 border-[var(--bg-app)] flex items-center justify-center",
                    "text-white shadow-xl hover:scale-110 active:scale-90 transition-transform z-[600]"
                )}
            >
                {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            <div className={cn("h-28 flex items-center border-b border-[var(--border)]", collapsed ? "justify-center" : "pl-8")}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">V</div>
                    {!collapsed && (
                        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }} className="text-xl font-black     text-[var(--text-main)]">
                            {t('vault_pro_split_1')}<span className="text-orange-500">{t('vault_pro_split_2')}</span>
                        </motion.h1>
                    )}
                </div>
            </div>

            <div className="flex-1 py-10 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const navBtn = (
                        <button 
                            key={item.id} 
                            onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} 
                            className={cn(
                                "w-full flex items-center h-14 transition-all duration-200 group relative",
                                collapsed 
                                    ? "justify-center rounded-[20px] px-0" 
                                    : "px-5 rounded-[20px] gap-4 justify-start",
                                isActive 
                                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" 
                                    : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                            )}
                        >
                            <item.icon size={isCompact ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} />
                            {!collapsed && <span className="text-[11px] font-black     ">{t(item.name)}</span>}
                            {isActive && collapsed && <div className="absolute left-2 w-1 h-6 bg-white rounded-full opacity-50" />}
                        </button>
                    );
                    return collapsed ? <Tooltip key={item.id} text={t(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                })}
            </div>

            <div className="p-6 border-t border-[var(--border)]">
                <button onClick={onLogout} className={cn("flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all", collapsed ? "justify-center" : "px-4 gap-4 w-full")}>
                    <LogOut size={20} strokeWidth={2.5} /> 
                    {!collapsed && <span className="text-[10px] font-black    ">{t('nav_signout')}</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- 2. Mobile Bottom Nav (Optimized Rendering) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook, fabTooltip, mainContainerRef }: any) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        const handleScroll = () => {
            const current = mainContainerRef?.current?.scrollTop || 0;
            setIsVisible(current < lastScrollY || current < 50);
            setLastScrollY(current);
        };
        
        const container = mainContainerRef?.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [lastScrollY, mainContainerRef]);

    const NavIcon = ({ id, icon: Icon }: any) => {
        const isActive = active === id;
        return (
            <button 
                onClick={() => { setActive(id); if (onResetBook) onResetBook(); }} 
                className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-90",
                    isActive ? "text-orange-500" : "text-[var(--text-muted)] opacity-60"
                )}
            >
                <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                {isActive && <motion.div layoutId="activeDot" className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full" />}
            </button>
        );
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }}
                    className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
                >
                    <div className="bg-[var(--bg-card)]/95 backdrop-blur-lg border border-[var(--border)] h-[72px] rounded-[35px] shadow-2xl flex items-center justify-between px-6 relative">
                        <div className="flex gap-5">
                            <NavIcon id="books" icon={LayoutGrid} />
                            <NavIcon id="reports" icon={BarChart2} />
                        </div>
                        
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                            <Tooltip text={fabTooltip || t('fab_add_book')} position="left">
                                <button 
                                    onClick={onFabClick}
                                    className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-lg relative z-20 active:scale-90 transition-transform"
                                >
                                    <Plus size={32} strokeWidth={4} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="flex gap-5">
                            <NavIcon id="timeline" icon={History} />
                            <NavIcon id="settings" icon={Settings} />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- 3. Dashboard Layout Main (Merged Logic & Simple Animation) ---
export const DashboardLayout = (props: any) => {
    const { children } = props;
    const [collapsed, setCollapsed] = useState(false);
    const [isShielded, setIsShielded] = useState(false);
    const { theme, setTheme } = useTheme();
    const mainContainerRef = useRef<HTMLElement>(null);
    const router = useRouter();
    const { openModal } = useModal();

    const { activeSection, setActiveSection, activeBook, setActiveBook, preferences } = useVaultState();
    const { t } = useTranslation();

    const prefs = preferences || {};

    // Generate context-aware tooltip text
    const getFabTooltip = () => {
        if (activeBook) return t('fab_add_entry'); // "Add Entry"
        if (activeSection === 'books') return t('fab_add_book'); // "Add Book"
        return t('fab_add_book'); // Default to "Add Book"
    };

    const handleLogout = async () => {
        const { logout } = useVaultStore.getState();
        await logout();
    };

    const handleBack = () => {
        setActiveBook(null);
        router.push('?');
    };

    const handleFabClick = () => {
        if (activeBook) {
            openModal('addEntry', { currentBook: activeBook });
        } else {
            openModal('addBook');
        }
    };

    // 🔥 Optimization: Merged Theme, Midnight, and Compact Mode Effects
    useEffect(() => {
        const root = document.documentElement;
        
        // Handle Theme/Midnight
        if (prefs.isMidnight) {
            if (theme !== 'dark') setTheme('dark');
            root.classList.add('midnight-mode');
        } else {
            root.classList.remove('midnight-mode');
        }
        
        // Handle Compact Mode
        if (prefs.compactMode) root.classList.add('compact-deck');
        else root.classList.remove('compact-deck');

        // Handle Session Shield Auto-Lock Logic
        if (!prefs.autoLock) {
            setIsShielded(false);
        } else {
            // CRITICAL: Only activate shield when window loses focus, not immediately
            const handleBlur = () => {
                setTimeout(() => setIsShielded(true), 500); // 500ms delay to prevent accidental triggers
            };
            const handleFocus = () => setIsShielded(false);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);
            return () => {
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('focus', handleFocus);
            };
        }
    }, [prefs.isMidnight, prefs.compactMode, prefs.autoLock, theme, setTheme]);

    // Initialize ConflictBackgroundService to keep timers alive across sessions
    useEffect(() => {
        ConflictBackgroundService.getInstance().restoreFromStorage();
        
        // 🚀 MEDIA QUEUE TRIGGER: Start processing any pending uploads on app mount
        if (typeof window !== 'undefined' && (window as any).mediaStore) {
            (window as any).mediaStore.getState().processQueue();
        }
    }, []);

    return (
        <div 
            className="h-screen bg-[var(--bg-app)]" 
            style={{ 
                display: 'grid', 
                gridTemplateColumns: collapsed ? '90px 1fr' : '280px 1fr',
                gridTemplateRows: 'auto 1fr',
                gridTemplateAreas: '"sidebar header" "sidebar main"' 
            }}
        >
            {/* Sidebar Column */}
            <div style={{ gridArea: 'sidebar' }}>
                <Sidebar 
                    active={activeSection} 
                    setActive={setActiveSection} 
                    onLogout={handleLogout} 
                    collapsed={collapsed} 
                    setCollapsed={setCollapsed}
                    isCompact={prefs.compactMode}
                    onResetBook={handleBack}
                />
            </div>
            
            {/* Header Area */}
            <div style={{ gridArea: 'header' }}>
                <DynamicHeader />
            </div>
            
            {/* Main Content Area */}
            <main 
                ref={mainContainerRef}
                style={{ gridArea: 'main' }} 
                className="overflow-y-auto custom-scrollbar h-full relative bg-[var(--bg-app)]"
            >
                {/* Mobile Bottom Nav */}
                <BottomNav 
                    active={activeSection} 
                    setActive={setActiveSection} 
                    onFabClick={handleFabClick} 
                    onResetBook={handleBack} 
                    fabTooltip={getFabTooltip()}
                    mainContainerRef={mainContainerRef}
                />
                
                {children}
            </main>
            
            {/* Shield Overlay */}
            <AnimatePresence mode="wait">
                {isShielded && activeSection !== 'settings' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-10000 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center text-white"
                    >
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 35, mass: 1 }} className="w-24 h-24 bg-orange-500 rounded-[35px] flex items-center justify-center mb-8">
                            <Fingerprint size={56} strokeWidth={2} />
                        </motion.div>
                        <h2 className="text-3xl font-black  ">{t('session_shield')}</h2>
                        <p className="text-[10px] font-bold text-white/40    mt-4 flex items-center gap-2">
                            <ShieldCheck size={12} /> {t('protocol_locked')}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
