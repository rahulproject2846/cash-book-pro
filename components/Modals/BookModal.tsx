"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, User, Truck, Smartphone, Camera, 
    Plus, Info, Fingerprint, X, ShieldCheck, Loader2
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers

export const BookModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', description: '', type: 'general', phone: '', image: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // ১. ডিভাইস ডিটেকশন
    useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

    // ২. ডাটা হাইড্রেশন ও অটো-ফোকাস লজিক
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setForm({ 
                    name: initialData.name, 
                    description: initialData.description || "",
                    type: initialData.type || 'general', 
                    phone: initialData.phone || '', 
                    image: initialData.image || ''
                });
            } else {
                setForm({ name: '', description: '', type: 'general', phone: '', image: '' });
            }
            
            // 🔥 ফিক্স: মডাল খোলার সাথে সাথে নামে ফোকাস হবে (ডেস্কটপে)
            setTimeout(() => {
                if (!isMobile) nameInputRef.current?.focus();
            }, 100);
        }
    }, [initialData, isOpen, isMobile]);

    // ৩. অ্যাকশন হ্যান্ডলার (এন্টার বাটন সাপোর্ট)
    const handleAction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (isLoading || !form.name.trim()) return;
        
        setIsLoading(true);
        const cleanPayload = {
            name: form.name.trim(),
            type: form.type,
            description: form.description.trim() || "",
            phone: form.type !== 'general' ? (form.phone.trim() || "") : "",
            image: form.image || ""
        };
        
        try {
            await onSubmit(cleanPayload);
            onClose(); // সফল হলে বন্ধ হবে
        } finally {
            setIsLoading(false);
        }
    };

    // ৪. কিবোর্ড শর্টকাট (Enter = Save)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAction();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            {/* ব্যাকড্রপ: পিওর গ্লাস ইফেক্ট */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl" 
            />

            {/* মডাল কন্টেনার */}
            <motion.div 
                drag={isMobile ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                initial={isMobile ? { y: "100%" } : { y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={isMobile ? { y: "100%" } : { y: 20, opacity: 0 }} 
                transition={{ type: "spring", damping: 30, stiffness: 400 }} 
                className="bg-[var(--bg-card)] w-full md:max-w-md h-[90vh] md:h-auto rounded-t-[40px] md:rounded-[40px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />

                {/* হেডার */}
                <div className="px-8 pt-6 pb-2 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-none">
                            {initialData ? t('title_vault_upgrade') : t('title_initialize_vault')}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                            <ShieldCheck size={10} className="text-orange-500" />
                            <span className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px]">{t('sync_ready')}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">
                    <div className="flex flex-col gap-7">
                        
                        {/* ভিজ্যুয়াল আইডি সিলেকশন */}
                        <div className="flex flex-col items-center group">
                            <div className="relative">
                                <motion.div 
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 rounded-[35px] bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-orange-500/50 shadow-md group/img"
                                >
                                    {form.image ? (
                                        <img src={form.image} alt="V" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={26} className="text-[var(--text-muted)] opacity-30 group-hover/img:text-orange-500 transition-all" />
                                    )}
                                </motion.div>
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -right-1 -bottom-1 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-[var(--bg-card)] active:scale-90 transition-all"><Plus size={14} strokeWidth={3} /></button>
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setForm({...form, image: reader.result as string});
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[4px] mt-4 opacity-50">{t('label_visual_id')}</p>
                        </div>

                        {/* টাইপ সিলেক্টর */}
                        <div className="bg-[var(--bg-input)] p-1.5 rounded-[26px] border border-[var(--border)] flex h-14 shadow-md">
                            {[
                                { id: 'general', label: t('type_general'), icon: BookOpen },
                                { id: 'customer', label: t('type_customer'), icon: User },
                                { id: 'supplier', label: t('type_supplier'), icon: Truck },
                            ].map((type) => (
                                <button 
                                    key={type.id} 
                                    type="button" 
                                    onClick={() => setForm({...form, type: type.id})} 
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 rounded-[20px] border transition-all duration-500",
                                        form.type === type.id 
                                            ? "bg-[var(--bg-card)] text-orange-500 shadow-xl border-[var(--border)]" 
                                            : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                    )}
                                >
                                    <type.icon size={14} strokeWidth={2.5} />
                                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ইনপুট ফর্ম */}
                        <form className="flex flex-col gap-4" onSubmit={handleAction}>
                            <div className="group relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10">
                                    {form.type === 'general' ? <BookOpen size={18} /> : <User size={18} />}
                                </div>
                                <input 
                                    ref={nameInputRef} // 🔥 অটো-ফোকাস রেফারেন্স
                                    placeholder={form.type === 'general' ? t('placeholder_ledger_name') : t('placeholder_identity_name')} 
                                    className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] rounded-[24px] text-[13px] font-bold uppercase outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-inner" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    onKeyDown={handleKeyDown} // 🔥 এন্টার বাটন হ্যান্ডলার
                                    required 
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {form.type !== 'general' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="group relative overflow-hidden">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10"><Smartphone size={18} /></div>
                                        <input 
                                            type="tel" 
                                            placeholder="+880 1XXX XXXXXX" 
                                            className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] rounded-[24px] text-[13px] font-bold outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-md" 
                                            value={form.phone} 
                                            onChange={e => setForm({...form, phone: e.target.value})} 
                                            onKeyDown={handleKeyDown}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="group relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10"><Info size={18} /></div>
                                <input 
                                    placeholder={t('placeholder_vault_memo')} 
                                    className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] rounded-[24px] text-[13px] font-bold outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-md" 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {/* সাবমিট বাটন */}
                            <button 
                                disabled={isLoading || !form.name} 
                                className={cn(
                                    "w-full h-16 rounded-[28px] font-black text-[11px] uppercase tracking-[5px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4",
                                    form.name ? "bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600" : "bg-zinc-800 text-zinc-500 opacity-50"
                                )}
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Fingerprint size={20} /> {initialData ? t('btn_upgrade') : t('btn_execute')}</>}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </motion.div>
        </div>
    );
};