// src/components/Sections/CommandHub.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Command, Zap, PlusCircle, Settings2, 
    ArrowRight, User, Layout
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { db } from '@/lib/offlineDB';

interface CommandItem {
    id: string;
    label: string;
    icon: React.ElementType;
    action: () => void;
    type: 'command' | 'book';
    key: string | number;
    color?: string;
    book?: any;
}

export const CommandHub = ({ isOpen: externalOpen, onClose, onAction, currentUser, setActiveSection, setCurrentBook }: any) => {
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [activeIndex, setActiveIndex] = useState(0); 
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null); 

    const fetchVaults = async () => {
        const data = await db.books.where('isDeleted').equals(0).toArray();
        setBooks(data.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    };

    const allItems = useMemo<CommandItem[]>(() => { 
        const bookItems: CommandItem[] = books.map(b => ({
            id: String(b.localId),
            label: b.name,
            icon: Layout,
            action: () => {onAction('selectBook', b);},
            type: 'book',
            key: String(b._id || b.localId),
            book: b
        }));
        
        const systemCommands: CommandItem[] = [ 
            { id: 'new_vault', label: t('btn_create_vault'), icon: PlusCircle, action: () => onAction('addBook'), type: 'command', color: 'text-orange-500', key: 'new_vault' },
            { id: 'go_settings', label: t('nav_system'), icon: Settings2, action: () => setActiveSection('settings'), type: 'command', color: 'text-blue-500', key: 'go_settings' },
            { id: 'go_profile', label: t('action_manage_profile'), icon: User, action: () => setActiveSection('profile'), type: 'command', color: 'text-purple-500', key: 'go_profile' },
        ];
        
        const combinedList = [...systemCommands, ...bookItems];
        const q = query.toLowerCase().trim();
        if (!q) return combinedList;
        return combinedList.filter(item => item.label.toLowerCase().includes(q));
    }, [books, query, t, onAction, setActiveSection, setCurrentBook]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                return;
            }
        }
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => prev > 0 ? prev - 1 : allItems.length - 1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => prev < allItems.length - 1 ? prev + 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (allItems[activeIndex]) {
                    allItems[activeIndex].action();
                    setIsOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    }, [isOpen, allItems, activeIndex]);
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
            fetchVaults();
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
            setActiveIndex(0);
        }
    }, [isOpen]);
    
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]); 
    
    useEffect(() => {
        const activeElement = resultsRef.current?.children[activeIndex];
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeIndex]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
                    {/* Overlay with Backdrop Blur */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/5 backdrop-blur-sm"
                    />

                    {/* Main Command Palette Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -10 }}
                        style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            backdropFilter: 'var(--glass-blur)',
                            WebkitBackdropFilter: 'var(--glass-blur)',
                            boxShadow: 'var(--card-shadow)',
                            borderColor: 'var(--border-color)'
                        }}
                        className="w-full max-w-2xl border rounded-[28px] overflow-hidden relative z-10"
                    >
                        {/* Search Input Area */}
                        <div className="p-5 border-b flex items-center gap-4" style={{ borderColor: 'var(--border-soft)' }}>
                            <Search size={20} className="text-orange-500" />
                            <input 
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('placeholder_command') || "Search protocols..."}
                                style={{ color: 'var(--text-main)' }}
                                className="flex-1 bg-transparent border-none outline-none text-lg font-medium placeholder:text-[#8E8E93]"
                            />
                            <div className="px-2 py-1 rounded-md bg-black/5 border flex items-center gap-1" style={{ borderColor: 'var(--border-soft)' }}>
                                <Command size={10} className="opacity-40" />
                                <span className="text-[10px] font-bold opacity-40 uppercase">ESC</span>
                            </div>
                        </div>

                        {/* Results Area */}
                        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto p-3 no-scrollbar">
                            {allItems.length > 0 && allItems.map((item, index) => {
                                const isActive = index === activeIndex;
                                return (
                                    <button 
                                        key={item.key || item.id}
                                        onClick={() => { item.action(); setIsOpen(false); }}
                                        onMouseEnter={() => setActiveIndex(index)} 
                                        style={{ 
                                            backgroundColor: isActive ? 'rgba(0,0,0,0.04)' : 'transparent',
                                            borderColor: isActive ? 'var(--border-color)' : 'transparent'
                                        }}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 border group mb-1 last:mb-0`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-white shadow-sm text-orange-500' : 'bg-black/5 text-gray-400'} ${item.color || ''}`}>
                                                <item.icon size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[13px] font-semibold tracking-tight" style={{ color: 'var(--text-main)' }}>{item.label}</p>
                                                <p className="text-[10px] font-medium opacity-50 uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                                    {item.type === 'book' ? 'Vault Protocol' : 'System Command'}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className={`shrink-0 transition-all ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                );
                            })}
                            
                            {/* Empty State */}
                            {allItems.length === 0 && (
                                <div className="py-16 text-center flex flex-col items-center gap-3">
                                    <div className="p-4 rounded-full bg-black/5 text-gray-300">
                                        <Zap size={32} />
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest opacity-30" style={{ color: 'var(--text-main)' }}>
                                        {t('no_match_found') || "No Protocols Found"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Hints */}
                        <div className="px-6 py-3 border-t flex items-center gap-6" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'var(--border-soft)' }}>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold opacity-40 uppercase tracking-tighter" style={{ color: 'var(--text-main)' }}>
                                <span className="px-1 py-0.5 rounded border bg-white" style={{ borderColor: 'var(--border-soft)' }}>↑↓</span> Navigate
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold opacity-40 uppercase tracking-tighter" style={{ color: 'var(--text-main)' }}>
                                <span className="px-1 py-0.5 rounded border bg-white" style={{ borderColor: 'var(--border-soft)' }}>ENTER</span> Execute
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};