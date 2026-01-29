"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Book, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, 
    Sun, Moon, Plus, UserCog, MoreVertical, Share2, Edit2, 
    Trash2, Download, Database, LayoutGrid, History, UserCircle
} from 'lucide-react';

// --- ১. সাইডবার কম্পোনেন্ট ---
const Sidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onResetBook }: any) => {
    const menuItems = [
        { id: 'books', name: 'Dashboard', icon: Book },
        { id: 'reports', name: 'Analytics', icon: BarChart2 },
        { id: 'timeline', name: 'Timeline', icon: History },
        { id: 'settings', name: 'System', icon: Database },
    ];

    return (
        <motion.div 
            animate={{ width: collapsed ? 80 : 260 }}
            className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-[var(--border-color)] bg-[var(--bg-card)] z-[500] transition-all duration-300 shadow-2xl"
        >
            <div className={`h-24 flex items-center ${collapsed ? 'justify-center' : 'justify-between px-8'} border-b border-[var(--border-color)] relative`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">V</div>
                    {!collapsed && <h1 className="text-xl font-black tracking-tighter uppercase italic text-[var(--text-main)]">Vault Pro</h1>}
                </div>
                <button 
                    onClick={() => setCollapsed(!collapsed)} 
                    className="absolute -right-3 top-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1.5 shadow-md hover:text-orange-500 text-[var(--text-muted)] z-10 transition-colors"
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </div>

            <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item: any) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActive(item.id);
                            if (onResetBook) onResetBook();
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
                <button 
                    onClick={onLogout} 
                    className={`flex items-center h-12 transition-colors text-red-500 hover:bg-red-500/5 rounded-xl ${collapsed ? 'justify-center' : 'px-4 gap-4 w-full'}`}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="text-sm font-black uppercase tracking-widest">Sing Out</span>}
                </button>
            </div>
        </motion.div>
    );
};

