"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CreditCard, Layers, Info, Loader2, Clock, X, 
    ArrowDownLeft, ArrowUpRight, Check, SlidersHorizontal, 
    ChevronDown, PlusCircle, Fingerprint
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ SUB-COMPONENT: OS INPUT ---
const OSInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text", autoFocus = false }: any) => {
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

// --- 🔘 SUB-COMPONENT: ELITE DROPDOWN ---
const ModalEliteDropdown = ({ label, current, options, onChange, icon: Icon }: any) => {
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

export const EntryModal = ({ isOpen, onClose, onSubmit, initialData, currentUser, currentBook }: any) => {
    const { T, t, language } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const [inflowAmount, setInflowAmount] = useState('');
    const [outflowAmount, setOutflowAmount] = useState('');
    const [activeInput, setActiveInput] = useState<'in' | 'out'>('out');
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({ title: '', amount: 0, type: 'expense', category: 'GENERAL', paymentMethod: 'CASH', note: '', status: 'completed', date: '', time: '' });

    const userCategories = currentUser?.categories || ['GENERAL', 'SALARY', 'FOOD', 'RENT', 'TRANSPORT'];

    useEffect(() => { 
        setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            const localDate = now.toISOString().split('T')[0];
            const localTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            if (initialData) {
                const isIncome = initialData.type === 'income';
                setInflowAmount(isIncome ? initialData.amount.toString() : '');
                setOutflowAmount(!isIncome ? initialData.amount.toString() : '');
                setForm({ ...initialData, category: initialData.category.toUpperCase(), date: new Date(initialData.date).toISOString().split('T')[0], time: initialData.time || localTime });
                setActiveInput(isIncome ? 'in' : 'out'); setIsExpanded(true);
            } else {
                setInflowAmount(''); setOutflowAmount('');
                setForm(prev => ({ ...prev, title: '', note: '', date: localDate, time: localTime, category: (typeof window !== 'undefined' && localStorage.getItem('last_category')) || 'GENERAL', paymentMethod: (typeof window !== 'undefined' && localStorage.getItem('last_via')) || 'CASH', status: 'completed', type: 'expense' }));
                setIsExpanded(false); setActiveInput('out');
            }
        }
    }, [initialData, isOpen]);

    const handleAmountChange = (val: string, mode: 'in' | 'out') => {
        const numericVal = val.replace(/[^0-9.]/g, '');
        if (mode === 'in') {
            setInflowAmount(numericVal); setOutflowAmount('');
            setForm(prev => ({ ...prev, amount: Number(numericVal), type: 'income' }));
        } else {
            setOutflowAmount(numericVal); setInflowAmount('');
            setForm(prev => ({ ...prev, amount: Number(numericVal), type: 'expense' }));
        }
    };

    const handleKeypad = (key: string) => {
        let currentVal = activeInput === 'in' ? inflowAmount : outflowAmount;
        if (key === 'del') currentVal = currentVal.slice(0, -1);
        else if (key === '.' && currentVal.includes('.')) return;
        else currentVal = currentVal + key;
        handleAmountChange(currentVal, activeInput);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !form.amount || form.amount <= 0) return;
        setIsLoading(true);
        localStorage.setItem('last_category', form.category);
        localStorage.setItem('last_via', form.paymentMethod);
        try {
            await onSubmit(form); 
        } finally {
            // Loading state will reset when component unmounts or parent updates
        }
    };

    if (!isOpen) return null;

    const toBn = (num: any) => {
        if (language !== 'bn') return num;
        const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.' };
        return String(num).split('').map(c => bnNums[c] || c).join('');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl" />
            
            <motion.div 
                drag={isMobile ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                initial={isMobile ? { y: "100%" } : { y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={isMobile ? { y: "100%" } : { y: 20, opacity: 0 }} 
                transition={{ type: "spring", damping: 30, stiffness: 400 }} 
                className="bg-[var(--bg-card)] w-full md:max-w-lg h-[95vh] md:h-auto md:max-h-[92vh] rounded-t-[45px] md:rounded-[40px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />
                
                <div className="px-8 py-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-[20px] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 overflow-hidden text-orange-500">
                            {currentBook?.image ? <img src={currentBook.image} alt="V" className="w-full h-full object-cover" /> : <PlusCircle size={22} />}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic truncate leading-none">{currentBook?.name || T('protocol_entry')}</h2>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1.5 opacity-70 truncate">{T('sync_ready')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-10 pt-2 pb-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div onClick={() => setActiveInput('out')} className={`p-5 rounded-[32px] border-2 transition-all duration-500 cursor-pointer ${activeInput === 'out' ? 'bg-red-500/5 border-red-500/40 shadow-xl shadow-red-500/5' : 'bg-[var(--bg-input)] border-transparent opacity-30 scale-95 grayscale'}`}>
                                <span className="text-[8px] font-black uppercase tracking-[3px] text-red-500 mb-4 block">{T('outflow')}</span>
                                <div className="flex items-center gap-2">
                                    <ArrowDownLeft size={16} className="text-red-500" />
                                    <input 
                                        type="number" step="any" inputMode="decimal"
                                        readOnly={isMobile}
                                        autoFocus={!isMobile} 
                                        value={outflowAmount} onChange={e => handleAmountChange(e.target.value, 'out')} 
                                        className="bg-transparent border-none p-0 text-xl font-mono font-bold text-[var(--text-main)] w-full outline-none" placeholder="0.00" 
                                    />
                                </div>
                            </div>
                            <div onClick={() => setActiveInput('in')} className={`p-5 rounded-[32px] border-2 transition-all duration-500 cursor-pointer ${activeInput === 'in' ? 'bg-green-500/5 border-green-500/40 shadow-xl shadow-green-500/5' : 'bg-[var(--bg-input)] border-transparent opacity-30 scale-95 grayscale'}`}>
                                <span className="text-[8px] font-black uppercase tracking-[3px] text-green-500 mb-4 block">{T('inflow')}</span>
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight size={16} className="text-green-500" />
                                    <input 
                                        type="number" step="any" inputMode="decimal"
                                        readOnly={isMobile} 
                                        value={inflowAmount} onChange={e => handleAmountChange(e.target.value, 'in')} 
                                        className="bg-transparent border-none p-0 text-xl font-mono font-bold text-[var(--text-main)] w-full outline-none" placeholder="0.00" 
                                    />
                                </div>
                            </div>
                        </div>

                        <OSInput label={T('protocol_identity')} placeholder={t('placeholder_entry_title')} value={form.title} onChange={(val:any) => setForm({...form, title: val})} icon={CreditCard} />

                        <div className="space-y-4">
                            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={`w-full h-14 flex items-center justify-between px-6 rounded-[22px] border transition-all duration-500 ${isExpanded ? 'bg-orange-500/5 border-orange-500/30 text-orange-500 shadow-inner' : 'bg-[var(--bg-input)] border-transparent text-[var(--text-muted)]'}`}>
                                <span className="text-[10px] font-black uppercase tracking-[3px] flex items-center gap-3"><SlidersHorizontal size={14} /> {isExpanded ? T('hide_config') : T('more_options')}</span>
                                <ChevronDown size={16} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-visible no-scrollbar space-y-6 pt-2 pb-4 ">
                                        <div className="grid grid-cols-2 gap-4">
                                            <OSInput label={T('protocol_date')} type="date" value={form.date} onChange={(v:any) => setForm({...form, date: v})} />
                                            <OSInput label={T('record_time')} type="time" value={form.time} onChange={(v:any) => setForm({...form, time: v})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <ModalEliteDropdown label={T('classification')} current={form.category} options={userCategories} onChange={(v:any) => setForm({...form, category: v})} icon={Layers} />
                                            <ModalEliteDropdown label={T('via_protocol')} current={form.paymentMethod} options={['CASH', 'BANK', 'BKASH', 'NAGAD']} onChange={(v:any) => setForm({...form, paymentMethod: v})} icon={CreditCard} />
                                        </div>
                                        <OSInput label={T('encrypted_memo')} placeholder={t('placeholder_entry_memo')} value={form.note} onChange={(v:any) => setForm({...form, note: v})} icon={Info} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>

                {isMobile && (
                    <div className="bg-[var(--bg-input)] p-3 grid grid-cols-4 gap-2 border-t border-[var(--border)] shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                        {[1, 2, 3, 'del', 4, 5, 6, '.', 7, 8, 9, '00', 0].map((key: any) => (
                            <motion.button 
                                key={key} type="button" whileTap={{ scale: 0.94 }} onClick={() => handleKeypad(key.toString())} 
                                className={`h-15 rounded-[22px] font-mono-finance text-xl font-bold flex items-center justify-center transition-all shadow-sm ${key === 'del' ? 'bg-red-500/10 text-red-500 border border-red-500/10' : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border)]'}`}
                            >
                                {key === 'del' ? <X size={22} strokeWidth={3} /> : toBn(key)}
                            </motion.button>
                        ))}
                        <button 
                            disabled={isLoading} 
                            className={`col-span-2 rounded-[22px] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center ${isLoading ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-500 text-white'}`}
                            onClick={handleSubmit}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : T('btn_execute')}
                        </button>
                    </div>
                )}

                <div className="p-8 border-t border-[var(--border)] shrink-0 hidden md:block bg-[var(--bg-card)]">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading} 
                        className={`w-full h-16 rounded-[28px] font-black text-[12px] uppercase tracking-[5px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isLoading ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-500 text-white shadow-orange-500/30'}`}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Fingerprint size={18} /> {T('execute_protocol')}</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};