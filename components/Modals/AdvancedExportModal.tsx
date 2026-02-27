"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, FileText, FileSpreadsheet, 
    CloudDownload, Loader2, Zap, ShieldCheck, 
    Fingerprint, ListFilter, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';

// --- 🛠️ HELPER: BENGALI NUMBER CONVERTER ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

export const AdvancedExportModal = ({ isOpen, onClose, entries = [], bookName }: any) => {
    const { t, language } = useTranslation();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { 
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 768);
        }
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isOpen]);

    const categories = useMemo(() => ['All', ...Array.from(new Set(entries.map((i: any) => i.category)))], [entries]);

    const dataToExport = useMemo(() => {
        return entries.filter((item: any) => {
            const itemDate = new Date(item.date).getTime();
            const start = startDate ? new Date(startDate).setHours(0,0,0,0) : 0;
            const end = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
            return itemDate >= start && itemDate <= end && (selectedCategory === 'All' || item.category === selectedCategory);
        });
    }, [entries, startDate, endDate, selectedCategory]);

    const filteredCount = dataToExport.length;

    const setPreset = (days: number | 'all') => {
        const today = new Date();
        const end = today.toISOString().split('T')[0];
        setEndDate(end);
        if (days === 'all') { setStartDate(''); setEndDate(''); } 
        else {
            const start = new Date();
            start.setDate(today.getDate() - days);
            setStartDate(start.toISOString().split('T')[0]);
        }
    };

    // --- 🧬 ৪. অপ্টিমাইজড এক্সপোর্ট লজিক (Lazy Loading Enabled) ---
    const handleExport = async () => {
        if (filteredCount === 0) return toast.error(t('err_no_archive_records'));
        setIsExporting(true);

        try {
            if (format === 'excel') {
                // 🔥 ডাইনামিক ইম্পোর্ট: বাটন ক্লিক করলেই কেবল XLSX লোড হবে
                const XLSX = await import("xlsx");
                
                const worksheetData = [
                    ["SOURCE: VAULT PRO FINANCIAL OS"], ["VAULT: " + (bookName || "SYSTEM").to ()],
                    ["GENERATED: " + new Date().toLocaleString()], ["SECURITY: ENCRYPTED ARCHIVE"], [],
                    ["Date", "Title", "Category", "Method", "Type", "Amount", "Status"]
                ];
                dataToExport.forEach((e: any) => worksheetData.push([new Date(e.date).toLocaleDateString('en-GB'), e.title, e.category, e.paymentMethod || "CASH", e.type.toUpperCase(), e.amount, e.status]));
                
                const ws = XLSX.utils.aoa_to_sheet(worksheetData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Vault_Archive");
                XLSX.writeFile(wb, `${bookName}_Vault_Archive.xlsx`);
            } else {
                // 🔥 ডাইনামিক ইম্পোর্ট: বাটন ক্লিক করলেই কেবল PDF লাইব্রেরি লোড হবে
                const { default: jsPDF } = await import("jspdf");
                const { default: autoTable } = await import("jspdf-autotable");

                const doc = new jsPDF();
                doc.setFontSize(22); doc.setTextColor(249, 115, 22); doc.text("VAULT PRO", 14, 20);
                doc.setFontSize(9); doc.setTextColor(120); doc.text(`ARCHIVE: ${bookName.to ()} | SECURE PROTOCOL`, 14, 28);
                const rows = dataToExport.map((e: any) => [new Date(e.date).toLocaleDateString('en-GB'), e.title, e.category, e.paymentMethod || "CASH", e.type.toUpperCase(), e.amount.toLocaleString(), e.status]);
                autoTable(doc, { head: [["DATE", "TITLE", "TAG", "VIA", "TYPE", "AMOUNT", "STATUS"]], body: rows, startY: 40, theme: 'grid' });
                doc.save(`${bookName}_Archive.pdf`);
            }
            toast.success(t('success_archive_exported'));
            onClose();
        } catch (err) { 
            console.error(err);
            toast.error(t('err_protocol_export')); 
        } finally { 
            setIsExporting(false); 
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-xl z-0" />
            
            <motion.div 
                layout
                initial={isMobile ? { y: "100%", opacity: 0 } : { scale: 0.9, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1, transition: { type: "spring", damping: 30, stiffness: 400, opacity: { duration: 0.1 } } }}
                exit={isMobile ? { y: "100%", opacity: 0 } : { scale: 0.9, opacity: 0 }}
                className="bg-[var(--bg-card)] w-full md:max-w-xl h-auto rounded-t-[45px] md:rounded-[45px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20 md:hidden" />

                <div className="px-8 pt-8 pb-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <CloudDownload size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[12px] font-black text-[var(--text-main)]    leading-none">{t('export_title')}</h2>
                            <p className="text-[8px] font-bold text-orange-500    mt-1.5 opacity-70 flex items-center gap-2">
                                <ShieldCheck size={10} /> {t('identity_secured')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-[var(--text-muted)]    ml-1 flex items-center gap-2">
                                <Calendar size={12} className="text-orange-500/60" /> {t('range_selector')}
                            </span>
                            <div className="flex gap-2 bg-[var(--bg-app)] p-1 rounded-xl border border-[var(--border)]">
                                {[7, 30, 'all'].map(p => (
                                    <button key={p} onClick={() => setPreset(p as any)} className="w-12 h-9 flex items-center justify-center rounded-lg text-[9px] font-black transition-all hover:bg-orange-500/10 active:scale-90 text-orange-500/80 border border-transparent hover:border-orange-500/20">
                                        {p === 'all' ? 'ALL' : toBn(p, language)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-14 bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl px-5 text-[11px] font-black text-[var(--text-main)] outline-none focus:border-orange-500/50 shadow-inner" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-14 bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl px-5 text-[11px] font-black text-[var(--text-main)] outline-none focus:border-orange-500/50 shadow-inner" />
                        </div>
                    </div>

                    <div className="space-y-4 relative group">
                        <span className="text-[9px] font-black text-[var(--text-muted)]    ml-1 flex items-center gap-2">
                            <ListFilter size={12} className="text-orange-500/60" /> {t('filter_class')}
                        </span>
                        <div className="relative">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pr-10 scroll-smooth">
                                {categories.map((cat: any) => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} 
                                        className={`whitespace-nowrap px-6 py-3 rounded-2xl text-[9px] font-black   border-2 transition-all active:scale-95
                                            ${selectedCategory === cat ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)] hover:border-orange-500/30'}`}>
                                        {t(`category_${cat.toLowerCase()}`) || cat}
                                    </button>
                                ))}
                            </div>
                            <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--bg-card)] to-transparent pointer-events-none flex items-center justify-end">
                                <ChevronRight size={14} className="text-orange-500 opacity-40 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[9px] font-black text-[var(--text-muted)]    ml-1 flex items-center gap-2"><Zap size={12} className="text-orange-500" /> {t('format_selection')}</span>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setFormat('pdf')} className={`group relative p-6 rounded-[35px] border-2 transition-all duration-500 flex flex-col items-center gap-3 overflow-hidden ${format === 'pdf' ? 'bg-red-500/5 border-red-500 shadow-xl scale-[1.02]' : 'bg-[var(--bg-app)] border-transparent opacity-40 hover:opacity-100'}`}>
                                <FileText size={32} className={format === 'pdf' ? 'text-red-500 scale-110' : 'text-[var(--text-muted)]'} />
                                <span className={`text-[10px] font-black    ${format === 'pdf' ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{t('format_pdf')}</span>
                            </button>
                            <button onClick={() => setFormat('excel')} className={`group relative p-6 rounded-[35px] border-2 transition-all duration-500 flex flex-col items-center gap-3 overflow-hidden ${format === 'excel' ? 'bg-green-500/5 border-green-500 shadow-xl scale-[1.02]' : 'bg-[var(--bg-app)] border-transparent opacity-40 hover:opacity-100'}`}>
                                <FileSpreadsheet size={32} className={format === 'excel' ? 'text-green-500 scale-110' : 'text-[var(--text-muted)]'} />
                                <span className={`text-[10px] font-black    ${format === 'excel' ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>{t('format_excel')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--bg-card)] border-t border-[var(--border)] shrink-0">
                    <div className="flex items-center justify-center gap-3 mb-6 opacity-40">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                         <span className="text-[9px] font-black    text-[var(--text-main)]">
                            {t('status_ready')}: {toBn(filteredCount, language)} {t('protocols_label')}
                         </span>
                    </div>

                    <button 
                        onClick={handleExport} disabled={isExporting || filteredCount === 0} 
                        className={`w-full h-16 rounded-[30px] font-black text-[12px]    shadow-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-4 border-none relative overflow-hidden group
                            ${filteredCount === 0 ? 'bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed' : 'bg-orange-500 text-white shadow-orange-500/30'}
                        `}
                    >
                        <AnimatePresence mode="wait">
                            {isExporting ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                                    <Loader2 className="animate-spin" size={24} />
                                    <span>{t('extracting_status')}</span>
                                </motion.div>
                            ) : (
                                <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                                    <Fingerprint size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                                    <span>{t('btn_extract')}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </motion.div>
        </div>
    );
};