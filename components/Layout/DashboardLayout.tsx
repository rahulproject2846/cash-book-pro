"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon, Plus, UserCog } from 'lucide-react';

// --- SIDEBAR (Desktop) ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed }: any) => {
    const menuItems = [
        { id: 'books', name: 'Dashboard', icon: Book },
        { id: 'reports', name: 'Reports', icon: BarChart2 },
        { id: 'settings', name: 'System', icon: Settings },
    ];

    return (
        <motion.div 
            animate={{ width: collapsed ? 80 : 260 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-50 transition-all duration-300"
        >
            <div className={`h-24 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-8'} border-b border-[var(--border-color)] relative`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">V</div>
                    {!collapsed && <h1 className="text-xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">Vault</h1>}
                </div>
                <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1.5 shadow-md hover:text-orange-500 text-[var(--text-muted)]">
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>

            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActive(item.id)}
                        className={`w-full flex items-center h-12 transition-all ${collapsed ? 'justify-center rounded-xl' : 'px-4 rounded-xl gap-4'} ${
                            active === item.id ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'
                        }`}
                    >
                        <item.icon size={20} strokeWidth={active === item.id ? 2.5 : 2} />
                        {!collapsed && <span className="text-sm font-bold tracking-tight">{item.name}</span>}
                    </button>
                ))}
            </div>

            <div className="p-6 border-t border-[var(--border-color)]">
                <button onClick={onLogout} className={`flex items-center h-12 transition-colors text-[var(--text-muted)] hover:text-red-500 rounded-xl ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}>
                    <LogOut size={20} />
                    {!collapsed && <span className="text-sm font-bold">Sign Out</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- 🔥 UPDATED BOTTOM NAV (Floating Style) ---
const BottomNav = ({ active, setActive, onFabClick }: any) => {
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6">
            <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] h-18 rounded-[30px] shadow-2xl flex items-center justify-between px-12 relative max-w-sm mx-auto py-3">
                
                {/* Left: Books */}
                <button onClick={() => setActive('books')} className={`flex flex-col items-center gap-1 transition-all ${active === 'books' ? 'text-orange-500 scale-110' : 'text-slate-400 opacity-50'}`}>
                    <Book size={22} strokeWidth={active === 'books' ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Books</span>
                </button>

                {/* Center: FAB */}
                <div className="absolute left-1/2 -top-6 -translate-x-1/2">
                    <button 
                        onClick={onFabClick}
                        className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-[0_10px_25px_rgba(249,115,22,0.4)] border-4 border-[var(--bg-app)] active:scale-90 transition-transform"
                    >
                        <Plus size={32} strokeWidth={4} />
                    </button>
                </div>

                {/* Right: Stats */}
                <button onClick={() => setActive('reports')} className={`flex flex-col items-center gap-1 transition-all ${active === 'reports' ? 'text-orange-500 scale-110' : 'text-slate-400 opacity-50'}`}>
                    <BarChart2 size={22} strokeWidth={active === 'reports' ? 3 : 2} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Stats</span>
                </button>
            </div>
        </div>
    );
};

// --- DYNAMIC GREETING ---
const AnimatedGreeting = ({ username }: any) => {
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        `Good Morning, ${username}`,
        "Let's track some wealth!",
        "Your Vault is secure.",
        "Keep the hustle on!",
        `Ready for today, ${username}?`
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % messages.length);
        }, 6000); 
        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence mode="wait">
            <motion.div 
                key={msgIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="h-8"
            >
                <h2 className="text-xl md:text-2xl font-black text-[var(--text-main)] tracking-tighter leading-none italic">
                    {messages[msgIndex].split(',')[0]}
                    <span className="text-orange-500">{messages[msgIndex].includes(',') ? `, ${messages[msgIndex].split(',')[1]}` : ''}</span>
                </h2>
            </motion.div>
        </AnimatePresence>
    );
};

// --- MAIN LAYOUT ---
export const DashboardLayout = ({ children, sections, onLogout, activeSection, setActiveSection, currentUser, onFabClick, onProfileClick }: any) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);
    const currentComponent = sections.find((s: any) => s.id === activeSection)?.component;

    return (
        <div className="flex min-h-screen transition-colors duration-300 bg-[var(--bg-app)] text-[var(--text-main)]">
            <Sidebar active={activeSection} setActive={setActiveSection} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} pb-24 md:pb-10`}>
                
                {/* HEADER */}
                <header className="sticky top-0 z-40 bg-[var(--bg-app)]/90 backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center border-b border-[var(--border-color)]">
                    <div>
                        <AnimatedGreeting username={currentUser?.username || "User"} />
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3px] mt-1 opacity-60">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {/* New Entry Button */}
                         <button onClick={onFabClick} className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                            <Plus size={16} strokeWidth={3} />
                            <span>ADD</span>
                        </button>

                        <div className="h-8 w-[1px] bg-[var(--border-color)] mx-2 hidden md:block"></div>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500 transition-all">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        )}

                        {/* User Profile Button */}
                        <button 
                            onClick={() => setActiveSection('profile')} 
                            className={`p-2.5 rounded-xl border transition-all ${
                                activeSection === 'profile' 
                                ? 'bg-orange-500 text-white border-transparent shadow-lg shadow-orange-500/20' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500'
                            }`}
                            title="User Profile"
                        >
                            <UserCog size={18} />
                        </button>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <div className="p-4 md:p-10 w-full mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                            {currentComponent}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} />
        </div>
    );
};