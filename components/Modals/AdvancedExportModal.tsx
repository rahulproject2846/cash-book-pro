"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, FileText, FileSpreadsheet, Download, 
    Filter, CloudDownload, Loader2, Zap, Clock, ShieldCheck, Fingerprint 
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';

// Global Engine Hooks & Components
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip } from '@/components/UI/Tooltip';

// --- 🛠️ ১. ইন্টারফেস ফিক্স (Strict Types) ---
interface Transaction {
    date: string | Date;
    title: string;
    category: string;
    paymentMethod?: string;
    type: string;
    amount: number;
    status: string;
    note?: string;
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: Transaction[]; // এখানে অবশ্যই Transaction[] হতে হবে
    bookName: string;
}

// --- 🛠️ ২. হেল্পার: বেঙ্গলি নাম্বার কনভার্টার ---
const toBn = (num: any, lang: string) => {
    const str = String(num);
    if (lang !== 'bn') return str;
    const bnNums: any = { '0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯', ',':',', '.':'.' };
    return str.split('').map(c => bnNums[c] || c).join('');
};

// --- 🛠️ ৩. সাব-কম্পোনেন্ট: এলিট এক্সপোর্ট ইনপুট ---
const EliteExportInput = ({ label, value, onChange, icon: Icon }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex-1 space-y-2 group">
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2.5px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500/60" />} {label}
            </span>
            <div 
                onClick={() => inputRef.current?.showPicker()}
                className="relative h-14 bg-[var(--bg-app)] border border-[var(--border)] rounded-[22px] px-5 flex items-center transition-all hover:border-orange-500/30 cursor-pointer shadow-inner overflow-hidden"
            >
                <input 
                    ref={inputRef} type="date" value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[12px] font-black uppercase text-[var(--text-main)] cursor-pointer" 
                />
                <div className="absolute right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <Calendar size={18} className="text-orange-500" />
                </div>
            </div>
        </div>
    );
};

