"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, History, LayoutGrid, Fingerprint, ShieldCheck
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { useGuidance } from '@/hooks/useGuidance';
import { cn } from '@/lib/utils/helpers';

// --- Types ---
interface DashboardLayoutProps {
    children: React.ReactNode;
    activeSection: 'books' | 'reports' | 'timeline' | 'settings' | 'profile';
    setActiveSection: (section: any) => void;
    onLogout: () => void;
    currentUser: any; 
    currentBook: any; 
    onBack: () => void;
    onFabClick: () => void;
}

const NAV_ITEMS = [
    { id: 'books', name: 'nav_dashboard', icon: Book },
    { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
    { id: 'timeline', name: 'nav_timeline', icon: History },
    { id: 'settings', name: 'nav_system', icon: Settings },
] as const;

// --- 1. Sidebar Component (Optimized Blur) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook, isCompact }: any) => {
    const { t } = useTranslation();
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 90 : 280 }}
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0", 
                // Optimization: Reduced blur for faster rendering
                "border-r border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md",
                "z-[500] transition-all duration-300 ease-out"
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
                        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black uppercase italic text-[var(--text-main)] tracking-tighter">
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
                            {!collapsed && <span className="text-[11px] font-black uppercase tracking-[3px]">{t(item.name)}</span>}
                            {isActive && collapsed && <div className="absolute left-2 w-1 h-6 bg-white rounded-full opacity-50" />}
                        </button>
                    );
                    return collapsed ? <Tooltip key={item.id} text={t(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                })}
            </div>

            <div className="p-6 border-t border-[var(--border)]">
                <button onClick={onLogout} className={cn("flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all", collapsed ? "justify-center" : "px-4 gap-4 w-full")}>
                    <LogOut size={20} strokeWidth={2.5} /> 
                    {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">{t('nav_signout')}</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- 2. Mobile Bottom Nav (Optimized Rendering) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { t } = useTranslation();

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            setIsVisible(current < lastScrollY || current < 50);
            setLastScrollY(current);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

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
                    transition={{ duration: 0.2 }}
                    className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
                >
                    <div className="bg-[var(--bg-card)]/95 backdrop-blur-lg border border-[var(--border)] h-[72px] rounded-[35px] shadow-2xl flex items-center justify-between px-6 relative">
                        <div className="flex gap-5">
                            <NavIcon id="books" icon={LayoutGrid} />
                            <NavIcon id="reports" icon={BarChart2} />
                        </div>
                        
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                            <button 
                                onClick={onFabClick}
                                className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-lg relative z-20 active:scale-90 transition-transform"
                            >
                                <Plus size={32} strokeWidth={4} />
                            </button>
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
    const { children, activeSection, setActiveSection, onLogout, currentUser, currentBook, onBack, onFabClick } = props;
    const [collapsed, setCollapsed] = useState(false);
    const [isShielded, setIsShielded] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    const prefs = currentUser?.preferences || {};
    const { t } = useTranslation();

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
            const handleBlur = () => setIsShielded(true);
            const handleFocus = () => setIsShielded(false);
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);
            return () => {
                window.removeEventListener('blur', handleBlur);
                window.removeEventListener('focus', handleFocus);
            };
        }
    }, [prefs.isMidnight, prefs.compactMode, prefs.autoLock, theme, setTheme]);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-300 overflow-x-hidden">
            <Sidebar 
                active={activeSection} setActive={setActiveSection} onLogout={onLogout} 
                collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={onBack}
                isCompact={prefs.compactMode}
            />
            
            <main className={cn(
                "flex-1 transition-all duration-300 ease-out w-full relative z-[10]",
                collapsed ? "md:ml-[90px]" : "md:ml-[280px]"
            )}>
                <DynamicHeader {...props} collapsed={collapsed} theme={theme} setTheme={setTheme} />

                <div className={cn(
                    "w-full max-w-[1920px] mx-auto transition-all duration-200",
                    "px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] pb-40",
                    currentBook && activeSection === 'books' 
                        ? "pt-[6rem] md:pt-[7rem] px-0 md:px-0"  
                        : "pt-[5.5rem] md:pt-[7rem]"
                )}>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeSection + (currentBook?._id || '')}
                            // 🔥 Optimization: Using simple tween & opacity for fast loading
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={onBack} />

            <AnimatePresence>
                {isShielded && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center text-white"
                    >
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-orange-500 rounded-[35px] flex items-center justify-center mb-8">
                            <Fingerprint size={56} strokeWidth={2} />
                        </motion.div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t('session_shield')}</h2>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[4px] mt-4 flex items-center gap-2">
                            <ShieldCheck size={12} /> {t('protocol_locked')}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};