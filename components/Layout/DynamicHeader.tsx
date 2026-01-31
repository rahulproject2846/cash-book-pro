"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, UserCog, LogOut, ShieldCheck, BarChart3 
} from 'lucide-react';

export const DynamicHeader = ({ 
    activeSection, currentUser, currentBook, collapsed, 
    onBack, onFabClick, onLogout, theme, setTheme,
    onEditBook, onOpenShare, onOpenExport, onOpenAnalytics, 
    onDeleteBook, setActiveSection 
}: any) => {
    const [showSuperMenu, setShowSuperMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // --- Helper: Prevents Modal Flashing by closing menu after a small delay ---
    const safeOpenModal = (action: () => void) => {
        setShowSuperMenu(false); 
        setShowUserMenu(false);
        setTimeout(() => {
            if (action) action();
        }, 150); // Reliable delay for state transition
    };

    return (
        <header 
            className="fixed top-0 right-0 z-[400] bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-4 md:px-10 py-5 flex justify-between items-center transition-all duration-300"
            style={{ left: typeof window !== 'undefined' && window.innerWidth > 768 ? (collapsed ? '80px' : '260px') : '0' }}
        >
            {/* LEFT: Branding or Book Title */}
            <div className="flex items-center gap-4">
                {currentBook && activeSection === 'books' ? (
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 shadow-sm transition-all active:scale-90">
                            <ChevronLeft size={20} strokeWidth={3}/>
                        </button>
                        <div className="min-w-0 text-left">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)] truncate">{currentBook.name}</h2>
                            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-80 flex items-center gap-1.5">
                                <ShieldCheck size={10}/> Protocol Active
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-left">
                        <h2 className="text-xl md:text-2xl font-black tracking-tighter italic leading-none text-[var(--text-main)]">
                            {activeSection === 'books' ? `Hello, ${currentUser?.username?.split(' ')[0]}` : activeSection.toUpperCase()}
                        </h2>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1.5 opacity-60">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>
            
            {/* RIGHT: Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
                <button 
                    onClick={onFabClick} 
                    className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 text-[10px] font-black tracking-widest transition-all active:scale-95 whitespace-nowrap"
                >
                    <Plus size={16} strokeWidth={3} /> 
                    {currentBook && activeSection === 'books' ? 'NEW ENTRY' : 'CREATE VAULT'}
                </button>

                <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                    className="p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {currentBook && activeSection === 'books' ? (
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowSuperMenu(!showSuperMenu); }} 
                            className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSuperMenu ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500'}`}
                        >
                            <MoreVertical size={20} strokeWidth={2.5} />
                        </button>
                        <AnimatePresence>
                            {showSuperMenu && (
                                <>
                                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowSuperMenu(false)} />
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[500] overflow-hidden p-2">
                                        <button onClick={(e) => { e.stopPropagation(); safeOpenModal(onOpenAnalytics); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-blue-500">
                                            <BarChart3 size={18} className="shrink-0" /> <span>Analysis Report</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); safeOpenModal(onOpenShare); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-purple-500">
                                            <Share2 size={18} className="shrink-0" /> <span>Share Access</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); safeOpenModal(onOpenExport); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-green-500">
                                            <Download size={18} className="shrink-0" /> <span>Export Report</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); safeOpenModal(onEditBook); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-yellow-500">
                                            <Edit2 size={18} className="shrink-0" /> <span>Edit Ledger</span>
                                        </button>                                      
                                        
                                        <div className="h-px bg-[var(--border-color)] mx-2 my-1 opacity-50" />
                                        
                                        {/* MANAGE PROFILE BUTTON (Restored) */}
                                        <button onClick={() => {setActiveSection('profile'); onBack(); setShowSuperMenu(false);}} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500">
                                            <UserCog size={18} className="shrink-0" /> <span>Manage Profile</span>
                                        </button>

                                        <button onClick={(e) => { e.stopPropagation(); safeOpenModal(onDeleteBook); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] text-red-500 hover:bg-red-500/10">
                                            <Trash2 size={18} className="shrink-0" /> <span>Terminate Vault</span>
                                        </button>
                                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] text-red-500/70 hover:bg-red-500/10">
                                            <LogOut size={18} className="shrink-0" /> <span>Sing Out</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white text-lg font-black border-2 border-white/10 transition-transform active:scale-90 ${showUserMenu ? 'ring-2 ring-orange-500' : ''}`}>
                            {currentUser?.username?.charAt(0) || "U"}
                        </button>
                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)} />
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[500] overflow-hidden p-2">
                                        <button onClick={() => {setActiveSection('profile'); setShowUserMenu(false);}} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500">
                                            <UserCog size={18} className="shrink-0" /> <span>Account Settings</span>
                                        </button>
                                        <div className="mt-1 pt-1 border-t border-[var(--border-color)] opacity-40 mx-2" />
                                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] text-red-500/70 hover:text-red-500 hover:bg-red-500/5">
                                            <LogOut size={18} className="shrink-0" /> <span>Sing Out</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </header>
    );
};