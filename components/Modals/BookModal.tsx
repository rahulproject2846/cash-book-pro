"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, User, Truck, Smartphone, Camera, 
    Plus, Info, Fingerprint, X, ShieldCheck, Loader2
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { useLocalPreview } from '@/hooks/useLocalPreview';
import { useBookImage } from '@/hooks/useBookImage';
import { Tooltip } from '@/components/UI/Tooltip';
import { cn } from '@/lib/utils/helpers'; // তোর নতুন helpers
import { useVaultStore } from '@/lib/vault/store/index';

export const BookModal = ({ isOpen, onClose, initialData, currentUser }: any) => {
    const { t } = useTranslation();
    const { saveBook } = useVaultStore();
    const [form, setForm] = useState({ name: '', description: '', type: 'general', phone: '', image: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // --- 🚀 INSTANT LOCAL PREVIEW & BOOK IMAGE PROCESSING ---
    const { previewUrl, isLoading: isPreviewLoading, error: previewError } = useLocalPreview(form.image);
    const { handleImageProcess, handleRemoveImage } = useBookImage();

    // --- 🎯 IMAGE PREVIEW HELPER (Zero-Risk Refactor) ---
    const imagePreviewContent = (() => {
        // 🆕 PRIORITY 1: Instant local preview from file selection
        if (localPreview) {
            return <img src={localPreview} alt="Book Preview" className="w-full h-full object-cover" />;
        }
        
        if (!form.image) {
            return <Camera size={26} className="text-[var(--text-muted)] opacity-30 group-hover/img:text-orange-500 transition-all" />;
        }

        if (!form.image.startsWith('cid_')) {
            return <img src={form.image} alt="Book" className="w-full h-full object-cover" />;
        }

        if (isPreviewLoading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-input)] to-[var(--border)]">
                    <Loader2 size={24} className="text-orange-500 animate-spin" />
                </div>
            );
        }

        if (previewError) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-input)] to-[var(--border)]">
                    <Camera size={24} className="text-red-500" />
                </div>
            );
        }

        return previewUrl ? <img src={previewUrl} alt="Book Preview" className="w-full h-full object-cover" /> : null;
    })();

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
            
            // 🆕 CLEANUP: Clear local preview when modal opens/closes
            setLocalPreview(null);
            
            // 🔥 ফিক্স: মডাল খোলার সাথে সাথে নামে ফোকাস হবে (ডেস্কটপে)
            setTimeout(() => {
                if (!isMobile) nameInputRef.current?.focus();
            }, 100);
        }
    }, [initialData, isOpen, isMobile]);
    
    // 🆕 CLEANUP: Revoke object URL when modal closes or component unmounts
    useEffect(() => {
        return () => {
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
            }
        };
    }, [localPreview]);

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
            const result = await saveBook(cleanPayload, initialData);
            if (result.success) {
                onClose();
            } else {
                console.error('Save failed:', result.error);
            }
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
        <>

            <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20" />

                {/* হেডার */}
                <div className="px-8 pt-6 pb-2 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-[12px] font-black text-[var(--text-main)]        leading-none">
                            {initialData ? t('title_vault_upgrade') : t('title_initialize_vault')}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                            <ShieldCheck size={10} className="text-orange-500" />
                            <span className="text-[8px] font-bold text-orange-500     ">{t('sync_ready')}</span>
                        </div>
                    </div>
                    <Tooltip text={t('close_modal')}>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm"><X size={20} /></button>
                    </Tooltip>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">
                    <div className="flex flex-col gap-7">
                        
                        {/* ভিজ্যুয়াল আইডি সিলেকশন */}
                        <div className="flex flex-col items-center group">
                            <div className="relative">
                                <Tooltip text={t('select_image')}>
                                    <motion.div 
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-24 h-24 apple-card bg-[var(--bg-input)] border border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all hover:border-orange-500/50 shadow-md group/img"
                                    >
                                        {imagePreviewContent}
                                    </motion.div>
                                </Tooltip>
                                <Tooltip text={t('add_image')}>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -right-1 -bottom-1 w-8 h-8 bg-orange-500 apple-card flex items-center justify-center text-white shadow-lg border-4 border-[var(--bg-card)] active:scale-90 transition-all"><Plus size={14} strokeWidth={3} /></button>
                                </Tooltip>
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    try {
                                        // 🆕 INSTANT PREVIEW: Create temporary object URL
                                        const tempUrl = URL.createObjectURL(file);
                                        setLocalPreview(tempUrl);
                                        
                                        // 🚀 USE MEDIA STORE INTEGRATION
                                        const mediaCid = await handleImageProcess(file);
                                        setForm(prev => ({ ...prev, image: mediaCid }));
                                    } catch (error) {
                                        console.error('Image upload failed:', error);
                                        // 🛡️ CLEAN STATE: Reset preview and clear image on error
                                        setLocalPreview(null);
                                        setForm(prev => ({ ...prev, image: "" }));
                                        // Error is already shown by useBookImage toast
                                    }
                                }
                            }} />
                            <p className="text-[8px] font-black text-[var(--text-muted)]      mt-4 opacity-50">{t('label_visual_id')}</p>
                        </div>

                        {/* টাইপ সিলেক্টর */}
                        <div className="bg-[var(--bg-input)] p-1.5 apple-card border border-[var(--border)] flex h-14 shadow-md">
                            {[
                                { id: 'general', label: t('type_general'), icon: BookOpen },
                                { id: 'customer', label: t('type_customer'), icon: User },
                                { id: 'supplier', label: t('type_supplier'), icon: Truck },
                            ].map((type) => (
                                <Tooltip key={type.id} text={type.label}>
                                    <button 
                                        type="button" 
                                        onClick={() => setForm({...form, type: type.id})} 
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 apple-card border transition-all duration-500",
                                            form.type === type.id 
                                                ? "bg-[var(--bg-card)] text-orange-500 shadow-xl border-[var(--border)]" 
                                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        )}
                                    >
                                        <type.icon size={14} strokeWidth={2.5} />
                                        <span className="text-[9px] font-black     hidden sm:inline">{type.label}</span>
                                    </button>
                                </Tooltip>
                            ))}
                        </div>

                        <form className="flex flex-col gap-4" onSubmit={handleAction}>
                            {/* নাম ইনপুট */}
                            <div className="group relative">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-orange-500 transition-colors z-10">
                                    {form.type === 'general' ? <BookOpen size={18} /> : <User size={18} />}
                                </div>
                                <input 
                                    ref={nameInputRef} // 🔥 অটো-ফোকাস রেফারেন্স
                                    placeholder={form.type === 'general' ? t('placeholder_ledger_name') : t('placeholder_identity_name')} 
                                    className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] apple-card text-[13px] font-bold   outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-inner" 
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
                                            className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] apple-card text-[13px] font-bold outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-md" 
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
                                    className="w-full h-16 pl-14 bg-[var(--bg-input)] border border-[var(--border)] apple-card text-[13px] font-bold outline-none focus:border-orange-500/50 transition-all text-[var(--text-main)] shadow-md" 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    onKeyDown={handleKeyDown}
                                />
                            </div>

                            {/* সাবমিট বাটন */}
                            <Tooltip text={initialData ? t('btn_upgrade') : t('btn_execute')}>
                                <button 
                                    disabled={isLoading || !form.name} 
                                    className={cn(
                                        "w-full h-16 apple-card font-black text-[11px]     shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4",
                                        form.name ? "bg-orange-500 text-white shadow-orange-500/30 hover:bg-orange-600" : "bg-zinc-800 text-zinc-500 opacity-50"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Fingerprint size={20} /> {initialData ? t('btn_upgrade') : t('btn_execute')}</>}
                                </button>
                            </Tooltip>
                        </form>
                    </div>
                </div>
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </>
        );
};