"use client";
import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
    Edit2, Trash2, Zap, Clock, 
    ArrowUpRight, ArrowDownLeft, X 
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

// --- 🔘 COMPONENT: SMART SWIPE ROW ---
const TransactionRow = ({ e, onEdit, onDelete, activeId, setActiveId, currencySymbol, lang }: any) => {
    const { T } = useTranslation();
    const controls = useAnimation();
    const isIncome = e.type === 'income';
    const isCompleted = e.status === 'completed';
    const rowId = e.localId || e._id;
    const isOpen = activeId === rowId;

    // ১. প্রোটোকল: অ্যাকশন হ্যান্ডলার (Sequencing for Lag-free feel)
    const handleAction = async (actionFn: any) => {
        await controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 35 } });
        setActiveId(null);
        setTimeout(() => { actionFn(e); }, 150); // মডাল ওপেন করার আগে সামান্য বিরতি
    };

    // ২. জেসচার স্ন্যাপ লজিক
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

    // ৩. এক্সটার্নাল ক্লোজ লজিক (অন্য কোথাও ট্যাপ করলে)
    React.useEffect(() => {
        if (!isOpen) controls.start({ x: 0 });
    }, [isOpen, controls]);

    return (
        <div className="relative overflow-hidden border-t border-[var(--border)] first:rounded-t-[35px] last:rounded-b-[35px] bg-[var(--bg-card)]">
            {/* --- নীচের লেয়ার: অ্যাকশন বাটনসমূহ --- */}
            <div className="absolute inset-0 flex items-center justify-between px-6">
                <button onClick={() => handleAction(onEdit)} className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Edit2 size={20} strokeWidth={2.5} />
                </button>
                <button onClick={() => handleAction(onDelete)} className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* --- ওপরের লেয়ার: মেইন কন্টেন্ট --- */}
            <motion.div 
                drag="x"
                animate={controls}
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={onDragEnd}
                className="bg-[var(--bg-card)] px-6 py-5 flex items-center justify-between gap-4 border-b border-[var(--border)]/10 last:border-b-0 relative z-10 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-4 min-w-0 pointer-events-none">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isIncome ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownLeft size={18} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-[14px] font-black uppercase italic tracking-tighter text-[var(--text-main)] truncate">{e.title}</h4>
                        <div className="flex items-center gap-2 mt-1 opacity-60">
                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">{e.category}</span>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate max-w-[120px]">
                                {e.note ? `// ${e.note}` : `// ${T('protocol_secured')}`}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right shrink-0 pointer-events-none">
                    <div className={`text-[16px] font-mono-finance font-bold tracking-tighter ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {isIncome ? '+' : '-'}{currencySymbol}{toBn(e.amount.toLocaleString(), lang)}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-1 opacity-50">
                        {isCompleted ? <Zap size={8} className="text-green-500" fill="currentColor" /> : <Clock size={8} className="text-yellow-500" />}
                        <span className="text-[8px] font-black uppercase tracking-widest">{toBn(e.time || '00:00', lang)}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- 📦 MAIN LIST ORCHESTRATOR ---
export const MobileTransactionCards = ({ items, onEdit, onDelete, onToggleStatus, currencySymbol }: any) => {
    const { T, language } = useTranslation();
    const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

    const grouped = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        items.forEach((item: any) => {
            const dateStr = new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        return groups;
    }, [items]);

    if (items.length === 0) return null;

    return (
        <div className="xl:hidden space-y-8 relative">
            {/* ১. ইনভিজিবল ব্যাকড্রপ (ট্যাপ টু ডিসমিস লজিক) */}
            <AnimatePresence>
                {activeSwipeId && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setActiveSwipeId(null)}
                        className="fixed inset-0 z-40 bg-transparent"
                    />
                )}
            </AnimatePresence>

            {Object.keys(grouped).map((date) => (
                <div key={date} className="relative">
                    <div className="flex items-center gap-4 mb-4 px-2">
                        <div className="h-px flex-1 bg-gradient-to-l from-[var(--border)]/20 to-transparent" />
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-muted)] opacity-50">{date}</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)]/20 to-transparent" />
                    </div>

                    {/* ২. গ্রুপিং কন্টেইনার (Rounded [35px]) */}
                    <div className="bg-[var(--bg-card)] rounded-[35px] border border-[var(--border)] shadow-xl overflow-hidden relative z-50">
                        {grouped[date].map((e: any, idx: number) => (
                            <TransactionRow 
                                key={e.localId || e._id || idx}
                                e={e} onEdit={onEdit} onDelete={onDelete}
                                activeId={activeSwipeId}
                                setActiveId={setActiveSwipeId}
                                currencySymbol={currencySymbol} lang={language}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div className="hidden flex flex-col items-center py-10 opacity-10">
                <div className="h-px w-8 bg-orange-500 mb-4" />
                <span className="text-[8px] font-black uppercase tracking-[5px] text-orange-500">{T('protocol_archive_end')}</span>
            </div>
        </div>
    );
};