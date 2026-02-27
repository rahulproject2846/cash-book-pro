"use client";
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, Layers, Info, ArrowDownLeft, ArrowUpRight, 
    Calendar, Clock, X, Calculator, SlidersHorizontal, 
    ChevronDown, CheckCircle2, AlertTriangle, TrendingUp 
} from 'lucide-react';

// Components & Utils
import { OSInput, ModalEliteDropdown } from '@/components/UI/FormComponents';
import Keypad from '@/components/UI/Keypad';
import { Tooltip } from '@/components/UI/Tooltip';
import { SafeButton } from '@/components/UI/SafeButton';
import { cn } from '@/lib/utils/helpers';
import { useTranslation } from '@/hooks/useTranslation';
import { useVaultStore } from '@/lib/vault/store/index';
import { getVaultStore } from '@/lib/vault/store/storeHelper';
import { db } from '@/lib/offlineDB';
import { fixFinancialPrecision, convertBanglaToEnglish } from '@/lib/vault/core/VaultUtils';
import { useLocalPreview } from '@/hooks/useLocalPreview';

// --- 🎯 SPRING CONFIG ---
const spring = { type: "spring" as const, damping: 30, stiffness: 400 };

// --- 🧠 SMART MATH ENGINE ---
const safeCalculate = (expression: string) => {
    try {
        const sanitized = expression.replace(/[^0-9+\-*/.]/g, '');
        return sanitized ? new Function('return ' + sanitized)() : 0;
    } catch { return 0; }
};

