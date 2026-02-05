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
            <button 
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    // 🔥 ফিক্স: 'items-center' এবং 'h-14' নিশ্চিত করা হলো
    className="w-full h-14 flex items-center justify-between px-5 bg-[var(--bg-app)] border-2 border-[var(--border-color)] rounded-2xl focus:border-orange-500 transition-all text-[11px] font-black uppercase tracking-widest text-[var(--text-main)]"
>
    {/* আইকন এবং টেক্সটকে একটি গ্রুপে রাখা হলো */}
    <div className="flex items-center gap-3 overflow-hidden">
        {Icon && <Icon size={18} className="shrink-0 text-orange-500" />}
        <span className="truncate pt-0.5">{value === 'all' ? 'VIEW ALL' : value.toUpperCase()}</span>
    </div>
    <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
</button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 5, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute top-full left-0 w-full mt-2 glass-heavy border border-[var(--border)] rounded-[22px] shadow-2xl p-2 overflow-hidden"
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