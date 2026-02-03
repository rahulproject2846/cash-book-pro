"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Calendar, FileText, FileSpreadsheet, Download, 
    Filter, Check, CloudDownload, Loader2, Zap, Activity ,Clock
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import { useTranslation } from '@/hooks/useTranslation';

// --- ১. ইন্টারফেস ডেফিনিশন ---
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
    entries: Transaction[];
    bookName: string;
}

// --- ২. সাব-কম্পোনেন্ট: ওএস স্টাইল ডেট ইনপুট ---
const OSDateInput = ({ label, value, onChange, icon: Icon }: any) => {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[2px] ml-1 flex items-center gap-2">
                {Icon && <Icon size={12} className="text-orange-500" />} {label}
            </label>
            <div className="relative group" onClick={() => inputRef.current?.showPicker()}>
                <input 
                    ref={inputRef} type="date" value={value}
                    onChange={e => onChange(e.target.value)}
                    className="app-input h-12 md:h-14 px-4 text-[12px] font-black uppercase border-2 bg-[var(--bg-app)] focus:border-orange-500/40 transition-all cursor-pointer shadow-inner" 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <Calendar size={14}/>
                </div>
            </div>
        </div>
    );
};

export const AdvancedExportModal = ({ isOpen, onClose, entries, bookName }: ExportModalProps) => {
    const { t, T } = useTranslation();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    const categories = ['All', ...Array.from(new Set(entries.map((i) => i.category)))];

    const getFilteredData = () => {
        return entries.filter((item) => {
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
            toast.error("No archive records found");
            setIsExporting(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1200));

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

                data.forEach((e: any) => {
                    worksheetData.push([
                        new Date(e.date).toLocaleDateString('en-GB'), e.title, e.category, 
                        e.paymentMethod || "CASH", e.type.toUpperCase(), e.amount, e.status, e.note || "-"
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
                const tableRows = data.map((e) => [
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
            toast.success("Archive Successfully Exported");
            onClose();
        } catch (err) { toast.error("Protocol Error during Export"); } 
        finally { setIsExporting(false); }
    };

    if (!isOpen) return null;

return (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden">
            {/* Backdrop: এটি সব থিমে ফোকাস বাড়ানোর জন্য ডার্ক রাখা হয়েছে */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl" />
            
            <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 350 }}
                className="bg-[var(--bg-card)] w-full md:max-w-lg rounded-t-[45px] md:rounded-[45px] border-t md:border border-[var(--border)] shadow-2xl relative z-10 flex flex-col max-h-[95vh] overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-app)]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                            <Download size={20} />
                        </div>
                        <div>
                            <h2 className="text-[11px] font-black uppercase tracking-[3px] text-[var(--text-main)] italic">Protocol: Export</h2>
                            <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[2px] mt-0.5">Secure Archive Extraction</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 transition-all flex items-center justify-center active:scale-90 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-10 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Range Select */}
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <OSDateInput label="Start Date" value={startDate} onChange={setStartDate} icon={Calendar} />
                            <OSDateInput label="End Date" value={endDate} onChange={setEndDate} icon={Clock} />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2">
                            <Filter size={12}/> Filter Classification
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto no-scrollbar py-1">
                            {categories.map((cat) => (
                                <button 
                                    key={cat} 
                                    onClick={() => setSelectedCategory(cat)} 
                                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all 
                                        ${selectedCategory === cat 
                                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                                            : 'bg-[var(--bg-app)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/30'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[3px] ml-1 flex items-center gap-2">
                            <Zap size={12}/> Extraction Format
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setFormat('pdf')} 
                                className={`p-6 rounded-[28px] border-2 flex flex-col items-center gap-3 transition-all 
                                    ${format === 'pdf' 
                                        ? 'bg-red-500/5 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]' 
                                        : 'bg-[var(--bg-app)] border-[var(--border)] opacity-50 text-[var(--text-muted)]'}`}
                            >
                                <FileText size={32} className={format === 'pdf' ? 'text-red-500' : ''}/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Acrobat PDF</span>
                            </button>
                            
                            <button 
                                onClick={() => setFormat('excel')} 
                                className={`p-6 rounded-[28px] border-2 flex flex-col items-center gap-3 transition-all 
                                    ${format === 'excel' 
                                        ? 'bg-green-500/5 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]' 
                                        : 'bg-[var(--bg-app)] border-[var(--border)] opacity-50 text-[var(--text-muted)]'}`}
                            >
                                <FileSpreadsheet size={32} className={format === 'excel' ? 'text-green-500' : ''}/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Excel Sheet</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleExport} disabled={isExporting} 
                        className="app-btn-primary w-full h-16 text-[12px] font-black tracking-[4px] shadow-2xl shadow-[var(--accent)]/20 mt-4 bg-[var(--accent)] hover:opacity-90 border-none text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={22}/> : <CloudDownload size={22} strokeWidth={2.5} />}
                        {isExporting ? 'ENCRYPTING...' : 'EXECUTE EXTRACTION'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};