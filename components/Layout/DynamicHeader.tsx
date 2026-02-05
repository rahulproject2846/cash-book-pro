"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Plus, Sun, Moon, MoreVertical, 
    Share2, Download, Edit2, Trash2, UserCog, LogOut, ShieldCheck, BarChart3, User, Zap
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const DynamicHeader = ({ 
    activeSection, currentUser, currentBook, collapsed, 
    onBack, onFabClick, onLogout, theme, setTheme,
    onEditBook, onOpenShare, onOpenExport, onOpenAnalytics, 
    onDeleteBook, setActiveSection 
}: any) => {
    const { T, t } = useTranslation();
    const [showSuperMenu, setShowSuperMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Optimized Menu Handler (Logic Preserved)
    const handleAction = (action: () => void) => {
        setShowSuperMenu(false); 
        setShowUserMenu(false);
        if (action) action(); 
    };

    return (
        <header 
            className={`fixed top-0 right-0 z-[400] bg-[var(--bg-card)]/70 backdrop-blur-2xl border-b border-[var(--border)] px-[var(--app-padding,1.25rem)] md:px-[var(--app-padding,2.5rem)] py-4 flex justify-between items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] left-0 ${collapsed ? 'md:left-[100px]' : 'md:left-[280px]'}`}
        >
            {/* --- LEFT SECTION: BRANDING & TITLES --- */}
            <div className="flex items-center gap-4">
                {!currentBook && (
                    <div className="md:hidden flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/30">V</div>
                        <h1 className="text-xl font-black uppercase italic text-[var(--text-main)] tracking-tighter">
                            {T('vault_pro_split_1')}<span className="text-orange-500">{T('vault_pro_split_2')}</span>
                        </h1>
                    </div>
                )}

                {currentBook && activeSection === 'books' ? (
                    <div className="flex items-center gap-4">
                        <Tooltip text={t('tt_back_dashboard')}>
                            <button onClick={onBack} className="p-3 bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl text-[var(--text-muted)] hover:text-orange-500 shadow-sm transition-all active:scale-90">
                                <ChevronLeft size={20} strokeWidth={3}/>
                            </button>
                        </Tooltip>
                        <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)] truncate max-w-[150px] md:max-w-xs">{currentBook.name}</h2>
                            <p className="text-[9px] font-black text-orange-500 uppercase tracking-[2.5px] mt-1.5 flex items-center gap-2 opacity-80">
                                <ShieldCheck size={11} strokeWidth={3}/> {T('protocol_active')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-left hidden md:block">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic leading-none text-[var(--text-main)]">
                            {activeSection === 'books' ? T('financial_dashboard') : T(`nav_${activeSection}`)}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[3px] opacity-60">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                             </p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- RIGHT SECTION: OS CONTROLS --- */}
            <div className="flex items-center gap-4 shrink-0">
                
                {/* Global Action Button */}
                <Tooltip text={currentBook ? t('tt_add_entry') : t('tt_initialize_ledger')}>
                    <button 
                        onClick={onFabClick} 
                        className="hidden md:flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 text-[10px] font-black tracking-[3px] transition-all active:scale-95 whitespace-nowrap uppercase"
                    >
                        <Plus size={16} strokeWidth={3.5} /> 
                        {currentBook && activeSection === 'books' ? T('btn_new_entry') : T('btn_create_vault')}
                    </button>
                </Tooltip>

                {/* Theme Toggle */}
                <Tooltip text={t('tt_toggle_theme')}>
                    <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                        className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-orange-500 transition-all active:scale-90"
                    >
                        {theme === 'dark' ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
                    </button>
                </Tooltip>

                {/* Contextual Super Menu */}
                {currentBook && activeSection === 'books' ? (
                    <div className="relative">
                        <Tooltip text={t('tt_more_options')}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowSuperMenu(!showSuperMenu); }} 
                                className={`p-3.5  rounded-2xl border transition-all active:scale-90 ${showSuperMenu ? 'bg-orange-500 text-white border-orange-500 shadow-xl' : 'bg-[var(--bg-app)] border-[var(--border)] text-[var(--text-muted)] hover:text-orange-500'}`}
                            >
                                <MoreVertical size={20} strokeWidth={2.5} />
                            </button>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showSuperMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={() => setShowSuperMenu(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 15 }} 
                                        className="absolute right-0 top-18 w-72 bg-[var(--bg-app)] backdrop-blur-2xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-[var(--border)] mb-1">
                                            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{T('action_quick_protocol')}</span>
                                        </div>
                                        {[
                                            { label: 'nav_analytics', icon: BarChart3, color: 'text-blue-500', action: onOpenAnalytics },
                                            { label: 'action_share_access', icon: Share2, color: 'text-purple-500', action: onOpenShare },
                                            { label: 'action_export_report', icon: Download, color: 'text-green-500', action: onOpenExport },
                                            { label: 'action_edit_ledger', icon: Edit2, color: 'text-yellow-500', action: onEditBook },
                                        ].map((item) => (
                                            <button key={item.label} onClick={() => handleAction(item.action)} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)] group">
                                                <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} /> 
                                                <span>{T(item.label)}</span>
                                            </button>
                                        ))}
                                        
                                        <div className="h-px bg-[var(--border)] mx-4 my-2 opacity-50" />
                                        
                                        <button onClick={() => handleAction(() => { setActiveSection('profile'); onBack(); })} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-orange-500">
                                            <UserCog size={18} /> <span>{T('action_manage_profile')}</span>
                                        </button>

                                        <button onClick={() => handleAction(onDeleteBook)} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all text-left text-red-500 hover:bg-red-500/10">
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
                                className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center text-white text-lg font-black border-0 border-[var(--card)]  transition-all overflow-hidden active:scale-90 shadow-lg ${showUserMenu ? 'ring-4 ring-orange-500/30 border-orange-500' : ''}`}
                            >
                                {currentUser?.image ? (
                                    <img src={currentUser.image} alt="U" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="opacity-80">{(currentUser?.username?.charAt(0) || "U").toUpperCase()}</span>
                                )}
                            </button>
                        </Tooltip>
                        
                        <AnimatePresence>
                            {showUserMenu && (
                                <>
                                    <div className="fixed inset-0 z-[499]" onClick={() => setShowUserMenu(false)} />
                                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-18 w-64 bg-[var(--bg-card)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[32px] shadow-2xl z-[500] p-2 overflow-hidden">
                                        <button onClick={() => handleAction(() => setActiveSection('profile'))} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-blue-500">
                                            <User size={18} strokeWidth={3} /> <span>{T('action_account_settings')}</span>
                                        </button>
                                        <div className="mt-2 pt-2 border-t border-[var(--border)] opacity-30 mx-4" />
                                        <button onClick={onLogout} className="w-full flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-left text-red-500 hover:bg-red-500/10">
                                            <LogOut size={18} strokeWidth={3} /> <span>{T('nav_signout')}</span>
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