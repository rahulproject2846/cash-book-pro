"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, History, LayoutGrid, Shield
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip'; 
import { useGuidance } from '@/hooks/useGuidance'; 

// --- Types & Interfaces (অপরিবর্তিত) ---
interface DashboardLayoutProps {
    children: React.ReactNode;
    activeSection: 'books' | 'reports' | 'timeline' | 'settings' | 'profile';
    setActiveSection: (section: any) => void;
    onLogout: () => void;
    currentUser: any; 
    currentBook: any; 
    onBack: () => void;
    onFabClick: () => void;
    onEditBook?: () => void;
    onOpenShare?: () => void;
    onOpenExport?: () => void;
    onOpenAnalytics?: () => void;
    onDeleteBook?: () => void;
}

const NAV_ITEMS = [
    { id: 'books', name: 'nav_dashboard', icon: Book },
    { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
    { id: 'timeline', name: 'nav_timeline', icon: History },
    { id: 'settings', name: 'nav_system', icon: Settings },
] as const;

// --- 1. Smart Tooltip Component ---
const SmartTooltip = ({ text, visible }: { text: string, visible: boolean }) => (
    <AnimatePresence>
        {visible && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg shadow-xl z-[1001] whitespace-nowrap"
            >
                {text}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
            </motion.div>
        )}
    </AnimatePresence>
);

// --- 2. Desktop Sidebar Component (Refactored) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook, isCompact }: any) => {
    const { T, t } = useTranslation();
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 88 : 280 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120, damping: 15 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-[500] shadow-2xl transition-colors duration-300"
        >
            <button 
                onClick={() => setCollapsed(!collapsed)} 
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full w-7 h-7 flex items-center justify-center shadow-lg text-[var(--text-muted)] hover:text-orange-500 transition-all z-[600]"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`h-[var(--header-height,7rem)] flex items-center ${collapsed ? 'justify-center' : 'pl-8'} border-b border-[var(--border-color)] transition-all`}>
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">V</div>
                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                        <h1 className="text-xl font-black uppercase italic text-[var(--text-main)] whitespace-nowrap">
                            {T('vault_pro') || "Vault Pro"}
                        </h1>
                    </div>
                </div>
            </div>

            <div className={`flex-1 py-[var(--app-gap,2.5rem)] px-4 space-y-[var(--app-gap,0.75rem)] overflow-y-auto no-scrollbar`}>
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const navBtn = (
                        <button 
                            key={item.id} 
                            onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} 
                            className={`w-full flex items-center h-[var(--input-height,3.5rem)] transition-all duration-300 group relative ${collapsed ? 'justify-center rounded-2xl' : 'px-5 rounded-2xl gap-4'} ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}
                        >
                            <item.icon size={isCompact ? 18 : 22} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <span className="text-[13px] font-black uppercase tracking-[0.15em] whitespace-nowrap">{T(item.name)}</span>
                            </div>
                        </button>
                    );
                    return collapsed ? <Tooltip key={item.id} text={T(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                })}
            </div>

            <div className="p-[var(--card-padding,1.5rem)] border-t border-[var(--border-color)]">
                <button onClick={onLogout} className={`flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}>
                    <LogOut size={20} /> 
                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">{T('nav_signout')}</span>
                    </div>
                </button>
            </div>
        </motion.div>
    );
};

