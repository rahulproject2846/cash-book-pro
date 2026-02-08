// src/components/UI/EliteDropdown.tsx (নতুন ফাইল)
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip'; // নিশ্চিত করুন পাথ সঠিক

// --- 🔘 Elite Dropdown (Exported) ---
export const EliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
    // ... আপনার দেওয়া সম্পূর্ণ EliteDropdown কোডটি এখানে থাকবে ...
    const { T, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: any) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getTranslatedLabel = (key: string) => t(`category_${key.toLowerCase()}`) || key;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ... বাকি JSX ... */}
            <button 
                // ...
            >
                <Icon size={16} strokeWidth={2.5} className={isOpen ? 'text-orange-500' : 'text-[var(--text-muted)] opacity-60'} />
                <span className="hidden lg:block text-[var(--text-main)] truncate max-w-[100px]">
                     {getTranslatedLabel(current)}
                </span>
                <ChevronDown size={12} className={`opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        // ...
                        className="absolute right-0 mt-3 w-56 bg-[var(--bg-card)]/95 backdrop-blur-3xl border border-[var(--border)] rounded-[28px] p-2 z-[1000] shadow-2xl"
                    >
                        <div className="px-4 py-2 border-b border-[var(--border)] mb-1 opacity-40">
                            <span className="text-[8px] font-black uppercase tracking-[3px]">{label}</span>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto no-scrollbar py-1">
                            {options.map((opt: string) => {
                                const isSelected = current.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button 
                                        key={opt} 
                                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                                        className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${isSelected ? 'text-orange-500 bg-orange-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                    >
                                        {getTranslatedLabel(opt)} 
                                        {isSelected && <Check size={14} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};