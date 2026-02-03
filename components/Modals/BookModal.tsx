"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, Check, Loader2, Info, User, 
    Truck, Settings2, Smartphone, Camera, Plus, X 
} from 'lucide-react';
import { ModalLayout } from '@/components/Modals';

// --- ১. কাস্টম ইনপুট কম্পোনেন্ট ---
const VaultInput = ({ label, value, onChange, placeholder, icon: Icon, type = "text" }: any) => (
    <div className="space-y-2 group">
        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
            {Icon && <Icon size={12} className="text-orange-500" />} {label}
        </label>
        <input 
            type={type}
            placeholder={placeholder}
            className="app-input h-14 text-sm font-black uppercase tracking-widest border-2 border-[var(--border)] bg-[var(--bg-app)] focus:border-orange-500/50 transition-all outline-none px-5" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
        />
    </div>
);

export const BookModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
    const [form, setForm] = useState({ 
        name: '', 
        description: '', 
        type: 'general', // general, customer, supplier
        phone: '',
        image: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // হাইড্রেশন এবং এডিট ডাটা সিঙ্ক
    useEffect(() => {
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
    }, [initialData, isOpen]);

    // মোবাইল কন্টাক্ট লিস্ট সিঙ্ক লজিক
    const handleContactSync = async () => {
        try {
            // @ts-ignore - Web Contact API support check
            if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                const contacts = await (navigator as any).contacts.select(props, opts);
                if (contacts.length > 0) {
                    setForm(prev => ({
                        ...prev,
                        name: contacts[0].name[0] || prev.name,
                        phone: contacts[0].tel[0] || prev.phone
                    }));
                }
            } else {
                alert("Contact Protocol is not supported on this device.");
            }
        } catch (err) {
            console.warn("Contact Sync Interrupted");
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setIsLoading(true);
        await onSubmit(form);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <ModalLayout 
            title={initialData ? "Protocol: Vault Upgrade" : "Protocol: Initialize Vault"} 
            onClose={onClose}
        >
            <form onSubmit={handleSubmit} className="space-y-8 py-2">
                
                {/* --- ১. ভল্ট ইমেজ সিলেকশন --- */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative group">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-[35px] bg-[var(--bg-app)] border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer overflow-hidden transition-all group-hover:border-orange-500/50 group-hover:bg-orange-500/5 shadow-inner"
                        >
                            {form.image ? (
                                <img src={form.image} alt="Vault" className="w-full h-full object-cover" />
                            ) : (
                                <Camera size={28} className="text-[var(--text-muted)] opacity-30 group-hover:text-orange-500 group-hover:opacity-100 transition-all" />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -right-2 -bottom-2 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-[var(--bg-card)] active:scale-90 transition-all"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                    </div>
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-[3px] mt-4 opacity-60">Vault Visual ID</p>
                </div>

                {/* --- ২. টাইপ সিলেক্টর (Segmented Control) --- */}
                <div className="bg-[var(--bg-app)] p-1.5 rounded-[22px] border border-[var(--border)] flex gap-1">
                    {[
                        { id: 'general', label: 'General', icon: BookOpen },
                        { id: 'customer', label: 'Customer', icon: User },
                        { id: 'supplier', label: 'Supplier', icon: Truck },
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setForm({...form, type: t.id})}
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${form.type === t.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-[var(--text-muted)] hover:text-orange-500'}`}
                        >
                            <t.icon size={14} strokeWidth={2.5} />
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* --- ৩. ডাইনামিক ইনপুট সেকশন --- */}
                <div className="space-y-6">
                    {/* লেজার নাম */}
                    <VaultInput 
                        label={form.type === 'general' ? 'Ledger Name' : 'Identity Name'} 
                        placeholder={form.type === 'general' ? "E.G. OFFICE RENT" : "E.G. ABDUR RAHMAN"} 
                        value={form.name} 
                        onChange={(val:string) => setForm({...form, name: val})} 
                        icon={form.type === 'general' ? BookOpen : User}
                    />

                    {/* ফোন নম্বর (শুধুমাত্র কাস্টমার/সাপ্লায়ারের জন্য) */}
                    <AnimatePresence mode="wait">
                        {form.type !== 'general' && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 group">
                                    <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Smartphone size={12} className="text-orange-500" /> Phone Registry</span>
                                        <button 
                                            type="button"
                                            onClick={handleContactSync}
                                            className="text-[8px] bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md border border-orange-500/20 active:scale-95 transition-all"
                                        >
                                            FETCH IDENTITY
                                        </button>
                                    </label>
                                    <input 
                                        type="tel"
                                        placeholder="+880 1XXX-XXXXXX" 
                                        className="app-input h-14 text-sm font-black tracking-[3px] border-2 border-[var(--border)] bg-[var(--bg-app)] focus:border-orange-500/50 transition-all outline-none px-5" 
                                        value={form.phone} 
                                        onChange={e => setForm({...form, phone: e.target.value})} 
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ডেসক্রিপশন */}
                    <VaultInput 
                        label="Vault Memo" 
                        placeholder="ADDITIONAL PROTOCOL DETAILS..." 
                        value={form.description} 
                        onChange={(val:string) => setForm({...form, description: val})} 
                        icon={Info}
                    />
                </div>

                {/* --- ৪. সাবমিট বাটন --- */}
                <button 
                    disabled={isLoading}
                    className="app-btn-primary w-full h-16 text-[11px] font-black tracking-[4px] shadow-2xl shadow-orange-500/30 mt-4 bg-orange-500 border-none text-white active:scale-95 transition-all"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        initialData ? "INITIALIZE UPGRADE" : "EXECUTE INITIALIZATION"
                    )}
                </button>
            </form>
        </ModalLayout>
    );
};