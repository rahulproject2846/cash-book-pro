"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Tooltip } from '@/components/UI/Tooltip';
import { useTranslation } from '@/hooks/useTranslation';

interface CustomSelectProps {
    label?: string;
    value: string;
    options: string[];
    onChange: (val: string) => void;
    icon?: any;
    ttKey?: string; // টুলটিপ কি
}

const CustomSelect = ({ label, value, options, onChange, icon: Icon, ttKey }: CustomSelectProps) => {
    const { t, T } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ট্রান্সলেশন সাপোর্ট (যদি 'all' হয় তবে 'VIEW ALL' দেখাবে)
    const displayValue = value === 'all' 
        ? (T('view_all') || 'VIEW ALL') 
        : value.toUpperCase();

    return (
        <div className="space-y-2 relative" ref={dropdownRef}>
            {label && (
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1">
                    {label}
                </label>
            )}
            
            <Tooltip text={ttKey ? t(ttKey) : ""}>
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full h-14 flex items-center justify-between px-5",
                        "bg-[var(--bg-app)] border-2 border-[var(--border)] rounded-[22px]",
                        "transition-all duration-300 active:scale-[0.98] outline-none shadow-inner",
                        isOpen ? "border-orange-500/40 ring-4 ring-orange-500/5" : "hover:border-[var(--border-color)]"
                    )}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {Icon && <Icon size={18} className={cn("shrink-0", isOpen ? "text-orange-500" : "text-orange-500/60")} />}
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest truncate pt-0.5",
                            isOpen ? "text-orange-500" : "text-[var(--text-main)]"
                        )}>
                            {displayValue}
                        </span>
                    </div>
                    <ChevronDown size={16} className={cn(
                        "shrink-0 transition-transform duration-500 opacity-30",
                        isOpen ? "rotate-180 opacity-100 text-orange-500" : ""
                    )} />
                </button>
            </Tooltip>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-full left-0 w-full mt-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] shadow-2xl p-2 z-[1000] backdrop-blur-3xl overflow-hidden"
                    >
                        <div className="max-h-56 overflow-y-auto no-scrollbar p-1">
                            {options.map((opt: string) => {
                                const isSelected = value.toLowerCase() === opt.toLowerCase();
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => { onChange(opt); setIsOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-5 py-4",
                                            "text-[10px] font-black uppercase tracking-widest transition-all rounded-2xl mb-1 last:mb-0",
                                            isSelected 
                                                ? "text-orange-500 bg-orange-500/10 shadow-sm" 
                                                : "text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        <span className="truncate">{opt === 'all' ? (T('view_all') || 'VIEW ALL') : opt.toUpperCase()}</span>
                                        {isSelected && <Check size={14} strokeWidth={3} className="text-orange-500" />}
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

export default CustomSelect;