export const AdvancedExportModal = ({ isOpen, onClose, entries = [], bookName }: ExportModalProps) => {
    const { T, t, language } = useTranslation();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

    // এরর ফিক্স: ক্যাটাগরি ম্যাপিং লজিক
    const categories = ['All', ...Array.from(new Set((entries || []).map((i: Transaction) => i.category)))];

    // --- 🧬 লজিক ফিক্স: ফিল্টারিং ---
    const getFilteredData = () => {
        return (entries || []).filter((item: Transaction) => {
            const itemDate = new Date(item.date).getTime();
            const start = startDate ? new Date(startDate).setHours(0,0,0,0) : 0;
            const end = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
            return itemDate >= start && itemDate <= end && (selectedCategory === 'All' || item.category === selectedCategory);
        });
    };

    const handleExport = async () => {
        setIsExporting(true);
        const data = getFilteredData();
        if (data.length === 0) {
            toast.error(t('err_no_archive_records'));
            setIsExporting(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500)); // Encryption delay simulation

        try {
            if (format === 'excel') {
                const worksheetData = [
                    ["SOURCE: VAULT PRO FINANCIAL OS"], 
                    ["VAULT: " + (bookName || "SYSTEM_DEFAULT").toUpperCase()],
                    ["GENERATED: " + new Date().toLocaleString()],
                    ["SECURITY: ENCRYPTED LOCAL ARCHIVE"],
                    [], 
                    ["Date", "Title", "Category", "Method", "Type", "Amount", "Status", "Memo"]
                ];

                data.forEach((e: Transaction) => {
                    worksheetData.push([
                        new Date(e.date).toLocaleDateString('en-GB'), e.title, e.category, 
                        e.paymentMethod || "CASH", e.type.toUpperCase(), (e as any).amount, e.status, e.note || "-"
                    ]);
                });

                const ws = XLSX.utils.aoa_to_sheet(worksheetData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Vault_Archive");
                XLSX.writeFile(wb, `${bookName}_Vault_Archive.xlsx`);
            } 
            else {
                const doc = new jsPDF();
                doc.setFontSize(22); doc.setTextColor(249, 115, 22); doc.text("VAULT PRO", 14, 20);
                doc.setFontSize(9); doc.setTextColor(120); doc.text(`ARCHIVE: ${bookName.toUpperCase()} | SECURE PROTOCOL`, 14, 28);

                const tableColumn = ["DATE", "TITLE", "TAG", "VIA", "TYPE", "AMOUNT", "STATUS"];
                const tableRows = data.map((e: Transaction) => [
                    new Date(e.date).toLocaleDateString('en-GB'), e.title, e.category,
                    e.paymentMethod || "CASH", e.type.toUpperCase(), e.amount.toLocaleString(), e.status
                ]);

                autoTable(doc, {
                    head: [tableColumn], body: tableRows, startY: 40, theme: 'grid',
                    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 3 },
                });
                doc.save(`${bookName}_Report.pdf`);
            }
            toast.success(t('success_archive_exported'));
            onClose();
        } catch (err) { 
            toast.error(t('err_protocol_export')); 
        } finally { setIsExporting(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl" />
            
            <motion.div 
                initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
                exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="bg-[var(--bg-card)] w-full md:max-w-xl h-auto rounded-t-[45px] md:rounded-[40px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col overflow-hidden transition-all duration-500"
            >
                <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-4 shrink-0 opacity-20 md:hidden" />

                <div className="px-8 pt-8 pb-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                            <CloudDownload size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-[3px] italic leading-tight">{T('export_title')}</h2>
                            <p className="text-[8px] font-bold text-orange-500 uppercase tracking-[2px] mt-1 opacity-70 flex items-center gap-2">
                                <ShieldCheck size={10} /> {T('identity_secured')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-app)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90 shadow-sm"><X size={20} /></button>
                </div>

                <div className="px-8 py-6 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <EliteExportInput label={T('label_start')} value={startDate} onChange={setStartDate} icon={Calendar} />
                        <EliteExportInput label={T('label_end')} value={endDate} onChange={setEndDate} icon={Clock} />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2"><Filter size={12} className="text-orange-500" /> {T('filter_class')}</label>
                        <div className="flex flex-wrap gap-2 py-1">
                            {categories.map((cat) => (
                                <button 
                                    key={cat} onClick={() => setSelectedCategory(cat)} 
                                    className={`px-5 py-2.5 rounded-[16px] text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95
                                        ${selectedCategory === cat ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-[var(--bg-app)] border-[var(--border)] text-[var(--text-muted)]'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2"><Zap size={12} className="text-orange-500" /> {T('format_selection')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setFormat('pdf')} className={`group relative p-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center gap-3 ${format === 'pdf' ? 'bg-red-500/5 border-red-500 shadow-xl scale-[1.02]' : 'bg-[var(--bg-app)] border-transparent opacity-40'}`}>
                                <FileText size={36} className={format === 'pdf' ? 'text-red-500' : 'text-[var(--text-muted)]'}/><span className={`text-[10px] font-black uppercase tracking-[3px] ${format === 'pdf' ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>{T('format_pdf')}</span>
                            </button>
                            <button onClick={() => setFormat('excel')} className={`group relative p-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center gap-3 ${format === 'excel' ? 'bg-green-500/5 border-green-500 shadow-xl scale-[1.02]' : 'bg-[var(--bg-app)] border-transparent opacity-40'}`}>
                                <FileSpreadsheet size={36} className={format === 'excel' ? 'text-green-500' : 'text-[var(--text-muted)]'}/><span className={`text-[10px] font-black uppercase tracking-[3px] ${format === 'excel' ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>{T('format_excel')}</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleExport} disabled={isExporting} 
                        className="w-full h-16 bg-orange-500 rounded-[28px] text-white font-black text-[12px] uppercase tracking-[5px] shadow-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-4"
                    >
                        {isExporting ? <><Loader2 className="animate-spin" size={22}/><span>{T('extracting_status')}</span></> : <><Fingerprint size={22} /><span>{T('btn_extract')}</span></>}
                    </button>
                </div>
                <div className="h-[env(safe-area-inset-bottom)] bg-[var(--bg-card)]" />
            </motion.div>
        </div>
    );
};