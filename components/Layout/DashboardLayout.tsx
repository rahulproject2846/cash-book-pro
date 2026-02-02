"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, History, LayoutGrid 
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader';

// --- Types & Interfaces ---
interface DashboardLayoutProps {
    children: React.ReactNode;
    activeSection: 'books' | 'reports' | 'timeline' | 'settings';
    setActiveSection: (section: 'books' | 'reports' | 'timeline' | 'settings') => void;
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

// --- Unified Navigation Config ---
const NAV_ITEMS = [
    { id: 'books', name: 'Dashboard', icon: Book },
    { id: 'reports', name: 'Analytics', icon: BarChart2 },
    { id: 'timeline', name: 'Timeline', icon: History },
    { id: 'settings', name: 'System', icon: Settings },
] as const;

// --- 1. Desktop Sidebar Component (Fixed Toggle Position) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook }: any) => {
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 88 : 280 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 120, damping: 15 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-[500] shadow-2xl"
        >
            {/* Toggle Button MOVED HERE: Vertically Centered relative to entire sidebar */}
            <button 
                onClick={() => setCollapsed(!collapsed)} 
                className="absolute -right-3 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full w-7 h-7 flex items-center justify-center shadow-lg text-[var(--text-muted)] hover:text-orange-500 hover:border-orange-500 hover:scale-110 transition-all z-[600]"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo Section */}
            <div className={`h-22 flex items-center ${collapsed ? 'justify-center' : 'pl-8'} border-b border-[var(--border-color)] transition-all`}>
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/20">
                        V
                    </div>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>
                        <h1 className="text-xl font-black uppercase italic text-[var(--text-main)] whitespace-nowrap">
                            Vault Pro
                        </h1>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 py-10 px-4 space-y-3 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    return (
                        <button 
                            key={item.id} 
                            onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} 
                            className={`
                                w-full flex items-center h-14 transition-all duration-300 group relative
                                ${collapsed ? 'justify-center rounded-2xl' : 'px-5 rounded-2xl gap-4'}
                                ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}
                            `}
                        >
                            <item.icon size={22} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            
                            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <span className="text-[13px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                                    {item.name}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Logout Section */}
            <div className="p-6 border-t border-[var(--border-color)]">
                <button onClick={onLogout} className={`flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-xl transition-all ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}>
                    <LogOut size={20} />
                    <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                        <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Sign Out</span>
                    </div>
                </button>
            </div>
        </motion.div>
    );
};

// --- 2. Mobile Bottom Navigation (Fix: Cut Issue & Interactive Pulse) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring", damping: 20 }}
                    className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
                >
                    {/* Main Nav Container - Removed overflow-hidden to fix FAB clipping */}
                    <div className="bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border-color)] h-[72px] rounded-[28px] shadow-2xl shadow-black/20 flex items-center justify-between px-6 relative">
                        
                        <div className="flex gap-6">
                            <NavIcon id="books" icon={LayoutGrid} active={active} setActive={setActive} onReset={onResetBook} />
                            <NavIcon id="reports" icon={BarChart2} active={active} setActive={setActive} onReset={onResetBook} />
                        </div>

                        {/* Interactive FAB with Pulse Effect */}
                        <div className="relative -top-6">
                            <motion.button 
                                onClick={onFabClick}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                // Continuous Pulse Animation to invite clicks
                                animate={{ 
                                    boxShadow: [
                                        "0 0 0px rgba(249, 115, 22, 0)", 
                                        "0 0 15px rgba(249, 115, 22, 0.4)", 
                                        "0 0 0px rgba(249, 115, 22, 0)"
                                    ] 
                                }}
                                transition={{ 
                                    boxShadow: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                                className="w-16 h-16 bg-orange-500 rounded-[24px] flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] z-50"
                            >
                                <Plus size={32} strokeWidth={3.5} />
                            </motion.button>
                        </div>

                        <div className="flex gap-6">
                            <NavIcon id="timeline" icon={History} active={active} setActive={setActive} onReset={onResetBook} />
                            <NavIcon id="settings" icon={Settings} active={active} setActive={setActive} onReset={onResetBook} />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Helper for Mobile Icons
const NavIcon = ({ id, icon: Icon, active, setActive, onReset }: any) => {
    const isActive = active === id;
    return (
        <button 
            onClick={() => { setActive(id); onReset(); }} 
            className={`flex flex-col items-center justify-center w-10 h-10 transition-all ${isActive ? 'text-orange-500' : 'text-slate-400'}`}
        >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && (
                <motion.div 
                    layoutId="activeDot"
                    className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                />
            )}
        </button>
    );
};

// --- 3. Main Layout Orchestrator ---
export const DashboardLayout = ({ 
    children, 
    activeSection, 
    setActiveSection, 
    onLogout, 
    currentUser, 
    currentBook, 
    onBack, 
    onFabClick, 
    onEditBook, 
    onOpenShare, 
    onOpenExport, 
    onOpenAnalytics, 
    onDeleteBook 
}: DashboardLayoutProps) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden">
            
            <Sidebar 
                active={activeSection} 
                setActive={setActiveSection} 
                onLogout={onLogout} 
                collapsed={collapsed} 
                setCollapsed={setCollapsed} 
                onResetBook={onBack} 
            />
            
            <main 
                className={`
                    flex-1 transition-all duration-400 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                    ${collapsed ? 'md:ml-[88px]' : 'md:ml-[280px]'} 
                    w-full relative
                `}
            >
                <DynamicHeader 
                    activeSection={activeSection} 
                    setActiveSection={setActiveSection}
                    currentUser={currentUser} 
                    currentBook={currentBook} 
                    collapsed={collapsed}
                    onBack={onBack} 
                    onFabClick={onFabClick} 
                    onLogout={onLogout}
                    theme={theme} 
                    setTheme={setTheme}
                    onEditBook={onEditBook}
                    onOpenShare={onOpenShare}
                    onOpenExport={onOpenExport}
                    onOpenAnalytics={onOpenAnalytics}
                    onDeleteBook={onDeleteBook}
                />

                <div className={`
                    w-full max-w-[1920px] mx-auto pb-32 transition-all duration-300
                    ${currentBook && activeSection === 'books' ? 'pt-[120px] px-0' : 'pt-[110px] px-4 md:px-10'}
                `}>
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
            
            <BottomNav 
                active={activeSection} 
                setActive={setActiveSection} 
                onFabClick={onFabClick} 
                onResetBook={onBack} 
            />
        </div>
    );
};