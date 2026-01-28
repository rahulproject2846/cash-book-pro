"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, FileText, FileSpreadsheet, Download, Filter, Check, Loader2 } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: any[];
    bookName: string;
}

export const AdvancedExportModal = ({ isOpen, onClose, entries, bookName }: ExportModalProps) => {
    // --- ১. স্টেট ম্যানেজমেন্ট ---
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
    const [isExporting, setIsExporting] = useState(false);

    const categories = ['All', ...Array.from(new Set(entries.map((i: any) => i.category)))];

    // --- ২. ফিল্টার লজিক ---
    const getFilteredData = () => {
        return entries.filter((item: any) => {
            const itemDate = new Date(item.date).getTime();
            const start = startDate ? new Date(startDate).setHours(0,0,0,0) : 0;
            const end = endDate ? new Date(endDate).setHours(23,59,59,999) : Infinity;
            
            const matchesDate = itemDate >= start && itemDate <= end;
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

            return matchesDate && matchesCategory;
        });
    };

    // --- ৩. এক্সপোর্ট লজিক (With Logic Branding & Signature) ---
    const handleExport = async () => {
        setIsExporting(true);
        const data = getFilteredData();

        if (data.length === 0) {
            toast.error("Protocol Error: No data found for selected range");
            setIsExporting(false);
            return;
        }

        // এনিমেশন ফিল দেওয়ার জন্য ছোট ডিলে
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            if (format === 'excel') {
                // এক্সেল সিগনেচার ও ব্র্যান্ডিং লজিক (ইমপোর্ট ভ্যালিডেশনের জন্য মাস্ট)
                const worksheetData = [
                    ["SOURCE: CASHBOOK PRO DIGITAL LEDGER"], // Row 1: Signature
                    ["VAULT ID: " + (bookName || "UNNAMED_VAULT").toUpperCase()],
                    ["GENERATED ON: " + new Date().toLocaleString()],
                    ["DO NOT MODIFY STRUCTURE - SECURITY ENCRYPTED"],
                    [], // Space
                    ["Date", "Title", "Category", "Type", "Amount", "Status", "Note"] // Headers
                ];

                data.forEach((e: any) => {
                    worksheetData.push([
                        new Date(e.date).toLocaleDateString('en-GB'), 
                        e.title.toUpperCase(), 
                        e.category.toUpperCase(), 
                        e.type.toUpperCase(), 
                        e.amount, 
                        e.status.toUpperCase(), 
                        e.note || "-"
                    ]);
                });

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Financial_Protocol");
                
                XLSX.writeFile(workbook, `${bookName}_Vault_Archive.xlsx`);
            } 
            else {
                // পিডিএফ ব্র্যান্ডিং লজিক
                const doc = new jsPDF();
                
                // হেডার ব্র্যান্ডিং
                doc.setFontSize(22);
                doc.setTextColor(249, 115, 22); // Vault Orange
                doc.text("VAULT PRO", 14, 20);
                
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text(`SECURE LEDGER PROTOCOL | VAULT: ${bookName.toUpperCase()}`, 14, 28);
                doc.text(`DATE RANGE: ${startDate || 'ALL TIME'} - ${endDate || 'PRESENT'}`, 14, 33);

                const tableColumn = ["DATE", "TRANSACTION IDENTITY", "TAG", "TYPE", "AMOUNT", "STATUS"];
                const tableRows = data.map((e: any) => [
                    new Date(e.date).toLocaleDateString('en-GB'),
                    e.title.toUpperCase(),
                    e.category.toUpperCase(),
                    e.type.toUpperCase(),
                    e.amount.toLocaleString(),
                    e.status.toUpperCase()
                ]);

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 40,
                    theme: 'grid',
                    headStyles: { fillColor: [26, 26, 27], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 4 },
                    didDrawPage: (dataArg) => {
                        // ফুটারে প্রোমোশনাল ওয়াটারমার্ক
                        doc.setFontSize(7);
                        doc.setTextColor(150);
                        const str = "Generated by Vault Pro - Secure Financial OS (https://cash-book-pro.vercel.app/)";
                        doc.text(str, 14, doc.internal.pageSize.height - 10);
                    }
                });

                doc.save(`${bookName}_Protocol_Report.pdf`);
            }

            toast.success("Archive Secured & Downloaded");
            onClose();
        } catch (err) {
            toast.error("Export Protocol Failed");
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            {/* ব্যাকড্রপ */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="modal-backdrop"
            />
            
            {/* মডাল কন্টেন্ট */}
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[var(--bg-card)] w-full max-w-md rounded-[32px] border border-[var(--border-color)] shadow-2xl relative z-10 overflow-hidden"
            >
                {/* হেডার */}
                <div className="px-8 py-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-app)]/50">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[2px] text-[var(--text-main)] italic">Export Protocol</h2>
                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1">Prepare Financial Archive</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-red-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* ১. ডেট রেঞ্জ সিলেকশন */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={12}/> Chronological Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="date" 
                                className="app-input text-[11px] font-black uppercase"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <input 
                                type="date" 
                                className="app-input text-[11px] font-black uppercase"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ২. ক্যাটাগরি ফিল্টার */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <Filter size={12}/> Classification Tag
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
                            {categories.map((cat: any) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                                        selectedCategory === cat 
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                        : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-orange-500/50'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ৩. ফরম্যাট সিলেকশন */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <FileText size={12}/> Output Extension
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setFormat('pdf')}
                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                    format === 'pdf' 
                                    ? 'bg-red-500/5 border-red-500 text-red-500 shadow-inner' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-red-500/30'
                                }`}
                            >
                                <FileText size={28} />
                                <span className="text-[9px] font-black uppercase tracking-widest">PDF Doc</span>
                            </button>
                            <button 
                                onClick={() => setFormat('excel')}
                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                                    format === 'excel' 
                                    ? 'bg-green-500/5 border-green-500 text-green-500 shadow-inner' 
                                    : 'bg-[var(--bg-app)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-green-500/30'
                                }`}
                            >
                                <FileSpreadsheet size={28} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Excel Data</span>
                            </button>
                        </div>
                    </div>

                    {/* সাবমিট বাটন */}
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="app-btn-primary w-full py-5 text-[11px] font-black tracking-[3px] shadow-2xl shadow-orange-500/20 mt-4"
                    >
                        {isExporting ? <Loader2 className="animate-spin" size={18}/> : <Check size={18} strokeWidth={3} />}
                        {isExporting ? 'PROCESSING...' : 'INITIALIZE DOWNLOAD'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};