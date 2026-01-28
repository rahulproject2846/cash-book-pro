"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Sun, Moon, Plus, UserCog, MoreVertical, Share2, Edit2, 
    Trash2, Download, Database, LayoutGrid, User,UserCircle
} from 'lucide-react';

// --- ১. সাইডবার কম্পোনেন্ট ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook }: any) => {
    const menuItems = [
        { id: 'books', name: 'Dashboard', icon: Book },
        { id: 'reports', name: 'Analytics', icon: BarChart2 },
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'settings', name: 'System', icon: Database },
    ];

    return (
        <motion.div 
            animate={{ width: collapsed ? 80 : 260 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-500 transition-all duration-300 shadow-2xl"
        >
            <div className={`h-24 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-8'} border-b border-[var(--border-color)] relative`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">V</div>
                    {!collapsed && <h1 className="text-xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">Vault Pro</h1>}
                </div>
                <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1.5 shadow-md hover:text-orange-500 text-[var(--text-muted)] z-10">
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>

            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActive(item.id);
                            onResetBook(); // 🔥 ক্লিক করলেই বই রিসেট হবে
                        }}
                        className={`w-full flex items-center h-12 transition-all ${collapsed ? 'justify-center rounded-2xl' : 'px-4 rounded-2xl gap-4'} ${
                            active === item.id ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:bg-orange-500/5 hover:text-orange-500'
                        }`}
                    >
                        <item.icon size={20} strokeWidth={active === item.id ? 2.5 : 2} />
                        {!collapsed && <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>}
                    </button>
                ))}
            </div>

            <div className="p-6 border-t border-[var(--border-color)]">
                <button onClick={onLogout} className={`flex items-center h-12 transition-colors text-red-500 hover:bg-red-500/5 rounded-xl ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}>
                    <LogOut size={20} />
                    {!collapsed && <span className="text-sm font-black uppercase tracking-widest">Shutdown</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- ২. বটম নেভিগেশন ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
    // এখানেও একই লজিক প্রয়োগ করতে হবে
    const handleNavClick = (id: string) => {
        setActive(id);
        onResetBook(); // 🔥 ক্লিক করলেই বই রিসেট
    };

    return (
        <div className="md:hidden fixed bottom-6 left-3 right-3 z-[100]">
            <div className="bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-color)] h-[70px] rounded-[35px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] flex items-center justify-between px-9 relative">
                
                <div className="flex gap-9">
                    <button onClick={() => handleNavClick('books')} className={`nav-item ${active === 'books' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}>
                        <LayoutGrid size={22} strokeWidth={active === 'books' ? 3 : 2} />
                    </button>
                    <button onClick={() => handleNavClick('reports')} className={`nav-item ${active === 'reports' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}>
                        <BarChart2 size={22} strokeWidth={active === 'reports' ? 3 : 2} />
                    </button>
                </div>

                <div className="absolute left-1/2 -top-6 -translate-x-1/2">
                    <button onClick={onFabClick} className="w-16 h-16 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-[0_12px_25px_rgba(249,115,22,0.4)] border-[5px] border-[var(--bg-app)] active:scale-90 transition-transform">
                        <Plus size={30} strokeWidth={4} />
                    </button>
                </div>

                <div className="flex gap-9">
                    <button onClick={() => handleNavClick('profile')} className={`nav-item ${active === 'profile' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}>
                        <UserCircle size={22} strokeWidth={active === 'profile' ? 3 : 2} />
                    </button>
                    <button onClick={() => handleNavClick('settings')} className={`nav-item ${active === 'settings' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}>
                        <Settings size={22} strokeWidth={active === 'settings' ? 3 : 2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ৩. মেইন লেআউট ---
export const DashboardLayout = ({ children, activeSection, setActiveSection, onLogout, currentUser, currentBook, onBack, onFabClick, onEditBook, onOpenShare, onOpenExport, onDeleteBook }: any) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();
    const [showSuperMenu, setShowSuperMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    // 🔥 Magic Function: এটি যেকোনো মেনু ক্লিকে বই বন্ধ করে দেবে
    // onBack ফাংশনটি page.tsx থেকে আসছে যা setCurrentBook(null) করে
    const handleResetBook = () => {
        if (currentBook) {
            onBack(); 
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-500 overflow-x-hidden">
            
            {/* Sidebar এ onResetBook পাঠানো হলো */}
            <Sidebar 
                active={activeSection} 
                setActive={setActiveSection} 
                onLogout={onLogout} 
                collapsed={collapsed} 
                setCollapsed={setCollapsed} 
                onResetBook={handleResetBook} 
            />
            
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} w-full`}>
                
                {/* --- HEADER --- */}
                {/* Header logic same as before (currentBook check) */}
                {!currentBook && (
                    <header className="sticky top-0 z-[40] bg-[var(--bg-app)]/80 backdrop-blur-xl px-4 md:px-8 py-5 flex justify-between items-center border-b border-[var(--border-color)]">
                        
                        <div className="anim-fade-up">
                            <h2 className="text-xl md:text-2xl font-black tracking-tighter italic leading-none">
                                {activeSection === 'books' ? `Hello, ${currentUser?.username}` : activeSection.toUpperCase()}
                            </h2>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1 opacity-60">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             <button onClick={onFabClick} className="hidden md:flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-lg text-[10px] font-black tracking-widest hover:bg-orange-600 transition-all active:scale-95">
                                <Plus size={16} strokeWidth={3} /> {currentBook ? 'NEW ENTRY' : 'CREATE VAULT'}
                            </button>
                            
                            <div className="relative">
                                <button onClick={() => setShowSuperMenu(!showSuperMenu)} className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSuperMenu ? 'bg-orange-500 text-white border-orange-500' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'}`}>
                                    <MoreVertical size={20} strokeWidth={2.5} />
                                </button>
                                
                                <AnimatePresence>
    {showSuperMenu && (
        <>
            {/* ব্যাকড্রপ ফিক্স */}
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowSuperMenu(false)} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-16 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] z-[200] overflow-hidden p-2"
            >
                <div className="flex flex-col gap-1">
                    
                    {/* ১. Identity Protocol */}
                    <button 
                        onClick={() => {setActiveSection('profile'); handleResetBook(); setShowSuperMenu(false);}} 
                        className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500 rounded-2xl transition-all text-left"
                    >
                        <UserCog size={18} strokeWidth={2} className="shrink-0" /> 
                        <span>Identity Protocol</span>
                    </button>

                    {/* ২. System Engine */}
                    <button 
                        onClick={() => {setActiveSection('settings'); handleResetBook(); setShowSuperMenu(false);}} 
                        className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500 rounded-2xl transition-all text-left"
                    >
                        <Database size={18} strokeWidth={2} className="shrink-0" /> 
                        <span>System Engine</span>
                    </button>

                    {/* ৩. Light/Dark Mode */}
                    <button 
                        onClick={() => {setTheme(theme === 'dark' ? 'light' : 'dark'); setShowSuperMenu(false);}} 
                        className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500 rounded-2xl transition-all text-left"
                    >
                        {theme === 'dark' ? <Sun size={18} strokeWidth={2} className="shrink-0"/> : <Moon size={18} strokeWidth={2} className="shrink-0"/>}
                        <span>{theme === 'dark' ? 'Light Protocol' : 'Dark Protocol'}</span>
                    </button>
                    
                    {/* ডিভাইডার লাইন */}
                    <div className="h-px bg-[var(--border-color)] mx-2 my-1 opacity-50" />

                    {/* ৪. শাটডাউন (লগআউট) */}
                    <button 
                        onClick={onLogout} 
                        className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-2xl transition-all text-left"
                    >
                        <LogOut size={18} strokeWidth={2} className="shrink-0" /> 
                        <span>Shutdown Session</span>
                    </button>
                </div>
            </motion.div>
        </>
    )}
</AnimatePresence>
                            </div>
                        </div>
                    </header>
                )}

                <div className={currentBook ? "w-full p-0" : "p-4 md:p-10 pb-32 max-w-[1920px] mx-auto"}>
                    {children}
                </div>
            </main>
            
            {/* BottomNav এও onResetBook পাঠানো হলো */}
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={handleResetBook} />
            
            <style jsx>{`
                .nav-item { @apply transition-all active:scale-90; }
                .menu-item { @apply w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-all duration-200 justify-start !important; }
                .menu-item-danger { @apply w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-200 justify-start !important; }
            `}</style>
        </div>
    );
};