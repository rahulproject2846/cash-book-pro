"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

// --- CUSTOM DROPDOWN (SCROLLABLE & THEMED) ---
const CustomSelect = ({ label, value, options, onChange, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500" />} {label}
            </label>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between h-14 px-5 bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-2xl focus:border-orange-500 transition-all text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]"
            >
                <span className="truncate">{value}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute z-[200] left-0 right-0 top-full mt-2 w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="max-h-48 overflow-y-auto no-scrollbar p-1">
                            {options.map((opt: string) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => { onChange(opt); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/10 hover:text-orange-500 transition-colors flex items-center justify-between rounded-xl mb-1 ${value === opt ? 'text-orange-500 bg-orange-500/5' : 'text-[var(--text-muted)]'}`}
                                >
                                    {opt}
                                    {value === opt && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect; // 🔥 এক্সপোর্ট ডিফল্ট করুন