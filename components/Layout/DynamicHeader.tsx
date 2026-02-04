"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, UserCog, LogOut, ShieldCheck, BarChart3, User
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

/**
 * VAULT PRO: DYNAMIC HEADER (STABILIZED)
 * ------------------------------------
 * Handles navigation, theme toggling, and contextual menus.
 * Fully integrated with Global Spacing, Language, and Guidance.
 */
export const DynamicHeader = ({ 
    activeSection, currentUser, currentBook, collapsed, 
    onBack, onFabClick, onLogout, theme, setTheme,
    onEditBook, onOpenShare, onOpenExport, onOpenAnalytics, 
    onDeleteBook, setActiveSection 
}: any) => {
    const { T, t } = useTranslation();
    const [showSuperMenu, setShowSuperMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Optimized Menu Handler
    const handleAction = (action: () => void) => {
        setShowSuperMenu(false); 
        setShowUserMenu(false);
        if (action) action(); 
    };

    return (
        <header 
            className={`fixed top-0 right-0 z-[400] bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-[var(--app-padding,1rem)] md:px-[var(--app-padding,2.5rem)] py-5 flex justify-between items-center transition-all duration-300 left-0 ${collapsed ? 'md:left-20' : 'md:left-[260px]'}`}
        >
            {/* LEFT SECTION: BRANDING & TITLES */}
            <div className="flex items-center gap-4">
                {!currentBook && (
                    <div className="md:hidden flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">V</div>
                        <h1 className="text-lg font-black uppercase italic text-[var(--text-main)] tracking-tighter">
                            {T('vault_pro') || "Vault Pro"}
                        </h1>
                    </div>
                )}

                {currentBook && activeSection === 'books' ? (
                    <div className="flex items-center gap-3">
                        <Tooltip text={t('tt_back_dashboard')}>
                            <button onClick={onBack} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 shadow-sm transition-all active:scale-90">
                                <ChevronLeft size={20} strokeWidth={3}/>
                            </button>
                        </Tooltip>
                        <div className="min-w-0 text-left">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)] truncate">{currentBook.name}</h2>
                            <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-80 flex items-center gap-1.5">
                                <ShieldCheck size={10}/> {T('protocol_active')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-left hidden md:block">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)]">
                            {activeSection === 'books' ? T('financial_dashboard') : T(`nav_${activeSection}`)}
                        </h2>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] mt-1.5 opacity-60">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>
            
            {/* RIGHT SECTION: ACTIONS */}
            <div className="flex items-center gap-3 shrink-0">
                <Tooltip text={currentBook ? t('tt_add_entry') : t('tt_initialize_ledger')}>
                    <button 
                        onClick={onFabClick} 
                        className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 text-[10px] font-black tracking-widest transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} /> 
                        {currentBook && activeSection === 'books' ? T('btn_new_entry') : T('btn_create_vault')}
                    </button>
                </Tooltip>

                <Tooltip text={t('tt_toggle_theme')}>
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                        className="p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </Tooltip>

                {currentBook && activeSection === 'books' ? (
                    <div className="relative">
                        <Tooltip text={t('tt_more_options')}>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setShowSuperMenu(!showSuperMenu); 
                                }} 
                                className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSuperMenu ? 'bg-orange-500 text-white border-orange-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-orange-500'}`}
                            >
                                <MoreVertical size={20} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showSuperMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={(e) => { e.stopPropagation(); setShowSuperMenu(false); }} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                                        className="absolute right-0 top-16 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[500] overflow-hidden p-2"
                                    >
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(onOpenAnalytics); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-blue-500">
                                            <BarChart3 size={18} /> <span>{T('nav_analytics')}</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(onOpenShare); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-purple-500">
                                            <Share2 size={18} /> <span>{T('action_share_access')}</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(onOpenExport); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-green-500">
                                            <Download size={18} /> <span>{T('action_export_report')}</span>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(onEditBook); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-yellow-500">
                                            <Edit2 size={18} /> <span>{T('action_edit_ledger')}</span>
                                        </button>                                      
                                        
                                        <div className="h-px bg-[var(--border-color)] mx-2 my-1 opacity-50" />
                                        
                                        <button onClick={() => { handleAction(() => { setActiveSection('profile'); onBack(); }); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500">
                                            <UserCog size={18} /> <span>{T('action_manage_profile')}</span>
                                        </button>

                                        <button onClick={(e) => { e.stopPropagation(); handleAction(onDeleteBook); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                            <Trash2 size={18} /> <span>{T('action_terminate_vault')}</span>
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="relative">
                        <Tooltip text={t('tt_account_settings')}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }} 
                                className={`w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white text-lg font-black border-2 border-white/10 uppercase transition-all overflow-hidden active:scale-90 ${showUserMenu ? 'ring-2 ring-orange-500' : ''}`}
                            >
                                {currentUser?.image ? (
                                    <img src={currentUser.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    currentUser?.username?.charAt(0) || "U"
                                )}
                            </button>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); }} />
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute right-0 top-16 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] shadow-2xl z-[500] overflow-hidden p-2">
                                        <button onClick={() => { handleAction(() => setActiveSection('profile')); }} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-blue-500">
                                            <User size={18} /> <span>{T('action_account_settings')}</span>
                                        </button>
                                        <div className="mt-1 pt-1 border-t border-[var(--border-color)] opacity-40 mx-2" />
                                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500/70 hover:text-red-500 hover:bg-red-500/5">
                                            <LogOut size={18} /> <span>{T('nav_signout')}</span>
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