// --- ২. বটম নেভিগেশন ---
const BottomNav = ({ active, setActive, onFabClick, onResetBook }: any) => {
    const handleNavClick = (id: string) => {
        setActive(id);
        if (onResetBook) onResetBook();
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
                    <button onClick={() => handleNavClick('timeline')} className={`nav-item ${active === 'timeline' ? 'text-orange-500 scale-110' : 'text-slate-500'}`}>
                        <History size={22} strokeWidth={active === 'timeline' ? 3 : 2} />
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
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const handleResetBook = () => {
        if (currentBook) onBack(); 
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] transition-colors duration-500 overflow-x-hidden">
            <Sidebar active={activeSection} setActive={setActiveSection} onLogout={onLogout} collapsed={collapsed} setCollapsed={setCollapsed} onResetBook={handleResetBook} />
            
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} w-full`}>
                
                {/* --- MASTER DYNAMIC HEADER --- */}
                {/* DashboardLayout.tsx এর Header অংশটি এটি দিয়ে রিপ্লেস করুন */}
<header 
    className="fixed top-0 right-0 z-[100] bg-[var(--bg-app)]/85 backdrop-blur-xl border-b border-[var(--border-color)] px-4 md:px-10 py-5 flex justify-between items-center"
    style={{ 
        left: typeof window !== 'undefined' && window.innerWidth > 768 ? (collapsed ? '80px' : '260px') : '0' 
    }}
>
    {/* বাম পাশ: টাইটেল লজিক */}
    <div className="flex items-center gap-4">
        {currentBook && activeSection === 'books' ? (
            <div className="flex items-center gap-3 anim-fade-up">
                <button onClick={onBack} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 active:scale-90 shadow-sm shrink-0">
                    <ChevronLeft size={20} strokeWidth={3}/>
                </button>
                <div className="min-w-0">
                    <h2 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)] truncate">{currentBook.name}</h2>
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-80">Protocol Active</p>
                </div>
            </div>
        ) : (
            <div className="anim-fade-up">
                <h2 className="text-xl md:text-2xl font-black tracking-tighter italic leading-none text-[var(--text-main)]">
                    {activeSection === 'books' ? `Hello, ${currentUser?.username}` : activeSection.toUpperCase()}
                </h2>
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1.5 opacity-60">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>
        )}
    </div>
    
    {/* ডান পাশ: আপনার দেওয়া বাটন লজিক */}
    <div className="flex items-center gap-3 shrink-0">
        
        {/* অ্যাড বাটন */}
        <button 
            onClick={onFabClick} 
            className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 text-[10px] font-black tracking-widest transition-all active:scale-95 whitespace-nowrap"
        >
            <Plus size={16} strokeWidth={3} /> 
            {currentBook && activeSection === 'books' ? 'NEW ENTRY' : 'CREATE VAULT'}
        </button>

        {/* থিম সুইচ */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-95">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* কন্ডিশনাল মেনু */}
        {currentBook && activeSection === 'books' ? (
            /* --- ৩-ডট সুপার মেনু (বইয়ের ভেতরে) --- */
            <div className="relative">
                <button onClick={() => setShowSuperMenu(!showSuperMenu)} className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSuperMenu ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500'}`}>
                    <MoreVertical size={20} strokeWidth={2.5} />
                </button>
                
                <AnimatePresence>
                    {showSuperMenu && (
                        <>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowSuperMenu(false)} />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[200] overflow-hidden p-2">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => {onOpenShare(); setShowSuperMenu(false);}} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500">
                                        <Share2 size={18} className="shrink-0" /> <span>Share Access</span>
                                    </button>
                                    <button onClick={() => {onOpenExport(); setShowSuperMenu(false);}} className="menu-btn menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-green-500">
                                        <Download size={18} className="shrink-0" /> <span>Export Report</span>
                                    </button>
                                    <button onClick={() => {onEditBook(); setShowSuperMenu(false);}} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-blue-500">
                                        <Edit2 size={18} className="shrink-0" /> <span>Edit Ledger</span>
                                    </button>
                                    <button onClick={() => {onDeleteBook(); setShowSuperMenu(false);}} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                        <Trash2 size={18} className="shrink-0" /> <span>Terminate Vault</span>
                                    </button>
                                    
                                    <div className="h-px bg-[var(--border-color)] mx-2 my-1 opacity-50" />
                                    
                                    <button onClick={() => {setActiveSection('profile'); handleResetBook(); setShowSuperMenu(false);}} className="menu-btn menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-white">
                                        <UserCog size={18} className="shrink-0" /> <span>Manage Your Account</span>
                                    </button>
                                    <button onClick={onLogout} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500/70 hover:text-red-500 hover:bg-red-500/10">
                                        <LogOut size={18} className="shrink-0" /> <span>Sing Out Session</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        ) : (
            /* --- ইউজার অবতার মেনু (ড্যাশবোর্ডে) --- */
            <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white text-lg font-black shadow-lg border-2 border-white/10 uppercase transition-transform active:scale-90 ${showUserMenu ? 'ring-2 ring-orange-500' : ''}`}>
                    {currentUser?.username?.charAt(0) || "U"}
                </button>
                <AnimatePresence>
                    {showUserMenu && (
                        <>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)} />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[200] overflow-hidden p-2">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => {setActiveSection('profile'); setShowUserMenu(false);}} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500 rounded-2xl transition-all text-left">
                                        <UserCog size={18} className="shrink-0" /> <span>Manage Your Account</span>
                                    </button>
                                    <div className="mt-1 pt-1 border-t border-[var(--border-color)] opacity-40 mx-2" />
                                    <button onClick={onLogout} className="menu-btn w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500/70 hover:text-red-500 hover:bg-red-500/5">
                                        <LogOut size={18} className="shrink-0" /> <span>Sing Out Session</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        )}
    </div>
</header>

                <div className={currentBook ? "w-full p-0" : "p-4 md:p-10 pb-32 max-w-[1920px] mx-auto fixed-header-padding"}>
                    {children}
                </div>
            </main>
            
            <BottomNav active={activeSection} setActive={setActiveSection} onFabClick={onFabClick} onResetBook={handleResetBook} />
            
           <style jsx>{`
    .menu-btn {
        @apply w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-app)] rounded-2xl transition-all text-left;
        justify-content: flex-start !important;
    }
`}</style>
        </div>
    );
};