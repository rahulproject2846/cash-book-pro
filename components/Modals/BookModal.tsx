"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, User, Truck, Smartphone, Camera, 
    Plus, Info, Fingerprint, ArrowRight, X,
    Loader2
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

export const BookModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const { T, t } = useTranslation();
    const [form, setForm] = useState({ name: '', description: '', type: 'general', phone: '', image: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ১. প্রোটোকল: মোবাইল ডিটেকশন এবং ডাটা হাইড্রেটিং
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        if (initialData) {
            setForm({ 
                name: initialData.name, description: initialData.description || "",
                type: initialData.type || 'general', phone: initialData.phone || '', image: initialData.image || ''
            });
        } else {
            setForm({ name: '', description: '', type: 'general', phone: '', image: '' });
        }
    }, [initialData, isOpen]);

    // ২. প্রোটোকল: সাবমিট এবং স্মুথ ক্লোজিং লজিক (Logic Intact)
    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        
        setIsLoading(true);
        const cleanPayload = {
            name: form.name.trim(),
            type: form.type,
            description: form.description.trim() || "",
            phone: form.type !== 'general' ? (form.phone.trim() || "") : "",
            image: form.image || ""
        };

        // ডাটা সেভ হওয়ার পর ২-৩০০ মিলি-সেকেন্ড ওয়েট করব যাতে এনিমেশন দেখা যায়
        await onSubmit(cleanPayload);
        setTimeout(() => {
            setIsLoading(false);
            // onClose() কল হবে যাতে ফ্রেমওয়ার্ক মডালটি ক্লোজ করে
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            {/* --- 🌑 NATIVE BACKDROP (Blur Animation) --- */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl"
            />

            {/* --- 🍃 THE NATIVE SHEET (Pull-up Animation) --- */}
            <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 300 }}
                className="bg-[var(--bg-card)] w-full md:max-w-md h-[90vh] md:h-auto rounded-t-[45px] md:rounded-[45px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                {/* Mobile Handle (Visual Cue) */}
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />

                {/* --- 🏷️ HEADER --- */}
                <div className="px-8 pt-6 pb-2 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-tight">
                            {initialData ? T('title_vault_upgrade') : T('title_initialize_vault')}
                        </h2>
                        <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-70">
                            {T('sync_ready')}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">
                    <div className="flex flex-col gap-7">
                        
                        {/* ১. ভিজ্যুয়াল আইডি (Elite Visuals) */}
                        <div className="flex flex-col items-center group">
                            <div className="relative">
                                <motion.div 
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-[35px] bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-orange-500/50 shadow-inner"
                                >
                                    {form.image ? (
                                        <img src={form.image} alt="V" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={26} className="text-[var(--text-muted)] opacity-30 group-hover:text-orange-500 transition-all" />
                                    )}
                                </motion.div>
                                <button 
                                    type="button" onClick={() => fileInputRef.current?.click()}
                                    className="absolute -right-1 -bottom-1 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-[var(--bg-card)] active:scale-90 transition-all"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setForm({...form, image: reader.result as string});
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[4px] mt-4 opacity-50">{T('label_visual_id')}</p>
                        </div>

                        {/* ২. টাইপ সিলেক্টর (Native Selection) */}
                        <div className="bg-[var(--bg-input)] p-1.5 rounded-[26px] border border-[var(--border)] flex h-14">
                            {[
                                { id: 'general', label: t('type_general'), icon: BookOpen },
                                { id: 'customer', label: t('type_customer'), icon: User },
                                { id: 'supplier', label: t('type_supplier'), icon: Truck },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setForm({...form, type: type.id})}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-[20px] transition-all duration-500 ${
                                        form.type === type.id 
                                        ? 'bg-[var(--bg-card)] text-orange-500 shadow-xl border border-[var(--border)]' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                    }`}
                                >
                                    <type.icon size={14} strokeWidth={2.5} />
                                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ৩. স্মার্ট ইনপুটস (Zero Shift Layout) */}
                        <form className="flex flex-col gap-4" onSubmit={handleAction}>
                            
                            <div className="group relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10">
                                    {form.type === 'general' ? <BookOpen size={18} /> : <User size={18} />}
                                </div>
                                <input 
                                    autoFocus
                                    placeholder={form.type === 'general' ? t('placeholder_ledger_name') : t('placeholder_identity_name')}
                                    className="vault-glass-input !h-15 !pl-14 !rounded-[25px] !border-[var(--border)] focus:!border-orange-500/50"
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    required 
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {form.type !== 'general' && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="group relative overflow-hidden"
                                    >
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10">
                                            <Smartphone size={18} />
                                        </div>
                                        <input 
                                            placeholder="+880 1XXX XXXXXX"
                                            className="vault-glass-input !h-15 !pl-14 !rounded-[25px] !border-[var(--border)]"
                                            value={form.phone} 
                                            onChange={e => setForm({...form, phone: e.target.value})} 
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="group relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10">
                                    <Info size={18} />
                                </div>
                                <input 
                                    placeholder={t('placeholder_vault_memo')}
                                    className="vault-glass-input !h-15 !pl-14 !rounded-[25px] !border-[var(--border)]"
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                />
                            </div>

                            {/* সাবমিট বাটন (Haptic Feedback) */}
                            <Tooltip text={t('tt_execute')}>
                                <motion.button 
                                    disabled={isLoading || !form.name}
                                    whileTap={{ scale: 0.96 }}
                                    type="submit" 
                                    className={`vault-btn-elite !py-5 mt-4 transition-all duration-500 ${
                                        form.name 
                                        ? 'bg-orange-500 text-white shadow-[0_20px_40px_-10px_rgba(249,115,22,0.4)]' 
                                        : 'bg-[var(--bg-input)] text-[var(--text-muted)] opacity-50 border-[var(--border)]'
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Fingerprint size={20} strokeWidth={2.5} />
                                            {initialData ? T('btn_upgrade') : T('btn_execute')}
                                            <ArrowRight size={18} strokeWidth={3} />
                                        </div>
                                    )}
                                </motion.button>
                            </Tooltip>
                        </form>
                    </div>
                </div>

                {/* Safe Area for iOS */}
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </motion.div>
        </div>
    );
};