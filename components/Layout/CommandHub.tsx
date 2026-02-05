"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Command, Zap, PlusCircle, Settings2, 
    Moon, Smartphone, Layout, ArrowRight, User
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { db } from '@/lib/offlineDB';

/**
 * VAULT PRO: GLOBAL COMMAND HUB (V1)
 * ---------------------------------
 * Spotlight-style command palette for instant navigation and actions.
 * Trigger: Ctrl + K or Cmd + K
 */
export const CommandHub = ({ isOpen: externalOpen, onClose, onAction, currentUser, setActiveSection }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // ১. কিবোর্ড শর্টকাট লিসেনার (Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // ২. মডাল ওপেন হলে ইনপুটে অটো-ফোকাস
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            fetchVaults();
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const fetchVaults = async () => {
        const data = await db.books.toArray();
        setBooks(data);
    };

    // ৩. কমান্ড লিস্ট (Static + Dynamic)
    const systemCommands = [
        { id: 'new_vault', label: T('btn_create_vault'), icon: PlusCircle, action: () => onAction('addBook'), color: 'text-orange-500' },
        { id: 'go_settings', label: T('nav_system'), icon: Settings2, action: () => setActiveSection('settings'), color: 'text-blue-500' },
        { id: 'go_profile', label: T('action_manage_profile'), icon: User, action: () => setActiveSection('profile'), color: 'text-purple-500' },
    ];

    const filteredBooks = books.filter(b => b.name.toLowerCase().includes(query.toLowerCase()));
    const filteredCommands = systemCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-[#000000]/60 backdrop-blur-xl"
                    />

                    {/* Command Palette Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="w-full max-w-2xl bg-[#0F0F0F]/90 border border-white/10 rounded-[32px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative z-10"
                    >
                        {/* Search Input Area */}
                        <div className="p-6 border-b border-white/5 flex items-center gap-4">
                            <Search size={22} className="text-orange-500" />
                            <input 
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('placeholder_command') || "Type a command or vault name..."}
                                className="flex-1 bg-transparent border-none outline-none text-xl font-black uppercase tracking-widest text-white placeholder:text-white/10"
                            />
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
                                <Command size={10} className="text-white/40" />
                                <span className="text-[10px] font-black text-white/40">ESC</span>
                            </div>
                        </div>

                        {/* Result Area */}
                        <div className="max-h-[450px] overflow-y-auto p-4 no-scrollbar">
                            
                            {/* Section: Quick Actions */}
                            {filteredCommands.length > 0 && (
                                <div className="mb-6">
                                    <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[4px] mb-3">System Actions</p>
                                    <div className="space-y-1">
                                        {filteredCommands.map(cmd => (
                                            <button 
                                                key={cmd.id}
                                                onClick={() => { cmd.action(); setIsOpen(false); }}
                                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl bg-white/5 ${cmd.color}`}><cmd.icon size={18} /></div>
                                                    <span className="text-sm font-black uppercase tracking-widest text-white/80 group-hover:text-white">{cmd.label}</span>
                                                </div>
                                                <ArrowRight size={14} className="text-white/10 group-hover:translate-x-1 group-hover:text-orange-500 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Section: Vaults / Ledgers */}
                            {filteredBooks.length > 0 && (
                                <div>
                                    <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[4px] mb-3">Active Vaults</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {filteredBooks.map(book => (
                                            <button 
                                                key={book._id}
                                                onClick={() => { onAction('selectBook', book); setIsOpen(false); }}
                                                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all group text-left"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                    <Layout size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black uppercase tracking-widest text-white truncate">{book.name}</p>
                                                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Jump to Ledger</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No Results State */}
                            {filteredCommands.length === 0 && filteredBooks.length === 0 && (
                                <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                                    <Zap size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-[4px]">No Protocol Matches Query</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center gap-6">
                            <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">↑↓</span> Navigate
                            </div>
                            <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">ENTER</span> Execute
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};