// --- 3. Mobile Bottom Navigation (Guidance Integrated) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook, activeGuidanceStep }: any) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { T, t } = useTranslation();
    
    // Guidance Tooltip Logic
    const showFabTooltip = activeGuidanceStep === 1;
    const showReportTooltip = activeGuidanceStep === 2;
    const showSettingsTooltip = activeGuidanceStep === 3;

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            setIsVisible(current < lastScrollY || current < 50);
            setLastScrollY(current);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { window.removeEventListener('scroll', handleScroll); };
    }, [lastScrollY]);

    const NavIcon = ({ id, icon: Icon, tooltipKey }: any) => {
        const isActive = active === id;
        const isTooltipVisible = (id === 'reports' && showReportTooltip) || (id === 'settings' && showSettingsTooltip);
        
        return (
            <div className="relative">
                <SmartTooltip text={T(tooltipKey)} visible={Boolean(isTooltipVisible)} />
                <button 
                    onClick={() => { setActive(id); if (onResetBook) onResetBook(); }} 
                    className={`flex flex-col items-center justify-center w-10 h-10 relative transition-all ${isActive ? 'text-orange-500' : 'text-slate-400'}`}
                >
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                        <motion.div 
                            layoutId="activeDot"
                            className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                        />
                    )}
                </button>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring", damping: 20 }}
                    className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
                >
                    <div className="bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border-color)] h-[72px] rounded-[28px] shadow-2xl flex items-center justify-between px-8 relative">
                        <div className="flex gap-6">
                            <NavIcon id="books" icon={LayoutGrid} tooltipKey="nav_dashboard" />
                            <NavIcon id="reports" icon={BarChart2} tooltipKey="nav_analytics" />
                        </div>
                        <div className="relative -top-6">
                            <SmartTooltip text={t('tt_add_entry')} visible={showFabTooltip} />
                            <motion.button 
                                onClick={onFabClick}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                animate={{ 
                                    boxShadow: ["0 0 0px rgba(249, 115, 22, 0)", "0 0 20px rgba(249, 115, 22, 0.4)", "0 0 0px rgba(249, 115, 22, 0)"],
                                    scale: [1, 1.03, 1] 
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-16 h-16 bg-orange-500 rounded-[24px] flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-xl"
                            >
                                <Plus size={32} strokeWidth={3.5} />
                            </motion.button>
                        </div>
                        <div className="flex gap-6">
                            <NavIcon id="timeline" icon={History} tooltipKey="nav_timeline" />
                            <NavIcon id="settings" icon={Settings} tooltipKey="nav_system" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- 4. Main Layout Orchestrator ---
export const DashboardLayout = (props: DashboardLayoutProps) => {
    const { children, activeSection, setActiveSection, onLogout, currentUser, currentBook, onBack, onFabClick } = props;
    const [collapsed, setCollapsed] = useState(false);
    const [isShielded, setIsShielded] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    const prefs = currentUser?.preferences || {};
    const { T, t } = useTranslation();
    const activeGuidanceStep = useGuidance(activeSection); 

    useEffect(() => {
        const root = document.documentElement;
        if (prefs.isMidnight) {
            if (theme !== 'dark') setTheme('dark');
            root.classList.add('midnight-mode');
        } else root.classList.remove('midnight-mode');
        
        if (prefs.compactMode) root.classList.add('compact-deck');
        else root.classList.remove('compact-deck');
    }, [prefs.isMidnight, prefs.compactMode, theme, setTheme]);

    useEffect(() => {
        if (!prefs.autoLock) { setIsShielded(false); return; }
        const handleBlur = () => setIsShielded(true);
        const handleFocus = () => setIsShielded(false);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        return () => { window.removeEventListener('blur', handleBlur); window.removeEventListener('focus', handleFocus); };
    }, [prefs.autoLock]);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden transition-colors duration-500">
            <Sidebar 
                active={activeSection} setActive={setActiveSection} onLogout={onLogout} 
                collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={onBack}
                isCompact={prefs.compactMode}
            />
            
            <main className={`flex-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${collapsed ? 'md:ml-[88px]' : 'md:ml-[280px]'} w-full relative z-[10]`}>
                <DynamicHeader {...props} collapsed={collapsed} theme={theme} setTheme={setTheme} />

                <div className={`w-full max-w-[1920px] mx-auto transition-all duration-300 px-[var(--app-padding,1rem)] md:px-[var(--app-padding,2.5rem)] ${currentBook && activeSection === 'books' ? 'pt-[var(--header-height,7.5rem)] px-0' : 'pt-[var(--header-height,7rem)]'} pb-32`}>
                    {children}
                </div>
            </main>
            
            <BottomNav 
                active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={onBack} 
                activeGuidanceStep={activeGuidanceStep} 
            />

            <AnimatePresence>
                {isShielded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center text-white">
                        <div className="w-20 h-20 bg-orange-500 rounded-[30px] flex items-center justify-center mb-6 shadow-2xl">
                            <Shield size={40} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                            {T('session_shield')?.toUpperCase()} Active
                        </h2>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[3px] mt-2">
                            {t('protocol_locked') || "Protocol locked for your privacy"}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};