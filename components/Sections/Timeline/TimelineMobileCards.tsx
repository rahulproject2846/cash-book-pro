"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
    Edit2, Trash2, Zap, Clock, ShieldCheck, 
    ArrowUpRight, ArrowDownLeft, Database 
} from 'lucide-react';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { 
        '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', 
        '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', 
        ',':',', '.':'.', ':':':', '/': '/'
    };
    return str.split('').map(c => bnNums[c] || c).join('');
};

// --- 🔘 COMPONENT: INDIVIDUAL TRANSACTION CARD (SWIPE READY) ---
const TimelineMobileCard = ({ e, onEdit, onDelete, onToggleStatus, activeId, setActiveId, currencySymbol, lang }: any) => {
    const { T, t } = useTranslation();
    const controls = useAnimation();
    const isIncome = e.type === 'income';
    const isCompleted = e.status === 'completed';
    const rowId = e.localId || e._id;
    const isOpen = activeId === rowId;

    // ১. প্রোটোকল: অ্যাকশন হ্যান্ডলার (Lag-free action sequencing)
    const handleAction = async (actionFn: any) => {
        await controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
        setActiveId(null);
        if (actionFn) setTimeout(() => actionFn(e), 150);
    };

    // ২. সোয়াইপ লজিক
    const onDragEnd = (_: any, info: any) => {
        const threshold = 60;
        if (info.offset.x > threshold) {
            setActiveId(rowId);
            controls.start({ x: 90 });
        } else if (info.offset.x < -threshold) {
            setActiveId(rowId);
            controls.start({ x: -90 });
        } else {
            setActiveId(null);
            controls.start({ x: 0 });
        }
    };

    React.useEffect(() => {
        if (!isOpen) controls.start({ x: 0 });
    }, [isOpen, controls]);

    return (
        <div className="relative overflow-hidden bg-[var(--bg-card)] border-b border-[var(--border-color)]/10 last:border-0">
            {/* নীচের লেয়ার: এডিট ও ডিলিট বাটন */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
                <button onClick={() => handleAction(onEdit)} className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Edit2 size={20} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleAction(onDelete)} className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* ওপরের লেয়ার: মেইন কন্টেন্ট */}
            <motion.div 
                drag="x"
                animate={controls}
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={onDragEnd}
                className="bg-[var(--bg-card)] p-5 flex items-center justify-between gap-4 relative z-10 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-4 min-w-0">
                    {/* আইকন: ইনকাম/এক্সপেন্স নোড */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${isIncome ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {isIncome ? <ArrowDownLeft size={20} strokeWidth={3} /> : <ArrowUpRight size={20} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-black uppercase italic tracking-tighter text-[var(--text-main)] truncate leading-none">
                                {e.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[8px] font-black text-orange-500/40 uppercase">
                                <ShieldCheck size={10} strokeWidth={3} />
                                {toBn(String(e.localId || e._id).slice(-4).toUpperCase(), lang)}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                                {e.category || 'GENERAL'}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] italic truncate max-w-[120px] opacity-40">
                                {e.note ? `// ${e.note}` : `// SECURED`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* অ্যামাউন্ট ও স্ট্যাটাস */}
                <div className="text-right shrink-0">
                    <div className={`text-[18px] font-mono-finance font-bold tracking-tighter leading-none ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(e.amount.toLocaleString(), lang)}
                    </div>
                    <button 
                        onClick={() => onToggleStatus(e)}
                        className="flex items-center justify-end gap-1.5 mt-2 opacity-60 active:scale-95 transition-all ml-auto"
                    >
                        {isCompleted ? <Zap size={10} className="text-orange-500" fill="currentColor" /> : <Clock size={10} />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{toBn(e.time || '00:00', lang)}</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- 📦 MAIN ORCHESTRATOR COMPONENT ---
export const TimelineMobileCards = ({ 
    groupedEntries, 
    onEdit, 
    onDelete, 
    onToggleStatus, 
    currencySymbol 
}: any) => {
    const { language } = useTranslation();
    const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

    return (
        <div className="md:hidden space-y-10 relative">
            {/* ট্যাপ-টু-ডিসমিস ব্যাকড্রপ */}
            <AnimatePresence>
                {activeSwipeId && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setActiveSwipeId(null)}
                        className="fixed inset-0 z-40"
                    />
                )}
            </AnimatePresence>

            {Object.keys(groupedEntries).map((date) => (
                <div key={date} className="relative">
                    {/* গ্রুপিং হেডার (Sticky Look) */}
                    <div className="flex items-center gap-4 mb-4 px-2">
                        <div className="px-4 py-1 bg-orange-500 text-white rounded-full text-[9px] font-black uppercase tracking-[2px] shadow-lg shadow-orange-500/20 whitespace-nowrap">
                            {date}
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border-color)] to-transparent opacity-30" />
                    </div>

                    {/* কার্ড কন্টেইনার (Elite OS Rounded Style) */}
                    <div className="bg-[var(--bg-card)] rounded-[35px] border border-[var(--border-color)] shadow-xl overflow-hidden relative z-50 transition-all duration-500">
                        {groupedEntries[date].map((e: any, idx: number) => (
                            <TimelineMobileCard 
                                key={e.localId || e._id || idx}
                                e={e}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onToggleStatus={onToggleStatus}
                                activeId={activeSwipeId}
                                setActiveId={setActiveSwipeId}
                                currencySymbol={currencySymbol}
                                lang={language}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};