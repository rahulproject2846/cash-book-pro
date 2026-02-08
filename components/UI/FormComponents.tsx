// src/components/UI/FormComponents.tsx (নতুন ফাইল)
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ SUB-COMPONENT: OS INPUT (Exported) ---
export const OSInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text", autoFocus = false }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="w-full space-y-2 group transition-all duration-300">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500 opacity-60" />} {label}
            </label>
            <div className="relative group/input">
                <input 
                    ref={inputRef} type={type} value={value} onChange={e => onChange(e.target.value)} 
                    placeholder={placeholder} autoFocus={autoFocus}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-[22px] px-6 py-4 text-[14px] font-bold text-[var(--text-main)] outline-none focus:border-orange-500/40 transition-all placeholder:text-[var(--text-muted)]/20 shadow-inner"
                />
            </div>
        </div>
    );
};

// --- 🔘 SUB-COMPONENT: ELITE DROPDOWN (Exported) ---
export const ModalEliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: any) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    return (
        <div className="flex-1 space-y-2" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-1">
                {Icon && <Icon size={12} className="text-orange-500 opacity-60" />}
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px]">{label}</label>
            </div>
            <div className="relative">
                <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-[22px] px-5 py-4 text-[11px] font-black uppercase tracking-widest text-[var(--text-main)] flex items-center justify-between transition-all ${isOpen ? 'border-orange-500/40' : ''}`}>
                    <span className="truncate">{current}</span>
                    <ChevronDown size={14} className={`opacity-30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 left-0 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] p-2 z-[999] shadow-2xl backdrop-blur-xl">
                            <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
                                {options.map((opt: string) => (
                                    <button key={opt} type="button" onClick={() => { onChange(opt); setIsOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${current.toLowerCase() === opt.toLowerCase() ? 'bg-orange-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-input)]'}`}>
                                        {opt} {current.toLowerCase() === opt.toLowerCase() && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};