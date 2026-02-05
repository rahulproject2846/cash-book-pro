"use client";
import React, { useState, useRef } from 'react';
import { 
    Edit2, Trash2, Zap, Clock, 
    Calendar, Check, X, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

const TransactionCard = ({ e, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { T, t, language } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const x = useMotionValue(0);
    
    // সোয়াইপ করার সময় ব্যাকগ্রাউন্ড কালার এবং অপাসিটি পরিবর্তন
    const editOpacity = useTransform(x, [50, 100], [0, 1]);
    const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);

    const longPressTimer = useRef<any>(null);
    const isIncome = e.type === 'income';
    const isCompleted = e.status === 'completed';

    const startPress = () => {
        longPressTimer.current = setTimeout(() => {
            setIsMenuOpen(true);
            if (navigator.vibrate) navigator.vibrate(40);
        }, 500);
    };

    const endPress = () => clearTimeout(longPressTimer.current);

    // সোয়াইপ শেষ হলে একশন ট্রিগার
    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) onEdit(e);
        else if (info.offset.x < -100) onDelete(e);
    };

    return (
        <div className="relative mb-3 overflow-hidden rounded-[32px]">
            {/* --- REVEAL LAYER (Underneath Card) --- */}
            <div className="absolute inset-0 flex items-center justify-between px-8 bg-[var(--bg-app)]">
                <motion.div style={{ opacity: editOpacity }} className="flex items-center gap-3 text-blue-500 font-black">
                    <Edit2 size={24} strokeWidth={3} />
                    <span className="text-[10px] uppercase tracking-widest">{T('edit')}</span>
                </motion.div>
                <motion.div style={{ opacity: deleteOpacity }} className="flex items-center gap-3 text-red-500 font-black">
                    <span className="text-[10px] uppercase tracking-widest">{T('delete')}</span>
                    <Trash2 size={24} strokeWidth={3} />
                </motion.div>
            </div>

            {/* --- MAIN CARD LAYER --- */}
            <motion.div 
                style={{ x }}
                drag="x"
                dragConstraints={{ left: -120, right: 120 }}
                onDragEnd={handleDragEnd}
                onPointerDown={startPress}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                className={`bg-[var(--bg-card)] rounded-[32px] border border-[var(--border)] p-5 md:p-6 relative z-10 transition-all duration-300
                    ${isMenuOpen ? 'scale-[0.97] border-orange-500/30' : 'scale-100'}`}
            >
                {/* Long Press Action Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center gap-4 px-6"
                        >
                            <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 text-white/40"><X size={20}/></button>
                            <div className="flex gap-4">
                                <button onClick={() => { onToggleStatus(e); setIsMenuOpen(false); }} className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl transition-all ${isCompleted ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}`}>
                                    {isCompleted ? <Clock size={20} /> : <Zap size={20} fill="currentColor" />}
                                    <span className="text-[7px] font-black uppercase">{isCompleted ? T('pending') : T('complete')}</span>
                                </button>
                                <button onClick={() => { onEdit(e); setIsMenuOpen(false); }} className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex flex-col items-center justify-center gap-1 shadow-2xl"><Edit2 size={20}/><span className="text-[7px] font-black uppercase">{T('edit')}</span></button>
                                <button onClick={() => { onDelete(e); setIsMenuOpen(false); }} className="w-14 h-14 rounded-2xl bg-red-500 text-white flex flex-col items-center justify-center gap-1 shadow-2xl"><Trash2 size={20}/><span className="text-[7px] font-black uppercase">{T('delete')}</span></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- CONTENT LAYER --- */}
                <div className={`transition-all duration-500 ${isMenuOpen ? 'blur-sm opacity-40' : 'blur-0'}`}>
                    {/* Top row: Date & ID & Category */}
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <Calendar size={11} className="text-orange-500 opacity-60" />
                            <span className="text-[8px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                {new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}
                                <span className="mx-2 opacity-20">|</span>
                                <span className="text-orange-500/60">{T('label_id')}: {toBn(String(e.localId || e._id).slice(-4).toUpperCase(), language)}</span>
                            </span>
                        </div>
                        <div className="flex px-3 py-1 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                            <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">{e.category}</span>
                        </div>
                    </div>

                    {/* Middle row: Title & Amount */}
                    <div className="flex justify-between items-end gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-[var(--text-main)] leading-none truncate pr-2">
                                {e.title}
                            </h4>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2 opacity-40 truncate max-w-[140px]">
                                {e.note ? `// ${e.note}` : `// ${T('protocol_secured')}`}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className={`text-xl md:text-2xl font-mono-finance font-bold tracking-tighter ${isIncome ? 'text-green-500' : 'text-red-500'} max-w-[150px] truncate`}>
                                {isIncome ? '+' : '-'}{currencySymbol}{toBn(e.amount.toLocaleString(), language)}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                                {isCompleted ? <Zap size={8} className="text-green-500" fill="currentColor" /> : <Clock size={8} className="text-yellow-500" />}
                                <span className={`text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'text-green-500/60' : 'text-yellow-500/60'}`}>
                                    {isCompleted ? T('completed') : T('pending')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export const MobileTransactionCards = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { T } = useTranslation();

    return (
        <div className="xl:hidden  pb-32 space-y-1">
            {items.map((e: any, idx: number) => (
                <TransactionCard 
                    key={e.localId || e._id || idx}
                    e={e} onEdit={onEdit} onDelete={onDelete} 
                    onToggleStatus={onToggleStatus} currencySymbol={currencySymbol}
                />
            ))}
            
            {items.length > 0 && (
                <div className="flex flex-col items-center py-12 opacity-20">
                    <div className="h-px w-10 bg-orange-500 mb-4" />
                    <span className="text-[8px] font-black uppercase tracking-[5px] text-orange-500">{T('protocol_archive_end')}</span>
                </div>
            )}
        </div>
    );
};