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
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

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
    // ... optional props (onEditBook, etc.)
}

const NAV_ITEMS = [
    { id: 'books', name: 'nav_dashboard', icon: Book },
    { id: 'reports', name: 'nav_analytics', icon: BarChart2 },
    { id: 'timeline', name: 'nav_timeline', icon: History },
    { id: 'settings', name: 'nav_system', icon: Settings },
] as const;

// --- 1. Sidebar Component (Elite Polish) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook, isCompact }: any) => {
    const { T, t } = useTranslation();
    return (
        <motion.div 
            initial={false}
            animate={{ width: collapsed ? 90 : 280 }}
            className={cn(
                "hidden md:flex flex-col h-screen fixed left-0 top-0", 
                "border-r border-[var(--border)] bg-[var(--bg-card)]/90 backdrop-blur-2xl",
                "z-[500] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            )}
        >
            {/* Toggle Button */}
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

            {/* Logo Area */}
            <div className={cn("h-28 flex items-center border-b border-[var(--border)]", collapsed ? "justify-center" : "pl-8")}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[18px] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/30">V</div>
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
                            className={cn(
                                "w-full flex items-center h-14 transition-all duration-300 group relative",
                                // 🔥 ফিক্স: কলাপসড অবস্থায় justify-center এবং প্যাডিং রিসেট
                                collapsed 
                                    ? "justify-center rounded-[20px] px-0" 
                                    : "px-5 rounded-[20px] gap-4 justify-start",
                                isActive 
                                    ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20 scale-[1.02]" 
                                    : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                            )}
                        >
                            <item.icon size={isCompact ? 18 : 22} strokeWidth={isActive ? 2.5 : 2} className="transition-transform duration-300 group-active:scale-90" />
                            {/* টেক্সট শুধুমাত্র তখন দেখাবে যখন কলাপসড না */}
                            {!collapsed && <span className="text-[11px] font-black uppercase tracking-[3px]">{T(item.name)}</span>}
                            
                            {isActive && collapsed && <motion.div layoutId="sidebarDot" className="absolute left-2 w-1 h-6 bg-white rounded-full opacity-50" />}
                        </button>
                    );
                    return collapsed ? <Tooltip key={item.id} text={T(item.name)} position="right">{navBtn}</Tooltip> : navBtn;
                })}
            </div>

            {/* Logout Section */}
            <div className="p-6 border-t border-[var(--border)]">
                <button onClick={onLogout} className={cn("flex items-center h-12 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all", collapsed ? "justify-center" : "px-4 gap-4 w-full")}>
                    <LogOut size={20} strokeWidth={2.5} /> 
                    {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest">{T('nav_signout')}</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- 2. Mobile Bottom Nav (Elite Dynamic Island) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
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
        return (
            <div className="relative group">
                <button 
                    onClick={() => { setActive(id); if (onResetBook) onResetBook(); }} 
                    className={cn(
                        "flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-90",
                        isActive ? "text-orange-500" : "text-[var(--text-muted)] opacity-60"
                    )}
                >
                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                    {isActive && <motion.div layoutId="activeDot" className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,1)]" />}
                </button>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                    className="md:hidden fixed bottom-6 left-4 right-4 z-[900]"
                >
                    <div className="bg-[var(--bg-card)]/90 backdrop-blur-3xl border border-[var(--border)] h-[72px] rounded-[35px] shadow-2xl flex items-center justify-between px-6 relative overflow-visible">
                        <div className="flex gap-5">
                            <NavIcon id="books" icon={LayoutGrid} tooltipKey="nav_dashboard" />
                            <NavIcon id="reports" icon={BarChart2} tooltipKey="nav_analytics" />
                        </div>
                        
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                            <motion.button 
                                onClick={onFabClick}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white border-[6px] border-[var(--bg-app)] shadow-[0_10px_30px_rgba(249,115,22,0.4)] relative z-20"
                            >
                                <Plus size={32} strokeWidth={4} />
                            </motion.button>
                        </div>

                        <div className="flex gap-5">
                            <NavIcon id="timeline" icon={History} tooltipKey="nav_timeline" />
                            <NavIcon id="settings" icon={Settings} tooltipKey="nav_system" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- 3. Dashboard Layout Main ---
export const DashboardLayout = (props: any) => {
    const { children, activeSection, setActiveSection, onLogout, currentUser, currentBook, onBack, onFabClick } = props;
    const [collapsed, setCollapsed] = useState(false);
    const [isShielded, setIsShielded] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    const prefs = currentUser?.preferences || {};
    const { T, t } = useTranslation();

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
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-500 overflow-x-hidden">
            <Sidebar 
                active={activeSection} setActive={setActiveSection} onLogout={onLogout} 
                collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={onBack}
                isCompact={prefs.compactMode}
            />
            
            <main className={cn(
                "flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-full relative z-[10]",
                collapsed ? "md:ml-[90px]" : "md:ml-[280px]"
            )}>
                <DynamicHeader {...props} collapsed={collapsed} theme={theme} setTheme={setTheme} />

                {/* --- Content Area --- */}
                <div className={cn(
                    "w-full max-w-[1920px] mx-auto transition-all duration-300",
                    "px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] pb-40",
                    currentBook && activeSection === 'books' 
                        ? "pt-[6rem] md:pt-[7rem] px-0 md:px-0"  
                        : "pt-[5.5rem] md:pt-[7rem]"
                )}>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeSection + (currentBook?._id || '')}
                            initial={{ opacity: 0, y: 15, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.99 }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={onBack} />

            {/* --- Session Shield --- */}
            <AnimatePresence>
                {isShielded && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center text-white">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-24 h-24 bg-orange-500 rounded-[35px] flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(249,115,22,0.6)]">
                            <Fingerprint size={56} strokeWidth={2} />
                        </motion.div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{T('session_shield')}</h2>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[4px] mt-4 flex items-center gap-2">
                            <ShieldCheck size={12} /> {t('protocol_locked')}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};