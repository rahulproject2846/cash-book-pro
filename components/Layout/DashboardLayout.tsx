"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Plus, Database, LayoutGrid, History 
} from 'lucide-react';
import { DynamicHeader } from './DynamicHeader'; // 🔥 নতুন হেডার ইমপোর্ট

// --- ১. সাইডবার কম্পোনেন্ট ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook }: any) => {
    const menuItems = [
        { id: 'books', name: 'Dashboard', icon: Book },
        { id: 'reports', name: 'Analytics', icon: BarChart2 },
        { id: 'timeline', name: 'Timeline', icon: History },
        { id: 'settings', name: 'System', icon: Database },
    ];

    return (
        <motion.div animate={{ width: collapsed ? 80 : 260 }} className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-[500] shadow-2xl">
            <div className={`h-24 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-8'} border-b border-[var(--border-color)] relative`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">V</div>
                    {!collapsed && <h1 className="text-xl font-black uppercase italic text-[var(--text-main)]">Vault Pro</h1>}
                </div>
                <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1.5 shadow-md text-[var(--text-muted)] z-10">
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>
            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item: any) => (
                    <button key={item.id} onClick={() => { setActive(item.id); if (onResetBook) onResetBook(); }} className={`w-full flex items-center h-12 transition-all ${collapsed ? 'justify-center rounded-2xl' : 'px-4 rounded-2xl gap-4'} ${active === item.id ? 'bg-orange-500 text-white font-bold' : 'text-[var(--text-muted)] hover:text-orange-500'}`}>
                        <item.icon size={20} />
                        {!collapsed && <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>}
                    </button>
                ))}
            </div>
            <div className="p-6 border-t border-[var(--border-color)]">
                <button onClick={onLogout} className={`flex items-center h-12 text-red-500 hover:bg-red-500/5 rounded-xl ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}><LogOut size={20} />{!collapsed && <span className="text-sm font-black uppercase tracking-widest">Sing Out</span>}</button>
            </div>
        </motion.div>
    );
};

// --- ২. বটম নেভিগেশন (মোবাইল) ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
    return (
        <div className="md:hidden fixed bottom-6 left-3 right-3 z-[100]">
            <div className="bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] h-[70px] rounded-[35px] shadow-2xl flex items-center justify-between px-9">
                <button onClick={() => {setActive('books'); onResetBook();}} className={active === 'books' ? 'text-orange-500' : 'text-slate-500'}><LayoutGrid size={22}/></button>
                <button onClick={() => {setActive('reports'); onResetBook();}} className={active === 'reports' ? 'text-orange-500' : 'text-slate-500'}><BarChart2 size={22}/></button>
                <button onClick={onFabClick} className="w-16 h-16 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-lg border-[5px] border-[var(--bg-app)] -translate-y-6"><Plus size={30} strokeWidth={4}/></button>
                <button onClick={() => {setActive('timeline'); onResetBook();}} className={active === 'timeline' ? 'text-orange-500' : 'text-slate-500'}><History size={22}/></button>
                <button onClick={() => {setActive('settings'); onResetBook();}} className={active === 'settings' ? 'text-orange-500' : 'text-slate-500'}><Settings size={22}/></button>
            </div>
        </div>
    );
};

// --- ৩. মেইন লেআউট ---
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
    onOpenAnalytics, // 🔥 রিসিভ করা হলো
    onDeleteBook 
}: any) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden">
            <Sidebar active={activeSection} setActive={setActiveSection} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={onBack} />
            
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} w-full relative`}>
                
                {/* Master Dynamic Header */}
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
                    
                    // 🔥 অ্যাকশন হ্যান্ডলারস পাস করা হলো
                    onEditBook={onEditBook}
                    onOpenShare={onOpenShare}
                    onOpenExport={onOpenExport}
                    onOpenAnalytics={onOpenAnalytics}
                    onDeleteBook={onDeleteBook}
                />

                {/* Content Area */}
                <div className={`w-full ${currentBook && activeSection === 'books' ? 'pt-30 px-0' : 'pt-28 px-4 md:px-10'} pb-32 max-w-[1920px] mx-auto`}>
                    {children}
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={onBack} />
        </div>
    );
};