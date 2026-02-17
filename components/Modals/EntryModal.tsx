"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, Layers, Info, ArrowDownLeft, ArrowUpRight, 
    Calendar, Clock, X, PlusCircle, Calculator, 
    SlidersHorizontal, ChevronDown, CheckCircle2, AlertTriangle 
} from 'lucide-react';

// Components & Utils
import { OSInput, ModalEliteDropdown } from '@/components/UI/FormComponents';
import Keypad from '@/components/UI/Keypad';
import { cn, toBn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useVault } from '@/hooks/useVault';

// --- 🧠 SMART MATH ENGINE ---
const safeCalculate = (expression: string) => {
    try {
        const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
        if (!sanitized) return 0;
        return new Function('return ' + sanitized)();
    } catch { return 0; }
};

// --- 🕐 TIME FORMATTING HELPERS ---
// Convert database time format ("08:05 pm") to HTML input format ("20:05")
const dbToInputTime = (timeStr: string): string => {
    if (!timeStr) return '';
    
    // If already in 24h format, return as-is
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr;
    
    // Convert 12h format to 24h format
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!match) return timeStr;
    
    let [, hours, minutes, period] = match;
    let hoursNum = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && hoursNum !== 12) {
        hoursNum += 12;
    } else if (period.toUpperCase() === 'AM' && hoursNum === 12) {
        hoursNum = 0;
    }
    
    return `${hoursNum.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

// Convert HTML input format ("20:05") to database format ("08:05 pm")
const inputToDbTime = (timeStr: string): string => {
    if (!timeStr) return '';
    
    // If already in 12h format, return as-is
    if (/:\d{2}\s*(am|pm)/i.test(timeStr)) return timeStr.toLowerCase();
    
    // Convert 24h format to 12h format
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return timeStr;
    
    let [, hours, minutes] = match;
    let hoursNum = parseInt(hours);
    
    const period = hoursNum >= 12 ? 'pm' : 'am';
    if (hoursNum > 12) hoursNum -= 12;
    if (hoursNum === 0) hoursNum = 12;
    
    return `${hoursNum.toString().padStart(2, '0')}:${minutes} ${period}`;
};

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData, currentUser, currentBook }: any) => {
    const { t, language } = useTranslation();
    const { checkPotentialDuplicate } = useVault(currentUser, currentBook);
    
    // States
    const [isExpanded, setIsExpanded] = useState(false);
    const [amountStr, setAmountStr] = useState('');
    const [activeInput, setActiveInput] = useState<'in' | 'out'>('out');
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
    const [duplicateWarningBlink, setDuplicateWarningBlink] = useState(false);

    const [form, setForm] = useState({ 
        title: '', category: 'GENERAL', paymentMethod: 'CASH', 
        note: '', status: 'completed', date: '', time: '' 
    });

    const userCategories = currentUser?.categories || ['GENERAL', 'FOOD', 'TRANSPORT'];
    const amountInputRef = useRef<HTMLInputElement>(null);

    // --- 🛡️ LOGIC: POTENTIAL DUPLICATE CHECK ---
    useEffect(() => {
        const checkDuplicate = async () => {
            const finalAmount = safeCalculate(amountStr);
            if (finalAmount > 0) {
                // 🚀 DUPLICATE ENTRY SHIELD: Check amount, type, and category within last 10 minutes
                const isDuplicate = await checkPotentialDuplicate(
                    finalAmount, 
                    activeInput === 'in' ? 'income' : 'expense',
                    form.category
                );
                setShowDuplicateWarning(!!isDuplicate);
                if (isDuplicate) {
                    setDuplicateWarningBlink(true);
                    const intervalId = setInterval(() => {
                        setDuplicateWarningBlink(!duplicateWarningBlink);
                    }, 500);
                    return () => clearInterval(intervalId);
                } else {
                    setDuplicateWarningBlink(false);
                }
            } else {
                setShowDuplicateWarning(false);
                setDuplicateWarningBlink(false);
            }
        };

        const timeoutId = setTimeout(checkDuplicate, 500); // Debounce check
        return () => clearTimeout(timeoutId);
    }, [amountStr, activeInput, form.category]);

    useEffect(() => { 
        setIsMobile(window.innerWidth < 768); 
    }, []);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const localDate = now.toISOString().split('T')[0];
            const localTime = now.toTimeString().slice(0, 5);  // 24h format: "20:30"
            
            if (initialData) {
                const isIncome = initialData.type === 'income';
                setAmountStr(initialData.amount.toString());
                setActiveInput(isIncome ? 'in' : 'out');
                
                // 🔒 CRITICAL FIX: Proper date hydration for editEntry mode
                // Convert entry timestamp to HTML date/time input format
                let entryDate = localDate;
                let entryTime = localTime;
                
                if (initialData.date) {
                    try {
                        // Handle various date formats from the database
                        const entryDateTime = new Date(initialData.date);
                        if (!isNaN(entryDateTime.getTime())) {
                            entryDate = entryDateTime.toISOString().split('T')[0];
                            entryTime = entryDateTime.toTimeString().slice(0, 5);  // 24h format: "20:05"
                        }
                    } catch (err) {
                        console.warn('Date conversion failed, using current time:', err);
                    }
                }
                
                // 🚨 TIME FIELD RESTORATION: Use existing time field if available
                if (initialData.time && typeof initialData.time === 'string') {
                    entryTime = dbToInputTime(initialData.time);  // Convert to 24h format for HTML input
                }
                
                // Preserve all existing data including vKey, localId, _id, checksum
                // Only override date/time fields with properly formatted values
                setForm({ 
                    ...initialData, 
                    category: initialData.category?.toUpperCase() || 'GENERAL',
                    date: entryDate,
                    time: entryTime
                });
                setTimeout(() => setIsExpanded(true), 200);
            } else {
                setAmountStr('');
                setActiveInput('out');
                setForm(prev => ({ 
                    ...prev, title: '', note: '', status: 'completed', 
                    date: localDate, time: localTime,
                    category: 'GENERAL', paymentMethod: 'CASH', type: 'expense' 
                }));
                setIsExpanded(false);
                if (window.innerWidth < 768) setShowKeypad(true);
            }

            setTimeout(() => {
                if (window.innerWidth >= 768) amountInputRef.current?.focus();
            }, 300);
        }
    }, [initialData, isOpen]);

    const handleAmountFocus = () => {
        if (isMobile) {
            setShowKeypad(true);
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }
    };

    const handleTextFocus = () => {
        if (isMobile) setShowKeypad(false);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const finalAmount = safeCalculate(amountStr);
        if (isLoading || finalAmount <= 0) return;
        
        setIsLoading(true);
        try {
            const finalData = {
                ...form, 
                amount: finalAmount, 
                type: activeInput === 'in' ? 'income' : 'expense',
                time: inputToDbTime(form.time),  // Convert 24h to 12h format for storage
                bookId: initialData?.bookId || currentBook?._id || currentBook?.localId  // 🚨 ADD bookId
            };
            await onSubmit(finalData, initialData);
            setShowKeypad(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const getFontSize = (str: string) => {
        const len = str.length;
        if (len > 12) return 'text-3xl';
        if (len > 8) return 'text-4xl';
        return 'text-5xl';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="fixed inset-0 bg-black/70 backdrop-blur-md" 
            />
            
            <motion.div 
                initial={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0, y: 20 }} 
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }} 
                exit={isMobile ? { y: "100%" } : { scale: 0.95, opacity: 0, y: 20 }} 
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="bg-[var(--bg-card)] w-full md:max-w-lg h-[92vh] md:h-auto rounded-t-[32px] md:rounded-[32px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                {/* Visual Handle for Mobile */}
                <div className="md:hidden w-12 h-1.5 bg-[var(--border)]/60 rounded-full mx-auto mt-3 shrink-0" />
                
                {/* Header Section */}
                <div className="px-6 py-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500 shadow-inner overflow-hidden">
                            {currentBook?.image ? 
                                <img src={currentBook.image} alt="V" className="w-full h-full object-cover" /> : 
                                <PlusCircle size={24} strokeWidth={2.5} />
                            }
                        </div>
                        <div>
                            <h2 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] mb-0.5 leading-none">
                                {currentBook?.name || "NEW ENTRY"}
                            </h2>
                            <p className={cn(
                                "text-[13px] font-bold uppercase tracking-[1px]",
                                activeInput === 'in' ? "text-green-500" : "text-orange-500"
                            )}>
                                {activeInput === 'in' ? 'Income Stream' : 'Expense Record'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-32 md:pb-8">
                    
                    {/* 1. TYPE TOGGLE */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button 
                            onClick={() => { setActiveInput('out'); handleAmountFocus(); }} 
                            className={cn(
                                "h-16 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 active:scale-95", 
                                activeInput === 'out' 
                                ? "bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_8px_20px_-6px_rgba(239,68,68,0.3)]" 
                                : "bg-[var(--bg-input)] border-transparent opacity-60"
                            )}
                        >
                            <ArrowDownLeft size={20} strokeWidth={3} />
                            <span className="text-[11px] font-bold uppercase tracking-[1.5px]">Expense</span>
                        </button>
                        <button 
                            onClick={() => { setActiveInput('in'); handleAmountFocus(); }} 
                            className={cn(
                                "h-16 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 active:scale-95", 
                                activeInput === 'in' 
                                ? "bg-green-500/10 border-green-500/50 text-green-500 shadow-[0_8px_20px_-6px_rgba(34,197,94,0.3)]" 
                                : "bg-[var(--bg-input)] border-transparent opacity-60"
                            )}
                        >
                            <ArrowUpRight size={20} strokeWidth={3} />
                            <span className="text-[11px] font-bold uppercase tracking-[1.5px]">Income</span>
                        </button>
                    </div>

                    {/* 2. AMOUNT DISPLAY - Apple Haptic Look */}
                    <motion.div 
                        onClick={handleAmountFocus} 
                        animate={showKeypad ? { scale: [1, 1.02, 1] } : {}}
                        className={cn(
                            "w-full h-24 mb-6 rounded-3xl bg-[var(--bg-app)] border-2 flex flex-col justify-center px-6 relative transition-all duration-300", 
                            showKeypad ? "border-orange-500 shadow-[0_0_25px_-5px_rgba(249,115,22,0.2)]" : "border-[var(--border)]"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Calculator size={12} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[1.5px]">Entry Amount</span>
                        </div>
                        <input
                            ref={amountInputRef}
                            value={amountStr}
                            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9+\-*/.]/g, ''))}
                            onFocus={handleAmountFocus}
                            readOnly={isMobile}
                            placeholder="0.00"
                            className={cn(
                                "w-full bg-transparent text-right outline-none font-mono-finance font-black text-[var(--text-main)] placeholder:text-[var(--text-muted)]/20", 
                                getFontSize(amountStr)
                            )}
                        />
                    </motion.div>

                    {/* 3. MAIN INPUTS */}
                    <div className="space-y-4">
                        <OSInput 
                            value={form.title} 
                            onChange={(val:any) => setForm({...form, title: val})} 
                            placeholder={t('placeholder_entry_title')} 
                            icon={CreditCard} 
                            onFocus={handleTextFocus} 
                            onKeyDown={handleKeyDown}
                        />
                        
                        <button 
                            type="button" 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className={cn(
                                "w-full h-14 flex items-center justify-between px-5 rounded-2xl border-2 transition-all duration-300 active:scale-[0.98]",
                                isExpanded 
                                    ? "bg-orange-500/5 border-orange-500/20 text-orange-500" 
                                    : "bg-[var(--bg-input)] border-transparent text-[var(--text-muted)] hover:bg-[var(--border)]/10"
                            )}
                        >
                            <span className="text-[11px] font-bold uppercase tracking-[2px] flex items-center gap-2.5">
                                <SlidersHorizontal size={16} /> 
                                {isExpanded ? 'Fewer Details' : 'More Options'}
                            </span>
                            <ChevronDown size={18} className={cn("transition-transform duration-300", isExpanded && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }} 
                                    animate={{ height: "auto", opacity: 1 }} 
                                    exit={{ height: 0, opacity: 0 }} 
                                    className="overflow-hidden space-y-4 pt-1"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <OSInput type="date" value={form.date} onChange={(v:any) => setForm({...form, date: v})} icon={Calendar} />
                                        <OSInput type="time" value={form.time} onChange={(v:any) => setForm({...form, time: v})} icon={Clock} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <ModalEliteDropdown label={t('classification')} current={form.category} options={userCategories} onChange={(v:any) => setForm({...form, category: v})} icon={Layers} />
                                        <ModalEliteDropdown label={t('via_protocol')} current={form.paymentMethod} options={['CASH', 'BANK', 'BKASH', 'NAGAD']} onChange={(v:any) => setForm({...form, paymentMethod: v})} icon={CreditCard} />
                                    </div>
                                    
                                    <OSInput value={form.note} onChange={(v:any) => setForm({...form, note: v})} placeholder={t('placeholder_entry_memo')} icon={Info} onFocus={handleTextFocus} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- 🚀 BOTTOM ACTION AREA (Keypad + Warnings + Submit) --- */}
                <AnimatePresence>
                    {isMobile && showKeypad && (
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="absolute bottom-0 w-full z-[100] bg-[var(--bg-card)] border-t border-[var(--border)] pb-safe"
                        >
                            {/* Potential Duplicate Warning (Mobile) */}
                            <AnimatePresence>
                                {showDuplicateWarning && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="mx-4 mb-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-3"
                                    >
                                        <AlertTriangle size={18} className="text-orange-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider leading-tight">
                                            <span className="inline-flex items-center gap-2">
                                                {t('duplicate_warning')}
                                                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                            </span>
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Keypad 
                                onInput={(val) => setAmountStr(prev => prev + val)}
                                onDelete={() => setAmountStr(prev => prev.slice(0, -1))}
                            />
                            <div className="px-4 pb-4">
                                <button 
                                    onClick={() => handleSubmit()} 
                                    disabled={isLoading}
                                    className="w-full h-14 bg-orange-500 text-white rounded-2xl font-black text-[13px] uppercase tracking-[3px] shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    {isLoading ? 'Processing...' : 'Save Entry'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Save Button with Duplicate Warning */}
                <div className="hidden md:block p-6 border-t border-[var(--border)]/50 bg-[var(--bg-card)]">
                    <AnimatePresence>
                        {showDuplicateWarning && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3"
                            >
                                <AlertTriangle size={18} className="text-orange-500" />
                                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">{t('duplicate_warning')}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <button 
                        onClick={() => handleSubmit()} 
                        className="group w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[3px] shadow-[0_10px_30px_-10px_rgba(249,115,22,0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                        {t('execute_protocol')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};