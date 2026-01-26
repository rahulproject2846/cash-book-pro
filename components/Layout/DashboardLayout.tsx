"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon, Bell } from 'lucide-react';

const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed }: any) => {
    const menuItems = [
        { id: 'books', name: 'Dashboard', icon: Book },
        { id: 'reports', name: 'Reports', icon: BarChart2 },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    return (
        <motion.div 
            animate={{ width: collapsed ? 80 : 260 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-50 transition-all duration-300"
        >
            <div className={`h-24 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-8'} border-b border-[var(--border-color)] relative`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg">C</div>
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

const BottomNav = ({ active, setActive }: any) => {
    const navItems = [
        { id: 'books', icon: Book, label: 'Ledgers' },
        { id: 'reports', icon: BarChart2, label: 'Reports' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] h-20 pb-2 z-50 shadow-2xl">
            <div className="flex justify-around items-center h-full px-4">
                {navItems.map((item) => (
                    <button key={item.id} onClick={() => setActive(item.id)} className="flex-1 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform">
                        <div className={`p-2.5 rounded-2xl transition-all ${active === item.id ? 'bg-orange-500 text-white shadow-lg' : 'text-[var(--text-muted)]'}`}>
                            <item.icon size={22} strokeWidth={active === item.id ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${active === item.id ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const DashboardLayout = ({ children, sections, onLogout, activeSection, setActiveSection, currentUser }: any) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const getGreeting = () => {
        const h = new Date().getHours();
        return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    };

    const currentComponent = sections.find((s: any) => s.id === activeSection)?.component;

    return (
        <div className="flex min-h-screen transition-colors duration-300">
            <Sidebar active={activeSection} setActive={setActiveSection} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} p-4 md:p-10 pb-24`}>
                <header className="flex justify-between items-center mb-10 px-2">
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tighter leading-none italic">{getGreeting()}, <span className="text-orange-500">{currentUser?.username}</span></h2>
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[3.5px] mt-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {mounted && (
                            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-orange-500/50 shadow-sm transition-all">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        )}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-orange-500/20 border-2 border-white/10 uppercase">
                            {currentUser?.username?.charAt(0)}
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {currentComponent}
                    </motion.div>
                </AnimatePresence>
            </main>
            <BottomNav active={activeSection} setActive={setActiveSection} />
        </div>
    );
};