"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, LucideIcon, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';

// --- 🛠️ SUB-COMPONENT: ELITE OS INPUT (Updated V12) ---
interface OSInputProps {
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
    icon?: LucideIcon;
    type?: string;
    autoFocus?: boolean;
    onFocus?: () => void; // কাস্টম ফোকাস হ্যান্ডলার
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    readOnly?: boolean;
    onClick?: () => void; // ডেট পিকার ট্রিগারের জন্য
}

export const OSInput = ({ 
    value, onChange, placeholder, icon: Icon, 
    type = "text", autoFocus = false, onFocus, onBlur, onKeyDown, readOnly, onClick
}: OSInputProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={cn(
            "group relative h-16 bg-[var(--bg-input)] border-2 rounded-[24px] transition-all duration-300 flex items-center overflow-hidden",
            isFocused ? "border-orange-500/50 shadow-lg ring-4 ring-orange-500/5" : "border-[var(--border)] shadow-inner"
        )}>
            {/* Left Icon (Always Visible) */}
            <div className={cn(
                "absolute left-5 text-[var(--text-muted)] transition-colors z-10",
                isFocused ? "text-orange-500" : "opacity-50"
            )}>
                {Icon && <Icon size={20} strokeWidth={2.5} />}
            </div>

            {/* Main Input Field */}
            <input 
                type={type} 
                value={value} 
                onChange={e => onChange(e.target.value)} 
                onFocus={() => { setIsFocused(true); if(onFocus) onFocus(); }}
                onBlur={() => { setIsFocused(false); if(onBlur) onBlur(); }}
                onKeyDown={onKeyDown}
                onClick={onClick}
                placeholder={placeholder} 
                autoFocus={autoFocus}
                readOnly={readOnly}
                className="w-full h-full bg-transparent pl-14 pr-6 text-[14px] font-bold text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]/30 placeholder:uppercase placeholder:tracking-[2px] placeholder:font-bold"
            />
        </div>
    );
};

// --- 🔘 SUB-COMPONENT: ELITE DROPDOWN (Exported) ---
interface EliteDropdownProps {
    label: string;
    current: string;
    options: string[];
    onChange: (val: string) => void;
    icon?: LucideIcon;
    ttKey?: string;
}

export const ModalEliteDropdown = ({ label, current, options, onChange, icon: Icon, ttKey }: EliteDropdownProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { 
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); 
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getDisplayLabel = (val: string) => t(`category_${val.toLowerCase()}`) || val.toUpperCase();

    return (
        <div className="flex-1 space-y-2.5" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-1">
                {Icon && <Icon size={12} className={cn("transition-colors", isOpen ? "text-orange-500" : "text-orange-500/40")} />}
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px]">{label}</label>
            </div>

            <div className="relative">
                <Tooltip text={ttKey ? t(ttKey) : ""}>
                    <button 
                        type="button" 
                        onClick={() => setIsOpen(!isOpen)} 
                        className={cn(
                            "w-full bg-[var(--bg-input)] border-2 rounded-[22px] px-5 py-4",
                            "flex items-center justify-between transition-all duration-300 shadow-inner outline-none",
                            isOpen ? "border-orange-500/40 ring-4 ring-orange-500/5 shadow-xl" : "border-[var(--border)]"
                        )}
                    >
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest truncate",
                            isOpen ? "text-orange-500" : "text-[var(--text-main)]"
                        )}>
                            {getDisplayLabel(current)}
                        </span>
                        <ChevronDown size={14} className={cn(
                            "opacity-30 transition-transform duration-500",
                            isOpen ? "rotate-180 opacity-100 text-orange-500" : ""
                        )} />
                    </button>
                </Tooltip>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="absolute bottom-full mb-3 left-0 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[28px] p-2 z-[999] shadow-2xl backdrop-blur-3xl overflow-hidden"
                        >
                            <div className="px-3 py-2 border-b border-[var(--border)] mb-1 flex items-center justify-between opacity-30">
                                <span className="text-[7px] font-black uppercase tracking-[3px]">{label}</span>
                                <Zap size={10} fill="currentColor" strokeWidth={0} />
                            </div>
                            
                            <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
                                {options.map((opt: string) => {
                                    const isSelected = current.toLowerCase() === opt.toLowerCase();
                                    return (
                                        <button 
                                            key={opt} 
                                            type="button" 
                                            onClick={() => { onChange(opt); setIsOpen(false); }} 
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all mb-1 last:mb-0",
                                                "text-[10px] font-black uppercase tracking-widest",
                                                isSelected 
                                                    ? "bg-orange-500 text-white shadow-lg" 
                                                    : "text-[var(--text-muted)] hover:bg-[var(--bg-input)] hover:text-[var(--text-main)]"
                                            )}
                                        >
                                            <span className="truncate">{getDisplayLabel(opt)}</span>
                                            {isSelected && <Check size={14} strokeWidth={3} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};