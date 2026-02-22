"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, LucideIcon, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers';
import { AppleMenu } from '@/components/UI/AppleMenu';

// --- 🛠️ SUB-COMPONENT: ELITE OS INPUT (Updated V12) ---
interface OSInputProps {
    value: any;
    onChange: (val: any) => void;
    placeholder?: string;
    icon?: LucideIcon;
    iconPosition?: 'left' | 'right';
    type?: string;
    autoFocus?: boolean;
    onFocus?: () => void; // কাস্টম ফোকাস হ্যান্ডলার
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    readOnly?: boolean;
    onClick?: () => void; // ডেট পিকার ট্রিগারের জন্য
}

export const OSInput = ({ 
    value, onChange, placeholder, icon: Icon, iconPosition = 'left',
    type = "text", autoFocus = false, onFocus, onBlur, onKeyDown, readOnly, onClick
}: OSInputProps) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className={cn(
            "group relative h-16 bg-[var(--bg-input)] border-2 apple-card transition-all duration-300 flex items-center overflow-hidden",
            isFocused ? "border-orange-500/50 shadow-lg ring-4 ring-orange-500/5" : "border-[var(--border)] shadow-inner"
        )}>
            {/* Icon - Left or Right */}
            {Icon && (
                <div className={cn(
                    "absolute text-[var(--text-muted)] transition-colors z-10",
                    iconPosition === 'left' ? "left-5" : "right-5",
                    isFocused ? "text-orange-500" : "opacity-50"
                )}>
                    <Icon size={20} strokeWidth={2.5} />
                </div>
            )}

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
                className={cn(
                    "w-full h-full bg-transparent text-[14px] font-bold text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]/30 placeholder:uppercase placeholder:tracking-tight placeholder:font-bold",
                    iconPosition === 'left' ? "pl-14 pr-6" : "pl-6 pr-14"
                )}
            />
        </div>
    );
};

// --- 🔘 SUB-COMPONENT: ELITE DROPDOWN (Exported) ---
interface EliteDropdownProps {
    label?: string;
    placeholder?: string;
    current: string;
    options: string[];
    onChange: (val: string) => void;
    icon?: LucideIcon;
    ttKey?: string;
}

export const ModalEliteDropdown = ({ label, placeholder, current, options, onChange, icon: Icon, ttKey }: EliteDropdownProps) => {
    const { t } = useTranslation();
    const getDisplayLabel = (val: string) => t(`category_${val.toLowerCase()}`) || val.toUpperCase();
    const displayText = placeholder || label || 'Select option';

    return (
        <div className="flex-1 space-y-2.5">
            {/* Only show label if provided */}
            {label && (
                <div className="flex items-center gap-2 px-1">
                    {Icon && <Icon size={12} className="text-orange-500/40" />}
                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px]">{label}</label>
                </div>
            )}

            <AppleMenu
                trigger={
                    <div className="relative">
                        <Tooltip text={ttKey ? t(ttKey) : ""}>
                            <button 
                                type="button" 
                                className={cn(
                                    "w-full bg-[var(--bg-input)] border-2 apple-card px-5 py-4",
                                    "flex items-center justify-between transition-all duration-300 shadow-inner outline-none",
                                    "border-[var(--border)]"
                                )}
                            >
                                <span className="text-[11px] font-black uppercase tracking-[1px] text-[var(--text-main)]">
                                    {current ? getDisplayLabel(current) : displayText}
                                </span>
                                <ChevronDown size={14} className="opacity-30" />
                            </button>
                        </Tooltip>
                    </div>
                }
                headerText={label || displayText}
                position="top"
                width="w-full"
            >
                {(options as string[]).map((opt: string) => {
                    const isSelected = current.toLowerCase() === opt.toLowerCase();
                    return (
                        <button 
                            key={opt} 
                            type="button" 
                            onClick={() => onChange(opt)} 
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3.5 apple-card transition-all mb-1 last:mb-0",
                                "text-[10px] font-black uppercase tracking-tight",
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
            </AppleMenu>
        </div>
    );
};