export const EntryModal = ({ isOpen, onClose, initialData, currentUser, currentBook }: any) => {
    const { t } = useTranslation();
    const { saveEntry } = useVaultStore();
    const allEntries = getVaultStore().allEntries;
    
    // Core States
    const [isExpanded, setIsExpanded] = useState(false);
    const [amountStr, setAmountStr] = useState('');
    const [activeInput, setActiveInput] = useState<'income' | 'expense'>('expense');
    const [isLoading, setIsLoading] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [showDuplicate, setShowDuplicate] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const [form, setForm] = useState({ 
        title: '', category: 'GENERAL', paymentMethod: 'CASH', 
        note: '', status: 'completed', date: '', time: '', isPinned: false
    });

    // Header Image Preview
    const { previewUrl } = useLocalPreview(currentBook?.image);

    // --- 📊 AUTO-PILOT INITIALIZATION ---
    useEffect(() => {
        if (!isOpen) return;
        const now = new Date();
        const d = now.toISOString().split('T')[0];
        const tt = now.toTimeString().slice(0, 5);
        const isMobileDevice = window.innerWidth < 768;
        setIsMobile(isMobileDevice);

        if (initialData) {
            setAmountStr(initialData.amount.toString());
            setActiveInput(initialData.type);
            setForm({ ...initialData, category: initialData.category?.toUpperCase() || 'GENERAL' });
            setIsExpanded(true);
        } else {
            setAmountStr('');
            setActiveInput('expense');
            setForm(p => ({ ...p, date: d, time: tt, category: 'GENERAL', paymentMethod: 'CASH', isPinned: false }));
            // 📱 Mobile-only keypad activation
            if (isMobileDevice) {
                setShowKeypad(true);
            } else {
                setShowKeypad(false);
            }
        }
    }, [isOpen, initialData]);

    // --- 🛡️ DUPLICATE SHIELD (Real-time) ---
    useEffect(() => {
        const check = async () => {
            const amt = safeCalculate(convertBanglaToEnglish(amountStr));
            if (amt <= 0) return setShowDuplicate(false);
            const exists = await db.entries.where('userId').equals(currentUser?.id || '').and((entry: any) => 
                entry.bookId === (currentBook?._id || currentBook?.localId) && 
                entry.amount === amt && (Date.now() - entry.createdAt < 600000)
            ).count();
            setShowDuplicate(exists > 0);
        };
        const timer = setTimeout(check, 500);
        return () => clearTimeout(timer);
    }, [amountStr, activeInput, form.category]);

    const handleSave = async () => {
        const amt = fixFinancialPrecision(amountStr);
        
        // 🔍 ENHANCED ID RETRIEVAL: Extract from store first, then fallback to props
        const { userId: storeUserId } = getVaultStore();
        const finalUserId = storeUserId || currentUser?._id || currentUser?.id;
        
        // 🆕 UNIQUE ACTION ID: Prevent duplicate blocking
        const actionId = 'save-entry-' + Date.now();
        
        // 🔍 FORENSIC LOG: Debug save attempt
        console.log('🔍 [SAVE ATTEMPT]', {
            userId: finalUserId,
            bookId: currentBook?._id || currentBook?.localId,
            amount: amt,
            activeInput,
            form,
            actionId
        });
        
        // 🛑 CRITICAL VALIDATION: Check prerequisites before save
        if (!finalUserId) {
            console.error('❌ [ENTRY MODAL] Critical Error: Identity not found in Store or Props');
            return;
        }
        
        if (!currentBook?._id && !currentBook?.localId) {
            console.error('❌ [ENTRY MODAL] Cannot save: Book ID missing');
            return;
        }
        
        if (isLoading || amt <= 0) return;
        setIsLoading(true);
        try {
            const res = await saveEntry({
                ...form, amount: amt, type: activeInput,
                bookId: initialData?.bookId || currentBook?._id || currentBook?.localId,
                userId: finalUserId
            }, initialData, actionId);
            if (res.success) onClose();
        } finally { 
            setIsLoading(false);
            console.log('🔓 [ENTRY MODAL] Loading state cleared');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center overflow-hidden bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0" />
            
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
                className="w-full md:max-w-lg max-h-[90vh] md:min-h-[600px] rounded-t-[32px] md:rounded-[32px] bg-[var(--bg-app)] border border-[var(--border)] shadow-2xl relative z-10 flex flex-col"
            >
                {/* Visual Handle for Mobile */}
                <div className="md:hidden w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 shrink-0" />
                
                {/* Header: Identity */}
                <div className="px-6 py-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-2xl" /> : <Calculator size={22} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-muted)]      mb-0.5">{currentBook?.name || "LEDGER ENTRY"}</p>
                            <p className="text-[13px] font-bold text-[var(--text-main)]">{activeInput === 'income' ? 'Cash Inflow' : 'Cash Outflow'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-muted)] hover:text-white"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24 md:pb-8">
                    
                    {/* 🎯 POINT 1 & 2: THE LIVING CARDS (Desktop Input + Mobile Keypad) */}
                    <div className="grid grid-cols-2 gap-4 h-20 mb-4">
                        {['expense', 'income'].map((type) => (
                            <motion.button
                                key={type} onClick={() => { setActiveInput(type as any); if (isMobile) setShowKeypad(true); }}
                                whileTap={{ scale: 0.96 }}
                                className={cn(
                                    "relative flex flex-col justify-center px-6 rounded-[28px] border-2 transition-all duration-300",
                                    activeInput === type 
                                    ? (type === 'expense' ? "bg-red-500/20 border-red-500 shadow-[0_0_25px_-5px_rgba(239,68,68,0.5)]" : "bg-green-500/20 border-green-500 shadow-[0_0_25px_-5px_rgba(34,197,94,0.5)]")
                                    : "bg-[var(--bg-input)] border-transparent opacity-40"
                                )}
                            >
                                <span className="absolute top-3 right-4 text-[9px] font-black     opacity-60">{type}</span>
                                {type === 'expense' ? <ArrowDownLeft size={16} className="text-red-400 mb-1" /> : <ArrowUpRight size={16} className="text-green-400 mb-1" />}
                                {activeInput === type && !isMobile ? (
                                    <input
                                        type="text"
                                        value={amountStr}
                                        onChange={(e) => setAmountStr(e.target.value)}
                                        className="font-mono-finance font-black text-2xl bg-transparent text-[var(--text-main)] outline-none truncate w-full text-center"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                ) : (
                                    <div className={cn("font-mono-finance font-black text-2xl truncate", activeInput === type ? "text-[var(--text-main)]" : "text-[var(--text-muted)]")}>
                                        {activeInput === type ? (amountStr || "0.00") : "---"}
                                    </div>
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* 🎯 POINT 4 & 5: STEALTH INPUTS (No labels) */}
                    <div className="space-y-4">
                        <OSInput 
                            value={form.title} icon={CreditCard} iconPosition="left"
                            placeholder="Enter entry title..." 
                            onChange={(v: any) => setForm({...form, title: v})}
                            onFocus={() => setShowKeypad(false)}
                        />

                        {/* 🎯 POINT 6: SQUIRCLE TOGGLE BOX */}
                        <motion.button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full h-14 bg-[var(--bg-input)] rounded-[24px] border border-[var(--border)] flex items-center justify-center gap-3 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                        >
                            <SlidersHorizontal size={16} />
                            <span className="text-xs font-bold    ">{isExpanded ? 'Fewer Details' : 'More Options'}</span>
                            <ChevronDown size={16} className={cn("transition-transform duration-500", isExpanded && "rotate-180")} />
                        </motion.button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden pt-1">
                                    <div className="grid grid-cols-2 gap-3">
                                        <OSInput type="date" value={form.date} icon={Calendar} iconPosition="left" onChange={(v: any) => setForm({...form, date: v})} onFocus={() => setShowKeypad(false)} />
                                        <OSInput type="time" value={form.time} icon={Clock} iconPosition="left" onChange={(v: any) => setForm({...form, time: v})} onFocus={() => setShowKeypad(false)} />
                                    </div>
                                    
                                    {/* 🎯 POINT 7 & 8: ELITE DROPDOWNS */}
                                    <div className="grid grid-cols-2 gap-3 relative z-50">
                                        <ModalEliteDropdown current={form.category} options={currentUser?.categories || []} onChange={(v: any) => setForm({...form, category: v})} icon={Layers} />
                                        <ModalEliteDropdown current={form.paymentMethod} options={['CASH', 'BANK', 'BKASH', 'NAGAD']} onChange={(v: any) => setForm({...form, paymentMethod: v})} icon={CreditCard} />
                                    </div>

                                    <OSInput 
                                        value={form.note} icon={Info} iconPosition="left"
                                        placeholder="Add a note..." 
                                        onChange={(v: any) => setForm({...form, note: v})}
                                        onFocus={() => setShowKeypad(false)}
                                    />

                                    {/* 📌 PIN TOGGLE - Apple Native Design */}
                                    <div className="flex items-center justify-between p-3 bg-[var(--bg-input)] rounded-2xl border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-[var(--text-main)]">Pin to Top</span>
                                        </div>
                                        <button
                                            onClick={() => setForm({...form, isPinned: !form.isPinned})}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                                                form.isPinned ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                                form.isPinned ? 'translate-x-7' : 'translate-x-1'
                                            }`} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* --- 🚀 ACTION AREA --- */}
                <div className="absolute bottom-0 w-full bg-[var(--bg-app)] border-t border-[var(--border)] p-5 z-[100]">
                    <AnimatePresence>
                        {showKeypad && (
                            <motion.div initial={{ y: 250 }} animate={{ y: 0 }} exit={{ y: 250 }} transition={spring} className="mb-4">
                                {showDuplicate && (
                                    <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3">
                                        <AlertTriangle size={16} className="text-orange-500" />
                                        <span className="text-[10px] font-black text-orange-500    ">{t('duplicate_warning')}</span>
                                    </div>
                                )}
                                <Keypad 
                                    onInput={(v) => setAmountStr(p => p + v)} 
                                    onDelete={() => setAmountStr(p => p.slice(0, -1))} 
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 🎯 POINT 10: ROBOT ORANGE BUTTON */}
                    <SafeButton
                        actionId="save-entry" onAction={handleSave}
                        disabled={isLoading || !amountStr}
                        className="w-full h-14 bg-[var(--orange-main)] text-white rounded-[24px] font-black      shadow-[0_8px_20px_rgba(249,115,22,0.3)] active:scale-[0.98] transition-all"
                    >
                        <CheckCircle2 size={18} /> {t('save_entry')}
                    </SafeButton>
                </div>
            </motion.div>
        </div>
    );
};
