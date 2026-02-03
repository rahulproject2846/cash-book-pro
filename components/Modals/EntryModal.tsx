"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, CreditCard, Layers, Info, Loader2, Clock, X, 
    ArrowDownLeft, ArrowUpRight, Check, SlidersHorizontal, 
    ChevronDown, PlusCircle
} from 'lucide-react';

// --- ১. হাইব্রিড ওএস ইনপুট (টাইপিং + পিকার সাপোর্ট) ---
const OSInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text" }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // আইকনে ক্লিক করলে ক্যালেন্ডার/ক্লক ওপেন করার লজিক
    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (inputRef.current && 'showPicker' in HTMLInputElement.prototype) {
            try {
                // @ts-ignore (TypeScript might not know showPicker yet)
                inputRef.current.showPicker();
            } catch (err) {
                inputRef.current.focus();
            }
        } else {
            inputRef.current?.focus();
        }
    };

    return (
        <div className="w-full space-y-2 group">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-[var(--accent)] opacity-60" />}
                {label}
            </label>
            <div className="relative group/input">
                <input 
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-[20px] px-6 py-4 text-[14px] font-bold text-[var(--text-main)] outline-none focus:border-[var(--accent)]/40 focus:ring-4 focus:ring-[var(--accent)]/5 transition-all placeholder:text-[var(--text-muted)]/20 shadow-inner"
                />
                
                {/* Interactive Clickable Icon Button */}
                {(type === 'date' || type === 'time') && (
                    <button 
                        type="button"
                        onClick={handleIconClick}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-transparent hover:bg-[var(--accent)]/10 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all active:scale-90"
                    >
                        {type === 'date' ? <Calendar size={18} /> : <Clock size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- ২. কাস্টম এলিট ড্রপডাউন ---
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
                {Icon && <Icon size={12} className="text-[var(--accent)] opacity-60" />}
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px]">{label}</label>
            </div>
            <div className="relative">
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-[18px] px-5 py-4 text-[12px] font-black uppercase text-[var(--text-main)] flex items-center justify-between transition-all ${isOpen ? 'border-[var(--accent)]/40' : ''}`}
                >
                    <span className="truncate">{current}</span>
                    <ChevronDown size={14} className={`opacity-30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.98 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            className="absolute top-full mt-2 left-0 w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-[22px] p-2 z-[999] shadow-2xl overflow-hidden"
                        >
                            <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                {options.map((opt: string) => (
                                    <button 
                                        key={opt}
                                        type="button"
                                        onClick={() => { onChange(opt); setIsOpen(false); }}
                                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all mb-1 last:mb-0 ${current.toLowerCase() === opt.toLowerCase() ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)] hover:text-[var(--text-main)]'}`}
                                    >
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [inflowAmount, setInflowAmount] = useState('');
    const [outflowAmount, setOutflowAmount] = useState('');
    const [activeInput, setActiveInput] = useState<'in' | 'out'>('out');
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [form, setForm] = useState({
        title: '', amount: 0, type: 'expense', category: 'GENERAL', 
        paymentMethod: 'CASH', note: '', status: 'completed', 
        date: '', time: ''
    });

    const currencySymbol = currentUser?.currency?.match(/\(([^)]+)\)/)?.[1] || "৳";
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
                setForm({
                    ...initialData,
                    category: initialData.category.toUpperCase(),
                    date: new Date(initialData.date).toISOString().split('T')[0],
                    time: initialData.time || localTime
                });
                setActiveInput(isIncome ? 'in' : 'out');
                setIsExpanded(true);
            } else {
                setInflowAmount(''); setOutflowAmount('');
                setForm(prev => ({
                    ...prev, title: '', note: '', date: localDate, time: localTime,
                    category: localStorage.getItem('last_category') || 'GENERAL',
                    paymentMethod: localStorage.getItem('last_via') || 'CASH',
                    status: 'completed', type: 'expense'
                }));
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
        if (!form.amount || form.amount <= 0) return;
        setIsLoading(true);
        localStorage.setItem('last_category', form.category);
        localStorage.setItem('last_via', form.paymentMethod);
        await onSubmit(form); 
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 md:bg-black/50 backdrop-blur-md" />

            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="bg-[var(--bg-card)] w-full md:max-w-lg h-[96vh] md:h-auto md:max-h-[90vh] rounded-t-[40px] md:rounded-[40px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />

                {/* --- HEADER --- */}
                <div className="px-8 py-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent)]/10 rounded-xl border border-[var(--accent)]/20 text-[var(--accent)] overflow-hidden w-10 h-10 flex items-center justify-center">
                            {currentBook?.image ? (
                                <img src={currentBook.image} alt="book" className="w-full h-full object-cover" />
                            ) : (
                                <PlusCircle size={22} strokeWidth={2.5} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic truncate leading-none">
                                {currentBook?.name || "Initializing Protocol"}
                            </h2>
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-1 opacity-60 truncate">
                                {currentBook?.description || "Protocol Synchronization Ready"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center hover:text-[var(--text-main)] transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* --- DUAL HERO INPUTS --- */}
                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                onClick={() => setActiveInput('out')}
                                className={`p-5 rounded-[30px] border-2 transition-all duration-300 cursor-pointer ${activeInput === 'out' ? 'bg-red-500/5 border-red-500/40 ring-4 ring-red-500/5' : 'bg-[var(--bg-app)] border-[var(--border)] opacity-30 scale-95'}`}
                            >
                                <span className={`text-[8px] font-black uppercase tracking-[3px] mb-3 block ${outflowAmount ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>Outflow</span>
                                <div className="flex items-center gap-2">
                                    <ArrowDownLeft size={16} className={outflowAmount ? 'text-red-500' : 'text-[var(--text-muted)]/20'} />
                                    <input 
                                        type="number" step="any" placeholder="0.00"
                                        readOnly={isMobile}
                                        value={outflowAmount} 
                                        onChange={e => handleAmountChange(e.target.value, 'out')}
                                        className="bg-transparent border-none p-0 text-xl font-mono-finance font-bold text-[var(--text-main)] w-full outline-none placeholder:opacity-5" 
                                    />
                                </div>
                            </div>
                            <div 
                                onClick={() => setActiveInput('in')}
                                className={`p-5 rounded-[30px] border-2 transition-all duration-300 cursor-pointer ${activeInput === 'in' ? 'bg-green-500/5 border-green-500/30 ring-4 ring-green-500/5' : 'bg-[var(--bg-app)] border-[var(--border)] opacity-30 scale-95'}`}
                            >
                                <span className={`text-[8px] font-black uppercase tracking-[3px] mb-3 block ${inflowAmount ? 'text-green-500' : 'text-green-500'}`}>Inflow</span>
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight size={16} className={inflowAmount ? 'text-green-500' : 'text-[var(--text-muted)]/20'} />
                                    <input 
                                        type="number" step="any" placeholder="0.00"
                                        readOnly={isMobile}
                                        value={inflowAmount} 
                                        onChange={e => handleAmountChange(e.target.value, 'in')}
                                        className="bg-transparent border-none p-0 text-xl font-mono-finance font-bold text-[var(--text-main)] w-full outline-none placeholder:opacity-5" 
                                    />
                                </div>
                            </div>
                        </div>

                        <OSInput label="Protocol Identity" placeholder="WHAT IS THIS FOR?" value={form.title} onChange={(val:any) => setForm({...form, title: val})} />

                        {/* --- MORE OPTIONS (RE-DESIGNED) --- */}
                        <div className="space-y-4">
                            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={`w-full flex items-center justify-between px-6 py-4 rounded-[22px] transition-all duration-300 ${isExpanded ? 'bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)]'}`}>
                                <span className="text-[10px] font-black uppercase tracking-[3px] flex items-center gap-3">
                                    <SlidersHorizontal size={14} className={isExpanded ? 'rotate-90' : ''} />
                                    {isExpanded ? "Hide Configuration" : "More Options"}
                                </span>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0, y: -10 }} 
                                        animate={{ height: "auto", opacity: 1, y: 0 }} 
                                        exit={{ height: 0, opacity: 0, y: -10 }} 
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                        className="overflow-visible space-y-7 pt-4 pb-6"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <OSInput 
                                                label="Protocol Date" 
                                                type="date" 
                                                value={form.date} 
                                                onChange={(v:any) => setForm({...form, date: v})} 
                                            />
                                            <OSInput 
                                                label="Record Time" 
                                                type="time" 
                                                value={form.time} 
                                                onChange={(v:any) => setForm({...form, time: v})} 
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <ModalEliteDropdown 
                                                label="Classification" 
                                                current={form.category} 
                                                options={userCategories} 
                                                onChange={(v:any) => setForm({...form, category: v})} 
                                                icon={Layers} 
                                            />
                                            <ModalEliteDropdown 
                                                label="Via Protocol" 
                                                current={form.paymentMethod} 
                                                options={['CASH', 'BANK', 'BKASH', 'NAGAD']} 
                                                onChange={(v:any) => setForm({...form, paymentMethod: v})} 
                                                icon={CreditCard} 
                                            />
                                        </div>

                                        <div className="pt-2">
                                            <OSInput 
                                                label="Encrypted Memo" 
                                                placeholder="SYSTEM NOTES OR REMARKS..." 
                                                value={form.note} 
                                                onChange={(v:any) => setForm({...form, note: v})} 
                                                icon={Info} 
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </form>
                </div>

                {/* --- কাস্টম কিপ্যাড (Only Mobile) --- */}
                <div className="md:hidden bg-[var(--bg-app)] p-2 grid grid-cols-4 gap-1 border-t border-[var(--border)] shadow-2xl shrink-0">
                    {[1, 2, 3, 'del', 4, 5, 6, '+', 7, 8, 9, '-', '.', 0, '00', '='].map((key: any) => (
                        <motion.button 
                            key={key} type="button" whileTap={{ scale: 0.9 }} onClick={() => handleKeypad(key.toString())}
                            className={`h-14 rounded-2xl font-mono-finance text-lg font-bold flex items-center justify-center transition-all
                            ${typeof key === 'number' || key === '00' ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}
                        >
                            {key === 'del' ? <X size={20} /> : key}
                        </motion.button>
                    ))}
                </div>

                {/* --- STICKY FOOTER --- */}
                <div className="p-6 pt-2 bg-[var(--bg-card)] border-t border-[var(--border)] shrink-0 rounded-b-[40px] z-[9999]">
                    <button 
                        onClick={handleSubmit} disabled={isLoading} 
                        className="w-full h-16 bg-[var(--accent)] rounded-[24px] text-white font-black text-[12px] uppercase tracking-[5px] shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)] active:scale-[0.98] transition-all flex items-center justify-center border-none"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Execute Protocol"}
                    </button>
                    <div className="h-[env(safe-area-inset-bottom)] md:hidden" />
                </div>
            </motion.div>
        </div>
    );
};