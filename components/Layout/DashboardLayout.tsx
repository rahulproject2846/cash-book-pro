"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, History, LayoutGrid, Shield, Fingerprint
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip'; 
import { useGuidance } from '@/hooks/useGuidance'; 
import { CommandHub } from './CommandHub';

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

// --- 1. Smart Tooltip (Apple Style) ---
const SmartTooltip = ({ text, visible }: { text: string, visible: boolean }) => (
    <AnimatePresence>
        {visible && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-2xl shadow-2xl z-[1001] whitespace-nowrap border border-[var(--border-color)] "
            >
                {text}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
            </motion.div>
        )}
    </AnimatePresence>
);

// --- 2. Sidebar Component (Elite Polish) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook, isCompact }: any) => {
    const { T, t } = useTranslation();
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 100 : 280 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-2xl z-[500] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        >
            <button 
                onClick={() => setCollapsed(!collapsed)} 
                className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-orange-500 border-4 border-[var(--bg-app)] rounded-full w-8 h-8 flex items-center justify-center shadow-xl text-white hover:scale-110 transition-all z-[600] active:scale-90"
            >
                {collapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            {/* Logo Area */}
            <div className={`h-[var(--header-height,7rem)] flex items-center ${collapsed ? 'justify-center' : 'pl-8'} border-b border-[var(--border)]`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400  to-orange-600 rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">V</div>
                    {!collapsed && (
                        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-black uppercase italic text-[var(--text-main)] tracking-tighter">
                            {T('vault_pro_split_1')}<span className="text-orange-500">{T('vault_pro_split_2')}</span>
                        </motion.h1>
                    )}
                </div>
            </div>

            {/* Nav Menu */}
            <div className="flex-1 py-10 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const isActive = active === item.id;
                    const navBtn = (
                        <button 
                            key={item.id} 
                            onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} 
                            className={`w-full flex items-center h-14 transition-all duration-300 group relative ${collapsed ? 'justify-center rounded-[20px]' : 'px-5 rounded-[20px] gap-4'} ${isActive ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20 scale-[1.02]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}
                        >
                            <item.icon size={isCompact ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 group-active:scale-90" />
                            {!collapsed && <span className="text-[12px] font-black uppercase tracking-[0.15em]">{T(item.name)}</span>}
                            {isActive && collapsed && <motion.div layoutId="sidebarDot" className="absolute left-1 w-1 h-6 bg-white rounded-full" />}
                        </button>
                    );
                    return collapsed ? <Tooltip key={item.id} text={T(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                })}
            </div>

            {/* Logout Section */}
            <div className="p-6 border-t border-[var(--border)]">
                <button onClick={onLogout} className={`flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}>
                    <LogOut size={20} /> 
                    {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">{T('nav_signout')}</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- 3. Mobile Bottom Nav (The Modern Dock) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook, activeGuidanceStep }: any) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { T, t } = useTranslation();

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            setIsVisible(current < lastScrollY || current < 50);
            setLastScrollY(current);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const NavIcon = ({ id, icon: Icon, tooltipKey }: any) => {
        const isActive = active === id;
        const isTooltipVisible = (id === 'reports' && activeGuidanceStep === 2) || (id === 'settings' && activeGuidanceStep === 3);
        
        return (
            <div className="relative">
                <SmartTooltip text={T(tooltipKey)} visible={isTooltipVisible} />
                <button 
                    onClick={() => { setActive(id); if (onResetBook) onResetBook(); }} 
                    className={`flex flex-col items-center justify-center w-12  border-[var(--border-color)] h-12 transition-all ${isActive ? 'text-orange-500' : 'text-slate-500 opacity-60'}`}
                >
                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                    {isActive && <motion.div layoutId="activeDot" className="absolute -bottom-2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />}
                </button>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                    className="md:hidden fixed bottom-8 left-6 right-6 z-[900]"
                >
                    <div className="bg-[var(--bg-card)]/80 backdrop-blur-2xl border border-[var(--border)] h-[76px] rounded-[32px] shadow-2xl flex items-center justify-between px-2">
                        <div className="flex gap-4">
                            <NavIcon id="books" icon={LayoutGrid} tooltipKey="nav_dashboard" />
                            <NavIcon id="reports" icon={BarChart2} tooltipKey="nav_analytics" />
                        </div>
                        
                        <div className="relative -top-0">
                            <SmartTooltip text={t('tt_add_entry')} visible={activeGuidanceStep === 1} />
                            <motion.button 
                                onClick={onFabClick}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="w-15 h-15 bg-orange-500 rounded-[22px] flex items-center justify-center text-white border-[4px] border-[var(--bg-card)] shadow-[0_15px_30px_rgba(249,115,22,0.4)]"
                            >
                                <Plus size={36} strokeWidth={3.5} />
                            </motion.button>
                        </div>

                        <div className="flex gap-4 border-[var(--border-color)]">
                            <NavIcon id="timeline" icon={History} tooltipKey="nav_timeline" />
                            <NavIcon id="settings" icon={Settings} tooltipKey="nav_system" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- 4. Dashboard Layout Main ---
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

    const handleHubAction = (type: string, payload?: any) => {
        if (type === 'selectBook' && payload) {
            window.dispatchEvent(new CustomEvent('vault-select-book', { detail: payload }));
            setActiveSection('books');
        } else if (type === 'addBook') onFabClick();
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden transition-colors duration-500">
            <Sidebar 
                active={activeSection} setActive={setActiveSection} onLogout={onLogout} 
                collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={onBack}
                isCompact={prefs.compactMode}
            />
            
            <main className={`flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'md:ml-[100px]' : 'md:ml-[280px]'} w-full relative z-[10]`}>
                <DynamicHeader {...props} collapsed={collapsed} theme={theme} setTheme={setTheme} />

                {/* --- Content Area with "Leaf" Transition --- */}
                <div className={`w-full max-w-[1920px] mx-auto transition-all duration-300 px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] ${currentBook && activeSection === 'books' ? 'pt-[var(--header-height,7.5rem)] px-0' : 'pt-[var(--header-height,7rem)]'} pb-36`}>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeSection + (currentBook?._id || '')}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={onBack} activeGuidanceStep={activeGuidanceStep} />

            <CommandHub currentUser={currentUser} setActiveSection={setActiveSection} onAction={handleHubAction} />

            {/* --- Session Shield (Apple Style) --- */}
            <AnimatePresence>
                {isShielded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-[40px] flex flex-col items-center justify-center p-10 text-center text-white">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-24 h-24 bg-orange-500 rounded-[35px] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.5)]">
                            <Fingerprint size={48} strokeWidth={2.5} />
                        </motion.div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{T('session_shield')}</h2>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-[4px] mt-4">{t('protocol_locked')}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};